import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const sitemapPath = path.join(destination, "sitemap.xml");
const llmsPath = path.join(destination, "llms.txt");
const buildMetaPath = path.join(destination, "build-meta.json");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
const quickStartUrl = `${canonicalOrigin}/quick-start/`;

let sitemap = await readFile(sitemapPath, "utf8");
if (!sitemap.includes(`<loc>${quickStartUrl}</loc>`)) {
  const entry = `  <url>\n    <loc>${quickStartUrl}</loc>\n    <lastmod>2026-07-20</lastmod>\n    <priority>0.9</priority>\n      <xhtml:link rel="alternate" hreflang="fa-IR" href="${quickStartUrl}"/>\n      <xhtml:link rel="alternate" hreflang="x-default" href="${quickStartUrl}"/>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

let llms = await readFile(llmsPath, "utf8");
if (!llms.includes(`Developer quick start: ${quickStartUrl}`)) {
  llms += `Developer quick start: ${quickStartUrl}\n`;
  await writeFile(llmsPath, llms);
}

const buildMeta = JSON.parse(await readFile(buildMetaPath, "utf8"));
buildMeta.static_product_pages = [...new Set([...(buildMeta.static_product_pages ?? []), "/quick-start/"])];
await writeFile(buildMetaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

console.log("Registered /quick-start/ in sitemap.xml, llms.txt and build-meta.json.");
