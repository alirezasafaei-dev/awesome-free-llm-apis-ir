import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourcePage = path.join(root, "site", "quick-start", "index.html");
const sourceStyles = path.join(root, "site", "quick-start", "quick-start.css");
const providerContext = path.join(root, "site", "quick-start", "provider-context.js");
const providerContextEn = path.join(root, "site", "en", "quick-start", "provider-context-en.js");
const destination = path.join(root, ".site-dist");
const quickStartUrl = "https://llm.persiantoolbox.ir/quick-start/";

await access(sourcePage);
await access(sourceStyles);
await access(providerContext);
await access(providerContextEn);

const source = await readFile(sourcePage, "utf8");
const styles = await readFile(sourceStyles, "utf8");
const contextScript = await readFile(providerContext, "utf8");
const contextScriptEn = await readFile(providerContextEn, "utf8");

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

const providerContextSignals = [
  'params.get("provider")',
  'allowedUsecases',
  'allowedRegions',
  'VERIFIED_MODEL_ID',
  'provider.api?.base_url',
  'provider.docs',
  'quick_start_provider_loaded',
  'official_docs_click',
  'finder_handoff',
  'document.body.dataset.providerId',
  'updateEnvironmentExample(provider, model)'
];

for (const signal of ['fetch("../catalog.json"', ...providerContextSignals]) {
  if (!contextScript.includes(signal)) throw new Error(`Provider-aware quick-start is missing: ${signal}`);
}

for (const signal of [
  'fetch("../../catalog.json"',
  'document.querySelector(".qs-en-hero")',
  ...providerContextSignals
]) {
  if (!contextScriptEn.includes(signal)) throw new Error(`English Provider-aware quick-start is missing: ${signal}`);
}

for (const [label, script] of [["Persian", contextScript], ["English", contextScriptEn]]) {
  if (script.includes('type="password"') || script.includes("localStorage.setItem")) {
    throw new Error(`${label} Provider-aware Quick Start must not request or persist API credentials`);
  }
}

for (const evidence of ["Reachability", "Signup", "Key issuance", "Inference"]) {
  if (!source.includes(evidence)) throw new Error(`Developer quick-start does not separate evidence layer: ${evidence}`);
}

for (const status of ["401 Unauthorized", "403 Forbidden", "404 Not Found", "429 Too Many Requests", "200 + HTML"]) {
  if (!source.includes(status)) throw new Error(`Developer quick-start error map is missing: ${status}`);
}

const allQuickStartSource = source + contextScript + contextScriptEn;
if (/\bsk-[A-Za-z0-9_-]{16,}\b/.test(allQuickStartSource)) throw new Error("Possible API secret found in quick-start source");
if (/BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY/.test(allQuickStartSource)) throw new Error("Private key material found in quick-start source");
if ((source.match(/<h1(?:\s|>)/g) || []).length !== 1) throw new Error("Developer quick-start must have exactly one H1");
if ((source.match(/class="copy-button"/g) || []).length < 4) throw new Error("Expected copy controls for environment and three code examples");
if (!styles.includes(".code-example") || !styles.includes(".activation-steps")) throw new Error("Developer quick-start styles are incomplete");

for (const [label, file] of [["Persian", providerContext], ["English", providerContextEn]]) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `${label} Provider-aware quick-start script syntax failed`);
}

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "quick-start-provider-contract" }
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

try {
  const builtPage = await readFile(path.join(destination, "quick-start", "index.html"), "utf8");
  const builtContext = await readFile(path.join(destination, "quick-start", "provider-context.js"), "utf8");
  const builtPageEn = await readFile(path.join(destination, "en", "quick-start", "index.html"), "utf8");
  const builtContextEn = await readFile(path.join(destination, "en", "quick-start", "provider-context-en.js"), "utf8");
  const builtHomepage = await readFile(path.join(destination, "index.html"), "utf8");
  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const llms = await readFile(path.join(destination, "llms.txt"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!builtPage.includes('src="../analytics.js"')) throw new Error("Built quick-start page is missing analytics");
  if (!builtPage.includes('src="../plausible.js"')) throw new Error("Built quick-start page is missing the Plausible tracker");
  if (!builtPage.includes('src="./provider-context.js"')) throw new Error("Built quick-start page is missing Provider context activation");
  if (!builtContext.includes("quick_start_provider_loaded")) throw new Error("Built Provider context lost activation analytics");
  if (!builtPageEn.includes('src="./provider-context-en.js"')) throw new Error("Built English quick-start page is missing Provider context activation");
  if (!builtContextEn.includes('fetch("../../catalog.json"')) throw new Error("Built English Provider context has the wrong catalog path");
  if (!builtContextEn.includes('document.querySelector(".qs-en-hero")')) throw new Error("Built English Provider context lost its page selector");
  if (!builtContextEn.includes("quick_start_provider_loaded")) throw new Error("Built English Provider context lost activation analytics");
  if (!builtHomepage.includes(`href="${quickStartUrl}"`)) throw new Error("Built homepage does not link to developer quick start");
  if (!builtHomepage.includes("شروع مرحله‌ای و نمونه‌کد")) throw new Error("Developer journey is not connected to quick start");
  if (!sitemap.includes(`<loc>${quickStartUrl}</loc>`)) throw new Error("Sitemap is missing quick-start route");
  if (!llms.includes(`Developer quick start: ${quickStartUrl}`)) throw new Error("llms.txt is missing quick-start route");
  if (!buildMeta.static_product_pages?.includes("/quick-start/")) throw new Error("build-meta.json is missing quick-start product route");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Developer quick-start contract passed for Persian and English Provider context, safe model fallback, source-backed Base URL and activation analytics.");
