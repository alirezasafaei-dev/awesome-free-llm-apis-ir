import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
function valueAfter(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const host = valueAfter("--host", "127.0.0.1");
const port = Number.parseInt(valueAfter("--port", "4173"), 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("--port must be an integer between 1 and 65535");
}

const root = path.resolve(process.cwd(), ".site-dist");
try {
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) throw new Error("not a directory");
} catch {
  console.error("Missing .site-dist. Run `npm run site:build` first.");
  process.exit(1);
}

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

function safePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const normalized = path.posix.normalize(decoded.replaceAll("\\", "/"));
  const relative = normalized.replace(/^\/+/, "");
  const absolute = path.resolve(root, relative || "index.html");
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null;
  return absolute;
}

async function resolveFile(requestPath) {
  let candidate = safePath(requestPath);
  if (!candidate) return null;
  try {
    const candidateStat = await stat(candidate);
    if (candidateStat.isDirectory()) candidate = path.join(candidate, "index.html");
    const fileStat = await stat(candidate);
    return fileStat.isFile() ? { path: candidate, size: fileStat.size } : null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  const requestUrl = new URL(request.url ?? "/", `http://${host}:${port}`);
  const resolved = await resolveFile(requestUrl.pathname);
  if (!resolved) {
    const notFound = await resolveFile("/404.html");
    if (notFound) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      if (method === "HEAD") response.end();
      else createReadStream(notFound.path).pipe(response);
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mime.get(path.extname(resolved.path).toLowerCase()) ?? "application/octet-stream",
    "Content-Length": resolved.size,
    "Cache-Control": "no-store"
  });
  if (method === "HEAD") response.end();
  else createReadStream(resolved.path).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Serving ${root}`);
  console.log(`http://${host}:${port}/`);
  console.log("Press Ctrl+C to stop.");
});
