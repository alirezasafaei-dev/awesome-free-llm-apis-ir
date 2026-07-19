import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PROVIDERS_DIR = path.join(process.cwd(), "data", "providers");
const HEALTH_FILE = path.join(process.cwd(), "data", "api-health.json");
const checkFlag = process.argv.includes("--check");
const today = new Date().toISOString().slice(0, 10);
const CONCURRENCY = 6;

async function fetchUrl(url) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "awesome-free-llm-apis-ir-health-checker/1.0" }
    });
    const latency = Date.now() - start;
    await response.body?.cancel();
    return { status: response.status, latency, error: null };
  } catch (error) {
    const latency = Date.now() - start;
    return { status: null, latency, error: error.message };
  }
}

function classifyEndpointStatus(results) {
  const { api, website, docs } = results;
  const checks = [api, website, docs].filter(Boolean);

  if (checks.length && checks.every((r) => r.error === null && r.status >= 200 && r.status < 400)) {
    return "operational";
  }

  if (checks.some((r) => r.error !== null || (r.status !== null && (r.status >= 500 || r.status === 408 || r.status === 425)))) {
    return "down";
  }

  if (checks.some((r) => r.status !== null && (r.status === 401 || r.status === 403 || r.status === 429))) {
    return "degraded";
  }

  return "unknown";
}

function collectBrokenUrls(results) {
  return Object.values(results)
    .filter((r) => r && (r.error !== null || (r.status !== null && r.status >= 400)))
    .map((r) => r.url);
}

function averageLatency(results) {
  const values = Object.values(results)
    .filter((r) => r && r.latency != null && r.error === null)
    .map((r) => r.latency);
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

async function checkProvider(provider) {
  const id = provider.id;
  const apiUrl = provider.api?.base_url;
  const websiteUrl = provider.website;
  const docsUrl = provider.docs;
  const staleAfterDays = provider.verification?.stale_after_days || 30;
  const lastChecked = provider.verification?.last_checked;

  const stale = lastChecked
    ? (Date.now() - new Date(`${lastChecked}T00:00:00Z`).getTime()) / 86_400_000 > staleAfterDays
    : false;

  const tasks = [];
  const results = {};

  if (apiUrl) {
    tasks.push(
      fetchUrl(apiUrl).then((r) => { results.api = { ...r, url: apiUrl }; })
    );
  }
  if (websiteUrl) {
    tasks.push(
      fetchUrl(websiteUrl).then((r) => { results.website = { ...r, url: websiteUrl }; })
    );
  }
  if (docsUrl) {
    tasks.push(
      fetchUrl(docsUrl).then((r) => { results.docs = { ...r, url: docsUrl }; })
    );
  }

  await Promise.all(tasks);

  const statusSymbol = (r) =>
    r.error ? "FAIL" : r.status >= 200 && r.status < 400 ? "OK" : r.status >= 400 && r.status < 500 ? "WARN" : "FAIL";

  for (const [label, r] of Object.entries(results)) {
    console.log(`  ${label.padEnd(5)} ${statusSymbol(r)} ${r.status ?? "-".padStart(3)} ${r.url}${r.error ? ` (${r.error})` : ""}`);
  }

  const endpointStatus = classifyEndpointStatus(results);
  const broken = collectBrokenUrls(results);
  const latency = averageLatency(results);

  const statusTag =
    endpointStatus === "operational" ? "OK" :
    endpointStatus === "degraded" ? "DEGRADED" :
    endpointStatus === "down" ? "DOWN" : "UNKNOWN";

  console.log(`  \u2192 ${statusTag} | latency=${latency ?? "N/A"}ms | broken=${broken.length} | stale=${stale}`);

  return {
    provider_id: id,
    last_verification_date: today,
    endpoint_status: endpointStatus,
    endpoint_tested: apiUrl || websiteUrl || docsUrl || null,
    documentation_change_detected: false,
    documentation_last_checked: today,
    broken_links: broken,
    latency_ms: latency,
    notes: null,
    checked_by: "system"
  };
}

async function main() {
  const providerFiles = (await readdir(PROVIDERS_DIR))
    .filter((f) => f.endsWith(".json"))
    .sort();

  const providers = [];
  for (const file of providerFiles) {
    providers.push(JSON.parse(await readFile(path.join(PROVIDERS_DIR, file), "utf8")));
  }

  let cursor = 0;
  const results = [];
  let anyDown = false;

  async function worker() {
    while (cursor < providers.length) {
      const provider = providers[cursor];
      cursor += 1;
      console.log(`\n--- ${provider.name} (${provider.id}) ---`);
      const entry = await checkProvider(provider);
      results.push(entry);
      if (entry.endpoint_status === "down") anyDown = true;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, providers.length) }, () => worker())
  );

  results.sort((a, b) => a.provider_id.localeCompare(b.provider_id));

  const output = {
    schema_version: "1.0.0",
    entries: results
  };

  if (checkFlag) {
    const existing = JSON.parse(await readFile(HEALTH_FILE, "utf8"));
    const existingStr = JSON.stringify(existing, null, 2) + "\n";
    const newStr = JSON.stringify(output, null, 2) + "\n";
    if (existingStr !== newStr) {
      console.error("\napi-health.json is out of date. Run without --check to update.");
      process.exit(1);
    }
    console.log("\napi-health.json is up to date.");
  } else {
    await writeFile(HEALTH_FILE, JSON.stringify(output, null, 2) + "\n");
    console.log(`\nWrote ${results.length} entries to data/api-health.json`);
  }

  if (anyDown) {
    console.error("\nOne or more providers are DOWN.");
    process.exit(1);
  }
}

await main();
