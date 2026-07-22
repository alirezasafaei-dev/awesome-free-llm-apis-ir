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

function replaceRequired(text, from, to, label) {
  if (!text.includes(from)) {
    throw new Error(`Required marker missing (${label})`);
  }
  return text.replace(from, to);
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

  const replacement = `<form id="filters" class="catalog-filter-shell" role="search" aria-label="جست‌وجو و فیلتر سرویس‌ها">\n          ${search}\n          <details class="advanced-filter-panel">\n            ${summaryAndLead}\n            <div class="filters">\n              ${advancedControls}\n            </div>\n          </details>\n        </form>`;

  return html.replace(pattern, replacement);
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

await edit("api-finder/index.html", (html) => {
  let next = html;
  next = ensureAlternate(next, "en", "https://llm.persiantoolbox.ir/en/api-finder/");
  next = replaceRequired(next, "بودجه، سرعت و منطقه", "بودجه، ظرفیت درخواست و منطقه", "fa finder meta");
  next = replaceRequired(next, "سرعت / Latency", "ظرفیت درخواست / Rate limit", "fa finder field");
  next = replaceRequired(next, "🌐 پشتیبانی فارسی (+۱۵)", "🌐 دسترس‌پذیری و اطلاعات فارسی (+۱۵)", "fa language label");
  next = replaceRequired(
    next,
    "اگر Provider یادداشت فارسی (<code>notes_fa</code>) داشته و از ایران قابل دسترس باشد.",
    "بر اساس وجود اطلاعات فارسی در کاتالوگ و وضعیت دسترسی ثبت‌شده امتیاز می‌گیرد؛ این معیار کیفیت زبانی مدل یا نتیجه بنچمارک فارسی نیست.",
    "fa language explanation"
  );
  next = replaceRequired(next, 'breakdown.latency = { label: "سرعت"', 'breakdown.latency = { label: "ظرفیت درخواست"', "fa score breakdown");
  return next;
});

await edit("en/api-finder/index.html", (html) => {
  let next = html;
  next = replaceRequired(next, "Region and latency controls", "Region and request-capacity controls", "en finder hero");
  next = replaceRequired(next, "Advanced settings — region, latency, etc.", "Advanced settings — region and request capacity", "en advanced summary");
  next = replaceRequired(next, "Latency sensitivity", "Request-capacity priority", "en finder field");
  next = replaceRequired(next, "Latency (max +15)", "Request capacity (max +15)", "en rate label");
  next = replaceRequired(
    next,
    "Based on reported RPM — critical sensitivity awards higher scores for faster endpoints.",
    "Based on reported RPM. This measures request allowance, not response latency or model speed.",
    "en rate explanation"
  );
  next = replaceRequired(next, 'breakdown.latency = { label: "Latency"', 'breakdown.latency = { label: "Request capacity"', "en score breakdown");
  return next;
});

await edit("compare/index.html", (html) => ensureAlternate(html, "en", "https://llm.persiantoolbox.ir/en/compare/"));
await edit("en/compare/index.html", (html) => ensureAlternate(html, "fa", "https://llm.persiantoolbox.ir/compare/"));
await edit("quick-start/index.html", (html) => ensureAlternate(html, "en", "https://llm.persiantoolbox.ir/en/quick-start/"));
await edit("en/quick-start/index.html", (html) => ensureAlternate(html, "fa", "https://llm.persiantoolbox.ir/quick-start/"));

await edit("tools/index.html", (html) => ensureAlternate(html, "fa-IR", "https://llm.persiantoolbox.ir/tools/"));

console.log("UX/SEO P0 build transforms complete.");
