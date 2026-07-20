import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePage = path.join(root, "site", "quick-start", "index.html");
const sourceStyles = path.join(root, "site", "quick-start", "quick-start.css");
const destination = path.join(root, ".site-dist");
const quickStartUrl = "https://llm.persiantoolbox.ir/quick-start/";

await access(sourcePage);
await access(sourceStyles);

const source = await readFile(sourcePage, "utf8");
const styles = await readFile(sourceStyles, "utf8");

const requiredSourceSignals = [
  `<link rel="canonical" href="${quickStartUrl}">`,
  'hreflang="fa-IR"',
  'hreflang="x-default"',
  'application/ld+json',
  '"@type": "TechArticle"',
  '"@type": "HowTo"',
  'id="activation-flow"',
  'id="evidence"',
  'id="environment"',
  'id="code-examples"',
  'id="errors"',
  'LLM_API_KEY',
  'LLM_BASE_URL',
  'LLM_MODEL',
  'from openai import OpenAI',
  'import OpenAI from "openai"',
  'curl "$LLM_BASE_URL/chat/completions"',
  'class="copy-button"',
  'data-copy-text=',
  '../api-finder/',
  '../guides/fix-llm-api-401-403-model-not-found/',
  '../guides/llm-api-rate-limit-429/'
];

for (const signal of requiredSourceSignals) {
  if (!source.includes(signal)) throw new Error(`Developer quick-start source is missing: ${signal}`);
}

for (const evidence of ["Reachability", "Signup", "Key issuance", "Inference"]) {
  if (!source.includes(evidence)) throw new Error(`Developer quick-start does not separate evidence layer: ${evidence}`);
}

for (const status of ["401 Unauthorized", "403 Forbidden", "404 Not Found", "429 Too Many Requests", "200 + HTML"]) {
  if (!source.includes(status)) throw new Error(`Developer quick-start error map is missing: ${status}`);
}

if (/\bsk-[A-Za-z0-9_-]{16,}\b/.test(source)) throw new Error("Possible API secret found in quick-start source");
if (/BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY/.test(source)) throw new Error("Private key material found in quick-start source");
if ((source.match(/<h1(?:\s|>)/g) || []).length !== 1) throw new Error("Developer quick-start must have exactly one H1");
if ((source.match(/class="copy-button"/g) || []).length < 4) throw new Error("Expected copy controls for environment and three code examples");
if (!styles.includes(".code-example") || !styles.includes(".activation-steps")) throw new Error("Developer quick-start styles are incomplete");

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "quick-start-contract" }
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

try {
  const builtPage = await readFile(path.join(destination, "quick-start", "index.html"), "utf8");
  const builtHomepage = await readFile(path.join(destination, "index.html"), "utf8");
  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const llms = await readFile(path.join(destination, "llms.txt"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!builtPage.includes('src="../analytics.js"')) throw new Error("Built quick-start page is missing analytics");
  if (!builtPage.includes('src="../plausible.js"')) throw new Error("Built quick-start page is missing the Plausible tracker");
  if (!builtHomepage.includes(`href="${quickStartUrl}"`)) throw new Error("Built homepage does not link to developer quick start");
  if (!builtHomepage.includes("شروع مرحله‌ای و نمونه‌کد")) throw new Error("Developer journey is not connected to quick start");
  if (!sitemap.includes(`<loc>${quickStartUrl}</loc>`)) throw new Error("Sitemap is missing quick-start route");
  if (!llms.includes(`Developer quick start: ${quickStartUrl}`)) throw new Error("llms.txt is missing quick-start route");
  if (!buildMeta.static_product_pages?.includes("/quick-start/")) throw new Error("build-meta.json is missing quick-start product route");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Developer quick-start contract passed: secure setup, copy-ready examples, evidence layers and production discovery are complete.");
