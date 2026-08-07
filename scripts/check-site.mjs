import { access, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { XMLParser } from "fast-xml-parser";

const root = process.cwd();
const plausibleScript = "./plausible.js";
const required = [
  "site/index.html",
  "site/en/index.html",
  "site/styles.css",
  "site/seo.css",
  "site/app.js",
  "site/analytics.js",
  "site/manifest.webmanifest",
  "site/robots.txt",
  "site/sitemap.xml",
  "site/404.html",
  "deploy/caddy/llm.persiantoolbox.ir.caddy",
  "deploy/nginx/ir.llm.persiantoolbox.ir.conf"
];
for (const file of required) await access(path.join(root, file));

// Favicon assets
const faviconAssets = ["favicon.svg", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"];
for (const asset of faviconAssets) {
  await access(path.join(root, "site", "assets", asset));
}

const html = await readFile(path.join(root, "site/index.html"), "utf8");
const robots = await readFile(path.join(root, "site/robots.txt"), "utf8");
const appSource = await readFile(path.join(root, "site/app.js"), "utf8");
const analyticsSource = await readFile(path.join(root, "site/analytics.js"), "utf8");
const caddy = await readFile(path.join(root, "deploy/caddy/llm.persiantoolbox.ir.caddy"), "utf8");
const nginx = await readFile(path.join(root, "deploy/nginx/ir.llm.persiantoolbox.ir.conf"), "utf8");

for (const needle of ["lang=\"fa\"", "dir=\"rtl\"", "./app.js", "./styles.css", "API رایگان LLM برای ایران", "application/ld+json", "SEO_PROVIDER_LINKS_START", "Organization", "Dataset", "creator"]) {
  if (!html.includes(needle)) throw new Error(`site/index.html is missing ${needle}`);
}
if (!appSource.includes('fetch("./catalog.json"')) throw new Error("site/app.js does not fetch the generated catalog");

const remoteScriptsAllowed = [plausibleScript];
const scriptTags = html.match(/<script[^>]+src=["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
for (const tag of scriptTags) {
  const src = tag.match(/src=["']([^"']+)["']/i)?.[1] ?? "";
  if (!remoteScriptsAllowed.includes(src)) throw new Error(`Remote script is not allow-listed: ${src}`);
}

const analyticsSignals = ["persian_campaign_landing", "provider_detail_view", "provider_docs_click", "catalog_filter", "github_click", "iran_report_click", "finder_start", "finder_complete", "quick_start_copy"];
for (const signal of analyticsSignals) {
  if (!analyticsSource.includes(signal)) throw new Error(`site/analytics.js is missing ${signal}`);
}
if (!analyticsSource.includes("plausible")) throw new Error("site/analytics.js must integrate Plausible");

if (!robots.includes("Sitemap: https://llm.persiantoolbox.ir/sitemap.xml")) throw new Error("site/robots.txt is missing the canonical sitemap URL");
if (!caddy.includes("header X-Robots-Tag \"noindex, nofollow\"")) throw new Error("Iran Caddy mirror must emit X-Robots-Tag noindex, nofollow");
if (!nginx.includes('add_header X-Robots-Tag "noindex, nofollow" always;')) throw new Error("Iran Nginx mirror must emit X-Robots-Tag noindex, nofollow");

// Build a fresh site before checking generated assets.
await rm(path.join(root, ".site-dist"), { recursive: true, force: true });
const build = spawnSync("npm", ["run", "site:build"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
});
if (build.status !== 0) {
  process.stdout.write(build.stdout ?? "");
  process.stderr.write(build.stderr ?? "");
  throw new Error("Site build failed");
}

const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
const generatedHome = await readFile(path.join(root, ".site-dist", "index.html"), "utf8");
const generatedEnHome = await readFile(path.join(root, ".site-dist", "en", "index.html"), "utf8");
const generatedRobots = await readFile(path.join(root, ".site-dist", "robots.txt"), "utf8");
const generatedSitemap = await readFile(path.join(root, ".site-dist", "sitemap.xml"), "utf8");
const buildMeta = JSON.parse(await readFile(path.join(root, ".site-dist", "build-meta.json"), "utf8"));

for (const needle of ["application/ld+json", "Organization", "Dataset", "creator", "skip-link", "site-footer", "./analytics.js"]) {
  if (!generatedHome.includes(needle)) throw new Error(`Generated Persian homepage is missing ${needle}`);
}
for (const needle of ["application/ld+json", "Organization", "CollectionPage", "skip-link", "site-footer", "../analytics.js"]) {
  if (!generatedEnHome.includes(needle)) throw new Error(`Generated English homepage is missing ${needle}`);
}
if (!generatedRobots.includes("Sitemap: https://llm.persiantoolbox.ir/sitemap.xml")) throw new Error("Generated robots.txt is missing canonical sitemap");

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
const sitemap = parser.parse(generatedSitemap);
const urls = Array.isArray(sitemap.urlset.url) ? sitemap.urlset.url : [sitemap.urlset.url];
const sitemapLocs = urls.map((item) => item.loc);
if (new Set(sitemapLocs).size !== sitemapLocs.length) throw new Error("Sitemap contains duplicate URLs");
if (sitemapLocs.some((loc) => String(loc).includes("ir.llm.persiantoolbox.ir"))) throw new Error("Sitemap must not contain Iran mirror URLs");

if (buildMeta.provider_count !== catalog.provider_count) throw new Error("build-meta provider_count must match catalog");
if (buildMeta.provider_page_count !== catalog.provider_count) throw new Error("build-meta provider_page_count must match catalog");
if (buildMeta.catalog_last_updated !== catalog.last_updated) throw new Error("build-meta catalog_last_updated must match catalog");

const organizationId = "https://llm.persiantoolbox.ir/#organization";
for (const provider of catalog.providers) {
  const providerPath = path.join(root, ".site-dist", "providers", provider.id, "index.html");
  await access(providerPath);
  const providerHtml = await readFile(providerPath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/providers/${provider.id}/`;
  for (const needle of [canonical, provider.name, "application/ld+json", "../../analytics.js", `dateModified\":\"${provider.verification.last_checked}`, "skip-link", "#organization"]) {
    if (!providerHtml.includes(needle)) throw new Error(`${provider.id}: generated provider page is missing ${needle}`);
  }

  // Verify JSON-LD TechArticle references Organization via @id
  const providerLdMatch = providerHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (providerLdMatch) {
    const providerLd = JSON.parse(providerLdMatch[1]);
    const graph = providerLd["@graph"] || [providerLd];
    const article = graph.find((item) => item["@type"] === "TechArticle");
    if (article) {
      if (!article.author || !article.author["@id"]) throw new Error(`${provider.id}: TechArticle author must use @id reference`);
      if (article.author["@id"] !== organizationId) throw new Error(`${provider.id}: TechArticle author must reference organization`);
    }
    // Validate JSON-LD parses
    JSON.stringify(providerLd);
  }
}

const providerDirectories = await readdir(path.join(root, ".site-dist", "providers"));
if (providerDirectories.length !== catalog.providers.length) throw new Error("Generated provider page count does not match catalog");

const sourceOwnedGuideDates = new Map();
const persianContentDir = path.join(root, "content", "fa");
for (const file of (await readdir(persianContentDir)).filter((name) => name.endsWith(".md"))) {
  const source = await readFile(path.join(persianContentDir, file), "utf8");
  const frontmatterEnd = source.indexOf("\n---\n", 4);
  if (!source.startsWith("---\n") || frontmatterEnd === -1) continue;
  const frontmatter = source.slice(4, frontmatterEnd);
  const slug = frontmatter.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim();
  const updatedAt = frontmatter.match(/^updated_at:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m)?.[1];
  if (slug && updatedAt) sourceOwnedGuideDates.set(slug, updatedAt);
}

const guideCount = 6;
const guideSlugs = ["best-free-llm-api-iran", "openai-compatible-api-without-card", "free-coding-api", "free-embedding-api", "free-tier-vs-trial-vs-credit", "openai-sdk-custom-base-url"];

const enGuideSlugs = ["en-practical-free-llm-api-iran", "en-build-persian-chatbot-python", "en-fix-llm-api-401-403", "en-llm-api-rate-limit-429", "en-use-free-llm-api-nodejs"];
const guidesDir = path.join(root, ".site-dist", "guides");
await access(guidesDir);
const guideDirectories = await readdir(guidesDir);
if (guideDirectories.length < guideCount) throw new Error(`Generated guide page count does not match expected. Found ${guideDirectories.length}, expected at least ${guideCount}`);
for (const slug of guideSlugs) {
  const guidePath = path.join(guidesDir, slug, "index.html");
  await access(guidePath);
  const guideHtml = await readFile(guidePath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/guides/${slug}/`;
  const expectedDateModified = sourceOwnedGuideDates.get(slug) ?? catalog.last_updated;
  for (const needle of [canonical, "application/ld+json", "../../analytics.js", `dateModified\":\"${expectedDateModified}`, "skip-link", "#organization"]) {
    if (!guideHtml.includes(needle)) throw new Error(`Guide ${slug} is missing ${needle}`);
  }
  if (!guideHtml.includes(`hreflang="fa-IR" href="${canonical}"`) || !guideHtml.includes(`hreflang="x-default" href="${canonical}"`)) throw new Error(`Guide ${slug} is missing hreflang tags`);
  if (guideHtml.includes(`hreflang="fa" href="${canonical}"`)) throw new Error(`Guide ${slug} must not emit bare fa hreflang`);
  if (guideHtml.includes('lang-switcher')) throw new Error(`Guide ${slug} must not have a language switcher (no English counterpart)`);
  if (guideHtml.includes('href="../providers/')) throw new Error(`Guide ${slug} contains a broken provider relative link`);
  if (guideHtml.includes('href="../catalog.json"')) throw new Error(`Guide ${slug} contains a broken catalog relative link`);
  if ((guideHtml.match(new RegExp(plausibleScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length !== 1) throw new Error(`Guide ${slug} must contain exactly one Plausible tracker`);

  // Title duplication check
  const guideTitleMatch = guideHtml.match(/<title>([^<]+)<\/title>/);
  if (guideTitleMatch && /API\s+API/i.test(guideTitleMatch[1])) throw new Error(`Guide ${slug} title has duplicate API: ${guideTitleMatch[1]}`);

  // H1 check
  const guideH1Count = (guideHtml.match(/<h1[^>]*>/g) || []).length;
  if (guideH1Count !== 1) throw new Error(`Guide ${slug} has ${guideH1Count} H1 tags, expected 1`);

  // Verify guide TechArticle references Organization
  const guideLdMatch = guideHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (guideLdMatch) {
    const guideLd = JSON.parse(guideLdMatch[1]);
    const graph = guideLd["@graph"] || [guideLd];
    const article = graph.find((item) => item["@type"] === "TechArticle");
    if (article) {
      if (!article.author || article.author["@id"] !== organizationId) throw new Error(`Guide ${slug}: TechArticle author must reference organization`);
    }
    JSON.stringify(guideLd);
  }
}

for (const slug of enGuideSlugs) {
  const guidePath = path.join(guidesDir, slug, "index.html");
  await access(guidePath);
  const guideHtml = await readFile(guidePath, "utf8");
  if (!guideHtml.includes("application/ld+json")) throw new Error(`English guide ${slug} is missing JSON-LD`);
  if (!guideHtml.includes("skip-link")) throw new Error(`English guide ${slug} is missing skip link`);
  if (!guideHtml.includes("site-footer")) throw new Error(`English guide ${slug} is missing site footer`);
}

console.log(`Site checks passed: ${catalog.provider_count} providers, ${providerDirectories.length} provider pages, ${guideDirectories.length} guide directories.`);
