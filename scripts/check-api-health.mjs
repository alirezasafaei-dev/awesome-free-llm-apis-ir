import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  classifyEndpointStatus,
  classifyProbe,
  collectBrokenUrls,
  statusNote,
  statusSymbol
} from "./lib/api-health-classification.mjs";

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
      signal: AbortSignal.timeout(30_000),
      headers: { "user-agent": "awesome-free-llm-apis-ir-health-checker/1.1" }
    });
    const latency = Date.now() - start;
    await response.body?.cancel();
    return { status: response.status, latency, error: null };
  } catch (error) {
    const latency = Date.now() - start;
    return { status: null, latency, error: error.message };
  }
}

function averageLatency(results) {
  const values = Object.values(results)
    .filter((result) => result && result.latency != null && result.error === null)
    .map((result) => result.latency);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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
    tasks.push(fetchUrl(apiUrl).then((result) => { results.api = { ...result, url: apiUrl }; }));
  }
  if (websiteUrl) {
    tasks.push(fetchUrl(websiteUrl).then((result) => { results.website = { ...result, url: websiteUrl }; }));
  }
  if (docsUrl) {
    tasks.push(fetchUrl(docsUrl).then((result) => { results.docs = { ...result, url: docsUrl }; }));
  }

  await Promise.all(tasks);

  for (const [kind, result] of Object.entries(results)) {
    const classification = classifyProbe(kind, result);
    console.log(
      `  ${kind.padEnd(7)} ${statusSymbol(kind, result).padEnd(9)} ${String(result.status ?? "-").padStart(3)} ${classification.padEnd(13)} ${result.url}${result.error ? ` (${result.error})` : ""}`
    );
  }

  const endpointStatus = classifyEndpointStatus(results);
  const broken = collectBrokenUrls(results);
  const latency = averageLatency(results);
  const statusTag = endpointStatus.toUpperCase();

  console.log(`  → ${statusTag} | latency=${latency ?? "N/A"}ms | broken=${broken.length} | stale=${stale}`);

  return {
    provider_id: id,
    last_verification_date: today,
    endpoint_status: endpointStatus,
    endpoint_tested: apiUrl || websiteUrl || docsUrl || null,
    documentation_change_detected: false,
    documentation_last_checked: today,
    broken_links: broken,
    latency_ms: latency,
    notes: statusNote(endpointStatus, results.api),
    checked_by: "system"
  };
}

async function main() {
  const providerFiles = (await readdir(PROVIDERS_DIR))
    .filter((file) => file.endsWith(".json"))
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
    entries: results,
    last_updated: today
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
    console.error("\nOne or more API endpoints have an infrastructure-level DOWN result.");
    process.exit(1);
  }
}

await main();
