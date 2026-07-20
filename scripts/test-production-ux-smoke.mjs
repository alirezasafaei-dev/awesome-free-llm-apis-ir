import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";

const buildMeta = {
  source_revision: "fixture-sha",
  static_product_pages: ["/api-finder/", "/quick-start/"]
};

function send(response, status, contentType, body) {
  response.writeHead(status, { "content-type": contentType });
  response.end(body);
}

function fixtureResponse(request, response) {
  const url = new URL(request.url, "http://localhost");
  const match = url.pathname.match(/^\/(good|bad)(?:\/(.*))?$/);
  if (!match) return send(response, 404, "text/plain; charset=utf-8", "not found");

  const target = match[1];
  const relative = match[2] || "";

  if (relative === "") {
    const body = target === "good"
      ? '<!doctype html><html><body><h1>API رایگان هوش مصنوعی</h1><section class="audience-paths"></section><a href="/api-finder/">finder</a><a href="/quick-start/">quick</a></body></html>'
      : '<!doctype html><html><body><h1>legacy</h1></body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "api-finder/") {
    const body = target === "good"
      ? '<!doctype html><html><head><link rel="stylesheet" href="finder-clarity.css"><script type="application/ld+json">{}</script></head><body><form id="finder-form"></form><script src="finder-clarity.js"></script></body></html>'
      : '<!doctype html><html><body>finder</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "quick-start/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><h1 id="quick-start-title">Quick Start</h1><code>LLM_API_KEY LLM_BASE_URL LLM_MODEL from openai import OpenAI import OpenAI from</code></body></html>'
      : '<!doctype html><html><body>missing examples</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "build-meta.json") {
    const payload = target === "good" ? buildMeta : { source_revision: "wrong", static_product_pages: ["/api-finder/"] };
    return send(response, 200, "application/json; charset=utf-8", JSON.stringify(payload));
  }

  if (relative === "sitemap.xml") {
    const body = target === "good"
      ? "<?xml version=\"1.0\"?><urlset><url><loc>https://example.test/api-finder/</loc></url><url><loc>https://example.test/quick-start/</loc></url></urlset>"
      : "<?xml version=\"1.0\"?><urlset><url><loc>https://example.test/api-finder/</loc></url></urlset>";
    return send(response, 200, "application/xml; charset=utf-8", body);
  }

  return send(response, 404, "text/plain; charset=utf-8", "not found");
}

function runChecker(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["scripts/check-production-ux-smoke.mjs", ...args], {
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
  const positive = await runChecker(["--expected-revision=fixture-sha", "--timeout-ms=5000"], {
    UX_SMOKE_TARGETS_JSON: JSON.stringify([{ name: "good", baseUrl: `${origin}/good/` }])
  });
  if (positive.code !== 0) throw new Error(`Expected positive UX smoke fixture to pass.\n${positive.stdout}\n${positive.stderr}`);
  if (!positive.stdout.includes("Overall: PASS")) throw new Error("Positive UX smoke report did not pass");
  if (!positive.stdout.includes("UX routes checked: 5")) throw new Error("Positive UX smoke report did not include all route checks");

  const negative = await runChecker(["--expected-revision=fixture-sha", "--timeout-ms=5000"], {
    UX_SMOKE_TARGETS_JSON: JSON.stringify([{ name: "bad", baseUrl: `${origin}/bad/` }])
  });
  if (negative.code === 0) throw new Error("Expected negative UX smoke fixture to fail");
  for (const explanation of ["missing required UX signal", "missing product route /quick-start/", "sitemap is missing quick-start/"]) {
    if (!negative.stdout.includes(explanation)) throw new Error(`Negative report did not include: ${explanation}\n${negative.stdout}\n${negative.stderr}`);
  }

  const dryRun = await runChecker(["--dry-run", "--target=good"], {
    UX_SMOKE_TARGETS_JSON: JSON.stringify([{ name: "good", baseUrl: `${origin}/good/` }])
  });
  if (dryRun.code !== 0 || !dryRun.stdout.includes("/quick-start/")) throw new Error("UX smoke dry-run contract failed");

  console.log("Production UX smoke checker fixture tests passed.");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
