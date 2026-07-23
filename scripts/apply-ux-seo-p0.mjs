import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

async function edit(relativePath, transform) {
  const filePath = path.join(dist, relativePath);
  const before = await readFile(filePath, "utf8");
  const after = transform(before);
  if (after === before) {
    console.log(`verified ${relativePath}`);
    return;
  }
  await writeFile(filePath, after, "utf8");
  console.log(`patched ${relativePath}`);
}

function ensureAlternate(html, lang, href) {
  const tag = `<link rel="alternate" hreflang="${lang}" href="${href}">`;
  if (html.includes(tag)) return html;
  const xDefault = /\s*<link rel="alternate" hreflang="x-default"[^>]*>/;
  const match = html.match(xDefault);
  if (!match) throw new Error(`x-default marker missing while adding ${lang}`);
  return html.replace(match[0], `\n    ${tag}${match[0]}`);
}

function exposeCatalogSearch(html) {
  if (html.includes('class="search-field catalog-search"')) return html;

  const pattern = /<details class="advanced-filter-panel">([\s\S]*?)<form id="filters" class="filters" role="search" aria-label="فیلتر سرویس‌ها">([\s\S]*?)<\/form>\s*<\/details>/;
  const match = html.match(pattern);
  if (!match) throw new Error("Catalog advanced-filter block not found");

  const searchPattern = /\s*<label class="search-field"><span>جست‌وجو<\/span><input id="search"[\s\S]*?<\/label>/;
  const searchMatch = match[2].match(searchPattern);
  if (!searchMatch) throw new Error("Catalog search field not found");

  const search = searchMatch[0]
    .trim()
    .replace('class="search-field"', 'class="search-field catalog-search"');
  const advancedControls = match[2].replace(searchPattern, "").trim();
  const summaryAndLead = match[1].trim();

  const replacement = `<form id="filters" class="catalog-filter-shell" role="search" aria-label="جست‌وجو و فیلتر سرویس‌ها">
          ${search}
          <details class="advanced-filter-panel">
            ${summaryAndLead}
            <div class="filters">
              ${advancedControls}
            </div>
          </details>
        </form>`;

  return html.replace(pattern, replacement);
}

function assertFinderSourceSemantics(html, language) {
  const name = language === "fa" ? "Persian Finder" : "English Finder";
  const forbidden = language === "fa"
    ? ['id="finder-language"', "سرعت / Latency", "پشتیبانی فارسی (+۱۵)"]
    : ['id="finder-language"', "Latency sensitivity", "Language support (max +15)"];
  for (const marker of forbidden) {
    if (html.includes(marker)) throw new Error(`${name}: stale ranking marker remains (${marker})`);
  }
  const required = language === "fa"
    ? ["ظرفیت درخواست / Rate limit", "از ۱۰۰"]
    : ["Request-capacity priority", "not response latency or model speed", "/ 100"];
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`${name}: required source semantic is missing (${marker})`);
  }
  return html;
}

await edit("index.html", (html) => exposeCatalogSearch(html));

await edit("ux-clarity.css", (css) => {
  if (css.includes(".catalog-filter-shell")) return `${css}\n/* ux-seo-p0 already applied */\n`;
  return `${css}\n
.catalog-filter-shell {
  display: grid;
  gap: 14px;
}

.catalog-search {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 16px 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(17, 24, 39, .04);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.catalog-search input {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-soft);
  color: var(--text);
  padding: 9px 13px;
}

.catalog-search input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(109, 61, 245, .15);
  outline: none;
}
`;
});

await edit("api-finder/index.html", (html) => assertFinderSourceSemantics(
  ensureAlternate(html, "en", "https://llm.persiantoolbox.ir/en/api-finder/"),
  "fa"
));
await edit("en/api-finder/index.html", (html) => assertFinderSourceSemantics(html, "en"));
await edit("compare/index.html", (html) => ensureAlternate(html, "en", "https://llm.persiantoolbox.ir/en/compare/"));
await edit("en/compare/index.html", (html) => ensureAlternate(html, "fa", "https://llm.persiantoolbox.ir/compare/"));
await edit("quick-start/index.html", (html) => ensureAlternate(html, "en", "https://llm.persiantoolbox.ir/en/quick-start/"));
await edit("en/quick-start/index.html", (html) => ensureAlternate(html, "fa", "https://llm.persiantoolbox.ir/quick-start/"));
await edit("tools/index.html", (html) => ensureAlternate(html, "fa-IR", "https://llm.persiantoolbox.ir/tools/"));

console.log("UX/SEO P0 build transforms complete: catalog search and locale alternates verified; Finder semantics are source-owned.");
