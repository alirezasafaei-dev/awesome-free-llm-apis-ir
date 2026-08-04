import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");
const failures = [];

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolute] : [];
  }));
  return nested.flat();
}

function expectedPrefix(relativePath) {
  const depth = relativePath.split("/").length - 1;
  return depth === 0 ? "./" : "../".repeat(depth);
}

function count(html, needle) {
  return html.split(needle).length - 1;
}

function validateScripts(html, relativePath) {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = match[1];
    const body = match[2].trim();
    const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const hasSource = /\bsrc=["'][^"']+["']/i.test(attributes);
    if (type === "application/ld+json") continue;
    if (!hasSource || body) failures.push(`${relativePath}: executable inline script violates the production CSP`);
  }
}

const files = await htmlFiles(dist);
for (const absolutePath of files) {
  const relativePath = path.relative(dist, absolutePath).split(path.sep).join("/");
  const prefix = expectedPrefix(relativePath);
  const html = await readFile(absolutePath, "utf8");
  const primaryCss = `<link rel="stylesheet" href="${prefix}ui-pro-max.css">`;
  const componentCss = `<link rel="stylesheet" href="${prefix}ui-pro-max-components.css">`;
  if (count(html, primaryCss) !== 1) failures.push(`${relativePath}: expected exactly one source-owned UI Pro Max stylesheet`);
  if (count(html, componentCss) !== 1) failures.push(`${relativePath}: expected exactly one source-owned UI component stylesheet`);
  if (/<style\b/i.test(html) || /\sstyle\s*=/i.test(html)) failures.push(`${relativePath}: inline style violates the production CSP`);
  validateScripts(html, relativePath);

  const tracker = `<script defer data-domain="llm.persiantoolbox.ir" src="${prefix}plausible.js"></script>`;
  const guard = `<script defer src="${prefix}plausible-guard.js"></script>`;
  const hasTracker = html.includes("plausible.js");
  if (hasTracker) {
    if (count(html, tracker) !== 1) failures.push(`${relativePath}: tracker path/count is not source-owned`);
    if (count(html, guard) !== 1) failures.push(`${relativePath}: Plausible guard path/count is not source-owned`);
    if (html.indexOf(guard) > html.indexOf(tracker)) failures.push(`${relativePath}: Plausible guard must load before tracker`);
  } else if (html.includes("plausible-guard.js")) {
    failures.push(`${relativePath}: guard exists without a tracker`);
  }
}

const requiredAssets = [
  "ui-pro-max.css",
  "ui-pro-max-components.css",
  "plausible-guard.js",
  "api-finder/finder-core.css",
  "api-finder/finder-core.js",
  "en/api-finder/finder-core.css",
  "en/api-finder/finder-core.js",
  "en/compare/page-inline.css",
  "en/quick-start/page-inline.css"
];
await Promise.all(requiredAssets.map((relativePath) => access(path.join(dist, relativePath))));

const pageAssets = [
  ["api-finder/index.html", "./finder-core.css", "./finder-core.js"],
  ["en/api-finder/index.html", "./finder-core.css", "./finder-core.js"],
  ["en/compare/index.html", "./page-inline.css", null],
  ["en/quick-start/index.html", "./page-inline.css", null]
];
for (const [relativePath, stylesheet, script] of pageAssets) {
  const html = await readFile(path.join(dist, relativePath), "utf8");
  if (count(html, `href="${stylesheet}"`) !== 1) failures.push(`${relativePath}: page stylesheet is not source-owned exactly once`);
  if (script && count(html, `src="${script}"`) !== 1) failures.push(`${relativePath}: page script is not source-owned exactly once`);
}

if (failures.length) {
  console.error("UI shell source-ownership validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`UI shell source-ownership validation passed for ${files.length} HTML file(s); no build-time mutation was required.`);
