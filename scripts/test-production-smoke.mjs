import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";

const providers = [{ id: "alpha" }, { id: "beta" }];
const catalog = { schema_version: "1.1.0", provider_count: providers.length, providers };
const data = { lastUpdated: "2026-07-19", providerCount: providers.length, providers };
const buildMeta = { source_revision: "fixture-sha", provider_count: providers.length };

function send(response, status, contentType, body, headers = {}) {
  response.writeHead(status, { "content-type": contentType, ...headers });
  response.end(body);
}

function fixtureResponse(request, response) {
  const url = new URL(request.url, "http://localhost");
  const match = url.pathname.match(/^\/(global|iran|pages|bad)(?:\/(.*))?$/);
  if (!match) return send(response, 404, "text/plain; charset=utf-8", "not found");

  const target = match[1];
  const relative = match[2] || "";
  const rootHeaders = target === "iran" ? { "x-robots-tag": "noindex, nofollow" } : {};

  if (relative === "" || relative === "en/" || relative === "api-finder/") {
    return send(response, 200, "text/html; charset=utf-8", "<!doctype html><html><body>fixture</body></html>", relative === "" ? rootHeaders : {});
  }

  if (relative === "catalog.json") {
    return send(response, 200, "application/json; charset=utf-8", JSON.stringify(catalog));
  }

  if (relative === "data.json") {
    if (target === "bad") return send(response, 200, "text/html; charset=utf-8", "<!doctype html><html><body>fallback</body></html>");
    return send(response, 200, "application/json; charset=utf-8", JSON.stringify(data));
  }

  if (relative === "build-meta.json") {
    return send(response, 200, "application/json; charset=utf-8", JSON.stringify(buildMeta));
  }

  if (relative === "sitemap.xml") {
    return send(response, 200, "application/xml; charset=utf-8", "<?xml version=\"1.0\"?><urlset></urlset>");
  }

  if (relative === "robots.txt") {
    return send(response, 200, "text/plain; charset=utf-8", "User-agent: *\nSitemap: https://example.test/sitemap.xml\n");
  }

  if (relative === "__smoke_missing_route__") {
    return send(response, 404, "text/html; charset=utf-8", "<!doctype html><html><body>404</body></html>");
  }

  const providerMatch = relative.match(/^providers\/([^/]+)\/$/);
  if (providerMatch && providers.some((provider) => provider.id === providerMatch[1])) {
    const id = providerMatch[1];
    return send(response, 200, "text/html; charset=utf-8", `<!doctype html><html><head><script type=\"application/ld+json\">{}</script></head><body>${id}</body></html>`);
  }

  return send(response, 404, "text/plain; charset=utf-8", "not found");
}

function runChecker(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/check-production-smoke.mjs", ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

const server = createServer(fixtureResponse);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;

try {
  const positiveTargets = [
    { name: "global", baseUrl: `${origin}/global/`, robotsPolicy: "index" },
    { name: "iran", baseUrl: `${origin}/iran/`, robotsPolicy: "noindex" },
    { name: "pages", baseUrl: `${origin}/pages/`, robotsPolicy: "index" }
  ];

  const positive = await runChecker(["--expected-revision=fixture-sha", "--timeout-ms=5000"], {
    SMOKE_TARGETS_JSON: JSON.stringify(positiveTargets)
  });

  if (positive.code !== 0) {
    throw new Error(`Expected positive smoke fixture to pass.\nSTDOUT:\n${positive.stdout}\nSTDERR:\n${positive.stderr}`);
  }
  if (!positive.stdout.includes("Overall: PASS")) throw new Error("Positive report did not contain Overall: PASS");
  if (!positive.stdout.includes("Provider pages checked: 2")) throw new Error("Provider-page coverage was not reported");

  const negativeTargets = [
    { name: "bad", baseUrl: `${origin}/bad/`, robotsPolicy: "index" }
  ];
  const negative = await runChecker(["--expected-revision=fixture-sha", "--timeout-ms=5000"], {
    SMOKE_TARGETS_JSON: JSON.stringify(negativeTargets)
  });

  if (negative.code === 0) throw new Error("Expected HTML fallback fixture to fail");
  if (!negative.stdout.includes("HTML fallback") && !negative.stdout.includes("JSON content type")) {
    throw new Error(`Negative report did not explain the JSON fallback failure.\n${negative.stdout}\n${negative.stderr}`);
  }

  console.log("Production smoke checker fixture tests passed.");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
