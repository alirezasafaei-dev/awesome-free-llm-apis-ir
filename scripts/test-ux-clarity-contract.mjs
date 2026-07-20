import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const homepagePath = path.join(root, "site", "index.html");
const clarityCssPath = path.join(root, "site", "ux-clarity.css");
const analyticsPath = path.join(root, "site", "analytics.js");

await access(homepagePath);
await access(clarityCssPath);
await access(analyticsPath);

const html = await readFile(homepagePath, "utf8");
const css = await readFile(clarityCssPath, "utf8");
const analytics = await readFile(analyticsPath, "utf8");
const plainText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const requiredHomepageSignals = [
  "API رایگان هوش مصنوعی",
  'class="audience-paths"',
  "تازه‌کارم",
  "برنامه‌نویسم",
  'id="how-it-works"',
  "فقط سه قدم",
  'id="what-is-api"',
  'class="advanced-filter-panel"',
  'id="filters"',
  'id="glossary"',
  "RPM و RPD",
  'href="./api-finder/"',
  'href="./ux-clarity.css"'
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

const heroStart = html.indexOf('<section class="hero clarity-hero"');
const heroEnd = html.indexOf("</section>", heroStart);
const hero = html.slice(heroStart, heroEnd);
if (heroStart < 0 || heroEnd < 0) throw new Error("Clarity hero section is missing");

const primaryFinderPosition = hero.indexOf('class="button primary" href="./api-finder/"');
const catalogPosition = hero.indexOf('href="#catalog"');
if (primaryFinderPosition < 0) throw new Error("API Finder is not the primary hero CTA");
if (catalogPosition < 0 || primaryFinderPosition > catalogPosition) {
  throw new Error("Guided API Finder must appear before the technical catalog CTA");
}

const advancedPanelStart = html.indexOf('<details class="advanced-filter-panel"');
const filtersStart = html.indexOf('id="filters"');
if (advancedPanelStart < 0 || filtersStart < advancedPanelStart) {
  throw new Error("Advanced filters are not protected by progressive disclosure");
}

for (const selector of [".path-grid", ".step-grid", ".advanced-filter-panel", ".glossary-grid"]) {
  if (!css.includes(selector)) throw new Error(`Clarity CSS is missing ${selector}`);
}

for (const eventName of ["ux_path_click", "catalog_advanced_open"]) {
  if (!analytics.includes(`\"${eventName}\"`)) throw new Error(`Analytics is missing ${eventName}`);
}

const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
if (h1Count !== 1) throw new Error(`Homepage must keep one H1; found ${h1Count}`);

console.log("UX clarity contract passed: plain-language value, segmented journeys, guided CTA and progressive disclosure are present.");
