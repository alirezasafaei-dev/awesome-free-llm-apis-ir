import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const sitemapPath = path.join(destination, "sitemap.xml");
const llmsPath = path.join(destination, "llms.txt");
const buildMetaPath = path.join(destination, "build-meta.json");
const homepagePath = path.join(destination, "index.html");
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

let homepage = await readFile(homepagePath, "utf8");
if (!homepage.includes(`href="${quickStartUrl}"`)) {
  homepage = homepage.replace(
    '<a href="./api-finder/">انتخاب API</a>',
    `<a href="./api-finder/">انتخاب API</a>\n        <a href="${quickStartUrl}">شروع برنامه‌نویسی</a>`
  );
  homepage = homepage.replace(
    '<a class="path-link" href="./api-finder/">بازکردن API Finder ←</a>',
    `<a class="path-link" href="${quickStartUrl}">شروع مرحله‌ای و نمونه‌کد ←</a>`
  );
  await writeFile(homepagePath, homepage);
}

console.log("Registered /quick-start/ in homepage navigation, sitemap.xml, llms.txt and build-meta.json.");
