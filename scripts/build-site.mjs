import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { buildGuides } from "./build-guides.mjs";
import { canonicalOrigin, hreflangLinks, languageSwitcher, sitemapXhtmlLinks } from "./locales.mjs";

const root = process.cwd();
const source = path.join(root, "site");
const socialAssetsSource = path.join(root, "assets", "social");
const destination = path.join(root, ".site-dist");
const catalogPath = path.join(root, "catalog.json");
const organizationId = `${canonicalOrigin}/#organization`;
const plausibleScript = "./plausible.js";

const accessLabels = {
  verified_working: "دسترسی مستقیم از ایران تأیید شده",
  verified_working_vpn: "دسترسی با VPN تأیید شده",
  direct_blocked_vpn_working: "مستقیم مسدود و VPN موفق",
  verified_blocked: "محدودیت جغرافیایی تأیید شده",
  officially_unsupported: "ایران رسماً پشتیبانی نمی‌شود",
  intermittent: "دسترسی ناپایدار",
  signup_blocked: "مانع ثبت‌نام یا احراز حساب",
  account_activation_blocked: "مانع فعال‌سازی حساب",
  unknown: "وضعیت دسترسی نامشخص"
};

const freeLabels = {
  permanent_allowance: "سهمیه رایگان دائمی",
  free_models: "مدل‌های رایگان",
  monthly_credit: "اعتبار رایگان ماهانه",
  trial: "دوره آزمایشی",
  unknown: "نوع سهمیه نامشخص"
};

const capabilityLabels = {
  chat: "چت",
  text_generation: "تولید متن",
  reasoning: "استدلال",
  embeddings: "Embedding",
  tool_calling: "Tool calling",
  structured_output: "خروجی ساخت‌یافته"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function analyticsTags(prefix) {
  return `<script defer src="${prefix}analytics.js"></script>\n  <script defer data-domain="llm.persiantoolbox.ir" src="${plausibleScript}"></script>`;
}

function normalizeProviderLabel(name) {
  const trimmed = name.trim().replace(/\s+API(?:\s|$)/, " ").replace(/\s+API\s*$/, "").trim();
  if (trimmed.endsWith("API") || trimmed.endsWith("Api") || trimmed.endsWith("api")) {
    return trimmed;
  }
  return trimmed;
}

function providerDisplaySuffix(name) {
  const base = normalizeProviderLabel(name);
  return `${base} API رایگان`;
}

function providerDirectoryLabel(name) {
  const base = normalizeProviderLabel(name);
  return `${base} API`;
}

function limitText(provider) {
  const first = provider.free_tier?.limits?.[0];
  if (!first) return "وابسته به مدل یا حساب";
  const values = [];
  if (first.rpm != null) values.push(`${first.rpm} RPM`);
  if (first.rpd != null) values.push(`${first.rpd} RPD`);
  if (first.rph != null) values.push(`${first.rph} RPH`);
  if (first.tpm != null) values.push(`${first.tpm} TPM`);
  if (first.monthly_credit_usd != null) values.push(`$${first.monthly_credit_usd} در ماه`);
  if (first.monthly_requests != null) values.push(`${first.monthly_requests} درخواست در ماه`);
  return values.slice(0, 3).join(" · ") || "وابسته به مدل یا حساب";
}

function providerDescription(provider) {
  return `${provider.name}: ${freeLabels[provider.free_tier.type] ?? provider.free_tier.type}، ${limitText(provider)}، ${accessLabels[provider.iran_access.status] ?? provider.iran_access.status}. اطلاعات API و وضعیت ایران با منبع و تاریخ بررسی.`;
}

function providerPage(provider, relatedProviders) {
  const canonicalUrl = `${canonicalOrigin}/providers/${provider.id}/`;
  const displayTitle = providerDisplaySuffix(provider.name);
  const title = `${displayTitle} | سهمیه و وضعیت دسترسی ایران`;
  const description = providerDescription(provider);
  const capabilities = provider.capabilities.map((item) => capabilityLabels[item] ?? item);
  const models = provider.models?.notable ?? [];
  const sources = [...new Set([provider.docs, provider.website, ...(provider.sources ?? [])])];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        "name": "Awesome Free LLM APIs IR",
        "url": canonicalOrigin,
        "sameAs": ["https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir"]
      },
      {
        "@type": "TechArticle",
        "@id": `${canonicalUrl}#article`,
        headline: displayTitle,
        description,
        inLanguage: "fa-IR",
        dateModified: provider.verification.last_checked,
        mainEntityOfPage: canonicalUrl,
        author: { "@id": organizationId },
        publisher: { "@id": organizationId }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "APIهای رایگان LLM", item: `${canonicalOrigin}/` },
          { "@type": "ListItem", position: 2, name: provider.name, item: canonicalUrl }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <link rel="canonical" href="${canonicalUrl}">
  ${hreflangLinks([
    { hreflang: "fa-IR", href: canonicalUrl },
    { hreflang: "x-default", href: canonicalUrl }
  ])}
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../seo.css">
  <title>${escapeHtml(title)}</title>
  <script type="application/ld+json">${jsonLd(structuredData)}</script>
</head>
<body>
  <a class="skip-link" href="#provider-detail">رفتن به محتوای اصلی</a>
  <header class="topbar">
    <a class="brand" href="../../"><span class="brand-mark" aria-hidden="true"><img src="../../assets/logo-symbol.svg" alt="" width="40" height="40"></span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="پیوندهای اصلی"><a href="../../#catalog">همه APIها</a><a class="docs-link" href="${escapeHtml(provider.docs)}" rel="nofollow noopener" target="_blank">مستندات رسمی</a><a href="https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir">GitHub</a></nav>
  </header>
  <main class="provider-page">
    <nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="../../">APIهای رایگان LLM</a><span>←</span><span>${escapeHtml(provider.name)}</span></nav>
    <article class="provider-detail" id="provider-detail" data-provider-id="${escapeHtml(provider.id)}">
      <p class="eyebrow">صفحه اختصاصی Provider</p>
      <h1>${escapeHtml(displayTitle)}</h1>
      <p class="provider-lead">${escapeHtml(description)}</p>
      <div class="provider-status-row"><span class="access-badge">${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</span><span class="freshness-badge">آخرین بررسی: ${escapeHtml(provider.verification.last_checked)}</span></div>
      <section class="provider-facts" aria-labelledby="facts-title">
        <h2 id="facts-title">خلاصه فنی</h2>
        <dl>
          <div><dt>نوع سهمیه</dt><dd>${escapeHtml(freeLabels[provider.free_tier.type] ?? provider.free_tier.type)}</dd></div>
          <div><dt>محدودیت نمونه</dt><dd>${escapeHtml(limitText(provider))}</dd></div>
          <div><dt>سازگار با OpenAI</dt><dd>${provider.api.openai_compatible ? "بله" : "خیر"}</dd></div>
          <div><dt>نیاز به روش پرداخت</dt><dd>${provider.free_tier.requires_payment_method === true ? "بله" : provider.free_tier.requires_payment_method === false ? "خیر" : "در منابع رسمی مشخص نیست"}</dd></div>
          <div><dt>Base URL</dt><dd><code>${escapeHtml(provider.api.base_url)}</code> <button class="copy-button" type="button" data-copy-text="${escapeHtml(provider.api.base_url)}" aria-label="کپی Base URL"><span class="copy-text">کپی</span><span class="copy-status" role="status" aria-live="polite" hidden></span></button></dd></div>
          <div><dt>وضعیت ایران</dt><dd>${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</dd></div>
        </dl>
      </section>
      <section><h2>قابلیت‌ها</h2><div class="tag-list">${capabilities.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></section>
      <section><h2>مدل‌های شاخص</h2><p>${models.length ? escapeHtml(models.join("، ")) : "فهرست مدل‌ها پویا است؛ منبع رسمی را بررسی کنید."}</p></section>
      <section><h2>نکات مهم</h2><p>${escapeHtml(provider.free_tier.notes_fa)}</p>${provider.notes_fa ? `<p>${escapeHtml(provider.notes_fa)}</p>` : ""}${provider.iran_access.notes_fa ? `<p>${escapeHtml(provider.iran_access.notes_fa)}</p>` : ""}</section>
      <section class="provider-sources"><h2>منابع بررسی</h2><ul>${sources.map((url) => `<li><a href="${escapeHtml(url)}" rel="nofollow noopener" target="_blank">${escapeHtml(url)}</a></li>`).join("")}</ul></section>
      <section><h2>APIهای مرتبط</h2><ul class="related-provider-links">${relatedProviders.map((item) => `<li><a href="../${item.id}/">${escapeHtml(item.name)}</a></li>`).join("")}</ul></section>
      <div class="hero-actions"><a class="button primary docs-link" href="${escapeHtml(provider.docs)}" rel="nofollow noopener" target="_blank">مشاهده مستندات</a><a class="button detail-secondary" href="../../#catalog">مقایسه با سایر APIها</a></div>
    </article>
  </main>
  <footer><p>داده‌های این صفحه از Catalog ماشین‌خوان پروژه تولید شده‌اند.</p><a href="../../catalog.json">دریافت Catalog JSON</a></footer>
  ${analyticsTags("../../")}
</body>
</html>`;
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await mkdir(path.join(destination, "assets"), { recursive: true });
await cp(socialAssetsSource, path.join(destination, "assets", "social"), { recursive: true });
await cp(catalogPath, path.join(destination, "catalog.json"));

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const providers = [...catalog.providers].sort((a, b) => a.name.localeCompare(b.name, "en"));
const sourceRevision = process.env.SOURCE_REVISION?.trim() || null;
const linksHtml = providers
  .map((provider) => `<li><a href="./providers/${provider.id}/">${escapeHtml(providerDirectoryLabel(provider.name))}</a><span>${escapeHtml(freeLabels[provider.free_tier.type] ?? provider.free_tier.type)}</span></li>`)
  .join("\n          ");
const indexPath = path.join(destination, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
indexHtml = indexHtml.replace('<link rel="stylesheet" href="./styles.css">', '<link rel="stylesheet" href="./styles.css">\n    <link rel="stylesheet" href="./seo.css">');
indexHtml = indexHtml.replace(
  /<!-- SEO_PROVIDER_LINKS_START -->[\s\S]*?<!-- SEO_PROVIDER_LINKS_END -->/,
  `<!-- SEO_PROVIDER_LINKS_START -->\n          ${linksHtml}\n          <!-- SEO_PROVIDER_LINKS_END -->`
);
indexHtml = indexHtml.replace(
  `<script defer data-domain="llm.persiantoolbox.ir" src="${plausibleScript}"></script>`,
  `${analyticsTags("./")}`
);
indexHtml = indexHtml.replace(
  "<!-- HREFLANG_TAGS -->",
  hreflangLinks([
    { hreflang: "fa-IR", href: canonicalOrigin + "/" },
    { hreflang: "en", href: canonicalOrigin + "/en/" },
    { hreflang: "x-default", href: canonicalOrigin + "/" }
  ])
);
indexHtml = indexHtml.replace(
  "<!-- LANGUAGE_SWITCHER -->",
  languageSwitcher("fa-IR", canonicalOrigin + "/en/")
);
await writeFile(indexPath, indexHtml);

const enIndexPath = path.join(destination, "en", "index.html");
let enIndexHtml = await readFile(enIndexPath, "utf8");
enIndexHtml = enIndexHtml.replace('<link rel="stylesheet" href="../styles.css">', '<link rel="stylesheet" href="../styles.css">\n    <link rel="stylesheet" href="../seo.css">');
enIndexHtml = enIndexHtml.replace(
  "<!-- HREFLANG_TAGS -->",
  hreflangLinks([
    { hreflang: "fa-IR", href: canonicalOrigin + "/" },
    { hreflang: "en", href: canonicalOrigin + "/en/" },
    { hreflang: "x-default", href: canonicalOrigin + "/" }
  ])
);
enIndexHtml = enIndexHtml.replace(
  "<!-- LANGUAGE_SWITCHER -->",
  languageSwitcher("en", canonicalOrigin + "/")
);
enIndexHtml = enIndexHtml.replace(
  '<script defer data-domain="llm.persiantoolbox.ir" src="../plausible.js"></script>',
  '<script defer src="../analytics.js"></script>\n  <script defer data-domain="llm.persiantoolbox.ir" src="../plausible.js"></script>'
);
await writeFile(enIndexPath, enIndexHtml);

const providersRoot = path.join(destination, "providers");
await mkdir(providersRoot, { recursive: true });
for (const [index, provider] of providers.entries()) {
  const related = [1, 2, 3].map((offset) => providers[(index + offset) % providers.length]);
  const providerDir = path.join(providersRoot, provider.id);
  await mkdir(providerDir, { recursive: true });
  await writeFile(path.join(providerDir, "index.html"), providerPage(provider, related));
}

const guideCount = await buildGuides(catalog);

const guides = [
  { slug: "best-free-llm-api-iran", title: "بهترین API رایگان LLM برای ایران" },
  { slug: "openai-compatible-api-without-card", title: "API سازگار با OpenAI بدون نیاز به کارت" },
  { slug: "free-coding-api", title: "API رایگان برای برنامه‌نویسی" },
  { slug: "free-embedding-api", title: "API رایگان Embedding" },
  { slug: "free-tier-vs-trial-vs-credit", title: "تفاوت Free Tier با Trial و Credit" },
  { slug: "openai-sdk-custom-base-url", title: "آموزش SDK OpenAI با Base URL سفارشی" }
].map((guide) => ({ ...guide, lastmod: catalog.last_updated }));

const sitemapUrls = [
  {
    loc: `${canonicalOrigin}/`,
    lastmod: catalog.last_updated,
    priority: "1.0",
    xhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: canonicalOrigin + "/" },
      { hreflang: "en", href: canonicalOrigin + "/en/" },
      { hreflang: "x-default", href: canonicalOrigin + "/" }
    ])
  },
  {
    loc: `${canonicalOrigin}/en/`,
    lastmod: catalog.last_updated,
    priority: "0.9",
    xhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: canonicalOrigin + "/" },
      { hreflang: "en", href: canonicalOrigin + "/en/" },
      { hreflang: "x-default", href: canonicalOrigin + "/" }
    ])
  },
  ...providers.map((provider) => ({
    loc: `${canonicalOrigin}/providers/${provider.id}/`,
    lastmod: provider.verification.last_checked,
    priority: "0.8",
    xhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: `${canonicalOrigin}/providers/${provider.id}/` },
      { hreflang: "x-default", href: `${canonicalOrigin}/providers/${provider.id}/` }
    ])
  })),
  ...guides.map((guide) => ({
    loc: `${canonicalOrigin}/guides/${guide.slug}/`,
    lastmod: guide.lastmod,
    priority: "0.9",
    xhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: `${canonicalOrigin}/guides/${guide.slug}/` },
      { hreflang: "x-default", href: `${canonicalOrigin}/guides/${guide.slug}/` }
    ])
  }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapUrls.map((item) => `  <url>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n    <priority>${item.priority}</priority>\n${item.xhtml}\n  </url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(destination, "sitemap.xml"), sitemap);
await writeFile(path.join(destination, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${canonicalOrigin}/sitemap.xml\n`);
const llmsText = `# Awesome Free LLM APIs IR\n\nPersian-first catalog of free LLM APIs with quotas, OpenAI compatibility, official sources and Iran-access evidence.\n\nCanonical website: ${canonicalOrigin}/\nEnglish homepage: ${canonicalOrigin}/en/\nMachine-readable catalog: ${canonicalOrigin}/catalog.json\nGitHub repository: https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir\nProvider pages: ${providers.map((provider) => `${canonicalOrigin}/providers/${provider.id}/`).join(" ")}\nGuide pages: ${guides.map((guide) => `${canonicalOrigin}/guides/${guide.slug}/`).join(" ")}\n`;
await writeFile(path.join(destination, "llms.txt"), llmsText);
await writeFile(
  path.join(destination, "build-meta.json"),
  `${JSON.stringify({ schema_version: "1.1.0", source_revision: sourceRevision, catalog_last_updated: catalog.last_updated, provider_count: catalog.provider_count, provider_page_count: providers.length, guide_page_count: guideCount }, null, 2)}\n`
);
let enGuideCount = 0;
const enBuild = spawnSync(process.execPath, [path.join(root, "scripts/build-english-content.mjs")], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "inherit", "inherit"]
});
if (enBuild.status !== 0) process.exit(enBuild.status);
const enMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));
enGuideCount = enMeta.english_article_count ?? 0;

console.log(`Built static site with ${catalog.provider_count} providers, ${providers.length} provider pages, ${guideCount} Persian guide pages, and ${enGuideCount} English guide pages in .site-dist/.`);
