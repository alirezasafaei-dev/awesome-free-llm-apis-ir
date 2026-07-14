import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function loadDotEnv() {
  try {
    const text = await readFile(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

await loadDotEnv();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const valueArg = (name) => args.find((arg) => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const version = valueArg("--version") ?? "v1";
if (!/^v[0-9]+$/.test(version)) throw new Error("--version must look like v1");

const versionDir = path.join(process.cwd(), "benchmarks", "persian", version);
const manifest = JSON.parse(await readFile(path.join(versionDir, "manifest.json"), "utf8"));
const allPrompts = JSON.parse(await readFile(path.join(versionDir, manifest.prompt_file), "utf8"));
const selectedIds = valueArg("--prompts")?.split(",").filter(Boolean);
const selectedSet = selectedIds ? new Set(selectedIds) : null;
const prompts = selectedSet ? allPrompts.filter((prompt) => selectedSet.has(prompt.id)) : allPrompts;

if (selectedSet) {
  const known = new Set(allPrompts.map((prompt) => prompt.id));
  const unknown = [...selectedSet].filter((id) => !known.has(id));
  if (unknown.length) throw new Error(`Unknown prompt(s): ${unknown.join(", ")}`);
}

const config = {
  providerId: process.env.BENCHMARK_PROVIDER_ID?.trim(),
  baseUrl: process.env.BENCHMARK_API_BASE_URL?.trim()?.replace(/\/+$/, ""),
  apiKey: process.env.BENCHMARK_API_KEY?.trim(),
  model: process.env.BENCHMARK_MODEL?.trim()
};

if (dryRun) {
  console.log(`Persian benchmark ${manifest.id} is valid with ${allPrompts.length} prompts.`);
  console.log(`Runtime configuration: ${Object.values(config).every(Boolean) ? "configured" : "skipped (missing BENCHMARK_* variables)"}.`);
  process.exit(0);
}

for (const [name, value] of Object.entries(config)) {
  if (!value) throw new Error(`Missing benchmark configuration: ${name}`);
}
try {
  const parsed = new URL(config.baseUrl);
  if (parsed.protocol !== "https:" && !/^(localhost|127\.0\.0\.1)$/.test(parsed.hostname)) throw new Error();
} catch {
  throw new Error("BENCHMARK_API_BASE_URL must be HTTPS (HTTP is allowed only for localhost).");
}

const digitMap = new Map([
  ...["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"].map((digit, index) => [digit, String(index)]),
  ...["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"].map((digit, index) => [digit, String(index)])
]);
const latinDigits = (value) => [...value].map((char) => digitMap.get(char) ?? char).join("");
const normalize = (value) => latinDigits(value.normalize("NFKC"))
  .replace(/ي/g, "ی")
  .replace(/ك/g, "ک")
  .replace(/[\u200e\u200f]/g, "")
  .replace(/\s+/g, " ")
  .trim();
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const extractJson = (value) => {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
};

function scoreResponse(response, scoring) {
  if (scoring.type === "exact_surface") return scoring.expected.includes(response.trim());
  if (scoring.type === "exact_normalized") return scoring.expected.map(normalize).includes(normalize(response));
  if (scoring.type === "numeric") {
    const compact = latinDigits(response).replace(/[٬،,_\s]/g, "");
    const match = compact.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) === scoring.expected : false;
  }
  if (scoring.type === "json_equal") {
    try {
      return stableJson(extractJson(response)) === stableJson(scoring.expected);
    } catch {
      return false;
    }
  }
  throw new Error(`Unsupported scorer: ${scoring.type}`);
}

async function runPrompt(prompt) {
  const started = Date.now();
  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
        "user-agent": "awesome-free-llm-apis-ir-benchmark/1.0"
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "دستور کاربر را دقیق اجرا کن. پاسخ را فقط به زبان و قالب خواسته‌شده برگردان." },
          { role: "user", content: prompt.prompt_fa }
        ],
        temperature: manifest.temperature,
        max_tokens: prompt.max_tokens,
        seed: 1
      })
    });
    const body = await response.text();
    if (!response.ok) return { prompt_id: prompt.id, category: prompt.category, status: "request_error", passed: null, latency_ms: Date.now() - started, http_status: response.status, response: null, error: `HTTP ${response.status}` };
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return { prompt_id: prompt.id, category: prompt.category, status: "invalid_response", passed: null, latency_ms: Date.now() - started, http_status: response.status, response: null, error: "Provider returned invalid JSON" };
    }
    const content = parsed?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return { prompt_id: prompt.id, category: prompt.category, status: "invalid_response", passed: null, latency_ms: Date.now() - started, http_status: response.status, response: null, error: "Missing choices[0].message.content" };
    return { prompt_id: prompt.id, category: prompt.category, status: "scored", passed: scoreResponse(content, prompt.scoring), latency_ms: Date.now() - started, http_status: response.status, response: content, error: null };
  } catch (error) {
    return { prompt_id: prompt.id, category: prompt.category, status: "request_error", passed: null, latency_ms: Date.now() - started, http_status: null, response: null, error: error.name === "TimeoutError" ? "Request timed out" : "Network request failed" };
  }
}

const results = [];
for (const [index, prompt] of prompts.entries()) {
  const result = await runPrompt(prompt);
  results.push(result);
  console.log(`[${index + 1}/${prompts.length}] ${prompt.id}: ${result.status === "scored" ? (result.passed ? "pass" : "fail") : result.status}`);
}

const scored = results.filter((result) => result.status === "scored");
const passed = scored.filter((result) => result.passed).length;
const byCategory = {};
for (const category of manifest.categories) {
  const categoryResults = results.filter((result) => result.category === category);
  const categoryScored = categoryResults.filter((result) => result.status === "scored");
  byCategory[category] = {
    passed: categoryScored.filter((result) => result.passed).length,
    scored: categoryScored.length,
    total: categoryResults.length
  };
}

const report = {
  schema_version: "1.0.0",
  benchmark_id: manifest.id,
  run_id: randomUUID(),
  run_at: new Date().toISOString(),
  provider_id: config.providerId,
  model: config.model,
  complete: results.length === allPrompts.length && scored.length === results.length,
  summary: {
    passed,
    scored: scored.length,
    total: results.length,
    score_percent: scored.length ? Number(((passed / scored.length) * 100).toFixed(2)) : 0,
    errors: results.length - scored.length,
    by_category: byCategory
  },
  results
};

const stamp = report.run_at.replace(/[:.]/g, "-");
const output = valueArg("--output") ?? path.join("benchmarks", "results", "local", `${config.providerId}-${config.model.replace(/[^a-zA-Z0-9._-]+/g, "-")}-${stamp}.json`);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(`Score: ${passed}/${scored.length} scored (${report.summary.score_percent}%).`);
console.log(`Report written to ${output}.`);
if (!report.complete) {
  console.error("Run is incomplete and must not be included in a leaderboard.");
  process.exitCode = 2;
}
