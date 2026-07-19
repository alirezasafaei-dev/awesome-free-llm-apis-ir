import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const version = args.find((arg) => arg.startsWith("--version="))?.slice("--version=".length) ?? "v1";
if (!/^v[0-9]+$/.test(version)) throw new Error("--version must look like v1");

const root = process.cwd();
const versionDir = path.join(root, "benchmarks", "persian", version);
const manifest = JSON.parse(await readFile(path.join(versionDir, "manifest.json"), "utf8"));
const prompts = JSON.parse(await readFile(path.join(versionDir, manifest.prompt_file), "utf8"));

const fail = (message) => {
  throw new Error(`Persian benchmark validation failed: ${message}`);
};

if (manifest.schema_version !== "1.0.0") fail("unsupported manifest schema_version");
if (manifest.language !== "fa-IR") fail("language must be fa-IR");
if (manifest.license !== "MIT") fail("license must be MIT");
if (manifest.scoring !== "deterministic" || manifest.temperature !== 0) fail("must use deterministic scoring at temperature 0");
if (!Array.isArray(prompts) || prompts.length < 15) fail("at least 15 prompts are required");

const ids = new Set();
const categories = new Map(manifest.categories.map((category) => [category, 0]));
const supportedScorers = new Set(["exact_normalized", "exact_surface", "numeric", "json_equal"]);

for (const [index, prompt] of prompts.entries()) {
  const at = `prompt #${index + 1}`;
  if (!/^[a-z]+-[0-9]{2}$/.test(prompt.id ?? "")) fail(`${at} has an invalid id`);
  if (ids.has(prompt.id)) fail(`duplicate prompt id: ${prompt.id}`);
  ids.add(prompt.id);
  if (!categories.has(prompt.category)) fail(`${prompt.id} has an unknown category`);
  categories.set(prompt.category, categories.get(prompt.category) + 1);
  if (typeof prompt.prompt_fa !== "string" || prompt.prompt_fa.length < 20) fail(`${prompt.id} prompt is too short`);
  if (!Number.isInteger(prompt.max_tokens) || prompt.max_tokens < 8 || prompt.max_tokens > 256) fail(`${prompt.id} has unsafe max_tokens`);
  if (!supportedScorers.has(prompt.scoring?.type)) fail(`${prompt.id} has an unsupported scorer`);

  if (["exact_normalized", "exact_surface"].includes(prompt.scoring.type)) {
    if (!Array.isArray(prompt.scoring.expected) || !prompt.scoring.expected.every((value) => typeof value === "string" && value.length)) fail(`${prompt.id} needs string expectations`);
  }
  if (prompt.scoring.type === "numeric" && typeof prompt.scoring.expected !== "number") fail(`${prompt.id} needs a numeric expectation`);
  if (prompt.scoring.type === "json_equal" && (prompt.scoring.expected === null || typeof prompt.scoring.expected !== "object")) fail(`${prompt.id} needs a JSON expectation`);
}

const minPrompts = { context_retrieval: 2 };
for (const [category, count] of categories) {
  const min = minPrompts[category] ?? 3;
  if (count < min) fail(`${category} needs at least ${min} prompts, got ${count}`);
}

console.log(`Validated ${prompts.length} Persian benchmark prompts across ${categories.size} categories.`);
