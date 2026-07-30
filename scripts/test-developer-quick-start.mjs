import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const root = process.cwd();
const sourcePage = path.join(root, "site", "quick-start", "index.html");
const sourceStyles = path.join(root, "site", "quick-start", "quick-start.css");
const providerContextStyles = path.join(root, "site", "quick-start", "provider-context.css");
const providerContext = path.join(root, "site", "quick-start", "provider-context.js");
const providerContextEn = path.join(root, "site", "en", "quick-start", "provider-context-en.js");
const destination = path.join(root, ".site-dist");
const quickStartUrl = "https://llm.persiantoolbox.ir/quick-start/";

await access(sourcePage);
await access(sourceStyles);
await access(providerContextStyles);
await access(providerContext);
await access(providerContextEn);

const source = await readFile(sourcePage, "utf8");
const styles = await readFile(sourceStyles, "utf8");
const contextStyles = await readFile(providerContextStyles, "utf8");
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
  'safeHttpsUrl(provider.api?.base_url)',
  'safeHttpsUrl(provider.docs)',
  'quick_start_provider_loaded',
  'official_docs_click',
  'finder_handoff',
  'document.body.dataset.providerId',
  'updateEnvironmentExample(apiBaseUrl, model)'
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
  for (const forbidden of [
    'type="password"',
    "localStorage.setItem",
    'document.createElement("style")',
    "docs.href = provider.docs",
    "environmentText(provider, model)"
  ]) {
    if (script.includes(forbidden)) throw new Error(`${label} Provider-aware Quick Start contains forbidden behavior: ${forbidden}`);
  }
}

for (const signal of [
  ".provider-context-panel",
  ".provider-context-grid",
  ".provider-context-actions",
  ".provider-context-error",
  "@media (max-width: 640px)"
]) {
  if (!contextStyles.includes(signal)) throw new Error(`Provider context stylesheet is missing: ${signal}`);
}

function extractFunction(sourceText, name) {
  const start = sourceText.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const bodyStart = sourceText.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < sourceText.length; index += 1) {
    if (sourceText[index] === "{") depth += 1;
    if (sourceText[index] === "}") depth -= 1;
    if (depth === 0) return sourceText.slice(start, index + 1);
  }
  throw new Error(`Unterminated function ${name}`);
}

for (const [label, script] of [["Persian", contextScript], ["English", contextScriptEn]]) {
  const sandbox = { URL };
  vm.runInNewContext(`${extractFunction(script, "safeHttpsUrl")}; globalThis.validate = safeHttpsUrl;`, sandbox, { filename: label });
  const validate = sandbox.validate;
  for (const unsafe of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://provider.example/v1",
    "ftp://provider.example/file",
    'https://provider.example/v1"\nexport INJECTED="1'
  ]) {
    if (validate(unsafe) !== null) throw new Error(`${label} safeHttpsUrl accepted unsafe input: ${unsafe}`);
  }
  const valid = validate("https://provider.example/v1");
  if (valid !== "https://provider.example/v1") throw new Error(`${label} safeHttpsUrl rejected or rewrote a valid HTTPS URL unexpectedly: ${valid}`);
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
  const builtContextStyles = await readFile(path.join(destination, "quick-start", "provider-context.css"), "utf8");
  const builtPageEn = await readFile(path.join(destination, "en", "quick-start", "index.html"), "utf8");
  const builtContextEn = await readFile(path.join(destination, "en", "quick-start", "provider-context-en.js"), "utf8");
  const builtHomepage = await readFile(path.join(destination, "index.html"), "utf8");
  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const llms = await readFile(path.join(destination, "llms.txt"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!builtPage.includes('src="../analytics.js"')) throw new Error("Built quick-start page is missing analytics");
  if (!builtPage.includes('src="../plausible.js"')) throw new Error("Built quick-start page is missing the Plausible tracker");
  if (!builtPage.includes('href="./provider-context.css"')) throw new Error("Built quick-start page is missing external Provider context styles");
  if (!builtPage.includes('src="./provider-context.js"')) throw new Error("Built quick-start page is missing Provider context activation");
  if (!builtContext.includes("quick_start_provider_loaded")) throw new Error("Built Provider context lost activation analytics");
  if (!builtContextStyles.includes(".provider-context-panel")) throw new Error("Built Provider context stylesheet lost its panel contract");
  if (!builtPageEn.includes('href="../../quick-start/provider-context.css"')) throw new Error("Built English quick-start page is missing external Provider context styles");
  if (!builtPageEn.includes('src="./provider-context-en.js"')) throw new Error("Built English quick-start page is missing Provider context activation");
  if (!builtContextEn.includes('fetch("../../catalog.json"')) throw new Error("Built English Provider context has the wrong catalog path");
  if (!builtContextEn.includes('document.querySelector(".qs-en-hero")')) throw new Error("Built English Provider context lost its page selector");
  if (!builtContextEn.includes("quick_start_provider_loaded")) throw new Error("Built English Provider context lost activation analytics");

  const quickStartLink = builtHomepage.match(/<a\b[^>]*href="(?:\.\/|https:\/\/llm\.persiantoolbox\.ir\/)quick-start\/"[^>]*>([\s\S]*?)<\/a>/u);
  if (!quickStartLink) throw new Error("Built homepage is missing a discoverable and portable Quick Start link");
  const quickStartLabel = quickStartLink[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!/(درخواست|شروع سریع|راه‌اندازی|نمونه)/u.test(quickStartLabel)) {
    throw new Error(`Quick Start link label does not communicate its purpose: ${quickStartLabel}`);
  }
  if (!sitemap.includes(`<loc>${quickStartUrl}</loc>`)) throw new Error("Sitemap is missing quick-start route");
  if (!llms.includes(`Developer quick start: ${quickStartUrl}`)) throw new Error("llms.txt is missing quick-start route");
  if (!buildMeta.static_product_pages?.includes("/quick-start/")) throw new Error("build-meta.json is missing quick-start product route");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Developer quick-start contract passed for Persian and English Provider context, HTTPS-only URL flow, external CSP-safe styles, safe model fallback, semantic portable homepage linkage and activation analytics.");
