import { access, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "site/index.html",
  "site/styles.css",
  "site/seo.css",
  "site/app.js",
  "site/manifest.webmanifest",
  "site/robots.txt",
  "site/sitemap.xml"
];
for (const file of required) await access(path.join(root, file));

const html = await readFile(path.join(root, "site/index.html"), "utf8");
const robots = await readFile(path.join(root, "site/robots.txt"), "utf8");
const appSource = await readFile(path.join(root, "site/app.js"), "utf8");
for (const needle of ["lang=\"fa\"", "dir=\"rtl\"", "./app.js", "./styles.css", "API رایگان LLM برای ایران", "application/ld+json", "SEO_PROVIDER_LINKS_START"]) {
  if (!html.includes(needle)) throw new Error(`site/index.html is missing ${needle}`);
}
if (!appSource.includes('fetch("./catalog.json"')) throw new Error("site/app.js does not fetch the generated catalog");
if (/<script[^>]+src=["']https?:\/\//i.test(html)) throw new Error("Remote scripts are not allowed");
const canonicalOrigin = "https://llm.persiantoolbox.ir/";
if (!html.includes(`<link rel="canonical" href="${canonicalOrigin}">`)) throw new Error("Canonical production URL is missing");
if (!html.includes(`<meta property="og:url" content="${canonicalOrigin}">`)) throw new Error("Open Graph production URL is missing");
if (!robots.includes(`${canonicalOrigin}sitemap.xml`)) throw new Error("robots.txt does not reference the production sitemap");

for (const file of ["site/app.js", "scripts/build-site.mjs"]) {
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

const build = spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], { cwd: root, encoding: "utf8" });
if (build.status !== 0) throw new Error(build.stderr || "Site build failed");
for (const file of ["index.html", "styles.css", "seo.css", "app.js", "catalog.json", "build-meta.json", "robots.txt", "sitemap.xml", "llms.txt"]) {
  await access(path.join(root, ".site-dist", file));
}

const builtIndex = await readFile(path.join(root, ".site-dist", "index.html"), "utf8");
if (!builtIndex.includes('<link rel="stylesheet" href="./seo.css">')) throw new Error("Built homepage does not load seo.css");
for (const provider of catalog.providers) {
  const relativeUrl = `./providers/${provider.id}/`;
  if (!builtIndex.includes(relativeUrl)) throw new Error(`Homepage is missing crawlable link for ${provider.id}`);
  const providerPath = path.join(root, ".site-dist", "providers", provider.id, "index.html");
  await access(providerPath);
  const providerHtml = await readFile(providerPath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/providers/${provider.id}/`;
  for (const needle of [canonical, "application/ld+json", provider.name, "../../seo.css", "خلاصه فنی"]) {
    if (!providerHtml.includes(needle)) throw new Error(`${provider.id} page is missing ${needle}`);
  }
}

const providerDirectories = await readdir(path.join(root, ".site-dist", "providers"));
if (providerDirectories.length !== catalog.providers.length) throw new Error("Generated provider page count does not match catalog");

const guideCount = 6;
const guideSlugs = ["best-free-llm-api-iran", "openai-compatible-api-without-card", "free-coding-api", "free-embedding-api", "free-tier-vs-trial-vs-credit", "openai-sdk-custom-base-url"];
const guidesDir = path.join(root, ".site-dist", "guides");
await access(guidesDir);
const guideDirectories = await readdir(guidesDir);
if (guideDirectories.length !== guideCount) throw new Error("Generated guide page count does not match expected");
for (const slug of guideSlugs) {
  const guidePath = path.join(guidesDir, slug, "index.html");
  await access(guidePath);
  const guideHtml = await readFile(guidePath, "utf8");
  const canonical = `https://llm.persiantoolbox.ir/guides/${slug}/`;
  if (!guideHtml.includes(canonical)) throw new Error(`Guide ${slug} is missing canonical`);
  if (!guideHtml.includes("application/ld+json")) throw new Error(`Guide ${slug} is missing JSON-LD`);
}

const sitemap = await readFile(path.join(root, ".site-dist", "sitemap.xml"), "utf8");
const sitemapUrlCount = (sitemap.match(/<url>/g) || []).length;
if (sitemapUrlCount !== catalog.providers.length + 1 + guideCount) throw new Error(`Sitemap URL count ${sitemapUrlCount} does not match provider count + homepage + guide count`);
for (const provider of catalog.providers) {
  if (!sitemap.includes(`<loc>https://llm.persiantoolbox.ir/providers/${provider.id}/</loc>`)) throw new Error(`Sitemap is missing ${provider.id}`);
}
for (const slug of guideSlugs) {
  if (!sitemap.includes(`<loc>https://llm.persiantoolbox.ir/guides/${slug}/</loc>`)) throw new Error(`Sitemap is missing guide ${slug}`);
}

const buildMeta = JSON.parse(await readFile(path.join(root, ".site-dist", "build-meta.json"), "utf8"));
if (!("source_revision" in buildMeta)) throw new Error("build-meta.json is missing source_revision");
if (buildMeta.provider_page_count !== catalog.providers.length) throw new Error("build-meta provider_page_count mismatch");
await rm(path.join(root, ".site-dist"), { recursive: true, force: true });
console.log(`Static SEO checks passed for ${catalog.providers.length} indexable provider pages.`);
