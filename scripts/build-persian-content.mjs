import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { hreflangLinks, languageSwitcher, sitemapXhtmlLinks, getTranslationPair, resolveUrl, canonicalOrigin } from "./locales.mjs";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const destination = path.join(root, ".site-dist");
const guidesDir = path.join(destination, "guides");
const organizationId = `${canonicalOrigin}/#organization`;
const repositoryUrl = "https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir";
const reportUrl = `${repositoryUrl}/issues/new?template=iran-access-report.yml`;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseFrontmatter(source, filename) {
  if (!source.startsWith("---\n")) throw new Error(`${filename}: missing frontmatter`);
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filename}: unterminated frontmatter`);

  const metadata = {};
  for (const line of source.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):\s*["']?(.*?)["']?\s*$/);
    if (match) metadata[match[1]] = match[2];
  }

  return { metadata, body: source.slice(end + 5).trim() };
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return html;
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function markdownToHtml(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index >= lines.length) throw new Error("Unterminated Markdown code fence");
      index += 1;
      output.push(`<pre><code class="language-${escapeHtml(fence[1])}">${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 1 && output.length === 0) {
        index += 1;
        continue;
      }
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      index + 1 < lines.length &&
      /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1])
    ) {
      const headers = tableCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      output.push(`<div class="table-wrapper"><table><thead><tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^-\s+/, ""))}</li>`);
        index += 1;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(`<li>${renderInline(lines[index].replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return output.join("\n");
}

function articlePage(article) {
  const { metadata, body } = article;
  const canonicalUrl = metadata.canonical_target;
  const title = metadata.title;
  const description = metadata.description;
  const translationKey = metadata.translation_key;
  const pair = translationKey ? getTranslationPair(translationKey) : null;
  const enUrl = pair ? resolveUrl(pair.en) : null;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        "name": "Awesome Free LLM APIs IR",
        "url": canonicalOrigin,
        "sameAs": [repositoryUrl]
      },
      {
        "@type": "TechArticle",
        headline: title,
        description,
        inLanguage: "fa-IR",
        dateModified: metadata.updated_at,
        mainEntityOfPage: canonicalUrl,
        author: { "@id": organizationId },
        publisher: { "@id": organizationId }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "خانه", item: `${canonicalOrigin}/` },
          { "@type": "ListItem", position: 2, name: "راهنماهای فارسی", item: `${canonicalOrigin}/#persian-guides` },
          { "@type": "ListItem", position: 3, name: title, item: canonicalUrl }
        ]
      }
    ]
  };

  const hreflang = pair
    ? hreflangLinks([
        { hreflang: "fa-IR", href: canonicalUrl },
        { hreflang: "en", href: enUrl },
        { hreflang: "x-default", href: canonicalUrl }
      ])
    : hreflangLinks([
        { hreflang: "fa-IR", href: canonicalUrl },
        { hreflang: "x-default", href: canonicalUrl }
      ]);

  const switcher = pair ? languageSwitcher("fa-IR", enUrl) : "";

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
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  ${hreflang}
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../seo.css">
  <title>${escapeHtml(title)}</title>
  <script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>
</head>
<body data-page-type="guide">
  <a class="skip-link" href="#article-content">رفتن به محتوای اصلی</a>
  <header class="topbar">
    <a class="brand" href="../../" aria-label="Awesome Free LLM APIs IR"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56 38V166C56 188.091 73.909 206 96 206H202" stroke="#2563EB" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M112 116L158 80M112 116L174 140M112 116L126 170" stroke="#06B6D4" stroke-width="8" stroke-linecap="round"/><circle cx="112" cy="116" r="15" fill="#06B6D4"/><circle cx="158" cy="80" r="13" fill="#06B6D4"/><circle cx="174" cy="140" r="13" fill="#06B6D4"/><circle cx="126" cy="170" r="13" fill="#06B6D4"/></svg></span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="پیوندهای اصلی"><a href="../../#persian-guides">راهنماهای فارسی</a><a href="../../#catalog">همه APIها</a><a href="${repositoryUrl}">GitHub</a>${switcher ? `\n        ${switcher}` : ""}</nav>
  </header>
  <main class="provider-page">
    <nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="../../">خانه</a><span>←</span><span>راهنما</span><span>←</span><span>${escapeHtml(title)}</span></nav>
    <article class="provider-detail" id="article-content" data-guide-slug="${escapeHtml(metadata.slug)}">
      <h1>${escapeHtml(title)}</h1>
      <p class="provider-lead">${escapeHtml(description)}</p>
      <div class="freshness-badge">آخرین بازبینی: ${escapeHtml(metadata.updated_at)}</div>
      <div class="guide-content">${markdownToHtml(body)}</div>
      <aside class="guide-cta">
        <h2>به دقیق‌ترشدن داده برای کاربران ایران کمک کنید</h2>
        <p>اگر یک Provider را از ایران تست کرده‌اید، نتیجه تاریخ‌دار را بدون API Key، Cookie یا اطلاعات شخصی ثبت کنید.</p>
        <div class="hero-actions"><a class="button primary" href="${reportUrl}">ثبت گزارش دسترسی ایران</a><a class="button detail-secondary" href="${repositoryUrl}">مشاهده GitHub</a></div>
      </aside>
      <div class="hero-actions"><a class="button primary" href="../../#catalog">مقایسه همه APIها</a><a class="button detail-secondary" href="../../#persian-guides">راهنماهای فارسی</a></div>
    </article>
  </main>
  <footer><p>اطلاعات سهمیه و دسترسی را با Catalog تاریخ‌دار و منابع رسمی بررسی کنید.</p><a href="../../catalog.json">دریافت Catalog JSON</a></footer>
  <script defer src="../../analytics.js"></script>
  <script defer data-domain="llm.persiantoolbox.ir" src="../../plausible.js"></script>
</body>
</html>`;
}

const entries = (await readdir(contentDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();

const articles = [];
for (const filename of entries) {
  const source = await readFile(path.join(contentDir, filename), "utf8");
  const article = parseFrontmatter(source, filename);
  if (article.metadata.status !== "READY_FOR_SITE") continue;
  articles.push(article);
}

if (!articles.length) throw new Error("No READY_FOR_SITE Persian articles found");

await mkdir(guidesDir, { recursive: true });
for (const article of articles) {
  const articleDir = path.join(guidesDir, article.metadata.slug);
  await mkdir(articleDir, { recursive: true });
  await writeFile(path.join(articleDir, "index.html"), articlePage(article));
}

const articleUrls = articles.map((article) => article.metadata.canonical_target);
const sitemapPath = path.join(destination, "sitemap.xml");
let sitemap = await readFile(sitemapPath, "utf8");
const sitemapEntries = articles
  .filter((article) => !sitemap.includes(`<loc>${article.metadata.canonical_target}</loc>`))
  .map((article) => {
    const pair = article.metadata.translation_key ? getTranslationPair(article.metadata.translation_key) : null;
    const xhtml = pair
      ? sitemapXhtmlLinks([
          { hreflang: "fa-IR", href: article.metadata.canonical_target },
          { hreflang: "en", href: resolveUrl(pair.en) },
          { hreflang: "x-default", href: article.metadata.canonical_target }
        ])
      : sitemapXhtmlLinks([
          { hreflang: "fa-IR", href: article.metadata.canonical_target },
          { hreflang: "x-default", href: article.metadata.canonical_target }
        ]);
    return `  <url>\n    <loc>${article.metadata.canonical_target}</loc>\n    <lastmod>${article.metadata.updated_at}</lastmod>\n    <priority>0.9</priority>\n${xhtml}\n  </url>`;
  })
  .join("\n");
if (sitemapEntries) sitemap = sitemap.replace("</urlset>", `${sitemapEntries}\n</urlset>`);
await writeFile(sitemapPath, sitemap);

const llmsPath = path.join(destination, "llms.txt");
let llmsText = await readFile(llmsPath, "utf8");
const articleLine = `Persian article pages: ${articleUrls.join(" ")}`;
if (!llmsText.includes("Persian article pages:")) llmsText += `${articleLine}\n`;
await writeFile(llmsPath, llmsText);

const indexPath = path.join(destination, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
if (!indexHtml.includes('id="persian-guides"')) {
  const cards = articles.map((article) => `<article><h3><a href="./guides/${escapeHtml(article.metadata.slug)}/">${escapeHtml(article.metadata.title)}</a></h3><p>${escapeHtml(article.metadata.description)}</p></article>`).join("\n          ");
  const section = `      <section id="persian-guides" class="seo-intro" aria-labelledby="persian-guides-title">
        <p class="eyebrow">آموزش‌های تخصصی فارسی</p>
        <h2 id="persian-guides-title">از انتخاب API تا ساخت پروژه و رفع خطا</h2>
        <p>راهنماهای عملی برای توسعه‌دهندگان فارسی‌زبان؛ همراه با کد امن، وضعیت دسترسی ایران و مسیر مشارکت در GitHub.</p>
        <div class="seo-guide-grid">
          ${cards}
        </div>
      </section>\n\n`;
  const marker = '      <section id="guide" class="seo-intro" aria-labelledby="guide-title">';
  if (!indexHtml.includes(marker)) throw new Error("Homepage guide marker not found");
  indexHtml = indexHtml.replace(marker, section + marker);
}
await writeFile(indexPath, indexHtml);

const metaPath = path.join(destination, "build-meta.json");
const buildMeta = JSON.parse(await readFile(metaPath, "utf8"));
buildMeta.guide_page_count = Number(buildMeta.guide_page_count ?? 0) + articles.length;
buildMeta.persian_article_count = articles.length;
await writeFile(metaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

console.log(`Built ${articles.length} Persian article pages and added them to sitemap, llms.txt, homepage and build metadata.`);
