import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const finderSource = path.join(root, "site", "api-finder", "index.html");
const clarityScript = path.join(root, "site", "api-finder", "finder-clarity.js");
const clarityStyles = path.join(root, "site", "api-finder", "finder-clarity.css");
const activationStyles = path.join(root, "site", "api-finder", "funnel-activation.css");
const destination = path.join(root, ".site-dist");

await access(finderSource);
await access(clarityScript);
await access(clarityStyles);
await access(activationStyles);

const source = await readFile(finderSource, "utf8");
const script = await readFile(clarityScript, "utf8");
const styles = `${await readFile(clarityStyles, "utf8")}\n${await readFile(activationStyles, "utf8")}`;

for (const id of ["finder-form", "finder-usecase", "finder-language", "finder-budget", "finder-latency", "finder-region", "finder-results", "finder-loading", "finder-disclosure"]) {
  if (!source.includes(`id="${id}"`)) throw new Error(`API Finder source contract is missing #${id}`);
}

for (const signal of [
  "چه چیزی می‌سازی؟",
  "خروجی به چه زبانی است؟",
  "چه محدودیت مالی داری؟",
  "تنظیمات پیشرفته: سرعت و مسیر دسترسی",
  "این پیشنهاد چه چیزی را تضمین نمی‌کند؟",
  "امتیاز تطابق؛ نه تضمین",
  "انتخاب و ساخت اولین درخواست",
  "api_finder_started",
  "api_finder_default_results_viewed",
  "api_finder_completed",
  "api_finder_provider_selected",
  "api_finder_share",
  "explicit_submit",
  "navigator.clipboard.writeText",
  "window.runFinder()",
  "new URLSearchParams({ provider: providerId, usecase: filters.usecase, region: filters.region })"
]) {
  if (!script.includes(signal)) throw new Error(`API Finder clarity script is missing: ${signal}`);
}

if (script.includes("form.requestSubmit()")) {
  throw new Error("Page load must not submit the Finder form or count as an explicit completion");
}

for (const selector of [
  ".finder-clarity-intro",
  ".finder-advanced",
  ".finder-fit-summary",
  ".finder-score-details",
  ".finder-limitations",
  ".finder-share-actions",
  ".finder-quick-start-link"
]) {
  if (!styles.includes(selector)) throw new Error(`API Finder clarity styles are missing ${selector}`);
}

if (/\bsk-[A-Za-z0-9_-]{16,}\b/.test(script + styles)) throw new Error("Possible API secret found in API Finder clarity assets");

const syntax = spawnSync(process.execPath, ["--check", clarityScript], { encoding: "utf8" });
if (syntax.status !== 0) throw new Error(syntax.stderr || "API Finder clarity script syntax failed");

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "api-finder-funnel-contract" }
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

try {
  const built = await readFile(path.join(destination, "api-finder", "index.html"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!built.includes('href="./finder-clarity.css"')) throw new Error("Built API Finder is missing clarity CSS");
  if (!built.includes('href="./funnel-activation.css"')) throw new Error("Built API Finder is missing funnel activation CSS");
  if (!built.includes('src="./finder-clarity.js"')) throw new Error("Built API Finder is missing clarity JavaScript");
  if (!built.includes('id="finder-form"')) throw new Error("Built API Finder lost the scoring form");
  if (!built.includes("application/ld+json")) throw new Error("Built API Finder lost structured data");
  if (!buildMeta.static_product_pages?.includes("/api-finder/")) throw new Error("build-meta.json does not identify API Finder as a product page");
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("API Finder funnel contract passed: default results, intentional completion, safe sharing and Provider-aware activation are protected.");
