import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const stylesheetNames = ["ui-pro-max.css", "ui-pro-max-components.css"];
const finderPages = ["api-finder/index.html", "en/api-finder/index.html"];

/**
 * Move executable Finder code and page CSS out of HTML so the production CSP
 * can remain strict and build-time ranking transforms cannot invalidate it.
 * @param {string} relativePath
 * @returns {Promise<void>}
 */
async function externalizeFinderAssets(relativePath) {
  const absolutePath = path.join(dist, relativePath);
  const directory = path.dirname(absolutePath);
  const before = await readFile(absolutePath, "utf8");
  const styleMatch = before.match(/<style>([\s\S]*?)<\/style>/);
  const scriptMatch = before.match(/<script>([\s\S]*?)<\/script>/);
  if (!styleMatch || !scriptMatch) {
    console.warn(`${relativePath}: inline Finder assets already externalized or not found — skipping`);
    return;
  }

  await writeFile(path.join(directory, "finder-core.css"), `${styleMatch[1].trim()}\n`, "utf8");
  await writeFile(path.join(directory, "finder-core.js"), `${scriptMatch[1].trim()}\n`, "utf8");

  const after = before
    .replace(styleMatch[0], '<link rel="stylesheet" href="./finder-core.css">')
    .replace(scriptMatch[0], '<script defer src="./finder-core.js"></script>');
  await writeFile(absolutePath, after, "utf8");
}

/**
 * Externalize page-specific style blocks for compatibility with the shared CSP.
 * @param {string} absolutePath
 * @param {string} relativePath
 * @returns {Promise<void>}
 */
async function externalizePageStyles(absolutePath, relativePath) {
  const before = await readFile(absolutePath, "utf8");
  const matches = [...before.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  if (matches.length === 0) return;

  const css = matches.map((match) => match[1].trim()).filter(Boolean).join("\n\n");
  const assetName = "page-inline.css";
  await writeFile(path.join(path.dirname(absolutePath), assetName), `${css}\n`, "utf8");

  let after = before;
  for (const [index, match] of matches.entries()) {
    after = after.replace(match[0], index === 0 ? `<link rel="stylesheet" href="./${assetName}">` : "");
  }
  await writeFile(absolutePath, after, "utf8");
  console.log(`externalized page styles: ${relativePath}`);
}

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolute);
    return entry.isFile() && entry.name.endsWith(".html") ? [absolute] : [];
  }));
  return nested.flat();
}

/**
 * @param {string} absolutePath
 * @param {string} stylesheetName
 * @returns {string}
 */
function stylesheetHref(absolutePath, stylesheetName) {
  const relativeHtml = path.relative(dist, absolutePath).split(path.sep).join("/");
  const fromDirectory = path.posix.dirname(relativeHtml);
  const relativeCss = path.posix.relative(fromDirectory === "." ? "" : fromDirectory, stylesheetName);
  return relativeCss.startsWith(".") ? relativeCss : `./${relativeCss}`;
}

/**
 * @param {string} html
 * @param {string[]} hrefs
 * @param {string} relativePath
 * @returns {string}
 */
function injectStylesheets(html, hrefs, relativePath) {
  const missing = hrefs.filter((href) => !html.includes(`href="${href}"`));
  if (missing.length === 0) return html;

  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
  if (links.length === 0) throw new Error(`${relativePath}: no stylesheet link found`);

  const preferred = links.find((match) => match[1].endsWith("ui-pro-max.css"))
    ?? links.find((match) => match[1].endsWith("ux-clarity.css"))
    ?? links.find((match) => match[1].endsWith("seo.css"))
    ?? links.at(-1);
  if (!preferred) throw new Error(`${relativePath}: stylesheet insertion point missing`);

  const tags = missing.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n  ");
  return html.replace(preferred[0], `${preferred[0]}\n  ${tags}`);
}

/**
 * Load the domain guard before the deferred tracker on every generated page.
 * @param {string} html
 * @returns {string}
 */
function injectAnalyticsGuard(html) {
  if (html.includes("plausible-guard.js")) return html;
  return html.replace(
    /(<script defer data-domain="llm\.persiantoolbox\.ir" src="([^"]*?)plausible\.js"><\/script>)/,
    (_tag, trackerTag, prefix) => `<script defer src="${prefix}plausible-guard.js"></script>\n  ${trackerTag}`
  );
}

for (const finderPage of finderPages) await externalizeFinderAssets(finderPage);

const files = await htmlFiles(dist);
for (const absolutePath of files) {
  const relativePath = path.relative(dist, absolutePath).split(path.sep).join("/");
  await externalizePageStyles(absolutePath, relativePath);
}
let changed = 0;

for (const absolutePath of files) {
  const relativePath = path.relative(dist, absolutePath).split(path.sep).join("/");
  const before = await readFile(absolutePath, "utf8");
  if (/<style>[\s\S]*?<\/style>/.test(before) || /\sstyle="[^"]*"/.test(before)) {
    throw new Error(`${relativePath}: production HTML contains CSP-blocked inline styles`);
  }
  const hrefs = stylesheetNames.map((stylesheetName) => stylesheetHref(absolutePath, stylesheetName));
  const after = injectAnalyticsGuard(injectStylesheets(before, hrefs, relativePath));
  if (after === before) continue;
  await writeFile(absolutePath, after, "utf8");
  changed += 1;
}

console.log(`UI Pro Max shell applied to ${files.length} HTML file(s); ${changed} updated.`);
