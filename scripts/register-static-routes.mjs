import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const sitemapPath = path.join(destination, "sitemap.xml");
const llmsPath = path.join(destination, "llms.txt");
const buildMetaPath = path.join(destination, "build-meta.json");
const homepagePath = path.join(destination, "index.html");
const apiFinderPath = path.join(destination, "api-finder", "index.html");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
const apiFinderUrl = `${canonicalOrigin}/api-finder/`;
const quickStartUrl = `${canonicalOrigin}/quick-start/`;

let sitemap = await readFile(sitemapPath, "utf8");

for (const [url, priority] of [[apiFinderUrl, "0.9"], [quickStartUrl, "0.9"]]) {
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>2026-07-20</lastmod>\n    <priority>${priority}</priority>\n      <xhtml:link rel="alternate" hreflang="fa-IR" href="${url}"/>\n      <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>\n  </url>\n`;
    sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  }
}
await writeFile(sitemapPath, sitemap);

let llms = await readFile(llmsPath, "utf8");
for (const [label, url] of [["API Finder", apiFinderUrl], ["Developer quick start", quickStartUrl]]) {
  if (!llms.includes(`${label}: ${url}`)) {
    llms += `${label}: ${url}\n`;
  }
}
await writeFile(llmsPath, llms);

const buildMeta = JSON.parse(await readFile(buildMetaPath, "utf8"));
buildMeta.static_product_pages = [...new Set([...(buildMeta.static_product_pages ?? []), "/api-finder/", "/quick-start/"])];
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

let apiFinder = await readFile(apiFinderPath, "utf8");
if (!apiFinder.includes('href="./finder-clarity.css"')) {
  apiFinder = apiFinder.replace(
    "</head>",
    '  <link rel="stylesheet" href="./finder-clarity.css">\n</head>'
  );
}
if (!apiFinder.includes('src="./finder-clarity.js"')) {
  apiFinder = apiFinder.replace(
    "</body>",
    '    <script defer src="./finder-clarity.js"></script>\n  </body>'
  );
}
await writeFile(apiFinderPath, apiFinder);

console.log("Registered static product routes and applied the API Finder clarity layer.");
