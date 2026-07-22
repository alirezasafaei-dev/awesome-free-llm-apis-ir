import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const stylesheetNames = ["ui-pro-max.css", "ui-pro-max-components.css"];

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

const files = await htmlFiles(dist);
let changed = 0;

for (const absolutePath of files) {
  const relativePath = path.relative(dist, absolutePath).split(path.sep).join("/");
  const before = await readFile(absolutePath, "utf8");
  const hrefs = stylesheetNames.map((stylesheetName) => stylesheetHref(absolutePath, stylesheetName));
  const after = injectStylesheets(before, hrefs, relativePath);
  if (after === before) continue;
  await writeFile(absolutePath, after, "utf8");
  changed += 1;
}

console.log(`UI Pro Max shell applied to ${files.length} HTML file(s); ${changed} updated.`);
