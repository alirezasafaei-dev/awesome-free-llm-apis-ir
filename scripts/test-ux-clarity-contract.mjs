import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const homepagePath = path.join(root, "site", "index.html");
const clarityCssPath = path.join(root, "site", "ux-clarity.css");
const productCssPath = path.join(root, "site", "ui-pro-max.css");
const analyticsPath = path.join(root, "site", "analytics.js");

await Promise.all([homepagePath, clarityCssPath, productCssPath, analyticsPath].map((file) => access(file)));

const [html, clarityCss, productCss, analytics] = await Promise.all([
  readFile(homepagePath, "utf8"),
  readFile(clarityCssPath, "utf8"),
  readFile(productCssPath, "utf8"),
  readFile(analyticsPath, "utf8")
]);
const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const requiredHomepageSignals = [
  "API رایگان هوش مصنوعی",
  'class="hero clarity-hero product-hero"',
  'id="catalog"',
  'class="catalog-metrics"',
  'class="search-field catalog-search"',
  'class="advanced-filter-panel"',
  'id="filters"',
  'class="audience-paths"',
  'id="how-it-works"',
  'id="what-is-api"',
  'id="glossary"',
  'href="./api-finder/"',
  'href="./ui-pro-max.css"'
];

for (const signal of requiredHomepageSignals) {
  if (!html.includes(signal)) throw new Error(`Homepage clarity contract is missing: ${signal}`);
}

if (!plainText.includes("API راهی است که برنامه، سایت یا ربات شما را به یک مدل هوش مصنوعی وصل می‌کند")) {
  throw new Error("Homepage does not explain the API concept in plain language");
}

if (html.includes("مرجع فارسی، آزاد و ماشین‌خوان")) {
  throw new Error("Legacy technical-first hero message returned");
}

if (html.includes('id="english-guides"')) {
  throw new Error("English tutorial block must not interrupt the Persian homepage journey");
}

const heroStart = html.indexOf('<section class="hero clarity-hero product-hero"');
const heroEnd = html.indexOf("</section>", heroStart);
const hero = html.slice(heroStart, heroEnd);
if (heroStart < 0 || heroEnd < 0) throw new Error("Product hero section is missing");

const primaryFinderPosition = hero.indexOf('class="button primary" href="./api-finder/"');
const catalogPositionInHero = hero.indexOf('href="#catalog"');
if (primaryFinderPosition < 0) throw new Error("API Finder is not the primary hero CTA");
if (catalogPositionInHero < 0 || primaryFinderPosition > catalogPositionInHero) {
  throw new Error("Guided API Finder must appear before the catalog CTA");
}

const catalogPosition = html.indexOf('id="catalog"');
const searchPosition = html.indexOf('class="search-field catalog-search"');
const advancedPanelStart = html.indexOf('<details class="advanced-filter-panel"');
const advancedControlsStart = html.indexOf('<div class="filters">', advancedPanelStart);
const audiencePosition = html.indexOf('class="audience-paths"');
const educationalPosition = html.indexOf('id="how-it-works"');

if (!(heroStart < catalogPosition && catalogPosition < audiencePosition && catalogPosition < educationalPosition)) {
  throw new Error("Catalog must be available before audience segmentation and educational content");
}
if (!(catalogPosition < searchPosition && searchPosition < advancedPanelStart)) {
  throw new Error("Visible catalog search must precede advanced filters");
}
if (advancedControlsStart < advancedPanelStart) {
  throw new Error("Advanced controls are not protected by progressive disclosure");
}

for (const selector of [".path-grid", ".step-grid", ".advanced-filter-panel", ".glossary-grid"]) {
  if (!clarityCss.includes(selector)) throw new Error(`Clarity CSS is missing ${selector}`);
}
for (const selector of [".product-hero", ".catalog-filter-shell", ".provider-card", ".catalog-metrics"]) {
  if (!productCss.includes(selector)) throw new Error(`Product design CSS is missing ${selector}`);
}

for (const eventName of ["ux_path_click", "catalog_advanced_open"]) {
  if (!analytics.includes(`\"${eventName}\"`)) throw new Error(`Analytics is missing ${eventName}`);
}

const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
if (h1Count !== 1) throw new Error(`Homepage must keep one H1; found ${h1Count}`);

console.log("UX clarity contract passed: task-first catalog, visible search, progressive filters and plain-language onboarding are present.");
