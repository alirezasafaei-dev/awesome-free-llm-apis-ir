import { existsSync } from "node:fs";
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
const quickStartPath = path.join(destination, "quick-start", "index.html");
const enApiFinderPath = path.join(destination, "en", "api-finder", "index.html");
const enQuickStartPath = path.join(destination, "en", "quick-start", "index.html");
const enComparePath = path.join(destination, "en", "compare", "index.html");
const enIndexPath = path.join(destination, "en", "index.html");
const canonicalOrigin = "https://llm.persiantoolbox.ir";

const productRoutes = [
  { url: `${canonicalOrigin}/api-finder/`, priority: "0.9", hreflang: "fa-IR", label: "API Finder" },
  { url: `${canonicalOrigin}/quick-start/`, priority: "0.9", hreflang: "fa-IR", label: "Developer quick start" },
  { url: `${canonicalOrigin}/en/api-finder/`, priority: "0.9", hreflang: "en", label: "English API Finder" },
  { url: `${canonicalOrigin}/en/quick-start/`, priority: "0.9", hreflang: "en", label: "English developer quick start" },
  { url: `${canonicalOrigin}/en/compare/`, priority: "0.8", hreflang: "en", label: "English Provider comparison" }
];

let sitemap = await readFile(sitemapPath, "utf8");
let sitemapChanged = false;

for (const route of productRoutes) {
  if (!sitemap.includes(`<loc>${route.url}</loc>`)) {
    const counterpart = route.url.includes("/en/") ? route.url.replace("/en/", "/") : route.url;
    const faHref = route.url.includes("/en/") ? counterpart : route.url;
    const enHref = route.url.includes("/en/") ? route.url : counterpart;
    const entry = `  <url>\n    <loc>${route.url}</loc>\n    <lastmod>2026-07-20</lastmod>\n    <priority>${route.priority}</priority>\n      <xhtml:link rel="alternate" hreflang="fa-IR" href="${faHref}"/>\n      <xhtml:link rel="alternate" hreflang="en" href="${enHref}"/>\n      <xhtml:link rel="alternate" hreflang="x-default" href="${faHref}"/>\n  </url>\n`;
    sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
    sitemapChanged = true;
  }
}
if (sitemapChanged) await writeFile(sitemapPath, sitemap);

let llms = await readFile(llmsPath, "utf8");
let llmsChanged = false;
for (const route of productRoutes) {
  if (route.label && !llms.includes(`${route.label}: ${route.url}`)) {
    llms += `${route.label}: ${route.url}\n`;
    llmsChanged = true;
  }
}
if (llmsChanged) await writeFile(llmsPath, llms);

const buildMeta = JSON.parse(await readFile(buildMetaPath, "utf8"));
buildMeta.static_product_pages = [...new Set([
  ...(buildMeta.static_product_pages ?? []),
  "/api-finder/", "/quick-start/",
  "/en/api-finder/", "/en/quick-start/", "/en/compare/"
])];
await writeFile(buildMetaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

let homepage = await readFile(homepagePath, "utf8");
if (!homepage.includes(`href="${canonicalOrigin}/quick-start/"`)) {
  homepage = homepage.replace(
    '<a href="./api-finder/">انتخاب API</a>',
    `<a href="./api-finder/">انتخاب API</a>\n        <a href="${canonicalOrigin}/quick-start/">شروع برنامه‌نویسی</a>`
  );
  homepage = homepage.replace(
    '<a class="path-link" href="./api-finder/">بازکردن API Finder ←</a>',
    `<a class="path-link" href="${canonicalOrigin}/quick-start/">شروع مرحله‌ای و نمونه‌کد ←</a>`
  );
  await writeFile(homepagePath, homepage);
}

if (existsSync(enIndexPath)) {
  let enIndex = await readFile(enIndexPath, "utf8");
  if (!enIndex.includes('href="./api-finder/"')) {
    enIndex = enIndex.replace(
      '<a href="../catalog.json" target="_blank" rel="noopener">Catalog JSON</a>',
      '<a href="./api-finder/">API Finder</a>\n        <a href="./quick-start/">Quick Start</a>\n        <a href="./compare/">Compare</a>\n        <a href="../catalog.json" target="_blank" rel="noopener">Catalog JSON</a>'
    );
  }
  await writeFile(enIndexPath, enIndex);
}

let apiFinder = await readFile(apiFinderPath, "utf8");
if (!apiFinder.includes('href="./finder-clarity.css"')) {
  apiFinder = apiFinder.replace(
    "</head>",
    '  <link rel="stylesheet" href="./finder-clarity.css">\n</head>'
  );
}
if (!apiFinder.includes('href="./funnel-activation.css"')) {
  apiFinder = apiFinder.replace(
    "</head>",
    '  <link rel="stylesheet" href="./funnel-activation.css">\n</head>'
  );
}
if (!apiFinder.includes('src="./finder-clarity.js"')) {
  apiFinder = apiFinder.replace(
    "</body>",
    '    <script defer src="./finder-clarity.js"></script>\n  </body>'
  );
}
await writeFile(apiFinderPath, apiFinder);

let quickStart = await readFile(quickStartPath, "utf8");
if (!quickStart.includes('src="./provider-context.js"')) {
  quickStart = quickStart.replace(
    "</body>",
    '  <script defer src="./provider-context.js"></script>\n</body>'
  );
}
await writeFile(quickStartPath, quickStart);

if (existsSync(enQuickStartPath)) {
  let enQuickStart = await readFile(enQuickStartPath, "utf8");
  if (!enQuickStart.includes('src="./provider-context-en.js"')) {
    enQuickStart = enQuickStart.replace(
      "</body>",
      '  <script defer src="./provider-context-en.js"></script>\n</body>'
    );
  }
  await writeFile(enQuickStartPath, enQuickStart);
}

console.log("Registered static product routes (FA + EN) and applied Finder/Quick Start activation layers.");
