import { writeFile } from "node:fs/promises";
import process from "node:process";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TARGETS = [
  {
    name: "global",
    baseUrl: "https://llm.persiantoolbox.ir/",
    robotsPolicy: "index"
  },
  {
    name: "iran",
    baseUrl: "https://ir.llm.persiantoolbox.ir/",
    robotsPolicy: "noindex"
  },
  {
    name: "pages",
    baseUrl: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/",
    robotsPolicy: "index"
  }
];

const CORE_PATHS = [
  { path: "", kind: "html" },
  { path: "en/", kind: "html" },
  { path: "api-finder/", kind: "html" },
  { path: "catalog.json", kind: "catalog" },
  { path: "data.json", kind: "data" },
  { path: "sitemap.xml", kind: "xml" },
  { path: "robots.txt", kind: "text" },
  { path: "build-meta.json", kind: "build-meta" },
  { path: "__smoke_missing_route__", kind: "missing" }
];

function parseArgs(argv) {
  const options = {
    targets: null,
    expectedRevision: process.env.EXPECTED_REVISION || "",
    timeoutMs: Number(process.env.SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    reportPath: process.env.SMOKE_REPORT_PATH || "",
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

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 1_000) {
    throw new Error(`Invalid timeout: ${options.timeoutMs}`);
  }

  return options;
}

function loadTargets() {
  const raw = process.env.SMOKE_TARGETS_JSON;
  if (!raw) return DEFAULT_TARGETS;

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("SMOKE_TARGETS_JSON must be a non-empty JSON array");
  }

  return parsed.map((target, index) => {
    if (!target || typeof target !== "object") throw new Error(`Target ${index} must be an object`);
    if (!target.name || !target.baseUrl) throw new Error(`Target ${index} is missing name or baseUrl`);
    return {
      name: String(target.name),
      baseUrl: String(target.baseUrl),
      robotsPolicy: target.robotsPolicy === "noindex" ? "noindex" : "index"
    };
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
        "user-agent": "awesome-free-llm-apis-ir-production-smoke/1.0",
        accept: "text/html,application/json,application/xml,text/xml,text/plain;q=0.9,*/*;q=0.8"
      }
    });
    const body = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      url: response.url,
      elapsedMs: Math.round(performance.now() - startedAt),
      headers: Object.fromEntries(response.headers.entries()),
      body
    };
  } finally {
    clearTimeout(timer);
  }
}

function addFailure(result, message) {
  result.failures.push(message);
}

function looksLikeHtml(body) {
  return /<!doctype\s+html|<html[\s>]/i.test(body);
}

function validateHtml(check, response) {
  const contentType = response.headers["content-type"] || "";
  if (!response.ok) addFailure(check, `expected 2xx, received HTTP ${response.status}`);
  if (!contentType.includes("text/html")) addFailure(check, `expected text/html, received ${contentType || "missing content-type"}`);
  if (!looksLikeHtml(response.body)) addFailure(check, "response does not look like HTML");
}

function validateJson(check, response, label) {
  const contentType = response.headers["content-type"] || "";
  if (!response.ok) addFailure(check, `expected 2xx, received HTTP ${response.status}`);
  if (!contentType.includes("application/json") && !contentType.includes("text/json")) {
    addFailure(check, `${label} must use a JSON content type, received ${contentType || "missing content-type"}`);
  }
  if (looksLikeHtml(response.body)) addFailure(check, `${label} returned an HTML fallback`);

  try {
    return JSON.parse(response.body);
  } catch (error) {
    addFailure(check, `${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function validateXml(check, response) {
  if (!response.ok) addFailure(check, `expected 2xx, received HTTP ${response.status}`);
  if (!/<urlset[\s>]/i.test(response.body)) addFailure(check, "sitemap does not contain a urlset root");
}

function validateText(check, response) {
  if (!response.ok) addFailure(check, `expected 2xx, received HTTP ${response.status}`);
  if (!/sitemap:/i.test(response.body)) addFailure(check, "robots.txt does not declare a sitemap");
}

function validateMissing(check, response) {
  if (response.status !== 404) addFailure(check, `representative missing route must return HTTP 404, received ${response.status}`);
}

function validateRobotsPolicy(target, check, response) {
  if (check.path !== "") return;
  const header = response.headers["x-robots-tag"] || "";
  if (target.robotsPolicy === "noindex" && !/noindex/i.test(header)) {
    addFailure(check, "Iran mirror root is missing X-Robots-Tag: noindex");
  }
  if (target.robotsPolicy === "index" && /noindex/i.test(header)) {
    addFailure(check, "indexable target unexpectedly returns X-Robots-Tag: noindex");
  }
}

function normalizeRevision(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function checkTarget(target, options) {
  const result = {
    name: target.name,
    baseUrl: ensureTrailingSlash(target.baseUrl),
    robotsPolicy: target.robotsPolicy,
    checks: [],
    failures: [],
    catalogProviderIds: [],
    metadata: {}
  };

  let catalog = null;
  let data = null;
  let buildMeta = null;

  for (const spec of CORE_PATHS) {
    const check = {
      path: spec.path,
      kind: spec.kind,
      url: targetUrl(target.baseUrl, spec.path),
      status: null,
      elapsedMs: null,
      failures: []
    };

    try {
      const response = await fetchWithTimeout(check.url, options.timeoutMs);
      check.status = response.status;
      check.elapsedMs = response.elapsedMs;
      validateRobotsPolicy(target, check, response);

      if (spec.kind === "html") validateHtml(check, response);
      else if (spec.kind === "catalog") catalog = validateJson(check, response, "catalog.json");
      else if (spec.kind === "data") data = validateJson(check, response, "data.json");
      else if (spec.kind === "build-meta") buildMeta = validateJson(check, response, "build-meta.json");
      else if (spec.kind === "xml") validateXml(check, response);
      else if (spec.kind === "text") validateText(check, response);
      else if (spec.kind === "missing") validateMissing(check, response);
    } catch (error) {
      addFailure(check, `${error.name || "Error"}: ${error.message}`);
    }

    if (check.failures.length) {
      result.failures.push(...check.failures.map((message) => `${check.url}: ${message}`));
    }
    result.checks.push(check);
  }

  if (catalog) {
    const providers = Array.isArray(catalog.providers) ? catalog.providers : [];
    const ids = providers.map((provider) => provider?.id).filter((id) => typeof id === "string" && id.length > 0);
    result.catalogProviderIds = ids;
    result.metadata.catalogProviderCount = catalog.provider_count;

    if (ids.length === 0) result.failures.push("catalog.json has no providers");
    if (catalog.provider_count !== ids.length) {
      result.failures.push(`catalog.json provider_count (${catalog.provider_count}) does not match providers.length (${ids.length})`);
    }
    if (new Set(ids).size !== ids.length) result.failures.push("catalog.json contains duplicate provider IDs");
  }

  if (data) {
    const providers = Array.isArray(data.providers) ? data.providers : [];
    result.metadata.dataProviderCount = data.providerCount;
    if (data.providerCount !== providers.length) {
      result.failures.push(`data.json providerCount (${data.providerCount}) does not match providers.length (${providers.length})`);
    }
    if (catalog && data.providerCount !== catalog.provider_count) {
      result.failures.push(`data.json providerCount (${data.providerCount}) does not match catalog provider_count (${catalog.provider_count})`);
    }
  }

  if (buildMeta) {
    const revision = normalizeRevision(buildMeta.source_revision || buildMeta.sourceRevision || buildMeta.revision);
    result.metadata.sourceRevision = revision || null;
    result.metadata.buildProviderCount = buildMeta.provider_count ?? buildMeta.providerCount ?? null;

    if (options.expectedRevision) {
      const expected = normalizeRevision(options.expectedRevision);
      if (!revision) result.failures.push("build-meta.json does not expose source_revision");
      else if (revision !== expected && !revision.startsWith(expected) && !expected.startsWith(revision)) {
        result.failures.push(`deployed revision ${revision} does not match expected revision ${expected}`);
      }
    }
  }

  for (const id of result.catalogProviderIds) {
    const check = {
      path: `providers/${id}/`,
      kind: "provider",
      url: targetUrl(target.baseUrl, `providers/${id}/`),
      status: null,
      elapsedMs: null,
      failures: []
    };
    try {
      const response = await fetchWithTimeout(check.url, options.timeoutMs);
      check.status = response.status;
      check.elapsedMs = response.elapsedMs;
      validateHtml(check, response);
      if (!response.body.includes(id)) addFailure(check, `provider page does not contain provider ID ${id}`);
      if (!response.body.includes("application/ld+json")) addFailure(check, "provider page is missing JSON-LD");
    } catch (error) {
      addFailure(check, `${error.name || "Error"}: ${error.message}`);
    }
    if (check.failures.length) result.failures.push(...check.failures.map((message) => `${check.url}: ${message}`));
    result.checks.push(check);
  }

  result.ok = result.failures.length === 0;
  return result;
}

function markdownReport(report) {
  const lines = [
    "# Production Smoke Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Expected revision: ${report.expectedRevision || "not enforced"}`,
    `Overall: ${report.ok ? "PASS" : "FAIL"}`,
    ""
  ];

  for (const target of report.targets) {
    lines.push(`## ${target.name}: ${target.ok ? "PASS" : "FAIL"}`);
    lines.push("");
    lines.push(`- Base URL: ${target.baseUrl}`);
    lines.push(`- Provider pages checked: ${target.catalogProviderIds.length}`);
    if (target.metadata.sourceRevision) lines.push(`- Deployed revision: ${target.metadata.sourceRevision}`);
    lines.push(`- Requests: ${target.checks.length}`);
    lines.push("");

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
  const selectedTargets = options.targets
    ? availableTargets.filter((target) => options.targets.includes(target.name))
    : availableTargets;

  if (selectedTargets.length === 0) {
    throw new Error(`No matching targets. Available targets: ${availableTargets.map((target) => target.name).join(", ")}`);
  }

  if (options.dryRun) {
    console.log(JSON.stringify({
      expectedRevision: options.expectedRevision || null,
      timeoutMs: options.timeoutMs,
      targets: selectedTargets,
      corePaths: CORE_PATHS.map((entry) => entry.path)
    }, null, 2));
    return;
  }

  const results = [];
  for (const target of selectedTargets) {
    console.log(`Checking ${target.name}: ${target.baseUrl}`);
    results.push(await checkTarget(target, options));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    expectedRevision: options.expectedRevision || null,
    ok: results.every((result) => result.ok),
    targets: results
  };

  const markdown = markdownReport(report);
  process.stdout.write(markdown);

  if (options.reportPath) {
    await writeFile(options.reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  }

  if (!report.ok) process.exitCode = 1;
}

await main().catch((error) => {
  console.error(`Production smoke check failed: ${error.message}`);
  process.exitCode = 1;
});
