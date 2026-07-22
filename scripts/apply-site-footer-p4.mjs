import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { footerContextFromRelativePath, replaceFooter } from "./lib/site-footer.mjs";

const dist = path.join(process.cwd(), ".site-dist");

/**
 * @param {string} dir
 * @param {string} [base]
 * @returns {Promise<string[]>}
 */
async function collectHtmlFiles(dir, base = dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(full, base)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path.relative(base, full).replaceAll(path.sep, "/"));
    }
  }
  return files;
}

/**
 * Skip soft-404 and pure error shells that should stay minimal.
 * @param {string} relativePath
 * @param {string} html
 * @returns {boolean}
 */
function shouldUpgradeFooter(relativePath, html) {
  if (relativePath === "404.html") return false;
  if (/name="robots"\s+content="[^"]*noindex/i.test(html)) return false;
  if (!/<footer\b/i.test(html)) return false;
  return true;
}

/**
 * Ensure product pages load the shared footer styles.
 * @param {string} html
 * @param {string} assetPrefix
 * @returns {string}
 */
function ensureUxClarityStylesheet(html, assetPrefix) {
  if (html.includes("ux-clarity.css")) return html;
  const href = assetPrefix === "./" ? "./ux-clarity.css" : `${assetPrefix}ux-clarity.css`;
  if (!html.includes("</head>")) return html;
  return html.replace("</head>", `  <link rel="stylesheet" href="${href}">\n</head>`);
}

const relatives = await collectHtmlFiles(dist);
let upgraded = 0;
let skipped = 0;

for (const relativePath of relatives) {
  const filePath = path.join(dist, relativePath);
  const before = await readFile(filePath, "utf8");
  if (!shouldUpgradeFooter(relativePath, before)) {
    skipped += 1;
    continue;
  }

  const { lang, assetPrefix } = footerContextFromRelativePath(relativePath);
  let html = before;
  html = ensureUxClarityStylesheet(html, assetPrefix);
  const result = replaceFooter(html, { lang, assetPrefix });
  html = result.html;

  if (html !== before) {
    await writeFile(filePath, html, "utf8");
    upgraded += 1;
  }
}

console.log(`Site footer P4 complete: upgraded=${upgraded}, scanned=${relatives.length}, skipped=${skipped}.`);
