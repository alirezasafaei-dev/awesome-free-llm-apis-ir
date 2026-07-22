import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const stylesheetName = "ui-pro-max.css";

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
 * @returns {string}
 */
function stylesheetHref(absolutePath) {
  const relativeHtml = path.relative(dist, absolutePath).split(path.sep).join("/");
  const fromDirectory = path.posix.dirname(relativeHtml);
  const relativeCss = path.posix.relative(fromDirectory === "." ? "" : fromDirectory, stylesheetName);
  return relativeCss.startsWith(".") ? relativeCss : `./${relativeCss}`;
}

/**
 * @param {string} html
 * @param {string} href
 * @param {string} relativePath
 * @returns {string}
 */
function injectStylesheet(html, href, relativePath) {
  if (html.includes(`href="${href}"`)) return html;

  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)];
  if (links.length === 0) throw new Error(`${relativePath}: no stylesheet link found`);

  const preferred = links.find((match) => match[1].endsWith("ux-clarity.css"))
    ?? links.find((match) => match[1].endsWith("seo.css"))
    ?? links.at(-1);
  if (!preferred) throw new Error(`${relativePath}: stylesheet insertion point missing`);

  return html.replace(preferred[0], `${preferred[0]}\n  <link rel="stylesheet" href="${href}">`);
}

const files = await htmlFiles(dist);
let changed = 0;

for (const absolutePath of files) {
  const relativePath = path.relative(dist, absolutePath).split(path.sep).join("/");
  const before = await readFile(absolutePath, "utf8");
  const href = stylesheetHref(absolutePath);
  const after = injectStylesheet(before, href, relativePath);
  if (after === before) continue;
  await writeFile(absolutePath, after, "utf8");
  changed += 1;
}

console.log(`UI Pro Max shell applied to ${files.length} HTML file(s); ${changed} updated.`);
