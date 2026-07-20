import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const builder = path.join(root, "scripts", "build-tools-pages.mjs");
const styles = path.join(root, "site", "tools", "tools.css");
const script = path.join(root, "site", "tools", "tools.js");
const destination = path.join(root, ".site-dist");
const toolsUrl = "https://llm.persiantoolbox.ir/tools/";

await access(builder);
await access(styles);
await access(script);

const builderSource = await readFile(builder, "utf8");
const styleSource = await readFile(styles, "utf8");
const scriptSource = await readFile(script, "utf8");

for (const signal of [
  'path.join(root, "data", "tools")',
  "catalog-tools.json",
  "CLI، Router و Proxyهای LLM",
  "ریسک Terms",
  "امنیت Credential",
  "Cookie مرورگر",
  "static_product_pages",
  "tool_count",
  "Tools and CLI catalog"
]) {
  if (!builderSource.includes(signal)) throw new Error(`Tools builder is missing: ${signal}`);
}

for (const selector of [".tools-hero", ".tools-controls", ".tool-grid", ".tool-warning", ".tool-card-actions"]) {
  if (!styleSource.includes(selector)) throw new Error(`Tools styles are missing ${selector}`);
}

for (const signal of [
  "tools_catalog_started",
  "tools_filter_changed",
  "tool_install_copy",
  "tool_repository_click",
  "navigator.clipboard.writeText"
]) {
  if (!scriptSource.includes(signal)) throw new Error(`Tools interaction script is missing: ${signal}`);
}

if (scriptSource.includes("localStorage.setItem") || scriptSource.includes("sessionStorage.setItem")) {
  throw new Error("Tools catalog must not persist search terms or credentials");
}
if (/\b(sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/.test(builderSource + scriptSource)) {
  throw new Error("Possible secret material found in tools catalog assets");
}

for (const file of [builder, script]) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `Syntax check failed for ${file}`);
}

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "tools-catalog-contract" }
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

try {
  const page = await readFile(path.join(destination, "tools", "index.html"), "utf8");
  const builtScript = await readFile(path.join(destination, "tools", "tools.js"), "utf8");
  const catalog = JSON.parse(await readFile(path.join(destination, "catalog-tools.json"), "utf8"));
  const homepage = await readFile(path.join(destination, "index.html"), "utf8");
  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const llms = await readFile(path.join(destination, "llms.txt"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if ((page.match(/<h1(?:\s|>)/g) || []).length !== 1) throw new Error("Tools page must have exactly one H1");
  for (const signal of [
    `<link rel="canonical" href="${toolsUrl}">`,
    'hreflang="fa-IR"',
    'hreflang="x-default"',
    'application/ld+json',
    'class="tools-controls"',
    'class="tool-card"',
    'src="./tools.js"',
    'src="../analytics.js"',
    'src="../plausible.js"'
  ]) {
    if (!page.includes(signal)) throw new Error(`Built tools page is missing: ${signal}`);
  }
  if (!builtScript.includes("tools_filter_changed")) throw new Error("Built tools script lost filter analytics");
  if (catalog.tool_count < 1 || catalog.tools.length !== catalog.tool_count) throw new Error("Published tools catalog count is invalid");
  if (!homepage.includes(`href="${toolsUrl}"`)) throw new Error("Homepage does not link to the canonical tools catalog");
  if (!sitemap.includes(`<loc>${toolsUrl}</loc>`)) throw new Error("Sitemap is missing tools route");
  if (!llms.includes(`Tools and CLI catalog: ${toolsUrl}`)) throw new Error("llms.txt is missing tools route");
  if (!buildMeta.static_product_pages?.includes("/tools/")) throw new Error("Build metadata is missing /tools/");
  if (buildMeta.tool_count !== catalog.tool_count) throw new Error("Build metadata tool count does not match catalog");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Public tools catalog contract passed: risk-aware cards, safe filtering, installation guidance and production discovery are protected.");
