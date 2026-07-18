import { access, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const plausibleScript = "./plausible.js";
const required = [
  "site/index.html",
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
  const srcMatch = tag.match(/src=["']([^"']+)["']/i);
  if (srcMatch && !remoteScriptsAllowed.includes(srcMatch[1])) throw new Error(`Remote script not allowed: ${srcMatch[1]}`);
}

const analyticsEventsInAnalytics = [
  "provider_page_click",
  "guide_page_click",
  "copy_base_url",
  "provider_docs_click",
  "provider_website_click",
  "provider_detail_click",
  "github_click",
  "catalog_download",
  "persian_campaign_landing",
  "guide_catalog_click",
  "iran_access_report_click"
];
for (const eventName of analyticsEventsInAnalytics) {
  if (!analyticsSource.includes(`\"${eventName}\"`)) throw new Error(`Analytics source is missing ${eventName}`);
}
// App.js sends additional events directly
for (const eventName of ["advisor_provider_click", "filter_apply", "filter_reset"]) {
  if (!appSource.includes(`"${eventName}"`)) throw new Error(`App source is missing ${eventName}`);
}
if (!analyticsSource.includes("window.plausible")) throw new Error("Analytics source does not initialize the Plausible queue");
if (!analyticsSource.includes('"offsite_articles"')) throw new Error("Analytics source does not recognize the offsite article campaign");
if (analyticsSource.includes("_paq")) throw new Error("Matomo queue syntax must not be used for Plausible");
if (analyticsSource.includes('createElement("script")')) throw new Error("Analytics source must not inject a duplicate remote tracker");

for (const [name, config] of [["Caddy", caddy], ["Nginx", nginx]]) {
  if (!config.includes("script-src 'self'")) throw new Error(`${name} CSP does not allow self-hosted scripts`);
  if (!config.includes("connect-src 'self'")) throw new Error(`${name} CSP does not allow self-hosted connections`);
}

const canonicalOrigin = "https://llm.persiantoolbox.ir/";
if (!html.includes(`<link rel="canonical" href="${canonicalOrigin}">`)) throw new Error("Canonical production URL is missing");
if (!html.includes(`<meta property="og:url" content="${canonicalOrigin}">`)) throw new Error("Open Graph production URL is missing");
if (!robots.includes(`${canonicalOrigin}sitemap.xml`)) throw new Error("robots.txt does not reference the production sitemap");

// Check HTML meta tags on homepage
if (!html.includes('lang="fa"')) throw new Error("Homepage missing lang=fa");
if (!html.includes('dir="rtl"')) throw new Error("Homepage missing dir=rtl");
const h1Count = (html.match(/<h1/g) || []).length;
if (h1Count !== 1) throw new Error(`Homepage must have exactly 1 H1, found ${h1Count}`);
if (!html.includes('<meta name="description"')) throw new Error("Homepage missing meta description");
if (!html.includes('<meta property="og:type"')) throw new Error("Homepage missing og:type");
if (!html.includes('<meta name="twitter:card"')) throw new Error("Homepage missing twitter:card");
if (!html.includes('id="main-content"')) throw new Error("Homepage missing skip-link target");
if (!html.includes('class="skip-link"')) throw new Error("Homepage missing skip-link");
if (!html.includes('aria-pressed')) throw new Error("Theme toggle missing aria-pressed");
if (!html.includes('role="status"')) throw new Error("Result count missing role=status");

// Check 404.html
const notFoundHtml = await readFile(path.join(root, "site/404.html"), "utf8");
if (!notFoundHtml.includes("noindex")) throw new Error("404.html is missing noindex");
if (!notFoundHtml.includes("404")) throw new Error("404.html does not mention 404");
if (!notFoundHtml.includes("skip-link")) throw new Error("404.html missing skip-link");

// JSON-LD structured data validation on homepage
const ldJsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (!ldJsonMatch) throw new Error("Homepage missing JSON-LD");
const parsed = JSON.parse(ldJsonMatch[1]);
if (!parsed["@graph"]) throw new Error("JSON-LD missing @graph");
const org = parsed["@graph"].find((item) => item["@type"] === "Organization");
if (!org) throw new Error("JSON-LD missing Organization");
if (!org.name || !org.url || !org["@id"]) throw new Error("Organization missing required fields");
const dataset = parsed["@graph"].find((item) => item["@type"] === "Dataset");
if (!dataset) throw new Error("JSON-LD missing Dataset");
if (!dataset.creator) throw new Error("Dataset missing creator field");
if (dataset.creator["@id"] !== org["@id"]) throw new Error("Dataset creator does not reference Organization @id");
if (!dataset.publisher || dataset.publisher["@id"] !== org["@id"]) throw new Error("Dataset publisher must reference Organization @id");
if (!dataset.inLanguage) throw new Error("Dataset missing inLanguage");
if (!dataset.license) throw new Error("Dataset missing license");
if (!dataset.distribution) throw new Error("Dataset missing distribution");
if (dataset.isAccessibleForFree !== true) throw new Error("Dataset isAccessibleForFree must be true");
if (!dataset.sameAs === undefined && !Array.isArray(dataset.sameAs)) throw new Error("Dataset sameAs must be an array if present");

for (const file of ["site/app.js", "site/analytics.js", "scripts/build-site.mjs", "scripts/build-guides.mjs"]) {
  const syntax = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `${file} syntax check failed`);
}

const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
if (catalog.provider_count !== catalog.providers.length || catalog.providers.length === 0) throw new Error("Catalog provider count is invalid");
if (new Set(catalog.providers.map((provider) => provider.id)).size !== catalog.providers.length) throw new Error("Catalog has duplicate provider IDs");
const hostedServiceTypes = new Set(["official_provider", "official_gateway", "community_gateway"]);
if (catalog.schema_version !== "1.1.0") throw new Error("Catalog schema version is not 1.1.0");
if (catalog.providers.some((provider) => !hostedServiceTypes.has(provider.service_type))) throw new Error("Main catalog contains a non-hosted tool entry");
if (!appSource.includes("serviceLabels")) throw new Error("Site does not render service type labels");
if (!appSource.includes("detail-link")) throw new Error("Site does not render detail CTA link");
if (!appSource.includes("advisor-link")) throw new Error("Site does not render clickable advisor links");
if (!appSource.includes("advisor_provider_click")) throw new Error("Site does not send advisor analytics");

const build = spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], { cwd: root, encoding: "utf8" });
if (build.status !== 0) throw new Error(build.stderr || "Site build failed");
for (const file of ["index.html", "styles.css", "seo.css", "app.js", "analytics.js", "catalog.json", "build-meta.json", "robots.txt", "sitemap.xml", "llms.txt", "404.html"]) {
  await access(path.join(root, ".site-dist", file));
}

const builtIndex = await readFile(path.join(root, ".site-dist", "index.html"), "utf8");
if (!builtIndex.includes('<link rel="stylesheet" href="./seo.css">')) throw new Error("Built homepage does not load seo.css");
if (!builtIndex.includes('<script defer src="./analytics.js"></script>')) throw new Error("Built homepage does not load local analytics events");
if ((builtIndex.match(new RegExp(plausibleScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length !== 1) throw new Error("Built homepage must contain exactly one Plausible tracker");
// Built homepage structured data must include Organization and Dataset.creator
if (!builtIndex.includes('"Organization"') || !builtIndex.includes('"creator"')) throw new Error("Built homepage JSON-LD missing creator/organization");

const organizationId = "https://llm.persiantoolbox.ir/#organization";

for (const provider of catalog.providers) {
  const relativeUrl = `./providers/${provider.id}/`;
  if (!builtIndex.includes(relativeUrl)) throw new Error(`Homepage is missing crawlable link for ${provider.id}`);
  const providerPath = path.join(root, ".site-dist", "providers", provider.id, "index.html");
  await access(providerPath);
  const providerHtml = await readFile(providerPath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/providers/${provider.id}/`;
  for (const needle of [canonical, "application/ld+json", provider.name, "../../seo.css", "../../analytics.js", "خلاصه فنی", `data-provider-id="${provider.id}"`, "data-copy-text=", "skip-link", "#organization"]) {
    if (!providerHtml.includes(needle)) throw new Error(`${provider.id} page is missing ${needle}`);
  }
  if ((providerHtml.match(new RegExp(plausibleScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length !== 1) throw new Error(`${provider.id} page must contain exactly one Plausible tracker`);

  // Title duplication check - no "API API" pattern
  const titleMatch = providerHtml.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && /API\s+API/i.test(titleMatch[1])) throw new Error(`${provider.id} title has duplicate API: ${titleMatch[1]}`);

  // Exactly one H1 per page
  const h1Matches = providerHtml.match(/<h1[^>]*>/g) || [];
  if (h1Matches.length !== 1) throw new Error(`${provider.id} page has ${h1Matches.length} H1 tags, expected 1`);

  // Check all provider pages have Organization @id in JSON-LD
  if (!providerHtml.includes(organizationId)) throw new Error(`${provider.id} page references wrong Organization @id`);

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

const guideCount = 6;
const guideSlugs = ["best-free-llm-api-iran", "openai-compatible-api-without-card", "free-coding-api", "free-embedding-api", "free-tier-vs-trial-vs-credit", "openai-sdk-custom-base-url"];
const guidesDir = path.join(root, ".site-dist", "guides");
await access(guidesDir);
const guideDirectories = await readdir(guidesDir);
if (guideDirectories.length < guideCount) throw new Error(`Generated guide page count does not match expected. Found ${guideDirectories.length}, expected at least ${guideCount}`);
for (const slug of guideSlugs) {
  const guidePath = path.join(guidesDir, slug, "index.html");
  await access(guidePath);
  const guideHtml = await readFile(guidePath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/guides/${slug}/`;
  for (const needle of [canonical, "application/ld+json", "../../analytics.js", `dateModified\":\"${catalog.last_updated}`, "skip-link", "#organization"]) {
    if (!guideHtml.includes(needle)) throw new Error(`Guide ${slug} is missing ${needle}`);
  }
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
    const techArticle = graph.find((item) => item["@type"] === "TechArticle");
    if (techArticle) {
      if (!techArticle.author || !techArticle.author["@id"]) throw new Error(`Guide ${slug}: TechArticle author must use @id reference`);
    }
  }
}

const sitemap = await readFile(path.join(root, ".site-dist", "sitemap.xml"), "utf8");
const sitemapUrlCount = (sitemap.match(/<url>/g) || []).length;
if (sitemapUrlCount < catalog.providers.length + 1 + guideCount) throw new Error(`Sitemap URL count ${sitemapUrlCount} is less than expected`);
for (const provider of catalog.providers) {
  if (!sitemap.includes(`<loc>https://llm.persiantoolbox.ir/providers/${provider.id}/</loc>`)) throw new Error(`Sitemap is missing ${provider.id}`);
}

const socialAssets = [
  { file: "assets/social/og-default.png", width: 1200, height: 630 },
  { file: "assets/social/github-card.png", width: 1280, height: 640 },
  { file: "assets/social/site-desktop.png", width: 1440, height: 900 },
  { file: "assets/social/site-mobile.png", width: 390, height: 844 }
];
for (const asset of socialAssets) {
  await access(path.join(root, asset.file));
  const builtAsset = path.join(root, ".site-dist", asset.file);
  await access(builtAsset);
  const signature = (await readFile(builtAsset)).subarray(0, 8);
  if (!signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error(`Built social asset is not a PNG: ${asset.file}`);
  }
}

const buildMeta = JSON.parse(await readFile(path.join(root, ".site-dist", "build-meta.json"), "utf8"));
if (!("source_revision" in buildMeta)) throw new Error("build-meta.json is missing source_revision");
if (buildMeta.provider_page_count !== catalog.providers.length) throw new Error("build-meta provider_page_count mismatch");
if (Number(buildMeta.guide_page_count) < guideCount) throw new Error(`build-meta guide_page_count ${buildMeta.guide_page_count} is less than expected ${guideCount}`);

// Favicon asset validation in built output
for (const asset of faviconAssets) {
  const builtFavicon = path.join(root, ".site-dist", "assets", asset);
  await access(builtFavicon);
  if (asset.endsWith(".png")) {
    const sig = (await readFile(builtFavicon)).subarray(0, 8);
    if (!sig.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      throw new Error(`Built favicon is not a valid PNG: ${asset}`);
    }
  }
}

// Check soft-404 guards in configs
if (/try_files\s+\{path}\s+\{path}\s+\/index\.html/.test(caddy)) throw new Error("Caddy config must not contain SPA fallback to /index.html");
if (caddy.includes("handle_errors")) {
  if (!caddy.includes("404")) throw new Error("Caddy handle_errors must handle 404");
}
if (/try_files\s+\$uri\s+\$uri\/\s+\/index\.html/.test(nginx)) throw new Error("Nginx config must not contain SPA fallback to /index.html");
if (!nginx.includes("error_page 404")) throw new Error("Nginx config must have error_page 404 directive");
if (!nginx.includes("=404")) throw new Error("Nginx try_files must fall back to =404");

await rm(path.join(root, ".site-dist"), { recursive: true, force: true });
console.log(`Static SEO, analytics, accessibility, and soft-404 checks passed for ${catalog.providers.length} provider pages, ${guideCount}+ guide pages, and ${socialAssets.length} social assets.`);
