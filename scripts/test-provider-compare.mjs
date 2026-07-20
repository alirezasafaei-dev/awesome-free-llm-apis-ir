import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const shortlistScript = path.join(root, "site", "api-finder", "shortlist.js");
const shortlistStyles = path.join(root, "site", "api-finder", "shortlist.css");
const comparePage = path.join(root, "site", "compare", "index.html");
const compareScript = path.join(root, "site", "compare", "compare.js");
const compareStyles = path.join(root, "site", "compare", "compare.css");
const destination = path.join(root, ".site-dist");
const compareUrl = "https://llm.persiantoolbox.ir/compare/";

for (const file of [shortlistScript, shortlistStyles, comparePage, compareScript, compareStyles]) await access(file);

const shortlist = await readFile(shortlistScript, "utf8");
const shortlistCss = await readFile(shortlistStyles, "utf8");
const page = await readFile(comparePage, "utf8");
const compare = await readFile(compareScript, "utf8");
const compareCss = await readFile(compareStyles, "utf8");

for (const signal of [
  "llm-provider-shortlist-v1",
  "SHORTLIST_LIMIT = 3",
  "افزودن به مقایسه",
  "api_finder_compare_add",
  "api_finder_compare_remove",
  "api_finder_compare_open",
  "localStorage.setItem",
  "../compare/?"
]) {
  if (!shortlist.includes(signal)) throw new Error(`Finder shortlist is missing: ${signal}`);
}

for (const signal of [
  'fetch("../catalog.json"',
  'searchParams.get("providers")',
  "SHORTLIST_LIMIT = 3",
  "compare_loaded",
  "compare_share",
  "official_docs_click",
  "navigator.clipboard.writeText",
  "ساخت اولین درخواست"
]) {
  if (!compare.includes(signal)) throw new Error(`Compare script is missing: ${signal}`);
}

for (const signal of [
  `<link rel="canonical" href="${compareUrl}">`,
  'hreflang="fa-IR"',
  'hreflang="x-default"',
  'application/ld+json',
  'id="compare-grid"',
  'id="compare-empty"',
  'src="./compare.js"',
  'src="../analytics.js"'
]) {
  if (!page.includes(signal)) throw new Error(`Compare page is missing: ${signal}`);
}

for (const selector of [".finder-shortlist", ".finder-shortlist-toggle"]) {
  if (!shortlistCss.includes(selector)) throw new Error(`Shortlist styles are missing ${selector}`);
}
for (const selector of [".compare-hero", ".compare-grid", ".compare-card", ".compare-remove"]) {
  if (!compareCss.includes(selector)) throw new Error(`Compare styles are missing ${selector}`);
}

if (/\b(sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/.test(shortlist + compare + page)) {
  throw new Error("Possible secret material found in compare assets");
}
if (shortlist.includes("API_KEY") || compare.includes("API_KEY")) {
  throw new Error("Compare assets must never request or persist API keys");
}

for (const file of [shortlistScript, compareScript]) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `Syntax check failed for ${file}`);
}

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "provider-compare-contract" }
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

try {
  const builtFinder = await readFile(path.join(destination, "api-finder", "index.html"), "utf8");
  const builtCompare = await readFile(path.join(destination, "compare", "index.html"), "utf8");
  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const llms = await readFile(path.join(destination, "llms.txt"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!builtFinder.includes('href="./shortlist.css"')) throw new Error("Built Finder is missing shortlist CSS");
  if (!builtFinder.includes('src="./shortlist.js"')) throw new Error("Built Finder is missing shortlist JavaScript");
  if ((builtCompare.match(/<h1(?:\s|>)/g) || []).length !== 1) throw new Error("Compare page must have exactly one H1");
  if (!builtCompare.includes(`<link rel="canonical" href="${compareUrl}">`)) throw new Error("Built Compare canonical is invalid");
  if (!sitemap.includes(`<loc>${compareUrl}</loc>`)) throw new Error("Sitemap is missing Compare route");
  if (!llms.includes(`Provider comparison: ${compareUrl}`)) throw new Error("llms.txt is missing Compare route");
  if (!buildMeta.static_product_pages?.includes("/compare/")) throw new Error("Build metadata is missing /compare/");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Provider comparison contract passed: local shortlist, safe URL sharing, catalog-backed facts and production discovery are protected.");
