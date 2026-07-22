import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const providerContentDir = path.join(root, "content", "providers");
const catalogPath = path.join(root, "catalog.json");
const generatedGuidesSourcePath = path.join(root, "scripts", "build-guides.mjs");

const args = new Set(process.argv.slice(2));
const jsonOutput = args.has("--json");
const strict = args.has("--strict");

const requirements = [
  { id: "intent", label_fa: "هدف و نیت جست‌وجو" },
  { id: "signup", label_fa: "مراحل ثبت‌نام" },
  { id: "first-request", label_fa: "نمونه اولین درخواست API" },
  { id: "quota", label_fa: "سهمیه و محدودیت‌ها" },
  { id: "iran", label_fa: "وضعیت ایران با شواهد" },
  { id: "errors", label_fa: "خطاهای رایج و رفع اشکال" },
  { id: "when-not-to-use", label_fa: "چه زمانی انتخاب مناسبی نیست" },
  { id: "references", label_fa: "منابع رسمی تاریخ‌دار" },
  { id: "links", label_fa: "پیوندهای داخلی مرتبط" }
];

const requirementIds = new Set(requirements.map((item) => item.id));
const reports = [];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function stripFrontmatter(source) {
  return source.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function wordCount(source) {
  return stripFrontmatter(source)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

const sectionPatterns = {
  intent: [/^primary_keyword:\s*"?.+"?\s*$/mi, /نیت جست.?وجو/i, /هدف (?:این )?(?:صفحه|راهنما)/i, /primary intent/i],
  signup: [/ثبت.?نام/i, /ساخت حساب/i, /signup/i],
  "first-request": [/اولین درخواست/i, /نمونه درخواست/i, /chat\.completions/i, /curl\b/i],
  quota: [/سهمیه/i, /محدودیت/i, /rate limit/i, /quota/i],
  iran: [/وضعیت ایران/i, /دسترسی از ایران/i, /iran access/i],
  errors: [/خطاهای رایج/i, /رفع اشکال/i, /عیب.?یابی/i, /troubleshoot/i],
  "when-not-to-use": [/چه زمانی.*(?:انتخاب|استفاده).*(?:نکن|نیست)/i, /چه زمانی نباید/i, /چه زمانی.*(?:عوض|تغییر)/i, /مناسب نیست/i, /when not to/i],
  references: [/منابع رسمی/i, /منابع بررسی/i, /references/i],
  links: [/مطالب مرتبط/i, /راهنماهای مرتبط/i, /پیوندهای داخلی/i, /related (?:guides|links)/i]
};

function missingSectionsFromText(source) {
  const requiresIranEvidence = /^primary_keyword:.*ایران/m.test(source) || /^## .*ایران/m.test(source);
  return requirements
    .filter(({ id }) => id !== "iran" || requiresIranEvidence)
    .filter(({ id }) => !(sectionPatterns[id] ?? []).some((pattern) => pattern.test(source)))
    .map(({ id }) => id);
}

async function loadProviderContent() {
  const map = new Map();
  try {
    const entries = await readdir(providerContentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      try {
        const record = JSON.parse(await readFile(path.join(providerContentDir, entry.name), "utf8"));
        if (hasText(record.provider_id)) map.set(record.provider_id, record);
      } catch {
        // Structural errors are reported by validate-provider-content.mjs.
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return map;
}

function providerMissingSections(provider, editorial) {
  const missing = [];

  if (!hasText(editorial?.intent_fa)) missing.push("intent");
  if (!hasArray(editorial?.signup_steps_fa)) missing.push("signup");
  if (!hasText(editorial?.first_request?.code)) missing.push("first-request");
  if (!hasArray(provider.free_tier?.limits) && !hasText(provider.free_tier?.notes_fa)) missing.push("quota");
  if (!hasText(provider.iran_access?.status) || (!hasText(provider.iran_access?.notes_fa) && !hasArray(provider.iran_access?.evidence))) missing.push("iran");
  if (!hasArray(editorial?.common_errors)) missing.push("errors");
  if (!hasArray(editorial?.when_not_to_use_fa)) missing.push("when-not-to-use");

  const officialSources = [provider.docs, provider.website, ...(provider.sources ?? [])].filter(hasText);
  if (officialSources.length < 2 || !hasText(provider.verification?.last_checked)) missing.push("references");
  if (!hasArray(editorial?.related_guides)) missing.push("links");

  return [...new Set(missing)];
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const providerContent = await loadProviderContent();

for (const provider of catalog.providers) {
  const editorial = providerContent.get(provider.id);
  const missingSections = providerMissingSections(provider, editorial);
  const issues = [];

  if (!hasText(provider.notes_fa) && !hasText(provider.free_tier?.notes_fa)) issues.push("فاقد یادداشت فارسی");
  if (!hasText(provider.verification?.last_checked)) issues.push("تاریخ آخرین بررسی ثبت نشده");
  if (!editorial) issues.push("فایل محتوای تحریریه‌ای Provider ایجاد نشده");

  if (missingSections.length || issues.length) {
    reports.push({
      type: "provider",
      id: provider.id,
      name: provider.name,
      missing_sections: missingSections,
      issues
    });
  }
}

const markdownFiles = [];
try {
  for (const entry of await readdir(contentDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(entry.name);
  }
} catch {
  // content/fa is optional in minimal checkouts.
}

for (const filename of markdownFiles) {
  const source = await readFile(path.join(contentDir, filename), "utf8");
  const missingSections = missingSectionsFromText(source);
  const words = wordCount(source);
  const issues = [];
  if (words < 300) issues.push(`محتوای کوتاه (${words} کلمه)`);

  if (missingSections.length || issues.length) {
    reports.push({
      type: "guide",
      id: filename.replace(/\.md$/, ""),
      name: filename,
      missing_sections: missingSections,
      issues
    });
  }
}

const generatedGuideTargets = [
  "free-coding-api",
  "free-embedding-api",
  "free-tier-vs-trial-vs-credit",
  "openai-sdk-custom-base-url"
];

const generatedSource = await readFile(generatedGuidesSourcePath, "utf8");
for (const [index, slug] of generatedGuideTargets.entries()) {
  const marker = `slug: "${slug}"`;
  const start = generatedSource.indexOf(marker);
  if (start === -1) {
    reports.push({
      type: "generated-guide",
      id: slug,
      name: slug,
      missing_sections: requirements.map(({ id }) => id),
      issues: ["تعریف راهنما در build-guides.mjs پیدا نشد"]
    });
    continue;
  }

  const nextMarkers = generatedGuideTargets
    .slice(index + 1)
    .map((nextSlug) => generatedSource.indexOf(`slug: "${nextSlug}"`, start + marker.length))
    .filter((position) => position > start);
  const end = nextMarkers.length ? Math.min(...nextMarkers) : generatedSource.indexOf("\n];", start);
  const block = generatedSource.slice(start, end > start ? end : undefined);
  const missingSections = missingSectionsFromText(block);

  if (missingSections.length) {
    reports.push({
      type: "generated-guide",
      id: slug,
      name: slug,
      missing_sections: missingSections,
      issues: []
    });
  }
}

for (const report of reports) {
  for (const section of report.missing_sections) {
    if (!requirementIds.has(section)) throw new Error(`Unknown content requirement "${section}" in ${report.type}:${report.id}`);
  }
}

const missingSectionCounts = Object.fromEntries(
  requirements.map(({ id }) => [
    id,
    reports.reduce((count, report) => count + (report.missing_sections.includes(id) ? 1 : 0), 0)
  ])
);

const result = {
  schema_version: "1.0.0",
  requirements,
  summary: {
    providers_total: catalog.providers.length,
    provider_content_files: providerContent.size,
    markdown_guides_scanned: markdownFiles.length,
    generated_guides_targeted: generatedGuideTargets.length,
    reports_total: reports.length,
    missing_section_counts: missingSectionCounts
  },
  reports
};

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else if (reports.length) {
  console.log("Content quality audit backlog:");
  for (const report of reports) {
    const missing = report.missing_sections.length ? report.missing_sections.join(", ") : "none";
    const issues = report.issues.length ? report.issues.join("؛ ") : "none";
    console.log(`- ${report.type}:${report.id} | missing=${missing} | issues=${issues}`);
  }
  console.log(`\n${reports.length} page(s) require content work.`);
  console.log("Run with --json for machine-readable output or --strict to fail on any backlog.");
} else {
  console.log("All audited content meets the nine-section quality contract.");
}

if (strict && reports.length) process.exit(1);
