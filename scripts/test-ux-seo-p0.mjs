import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const read = (relative) => readFile(path.join(dist, relative), "utf8");
const [home, faFinder, enFinder, faCompare, enCompare] = await Promise.all([
  read("index.html"),
  read("api-finder/index.html"),
  read("en/api-finder/index.html"),
  read("compare/index.html"),
  read("en/compare/index.html")
]);

const assertions = [
  [home.includes('class="search-field catalog-search"'), "catalog search is always visible"],
  [home.indexOf('class="search-field catalog-search"') < home.indexOf('class="advanced-filter-panel"'), "catalog search precedes advanced filters"],
  [faFinder.includes("ظرفیت درخواست / Rate limit"), "Persian Finder labels RPM as request capacity"],
  [!faFinder.includes("سرعت / Latency"), "Persian Finder no longer calls RPM latency"],
  [faFinder.includes("کیفیت زبانی مدل یا نتیجه بنچمارک فارسی نیست"), "Persian language-score limitation is disclosed"],
  [enFinder.includes("Request-capacity priority"), "English Finder labels RPM as request capacity"],
  [!enFinder.includes("Latency sensitivity"), "English Finder no longer calls RPM latency"],
  [enFinder.includes("not response latency or model speed"), "English RPM limitation is disclosed"],
  [faFinder.includes('hreflang="en" href="https://llm.persiantoolbox.ir/en/api-finder/"'), "Persian Finder links English alternate"],
  [faCompare.includes('hreflang="en" href="https://llm.persiantoolbox.ir/en/compare/"'), "Persian Compare links English alternate"],
  [enCompare.includes('hreflang="fa" href="https://llm.persiantoolbox.ir/compare/"'), "English Compare links Persian alternate"]
];

const failed = assertions.filter(([condition]) => !condition).map(([, label]) => label);
if (failed.length) {
  console.error("UX/SEO P0 contract failed:");
  failed.forEach((label) => console.error(`- ${label}`));
  process.exit(1);
}

console.log(`UX/SEO P0 contract passed (${assertions.length} assertions).`);
