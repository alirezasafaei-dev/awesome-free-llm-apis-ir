import { spawnSync } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { shouldEnforceMinimumWordCount } from "./seo-page-policy.mjs";

const root = process.cwd();
const siteDir = path.join(root, ".site-dist");
const catalogPath = path.join(root, "catalog.json");
const strict = process.argv.includes("--strict");
const issues = [];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function wordCount(text) {
  return text.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function extractAttr(html, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}=["']([^"']*)["']`, "gi");
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) matches.push(match[1]);
  return matches;
}

function routePart(href) {
  return String(href).split(/[?#]/, 1)[0];
}

function isInternalPageLink(href) {
  const ext = path.extname(routePart(href)).toLowerCase();
  return !ext || ext === ".html";
}

function resolveHref(basePath, href) {
  const route = routePart(href);
  if (route.startsWith("/")) return path.posix.normalize(route);
  const dir = basePath.endsWith("/") ? basePath : `${path.posix.dirname(basePath)}/`;
  return path.posix.join("/", path.posix.resolve("/", dir, route));
}

const staticFiles = new Set([
  "/catalog.json", "/data.json", "/sitemap.xml", "/llms.txt", "/robots.txt",
  "/app.js", "/analytics.js", "/plausible.js", "/styles.css", "/seo.css",
  "/manifest.webmanifest"
]);

async function scanPage(filePath, urlPath) {
  const html = await readFile(filePath, "utf8");
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? null;
  const metaDescription = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  const images = extractAttr(html, "img", "src");
  const imagesWithAlt = extractAttr(html, "img", "alt");
  const bodyText = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
  const page = { path: urlPath, title };

  if (!hasText(metaDescription)) issues.push({ severity: "high", category: "missing_meta_description", page, detail: "Page missing meta description" });
  if (!html.includes('hreflang="')) issues.push({ severity: "high", category: "missing_hreflang", page, detail: "Page missing hreflang tags" });
  if (!html.includes('rel="canonical"')) issues.push({ severity: "high", category: "missing_canonical", page, detail: "Page missing canonical URL" });
  if (!html.includes("application/ld+json")) issues.push({ severity: "high", category: "missing_json_ld", page, detail: "Page missing JSON-LD structured data" });

  const imagesWithoutAlt = images.length - imagesWithAlt.length;
  if (imagesWithoutAlt > 0) issues.push({ severity: "medium", category: "missing_alt_text", page, detail: `${imagesWithoutAlt} image(s) missing alt text` });

  const wc = wordCount(bodyText);
  if (wc < 300 && shouldEnforceMinimumWordCount(html)) {
    issues.push({ severity: "low", category: "low_word_count", page, detail: `Low word count: ${wc} words (threshold: 300)` });
  }

  const internalLinks = extractAttr(html, "a", "href")
    .filter((href) => href.startsWith("./") || href.startsWith("../") || href.startsWith("/"))
    .filter((href) => !staticFiles.has(routePart(href)))
    .filter(isInternalPageLink);

  return { internalLinks, title };
}

function scanTitles(htmlByPath) {
  const seen = new Map();
  for (const [urlPath, { title }] of Object.entries(htmlByPath)) {
    if (!title) continue;
    const normalized = title.replace(/\s+/g, " ").trim();
    if (seen.has(normalized)) {
      issues.push({
        severity: "medium",
        category: "duplicate_title",
        page: { path: urlPath, title },
        detail: `Duplicate title "${normalized}" also used by ${seen.get(normalized)}`
      });
    } else {
      seen.set(normalized, urlPath);
    }
  }
}

function checkInternalLinks(htmlByPath) {
  const pagePaths = new Set([
    ...Object.keys(htmlByPath),
    "/providers", "/providers/", "/guides", "/guides/"
  ]);

  for (const [urlPath, { internalLinks }] of Object.entries(htmlByPath)) {
    for (const link of internalLinks) {
      const resolved = resolveHref(urlPath, link).replace(/\/$/, "") || "/";
      const indexPath = `${resolved.replace(/\/$/, "")}/index.html`;
      if (!pagePaths.has(resolved) && !pagePaths.has(`${resolved}/`) && !pagePaths.has(indexPath)) {
        issues.push({
          severity: "high",
          category: "broken_internal_link",
          page: { path: urlPath },
          detail: `Broken internal link: ${link} (resolved: ${resolved})`
        });
      }
    }
  }
}

async function collectGuidePages() {
  const pages = [];
  const guidesDir = path.join(siteDir, "guides");
  let entries;
  try {
    entries = await readdir(guidesDir, { withFileTypes: true });
  } catch {
    return pages;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directIndex = path.join(guidesDir, entry.name, "index.html");
    try {
      await access(directIndex);
      pages.push({ file: `guides/${entry.name}/index.html`, path: `/guides/${entry.name}/` });
      continue;
    } catch {
      // Try one nested language/category level.
    }

    let children;
    try {
      children = await readdir(path.join(guidesDir, entry.name), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const child of children) {
      if (!child.isDirectory()) continue;
      const nestedIndex = path.join(guidesDir, entry.name, child.name, "index.html");
      try {
        await access(nestedIndex);
        pages.push({ file: `guides/${entry.name}/${child.name}/index.html`, path: `/guides/${entry.name}/${child.name}/` });
      } catch {
        // Not a guide page.
      }
    }
  }
  return pages;
}

async function ensureBuild() {
  try {
    await access(path.join(siteDir, "guides", "llm-api-rate-limit-429", "index.html"));
  } catch {
    console.log("Building site for SEO check...");
    const result = spawnSync("npm", ["run", "site:build"], { cwd: root, encoding: "utf8", stdio: "inherit" });
    if (result.status !== 0) throw new Error("Site build failed");
  }
}

async function main() {
  await ensureBuild();
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const pagesToScan = [
    { file: "index.html", path: "/" },
    { file: "en/index.html", path: "/en/" },
    { file: "api-finder/index.html", path: "/api-finder/" },
    { file: "en/api-finder/index.html", path: "/en/api-finder/" },
    { file: "quick-start/index.html", path: "/quick-start/" },
    { file: "en/quick-start/index.html", path: "/en/quick-start/" },
    { file: "compare/index.html", path: "/compare/" },
    { file: "en/compare/index.html", path: "/en/compare/" },
    { file: "tools/index.html", path: "/tools/" },
    { file: "methodology/index.html", path: "/methodology/" },
    { file: "404.html", path: "/404.html" },
    ...catalog.providers.map((provider) => ({ file: `providers/${provider.id}/index.html`, path: `/providers/${provider.id}/` })),
    ...await collectGuidePages()
  ];

  const htmlByPath = {};
  for (const page of pagesToScan) {
    try {
      htmlByPath[page.path] = await scanPage(path.join(siteDir, page.file), page.path);
    } catch (error) {
      issues.push({ severity: "high", category: "page_not_found", page: { path: page.path }, detail: `Cannot read page: ${error.message}` });
    }
  }

  scanTitles(htmlByPath);
  checkInternalLinks(htmlByPath);

  const labels = {
    missing_meta_description: "Pages missing meta description",
    missing_hreflang: "Pages missing hreflang",
    missing_canonical: "Pages missing canonical URL",
    missing_json_ld: "Pages missing JSON-LD structured data",
    missing_alt_text: "Pages with images missing alt text",
    low_word_count: "Indexable content pages with low word count (<300 words)",
    duplicate_title: "Pages with duplicate titles",
    broken_internal_link: "Broken internal links",
    page_not_found: "Pages that could not be read"
  };
  const rank = { high: 0, medium: 1, low: 2 };
  const byCategory = Object.groupBy(issues, (issue) => issue.category);
  const lines = [
    "# SEO Opportunities Report", "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Pages scanned: ${pagesToScan.length}`,
    `Issues found: ${issues.length}`, "",
    "## Summary by Category", "",
    "| Category | Count | Severity |", "|---|---|---|"
  ];

  for (const [category, items] of Object.entries(byCategory).sort()) {
    const severity = items.reduce((current, item) => rank[item.severity] < rank[current] ? item.severity : current, "low");
    lines.push(`| ${labels[category] ?? category} | ${items.length} | ${severity} |`);
  }

  lines.push("", "## Detailed Issues", "");
  for (const issue of issues) {
    lines.push(`### [${issue.severity.toUpperCase()}] ${labels[issue.category] ?? issue.category}`);
    lines.push(`- **Page:** \`${issue.page.path}\`${issue.page.title ? ` — "${issue.page.title}"` : ""}`);
    lines.push(`- **Detail:** ${issue.detail}`, "");
  }

  console.log(lines.join("\n"));
  if (strict && issues.length) process.exit(1);
}

await main().catch((error) => {
  console.error(`SEO check failed: ${error.message}`);
  process.exit(1);
});
