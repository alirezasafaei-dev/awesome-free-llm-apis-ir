import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const pages = [
  ["api-finder/index.html", ["خانه", "انتخاب API", "شروع سریع", "مقایسه", "ابزارها", "EN"]],
  ["quick-start/index.html", ["خانه", "انتخاب API", "شروع سریع", "مقایسه", "ابزارها", "EN"]],
  ["compare/index.html", ["خانه", "انتخاب API", "شروع سریع", "مقایسه", "ابزارها", "EN"]],
  ["tools/index.html", ["خانه", "انتخاب API", "شروع سریع", "مقایسه", "ابزارها", "EN"]],
  ["en/api-finder/index.html", ["Home", "API Finder", "Quick Start", "Compare", "فارسی"]],
  ["en/quick-start/index.html", ["Home", "API Finder", "Quick Start", "Compare", "فارسی"]],
  ["en/compare/index.html", ["Home", "API Finder", "Quick Start", "Compare", "فارسی"]]
];

const failures = [];
for (const [relativePath, labels] of pages) {
  const html = await readFile(path.join(dist, relativePath), "utf8");
  const header = html.match(/<header class="topbar">([\s\S]*?)<\/header>/i)?.[1] ?? "";
  const nav = header.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)?.[1] ?? "";
  if (!nav) {
    failures.push(`${relativePath}: product navigation missing`);
    continue;
  }

  for (const label of labels) {
    if (!nav.includes(`>${label}<`)) failures.push(`${relativePath}: missing ${label}`);
  }

  const currentCount = (nav.match(/aria-current="page"/g) ?? []).length;
  if (currentCount !== 1) failures.push(`${relativePath}: expected one aria-current, found ${currentCount}`);

  if (nav.includes("github.com")) failures.push(`${relativePath}: GitHub should remain in footer/content, not crowded top navigation`);
}

const finder = await readFile(path.join(dist, "api-finder/index.html"), "utf8");
const finderHeader = finder.match(/<header class="topbar">([\s\S]*?)<\/header>/i)?.[1] ?? "";
if (!finderHeader.includes('id="theme-toggle"')) failures.push("api-finder/index.html: theme toggle was not preserved");

const css = await readFile(path.join(dist, "ux-clarity.css"), "utf8");
if (!css.includes("/* Product navigation P2 */")) failures.push("ux-clarity.css: navigation styles missing");
if (!css.includes("overflow-x: auto")) failures.push("ux-clarity.css: mobile horizontal navigation safety missing");
if (!css.includes('a[aria-current="page"]')) failures.push("ux-clarity.css: current-page styling missing");

if (failures.length) {
  console.error("Product navigation contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Product navigation contract passed (${pages.length} pages).`);
