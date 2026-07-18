import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { hreflangLinks, sitemapXhtmlLinks } from "./locales.mjs";

const root = process.cwd();
const contentDir = path.join(root, "content", "en");
const destination = path.join(root, ".site-dist");
const guidesDir = path.join(destination, "guides", "en");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
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
        inLanguage: "en-US",
        dateModified: metadata.updated_at,
        mainEntityOfPage: canonicalUrl,
        author: { "@id": organizationId },
        publisher: { "@id": organizationId }
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${canonicalOrigin}/` },
          { "@type": "ListItem", position: 2, name: "English Guides", item: `${canonicalOrigin}/#english-guides` },
          { "@type": "ListItem", position: 3, name: title, item: canonicalUrl }
        ]
      }
    ]
  };

  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="en_US">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  ${hreflangLinks([
    { hreflang: "en", href: canonicalUrl },
    { hreflang: "x-default", href: canonicalUrl }
  ])}
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../seo.css">
  <title>${escapeHtml(title)}</title>
  <script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>
</head>
<body data-page-type="guide">
  <a class="skip-link" href="#article-content">Skip to main content</a>
  <header class="topbar">
    <a class="brand" href="../../"><span class="brand-mark" aria-hidden="true">AI</span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="Main links"><a href="../../#english-guides">English Guides</a><a href="../../#catalog">All APIs</a><a href="${repositoryUrl}">GitHub</a></nav>
  </header>
  <main class="provider-page">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="../../">Home</a><span>›</span><span>English Guide</span><span>›</span><span>${escapeHtml(title)}</span></nav>
    <article class="provider-detail" id="article-content" data-guide-slug="${escapeHtml(metadata.slug)}">
      <h1>${escapeHtml(title)}</h1>
      <p class="provider-lead">${escapeHtml(description)}</p>
      <div class="freshness-badge">Last reviewed: ${escapeHtml(metadata.updated_at)}</div>
      <div class="guide-content">${markdownToHtml(body)}</div>
      <aside class="guide-cta">
        <h2>Help improve Iran-access data</h2>
        <p>If you tested a provider from Iran, submit a dated result without API keys, cookies, or personal information.</p>
        <div class="hero-actions"><a class="button primary" href="${reportUrl}">Submit Iran Access Report</a><a class="button detail-secondary" href="${repositoryUrl}">View on GitHub</a></div>
      </aside>
      <div class="hero-actions"><a class="button primary" href="../../#catalog">Compare all APIs</a><a class="button detail-secondary" href="../../#english-guides">English Guides</a></div>
    </article>
  </main>
  <footer><p>Quota and access information should be verified against the timestamped catalog and official sources.</p><a href="../../catalog.json">Download Catalog JSON</a></footer>
  <script defer src="./analytics.js"></script>
  <script defer data-domain="llm.persiantoolbox.ir" src="./plausible.js"></script>
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

if (!articles.length) throw new Error("No READY_FOR_SITE English articles found");

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
    const xhtml = sitemapXhtmlLinks([
      { hreflang: "en", href: article.metadata.canonical_target },
      { hreflang: "x-default", href: article.metadata.canonical_target }
    ]);
    return `  <url>\n    <loc>${article.metadata.canonical_target}</loc>\n    <lastmod>${article.metadata.updated_at}</lastmod>\n    <priority>0.9</priority>\n${xhtml}\n  </url>`;
  })
  .join("\n");
if (sitemapEntries) sitemap = sitemap.replace("</urlset>", `${sitemapEntries}\n</urlset>`);
await writeFile(sitemapPath, sitemap);

const llmsPath = path.join(destination, "llms.txt");
let llmsText = await readFile(llmsPath, "utf8");
const articleLine = `English article pages: ${articleUrls.join(" ")}`;
if (!llmsText.includes("English article pages:")) llmsText += `${articleLine}\n`;
await writeFile(llmsPath, llmsText);

const indexPath = path.join(destination, "index.html");
let indexHtml = await readFile(indexPath, "utf8");
if (!indexHtml.includes('id="english-guides"')) {
  const cards = articles.map((article) => `<article><h3><a href="./guides/en/${escapeHtml(article.metadata.slug)}/">${escapeHtml(article.metadata.title)}</a></h3><p>${escapeHtml(article.metadata.description)}</p></article>`).join("\n          ");
  const section = `      <section id="english-guides" class="seo-intro" aria-labelledby="english-guides-title">
        <p class="eyebrow">English Tutorials</p>
        <h2 id="english-guides-title">Free LLM API Guides for English Readers</h2>
        <p>Practical guides for using free LLM APIs from Iran: selection, secure signup, error handling, rate limiting, and code examples in Python and Node.js.</p>
        <div class="seo-guide-grid">
          ${cards}
        </div>
      </section>\n\n`;
  const persianMarker = '      <section id="guide" class="seo-intro" aria-labelledby="guide-title">';
  if (!indexHtml.includes(persianMarker)) throw new Error("Homepage guide marker not found for English section insertion");
  indexHtml = indexHtml.replace(persianMarker, section + persianMarker);
}
await writeFile(indexPath, indexHtml);

const metaPath = path.join(destination, "build-meta.json");
const buildMeta = JSON.parse(await readFile(metaPath, "utf8"));
buildMeta.guide_page_count = Number(buildMeta.guide_page_count ?? 0) + articles.length;
buildMeta.english_article_count = articles.length;
await writeFile(metaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

console.log(`Built ${articles.length} English article pages and added them to sitemap, llms.txt, homepage and build metadata.`);
