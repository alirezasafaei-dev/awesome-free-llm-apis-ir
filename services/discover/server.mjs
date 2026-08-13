import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { openDiscoverDatabase } from "./database.mjs";
import { enforceMutationRequest, errorResponse, readJsonBody, sendEmpty, sendJson } from "./http.mjs";

function assertRuntime() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    throw new Error("Discover service requires Node.js 22.13 or newer");
  }
}

function methodNotAllowed(response, allow) {
  sendJson(response, 405, { error: { code: "method_not_allowed", message: "method not allowed" } }, { allow });
}

function rejectMutation(request, response) {
  const guard = enforceMutationRequest(request);
  if (guard.ok) return false;
  sendJson(response, guard.status, { error: { code: guard.code, message: guard.message } });
  return true;
}

export function createDiscoverServer({ databasePath, host = "127.0.0.1", port = 8003 }) {
  assertRuntime();
  const repository = openDiscoverDatabase(databasePath);

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://discover.local");
    const pathname = url.pathname;

    try {
      if (pathname === "/discover/api/health") {
        if (request.method !== "GET") return methodNotAllowed(response, "GET");
        return sendJson(response, 200, { ok: true });
      }

      if (pathname === "/discover/api/tools") {
        if (request.method !== "GET") return methodNotAllowed(response, "GET");
        return sendJson(response, 200, { tools: repository.listPublishedTools() }, {
          "cache-control": "public, max-age=30, must-revalidate"
        });
      }

      if (pathname === "/discover/api/admin/tools") {
        if (request.method === "GET") return sendJson(response, 200, { tools: repository.listAdminTools() });
        if (request.method !== "POST") return methodNotAllowed(response, "GET, POST");
        if (rejectMutation(request, response)) return;
        const payload = await readJsonBody(request);
        return sendJson(response, 201, { tool: repository.createTool(payload) });
      }

      const itemMatch = pathname.match(/^\/discover\/api\/admin\/tools\/(\d+)$/);
      if (itemMatch) {
        const id = Number(itemMatch[1]);
        if (request.method === "PUT") {
          if (rejectMutation(request, response)) return;
          const payload = await readJsonBody(request);
          const tool = repository.updateTool(id, payload);
          if (!tool) return sendJson(response, 404, { error: { code: "not_found", message: "tool not found" } });
          return sendJson(response, 200, { tool });
        }
        if (request.method === "DELETE") {
          if (rejectMutation(request, response)) return;
          const deleted = repository.deleteTool(id);
          if (!deleted) return sendJson(response, 404, { error: { code: "not_found", message: "tool not found" } });
          return sendEmpty(response, 204);
        }
        return methodNotAllowed(response, "PUT, DELETE");
      }

      return sendJson(response, 404, { error: { code: "not_found", message: "route not found" } });
    } catch (error) {
      const { status, payload } = errorResponse(error);
      return sendJson(response, status, payload);
    }
  });

  let started = false;
  let stopped = false;

  return {
    server,
    repository,
    async start() {
      if (started) return;
      await new Promise((resolve, reject) => {
        const onError = (error) => { server.off("listening", onListening); reject(error); };
        const onListening = () => { server.off("error", onError); resolve(); };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, host);
      });
      started = true;
    },
    async stop() {
      if (stopped) return;
      stopped = true;
      if (started && server.listening) {
        await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      }
      repository.close();
    }
  };
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedFile && path.resolve(currentFile) === invokedFile) {
  const databasePath = process.env.DISCOVER_DATABASE_PATH || "/var/lib/persiantoolbox-discover/discover.sqlite3";
  const host = process.env.DISCOVER_HOST || "127.0.0.1";
  const port = Number(process.env.DISCOVER_PORT || 8003);
  const app = createDiscoverServer({ databasePath, host, port });
  await app.start();
  const shutdown = async () => {
    await app.stop();
    process.exit(0);
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
