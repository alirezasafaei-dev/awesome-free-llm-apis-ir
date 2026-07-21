import { spawn } from "node:child_process";
import { createServer } from "node:http";
import process from "node:process";

const buildMeta = {
  source_revision: "fixture-sha",
  static_product_pages: [
    "/api-finder/", "/quick-start/", "/tools/", "/compare/",
    "/en/api-finder/", "/en/quick-start/", "/en/compare/"
  ],
  tool_count: 8
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
      ? '<!doctype html><html><body><h1>API رایگان هوش مصنوعی</h1><section class="audience-paths"></section><a href="/api-finder/">finder</a><a href="/quick-start/">quick</a><a href="/tools/">tools</a></body></html>'
      : '<!doctype html><html><body><h1>legacy</h1></body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "api-finder/") {
    const body = target === "good"
      ? '<!doctype html><html><head><link rel="stylesheet" href="finder-clarity.css"><link rel="stylesheet" href="shortlist.css"><script type="application/ld+json">{}</script></head><body><form id="finder-form"></form><script src="finder-clarity.js"></script><script src="shortlist.js"></script></body></html>'
      : '<!doctype html><html><body>finder</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "quick-start/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><h1 id="quick-start-title">Quick Start</h1><code>LLM_API_KEY LLM_BASE_URL LLM_MODEL from openai import OpenAI import OpenAI from</code></body></html>'
      : '<!doctype html><html><body>missing examples</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "tools/") {
    const body = target === "good"
      ? '<!doctype html><html><head><link rel="stylesheet" href="tools.css"><script type="application/ld+json">{}</script></head><body><h1 id="tools-title">Tools</h1><section class="tools-controls"></section><article class="tool-card">ریسک Terms امنیت Credential</article><script src="tools.js"></script></body></html>'
      : '<!doctype html><html><body>unsafe legacy list</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "compare/") {
    const body = target === "good"
      ? '<!doctype html><html><head><link rel="stylesheet" href="compare.css"><script type="application/ld+json">{}</script></head><body><h1 id="compare-title">Compare</h1><section id="compare-empty"></section><div id="compare-grid"></div><a href="../catalog.json">catalog.json</a><script src="compare.js"></script></body></html>'
      : '<!doctype html><html><body>missing comparison contract</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "en/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><h1>Find and compare free LLM APIs</h1><a href="./api-finder/">finder</a><a href="./quick-start/">quick</a><a href="./compare/">compare</a></body></html>'
      : '<!doctype html><html><body>legacy English page</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "en/api-finder/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><section class="en-finder-hero"></section><form id="finder-form"></form><div id="finder-results"></div><a href="../../catalog.json">catalog</a></body></html>'
      : '<!doctype html><html><body>missing English finder</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "en/quick-start/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><section class="qs-en-hero"></section><code>LLM_API_KEY LLM_BASE_URL LLM_MODEL</code><script src="provider-context-en.js"></script></body></html>'
      : '<!doctype html><html><body>missing English quick start</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "en/compare/") {
    const body = target === "good"
      ? '<!doctype html><html><head><script type="application/ld+json">{}</script></head><body><section class="compare-en-hero"></section><section id="compare-empty"></section><div id="compare-grid"></div><a href="../../catalog.json">catalog.json</a><script src="compare.js"></script></body></html>'
      : '<!doctype html><html><body>missing English comparison</body></html>';
    return send(response, 200, "text/html; charset=utf-8", body);
  }

  if (relative === "build-meta.json") {
    const payload = target === "good" ? buildMeta : { source_revision: "wrong", static_product_pages: ["/api-finder/"] };
    return send(response, 200, "application/json; charset=utf-8", JSON.stringify(payload));
  }

  if (relative === "sitemap.xml") {
    const body = target === "good"
      ? "<?xml version=\"1.0\"?><urlset><url><loc>https://example.test/api-finder/</loc></url><url><loc>https://example.test/quick-start/</loc></url><url><loc>https://example.test/tools/</loc></url><url><loc>https://example.test/compare/</loc></url><url><loc>https://example.test/en/api-finder/</loc></url><url><loc>https://example.test/en/quick-start/</loc></url><url><loc>https://example.test/en/compare/</loc></url></urlset>"
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
  if (!positive.stdout.includes("UX routes checked: 11")) throw new Error("Positive UX smoke report did not include all bilingual route checks");

  const negative = await runChecker(["--expected-revision=fixture-sha", "--timeout-ms=5000"], {
    UX_SMOKE_TARGETS_JSON: JSON.stringify([{ name: "bad", baseUrl: `${origin}/bad/` }])
  });
  if (negative.code === 0) throw new Error("Expected negative UX smoke fixture to fail");
  for (const explanation of ["missing required UX signal", "missing product route /en/compare/", "sitemap is missing en/compare/"]) {
    if (!negative.stdout.includes(explanation)) throw new Error(`Negative report did not include: ${explanation}\n${negative.stdout}\n${negative.stderr}`);
  }

  const dryRun = await runChecker(["--dry-run", "--target=good"], {
    UX_SMOKE_TARGETS_JSON: JSON.stringify([{ name: "good", baseUrl: `${origin}/good/` }])
  });
  if (dryRun.code !== 0 || !dryRun.stdout.includes("/en/quick-start/")) throw new Error("Bilingual UX smoke dry-run contract failed");

  console.log("Production UX smoke checker fixture tests passed, including Persian and English product journeys.");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
