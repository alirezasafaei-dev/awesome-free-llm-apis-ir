import { writeFile } from "node:fs/promises";
import process from "node:process";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TARGETS = [
  { name: "global", baseUrl: "https://llm.persiantoolbox.ir/" },
  { name: "iran", baseUrl: "https://ir.llm.persiantoolbox.ir/" },
  { name: "pages", baseUrl: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/" }
];

function parseArgs(argv) {
  const options = {
    targets: null,
    expectedRevision: process.env.EXPECTED_REVISION || "",
    timeoutMs: Number(process.env.UX_SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    reportPath: process.env.UX_SMOKE_REPORT_PATH || "",
    dryRun: false
  };

  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--target=")) options.targets = arg.slice("--target=".length).split(",").map((value) => value.trim()).filter(Boolean);
    else if (arg.startsWith("--expected-revision=")) options.expectedRevision = arg.slice("--expected-revision=".length).trim();
    else if (arg.startsWith("--timeout-ms=")) options.timeoutMs = Number(arg.slice("--timeout-ms=".length));
    else if (arg.startsWith("--report=")) options.reportPath = arg.slice("--report=".length).trim();
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1_000) throw new Error(`Invalid timeout: ${options.timeoutMs}`);
  return options;
}

function loadTargets() {
  const raw = process.env.UX_SMOKE_TARGETS_JSON;
  if (!raw) return DEFAULT_TARGETS;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("UX_SMOKE_TARGETS_JSON must be a non-empty JSON array");
  return parsed.map((target, index) => {
    if (!target || typeof target !== "object" || !target.name || !target.baseUrl) throw new Error(`Target ${index} is missing name or baseUrl`);
    return { name: String(target.name), baseUrl: String(target.baseUrl) };
  });
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function targetUrl(baseUrl, relativePath) {
  return new URL(relativePath, ensureTrailingSlash(baseUrl)).toString();
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "awesome-free-llm-apis-ir-ux-smoke/1.0",
        accept: "text/html,application/json,application/xml,text/xml;q=0.9,*/*;q=0.8"
      }
    });
    return {
      status: response.status,
      ok: response.ok,
      elapsedMs: Math.round(performance.now() - startedAt),
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  } finally {
    clearTimeout(timer);
  }
}

function addFailure(check, message) {
  check.failures.push(message);
}

function validateHtml(check, response) {
  const contentType = response.headers["content-type"] || "";
  if (!response.ok) addFailure(check, `expected 2xx, received HTTP ${response.status}`);
  if (!contentType.includes("text/html")) addFailure(check, `expected text/html, received ${contentType || "missing content-type"}`);
  if (!/<!doctype\s+html|<html[\s>]/i.test(response.body)) addFailure(check, "response does not look like HTML");
}

function requireSignals(check, body, signals) {
  for (const signal of signals) {
    if (!body.includes(signal)) addFailure(check, `missing required UX signal: ${signal}`);
  }
}

function normalizeRevision(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function checkTarget(target, options) {
  const result = {
    name: target.name,
    baseUrl: ensureTrailingSlash(target.baseUrl),
    checks: [],
    failures: [],
    metadata: {}
  };

  const specs = [
    {
      path: "",
      kind: "homepage",
      signals: ["API رایگان هوش مصنوعی", "audience-paths", "/api-finder/", "/quick-start/"]
    },
    {
      path: "api-finder/",
      kind: "api-finder",
      signals: ["finder-form", "application/ld+json", "finder-clarity.css", "finder-clarity.js"]
    },
    {
      path: "quick-start/",
      kind: "quick-start",
      signals: ["quick-start-title", "LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL", "from openai import OpenAI", "import OpenAI from", "application/ld+json"]
    }
  ];

  for (const spec of specs) {
    const check = { path: spec.path, kind: spec.kind, url: targetUrl(target.baseUrl, spec.path), status: null, elapsedMs: null, failures: [] };
    try {
      const response = await fetchWithTimeout(check.url, options.timeoutMs);
      check.status = response.status;
      check.elapsedMs = response.elapsedMs;
      validateHtml(check, response);
      requireSignals(check, response.body, spec.signals);
    } catch (error) {
      addFailure(check, `${error.name || "Error"}: ${error.message}`);
    }
    if (check.failures.length) result.failures.push(...check.failures.map((message) => `${check.url}: ${message}`));
    result.checks.push(check);
  }

  const metaCheck = { path: "build-meta.json", kind: "build-meta", url: targetUrl(target.baseUrl, "build-meta.json"), status: null, elapsedMs: null, failures: [] };
  try {
    const response = await fetchWithTimeout(metaCheck.url, options.timeoutMs);
    metaCheck.status = response.status;
    metaCheck.elapsedMs = response.elapsedMs;
    const contentType = response.headers["content-type"] || "";
    if (!response.ok) addFailure(metaCheck, `expected 2xx, received HTTP ${response.status}`);
    if (!contentType.includes("application/json") && !contentType.includes("text/json")) addFailure(metaCheck, `expected JSON content type, received ${contentType || "missing content-type"}`);
    let meta = null;
    try { meta = JSON.parse(response.body); } catch (error) { addFailure(metaCheck, `invalid JSON: ${error.message}`); }
    if (meta) {
      const revision = normalizeRevision(meta.source_revision || meta.sourceRevision || meta.revision);
      result.metadata.sourceRevision = revision || null;
      const productPages = Array.isArray(meta.static_product_pages) ? meta.static_product_pages : [];
      result.metadata.staticProductPages = productPages;
      for (const route of ["/api-finder/", "/quick-start/"]) {
        if (!productPages.includes(route)) addFailure(metaCheck, `build metadata is missing product route ${route}`);
      }
      if (options.expectedRevision) {
        const expected = normalizeRevision(options.expectedRevision);
        if (!revision) addFailure(metaCheck, "build-meta.json does not expose source_revision");
        else if (revision !== expected && !revision.startsWith(expected) && !expected.startsWith(revision)) {
          addFailure(metaCheck, `deployed revision ${revision} does not match expected revision ${expected}`);
        }
      }
    }
  } catch (error) {
    addFailure(metaCheck, `${error.name || "Error"}: ${error.message}`);
  }
  if (metaCheck.failures.length) result.failures.push(...metaCheck.failures.map((message) => `${metaCheck.url}: ${message}`));
  result.checks.push(metaCheck);

  const sitemapCheck = { path: "sitemap.xml", kind: "sitemap", url: targetUrl(target.baseUrl, "sitemap.xml"), status: null, elapsedMs: null, failures: [] };
  try {
    const response = await fetchWithTimeout(sitemapCheck.url, options.timeoutMs);
    sitemapCheck.status = response.status;
    sitemapCheck.elapsedMs = response.elapsedMs;
    if (!response.ok) addFailure(sitemapCheck, `expected 2xx, received HTTP ${response.status}`);
    for (const route of ["api-finder/", "quick-start/"]) {
      if (!response.body.includes(route)) addFailure(sitemapCheck, `sitemap is missing ${route}`);
    }
  } catch (error) {
    addFailure(sitemapCheck, `${error.name || "Error"}: ${error.message}`);
  }
  if (sitemapCheck.failures.length) result.failures.push(...sitemapCheck.failures.map((message) => `${sitemapCheck.url}: ${message}`));
  result.checks.push(sitemapCheck);

  result.ok = result.failures.length === 0;
  return result;
}

function markdownReport(report) {
  const lines = [
    "# Production UX Smoke Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Expected revision: ${report.expectedRevision || "not enforced"}`,
    `Overall: ${report.ok ? "PASS" : "FAIL"}`,
    ""
  ];
  for (const target of report.targets) {
    lines.push(`## ${target.name}: ${target.ok ? "PASS" : "FAIL"}`, "");
    lines.push(`- Base URL: ${target.baseUrl}`);
    if (target.metadata.sourceRevision) lines.push(`- Deployed revision: ${target.metadata.sourceRevision}`);
    lines.push(`- UX routes checked: ${target.checks.length}`, "");
    if (target.failures.length) {
      lines.push("### Failures", "");
      for (const failure of target.failures) lines.push(`- ${failure}`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const availableTargets = loadTargets();
  const selectedTargets = options.targets ? availableTargets.filter((target) => options.targets.includes(target.name)) : availableTargets;
  if (!selectedTargets.length) throw new Error(`No matching targets. Available targets: ${availableTargets.map((target) => target.name).join(", ")}`);

  if (options.dryRun) {
    console.log(JSON.stringify({
      expectedRevision: options.expectedRevision || null,
      timeoutMs: options.timeoutMs,
      targets: selectedTargets,
      requiredRoutes: ["/", "/api-finder/", "/quick-start/", "/build-meta.json", "/sitemap.xml"]
    }, null, 2));
    return;
  }

  const targets = [];
  for (const target of selectedTargets) targets.push(await checkTarget(target, options));
  const report = {
    generatedAt: new Date().toISOString(),
    expectedRevision: options.expectedRevision || null,
    ok: targets.every((target) => target.ok),
    targets
  };
  const markdown = markdownReport(report);
  if (options.reportPath) await writeFile(options.reportPath, markdown);
  console.log(markdown);
  if (!report.ok) process.exitCode = 1;
}

await main();
