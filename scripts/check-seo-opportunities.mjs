import { spawnSync } from "node:child_process";
import { readFile, readdir, access } from "node:fs/promises";
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

const skipExtensions = new Set([".json", ".xml", ".txt", ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webmanifest", ".woff", ".woff2", ".ttf"]);

function isInternalPageLink(href) {
  const ext = path.extname(href.split("?")[0].split("#")[0]).toLowerCase();
  return !ext || ext === ".html";
}

function resolveHref(basePath, href) {
  if (href.startsWith("/")) return href;
  const dir = basePath.endsWith("/") ? basePath : path.posix.dirname(basePath) + "/";
  return path.posix.join("/", path.posix.resolve("/", dir, href));
}

const staticFiles = new Set(["/catalog.json", "/data.json", "/sitemap.xml", "/llms.txt", "/robots.txt", "/app.js", "/analytics.js", "/plausible.js", "/styles.css", "/seo.css", "/manifest.webmanifest"]);

async function scanPage(filePath, urlPath) {
  const html = await readFile(filePath, "utf8");

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : null;

  const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const hasMetaDescription = metaDescMatch && hasText(metaDescMatch[1]);

  const hasHreflang = html.includes('hreflang="');
  const hasCanonical = html.includes('rel="canonical"');
  const hasJsonLd = html.includes("application/ld+json");

  const allLinks = extractAttr(html, "a", "href");
  const internalLinks = allLinks
    .filter((href) => href.startsWith("./") || href.startsWith("../") || href.startsWith("/"))
    .filter((href) => !staticFiles.has(href.split("?")[0].split("#")[0]))
    .filter((href) => isInternalPageLink(href));

  const images = extractAttr(html, "img", "src");
  const imagesWithAlt = extractAttr(html, "img", "alt");
  const imagesWithoutAlt = images.length - imagesWithAlt.length;

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1] : "";
  const wc = wordCount(bodyText);

  const page = { path: urlPath, title };

  if (!hasMetaDescription) {
    issues.push({ severity: "high", category: "missing_meta_description", page, detail: "Page missing meta description" });
  }

  if (!hasHreflang) {
    issues.push({ severity: "high", category: "missing_hreflang", page, detail: "Page missing hreflang tags" });
  }

  if (!hasCanonical) {
    issues.push({ severity: "high", category: "missing_canonical", page, detail: "Page missing canonical URL" });
  }

  if (!hasJsonLd) {
    issues.push({ severity: "high", category: "missing_json_ld", page, detail: "Page missing JSON-LD structured data" });
  }

  if (imagesWithoutAlt > 0) {
    issues.push({ severity: "medium", category: "missing_alt_text", page, detail: `${imagesWithoutAlt} image(s) missing alt text` });
  }

  if (wc < 300 && shouldEnforceMinimumWordCount(html)) {
    issues.push({ severity: "low", category: "low_word_count", page, detail: `Low word count: ${wc} words (threshold: 300)` });
  }

  return { html, internalLinks, title };
}

async function scanTitles(htmlByPath) {
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

async function checkInternalLinks(htmlByPath) {
  const pagePaths = new Set([
    ...Object.keys(htmlByPath),
    "/providers",
    "/providers/",
    "/guides",
    "/guides/"
  ]);

  for (const [urlPath, { internalLinks }] of Object.entries(htmlByPath)) {
    for (const link of internalLinks) {
      const resolved = resolveHref(urlPath, link).replace(/\/$/, "").split("#")[0] || "/";
      if (!pagePaths.has(resolved) && !pagePaths.has(resolved + "/") && !pagePaths.has(resolved.replace(/\/$/, "") + "/index.html")) {
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
      await readFile(directIndex, "utf8");
      pages.push({ file: `guides/${entry.name}/index.html`, path: `/guides/${entry.name}/` });
      continue;
    } catch {
      // not a direct guide dir
    }

    try {
      const subEntries = await readdir(path.join(guidesDir, entry.name), { withFileTypes: true });
      for (const sub of subEntries) {
        if (!sub.isDirectory()) continue;
        const subIndex = path.join(guidesDir, entry.name, sub.name, "index.html");
        try {
          await readFile(subIndex, "utf8");
          pages.push({ file: `guides/${entry.name}/${sub.name}/index.html`, path: `/guides/${entry.name}/${sub.name}/` });
        } catch {
          // skip
        }
      }
    } catch {
      // not a subdirectory
    }
  }

  return pages;
}

async function main() {
  try {
    await access(path.join(siteDir, "guides", "llm-api-rate-limit-429", "index.html"));
  } catch {
    console.log("Building site for SEO check...");
    const result = spawnSync("npm", ["run", "site:build"], { cwd: root, encoding: "utf8", stdio: "inherit" });
    if (result.status !== 0) {
      console.error("Site build failed");
      process.exit(1);
    }
  }

  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

  const pagesToScan = [
    { file: "index.html", path: "/" },
    { file: "en/index.html", path: "/en/" },
    { file: "api-finder/index.html", path: "/api-finder/" },
    { file: "404.html", path: "/404.html" }
  ];

  for (const provider of catalog.providers) {
    pagesToScan.push({ file: `providers/${provider.id}/index.html`, path: `/providers/${provider.id}/` });
  }

  const guidePages = await collectGuidePages();
  pagesToScan.push(...guidePages);

  const htmlByPath = {};

  for (const { file, path: urlPath } of pagesToScan) {
    const filePath = path.join(siteDir, file);
    try {
      const result = await scanPage(filePath, urlPath);
      htmlByPath[urlPath] = result;
    } catch (err) {
      issues.push({ severity: "high", category: "page_not_found", page: { path: urlPath }, detail: `Cannot read page: ${err.message}` });
    }
  }

  await scanTitles(htmlByPath);
  await checkInternalLinks(htmlByPath);

  const categoryLabels = {
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

  const lines = [
    "# SEO Opportunities Report",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    `Pages scanned: ${pagesToScan.length}`,
    `Issues found: ${issues.length}`,
    "",
    "## Summary by Category",
    ""
  ];

  const byCategory = {};
  for (const issue of issues) {
    if (!byCategory[issue.category]) byCategory[issue.category] = [];
    byCategory[issue.category].push(issue);
  }

  lines.push("| Category | Count | Severity |");
  lines.push("|---|---|---|");
  for (const [category, items] of Object.entries(byCategory).sort()) {
    const label = categoryLabels[category] || category;
    const maxSeverity = items.reduce((max, i) => ["high", "medium", "low"].indexOf(i.severity) < ["high", "medium", "low"].indexOf(max) ? i.severity : max, "low");
    lines.push(`| ${label} | ${items.length} | ${maxSeverity} |`);
  }

  lines.push("", "## Detailed Issues", "");
  for (const issue of issues) {
    lines.push(`### [${issue.severity.toUpperCase()}] ${categoryLabels[issue.category] || issue.category}`);
    lines.push(`- **Page:** \`${issue.page.path}\`${issue.page.title ? ` — "${issue.page.title}"` : ""}`);
    lines.push(`- **Detail:** ${issue.detail}`);
    lines.push("");
  }

  const report = lines.join("\n");
  console.log(report);

  if (strict && issues.length) {
    process.exit(1);
  }
}

await main().catch((err) => {
  console.error(`SEO check failed: ${err.message}`);
  process.exit(1);
});
