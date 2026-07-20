import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const finderPath = path.join(destination, "api-finder", "index.html");
const comparePath = path.join(destination, "compare", "index.html");
const sitemapPath = path.join(destination, "sitemap.xml");
const llmsPath = path.join(destination, "llms.txt");
const buildMetaPath = path.join(destination, "build-meta.json");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
const compareUrl = `${canonicalOrigin}/compare/`;

await readFile(comparePath, "utf8");

let finder = await readFile(finderPath, "utf8");
if (!finder.includes('href="./shortlist.css"')) {
  finder = finder.replace("</head>", '  <link rel="stylesheet" href="./shortlist.css">\n</head>');
}
if (!finder.includes('src="./shortlist.js"')) {
  finder = finder.replace("</body>", '    <script defer src="./shortlist.js"></script>\n  </body>');
}
await writeFile(finderPath, finder);

let sitemap = await readFile(sitemapPath, "utf8");
if (!sitemap.includes(`<loc>${compareUrl}</loc>`)) {
  const entry = `  <url>\n    <loc>${compareUrl}</loc>\n    <lastmod>2026-07-20</lastmod>\n    <priority>0.8</priority>\n      <xhtml:link rel="alternate" hreflang="fa-IR" href="${compareUrl}"/>\n      <xhtml:link rel="alternate" hreflang="x-default" href="${compareUrl}"/>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

let llms = await readFile(llmsPath, "utf8");
if (!llms.includes(`Provider comparison: ${compareUrl}`)) {
  llms += `Provider comparison: ${compareUrl}\n`;
  await writeFile(llmsPath, llms);
}

const buildMeta = JSON.parse(await readFile(buildMetaPath, "utf8"));
buildMeta.static_product_pages = [...new Set([...(buildMeta.static_product_pages ?? []), "/compare/"])];
await writeFile(buildMetaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

console.log("Registered Provider shortlist assets and the /compare/ product route.");
