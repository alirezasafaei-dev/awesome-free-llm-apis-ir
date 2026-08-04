import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { NAV_CSS, NAV_PAGES, renderProductNav } from "./lib/site-nav.mjs";

const dist = path.join(process.cwd(), ".site-dist");
const failures = [];

function normalizeMarkup(value) {
  return value
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

for (const [relativePath, config] of Object.entries(NAV_PAGES)) {
  const html = await readFile(path.join(dist, relativePath), "utf8");
  const header = html.match(/<header class="topbar">([\s\S]*?)<\/header>/i)?.[1] ?? "";
  const nav = header.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  if (!nav) {
    failures.push(`${relativePath}: product navigation missing`);
    continue;
  }

  const expected = normalizeMarkup(renderProductNav(config));
  const actual = normalizeMarkup(nav);
  if (actual !== expected) {
    failures.push(`${relativePath}: source navigation diverges from shared renderer\n  expected: ${expected}\n  actual:   ${actual}`);
  }

  const currentCount = (nav.match(/aria-current="page"/g) ?? []).length;
  if (currentCount !== 1) failures.push(`${relativePath}: expected one aria-current, found ${currentCount}`);
  if (nav.includes("github.com")) failures.push(`${relativePath}: GitHub should remain in footer/content, not crowded top navigation`);
}

const finder = await readFile(path.join(dist, "api-finder/index.html"), "utf8");
const finderHeader = finder.match(/<header class="topbar">([\s\S]*?)<\/header>/i)?.[1] ?? "";
if (!finderHeader.includes('id="theme-toggle"')) failures.push("api-finder/index.html: theme toggle was not preserved");

const css = await readFile(path.join(dist, "ux-clarity.css"), "utf8");
if (!css.includes(NAV_CSS.trim())) failures.push("ux-clarity.css: source navigation CSS diverges from shared contract");
if (!css.includes("overflow-x: auto")) failures.push("ux-clarity.css: mobile horizontal navigation safety missing");
if (!css.includes('a[aria-current="page"]')) failures.push("ux-clarity.css: current-page styling missing");

if (failures.length) {
  console.error("Product navigation contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Product navigation contract passed (${Object.keys(NAV_PAGES).length} pages, shared markup and CSS parity).`);
