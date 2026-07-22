import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const toolsDir = path.join(root, "data", "tools");
const catalogPath = path.join(root, "catalog-tools.json");
const destination = path.join(root, ".site-dist");
const toolsDestination = path.join(destination, "tools");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
const toolsUrl = `${canonicalOrigin}/tools/`;

const toolTypeLabels = {
  proxy: "Proxy API",
  session_bridge: "پل Session یا CLI",
  router: "مسیریاب مدل",
  monitoring_companion: "ابزار پایش",
  aggregator: "تجمیع‌کننده"
};
const deploymentLabels = {
  local: "اجرای محلی",
  self_hosted: "Self-hosted",
  hosted: "سرویس میزبانی‌شده"
};
const authLabels = {
  api_key: "API Key",
  oauth: "OAuth",
  cookie: "Cookie مرورگر",
  har: "HAR",
  browser_session: "Session مرورگر",
  none: "بدون احراز هویت"
};
const iranLabels = {
  compatible: "سازگار گزارش شده",
  requires_configuration: "نیازمند تنظیمات",
  requires_vpn: "نیازمند VPN",
  unknown: "نامشخص",
  blocked: "مسدود"
};
const riskLabels = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
  safe: "ایمن‌تر",
  moderate: "متوسط",
  risky: "پرریسک",
  dangerous: "خطرناک",
  stable: "پایدار",
  volatile: "نوسانی",
  experimental: "آزمایشی",
  archived: "آرشیوشده"
};
const riskRank = { low: 0, medium: 1, high: 2, critical: 3 };

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function isStale(tool, latestDate) {
  const checked = new Date(`${tool.verification.last_checked}T00:00:00Z`).getTime();
  const latest = new Date(`${latestDate}T00:00:00Z`).getTime();
  return (latest - checked) / 86_400_000 > tool.verification.stale_after_days;
}

function toolCard(tool, latestDate) {
  const terms = tool.risk?.terms ?? "unknown";
  const stability = tool.risk?.stability ?? "unknown";
  const safety = tool.risk?.credential_safety ?? "unknown";
  const description = tool.description_fa || tool.description;
  const install = tool.deployment.instructions_fa || tool.deployment.instructions || "برای روش نصب، README رسمی مخزن را بررسی کنید.";
  const upstreams = tool.capabilities.supported_upstreams ?? [];
  const features = tool.capabilities.features ?? [];
  const highRisk = ["high", "critical"].includes(terms) || ["risky", "dangerous"].includes(safety);
  const stale = isStale(tool, latestDate);

  return `<article class="tool-card" data-tool-id="${escapeHtml(tool.id)}" data-tool-name="${escapeHtml(tool.name.toLowerCase())}" data-tool-type="${escapeHtml(tool.tool_type)}" data-deployment="${escapeHtml(tool.deployment.type)}" data-risk="${escapeHtml(terms)}">
    <div class="tool-card-head">
      <div>
        <p class="tool-kind">${escapeHtml(toolTypeLabels[tool.tool_type] ?? tool.tool_type)}</p>
        <h2>${escapeHtml(tool.name)}</h2>
      </div>
      <span class="risk-badge risk-${escapeHtml(terms)}">ریسک Terms: ${escapeHtml(riskLabels[terms] ?? terms)}</span>
    </div>
    <p class="tool-description">${escapeHtml(description)}</p>
    ${highRisk ? `<div class="tool-warning" role="note"><strong>هشدار امنیتی و حساب:</strong> این ابزار از سطح احراز هویت یا Credential پرریسک استفاده می‌کند. پیش از اجرا، Terms سرویس بالادستی، محل ذخیره Cookie/Token و احتمال مسدودی حساب را بررسی کنید.</div>` : ""}
    <dl class="tool-facts">
      <div><dt>روش اجرا</dt><dd>${escapeHtml(deploymentLabels[tool.deployment.type] ?? tool.deployment.type)}</dd></div>
      <div><dt>احراز هویت</dt><dd>${escapeHtml(authLabels[tool.auth_surface.type] ?? tool.auth_surface.type)}</dd></div>
      <div><dt>محل Credential</dt><dd><code>${escapeHtml(tool.auth_surface.credential_storage)}</code></dd></div>
      <div><dt>سازگار با OpenAI</dt><dd>${tool.capabilities.openai_compatible ? "بله" : "خیر"}</dd></div>
      <div><dt>سازگار با Anthropic</dt><dd>${tool.capabilities.anthropic_compatible ? "بله" : "خیر"}</dd></div>
      <div><dt>وضعیت ایران</dt><dd>${escapeHtml(iranLabels[tool.iran_compatibility.status] ?? tool.iran_compatibility.status)}</dd></div>
      <div><dt>پایداری</dt><dd>${escapeHtml(riskLabels[stability] ?? stability)}</dd></div>
      <div><dt>امنیت Credential</dt><dd>${escapeHtml(riskLabels[safety] ?? safety)}</dd></div>
    </dl>
    <details class="tool-details">
      <summary>نصب، Upstreamها و نکات ریسک</summary>
      <div class="tool-details-body">
        <h3>روش نصب یا اجرا</h3>
        <div class="install-command"><code>${escapeHtml(install)}</code><button type="button" class="tool-copy" data-copy-text="${escapeHtml(install)}"><span>کپی</span><span class="copy-status" role="status" aria-live="polite"></span></button></div>
        <h3>Providerها و Upstreamهای اعلام‌شده</h3>
        <p>${upstreams.length ? escapeHtml(upstreams.join("، ")) : "در داده فعلی مشخص نشده است."}</p>
        ${features.length ? `<h3>قابلیت‌ها</h3><p>${escapeHtml(features.join("، "))}</p>` : ""}
        <h3>یادداشت احراز هویت</h3>
        <p>${escapeHtml(tool.auth_surface.notes_fa || "یادداشت تکمیلی ثبت نشده است.")}</p>
        <h3>وضعیت ایران</h3>
        <p>${escapeHtml(tool.iran_compatibility.notes_fa)}</p>
        <h3>ریسک و پایداری</h3>
        <p>${escapeHtml(tool.risk?.notes_fa || "پیش از استفاده، کد و Terms سرویس‌های بالادستی را مستقل بررسی کنید.")}</p>
      </div>
    </details>
    <div class="tool-card-actions">
      <a class="button primary tool-repository-link" data-tool-id="${escapeHtml(tool.id)}" href="${escapeHtml(tool.repository)}" target="_blank" rel="nofollow noopener">مشاهده مخزن و README</a>
      ${tool.homepage ? `<a class="button secondary" href="${escapeHtml(tool.homepage)}" target="_blank" rel="nofollow noopener">وب‌سایت ابزار</a>` : ""}
    </div>
    <p class="tool-verification">آخرین بررسی: ${escapeHtml(tool.verification.last_checked)} · سطح: ${escapeHtml(tool.verification.level)}${stale ? " · نیازمند بازبینی تازه" : ""}</p>
  </article>`;
}

const files = (await readdir(toolsDir)).filter((file) => file.endsWith(".json")).sort();
const tools = [];
for (const file of files) tools.push(JSON.parse(await readFile(path.join(toolsDir, file), "utf8")));
const latestDate = tools.map((tool) => tool.verification.last_checked).sort().at(-1);
tools.sort((a, b) => (riskRank[a.risk?.terms] ?? 9) - (riskRank[b.risk?.terms] ?? 9) || a.name.localeCompare(b.name, "en"));

const itemList = tools.map((tool, index) => ({
  "@type": "ListItem",
  position: index + 1,
  name: tool.name,
  url: tool.repository
}));

const page = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="description" content="کاتالوگ مستقل CLIها، Routerها، Proxyها و ابزارهای دارای دسترسی رایگان LLM؛ با روش نصب، نوع احراز هویت، ریسک Credential، پایداری و وضعیت ایران.">
  <meta property="og:title" content="CLI و ابزارهای رایگان LLM | نصب، ریسک و وضعیت ایران">
  <meta property="og:description" content="مقایسه ابزارهای محلی و Self-hosted هوش مصنوعی بدون مخلوط‌کردن آن‌ها با Providerهای رسمی.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:url" content="${toolsUrl}">
  <meta property="og:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <link rel="canonical" href="${toolsUrl}">
  <link rel="alternate" hreflang="fa-IR" href="${toolsUrl}">
  <link rel="alternate" hreflang="x-default" href="${toolsUrl}">
  <link rel="alternate" type="application/json" href="../catalog-tools.json" title="Machine-readable tools catalog">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="./tools.css">
  <title>CLI و ابزارهای رایگان LLM | نصب، ریسک و وضعیت ایران</title>
  <script type="application/ld+json">${jsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${toolsUrl}#page`,
        url: toolsUrl,
        name: "کاتالوگ CLI و ابزارهای رایگان LLM",
        description: "فهرست مستقل ابزارها، Routerها، Proxyها و Session bridgeها با اطلاعات ریسک و نصب.",
        inLanguage: "fa-IR",
        isPartOf: { "@id": `${canonicalOrigin}/#website` }
      },
      {
        "@type": "ItemList",
        "@id": `${toolsUrl}#list`,
        itemListElement: itemList
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "APIهای رایگان LLM", item: `${canonicalOrigin}/` },
          { "@type": "ListItem", position: 2, name: "CLI و ابزارها", item: toolsUrl }
        ]
      }
    ]
  })}</script>
</head>
<body data-page-type="tools-catalog">
  <a class="skip-link" href="#tools-content">رفتن به محتوای اصلی</a>
  <header class="topbar">
    <a class="brand" href="../" aria-label="صفحه اصلی"><span class="brand-mark" aria-hidden="true"><img src="../assets/logo-symbol.svg" alt="" width="40" height="40"></span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="پیوندهای اصلی"><a href="../api-finder/">انتخاب API رسمی</a><a href="../quick-start/">شروع سریع</a><a href="../#catalog">Providerها</a><a href="https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir">GitHub</a></nav>
  </header>
  <main id="tools-content" class="tools-shell">
    <section class="tools-hero" aria-labelledby="tools-title">
      <p class="eyebrow">کاتالوگ مستقل ابزارها</p>
      <h1 id="tools-title">CLI، Router و Proxyهای LLM را<br><span>با ریسک واقعی‌شان مقایسه کن.</span></h1>
      <p>این صفحه Provider رایگان رسمی نیست. ابزارهای محلی، Self-hosted، Session bridge و Routerها را جدا نمایش می‌دهد تا روش نصب، محل نگهداری Credential، ریسک Terms، پایداری و وضعیت ایران قبل از اجرا روشن باشد.</p>
      <div class="tools-trust">
        <span><strong>${tools.length}</strong> ابزار بررسی‌شده</span>
        <span><strong>${tools.filter((tool) => tool.capabilities.openai_compatible).length}</strong> سازگار با OpenAI</span>
        <span><strong>${tools.filter((tool) => ["high", "critical"].includes(tool.risk?.terms)).length}</strong> مورد با ریسک Terms بالا</span>
      </div>
    </section>

    <section class="tools-boundary" aria-labelledby="boundary-title">
      <h2 id="boundary-title">چرا این ابزارها از APIهای رسمی جدا هستند؟</h2>
      <p>برخی ابزارها با OAuth، Cookie، Session مرورگر یا Pool کلید کار می‌کنند. رایگان بودن اجرای ابزار به معنی مجاز بودن استفاده، امنیت Credential، پایداری Upstream یا رایگان بودن Provider اصلی نیست. گزینه‌های دارای Cookie و Session باید فقط با حساب آزمایشی، بررسی کد و پذیرش آگاهانه ریسک استفاده شوند.</p>
    </section>

    <section class="tools-controls" aria-label="فیلتر ابزارها">
      <label>جست‌وجوی نام ابزار<input id="tool-search" type="search" autocomplete="off" placeholder="مثلاً CLIProxyAPI"></label>
      <label>نوع ابزار<select id="tool-type"><option value="all">همه نوع‌ها</option>${Object.entries(toolTypeLabels).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("")}</select></label>
      <label>روش اجرا<select id="tool-deployment"><option value="all">همه روش‌ها</option>${Object.entries(deploymentLabels).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("")}</select></label>
      <label>حداکثر ریسک Terms<select id="tool-risk"><option value="all">همه سطوح</option><option value="low">فقط کم</option><option value="medium">کم و متوسط</option><option value="high">تا ریسک زیاد</option></select></label>
      <button id="tool-reset" type="button" class="button secondary">پاک‌کردن فیلترها</button>
    </section>

    <div class="tools-result-status" role="status" aria-live="polite"><strong id="tool-result-count">${tools.length}</strong> ابزار نمایش داده می‌شود.</div>
    <section id="tool-grid" class="tool-grid" aria-label="فهرست ابزارها">${tools.map((tool) => toolCard(tool, latestDate)).join("\n")}</section>
    <div id="tool-empty" class="tool-empty" hidden><strong>ابزاری مطابق فیلترها پیدا نشد.</strong><p>فیلترها را پاک کنید یا داده جدید را در GitHub پیشنهاد دهید.</p></div>

    <section class="tools-next-step">
      <div><h2>برای API رسمی و Free Tier آماده‌ای؟</h2><p>اگر به‌جای ابزار واسط، Provider رسمی و نمونه‌کد مستقیم می‌خواهی، از API Finder شروع کن.</p></div>
      <a class="button primary" href="../api-finder/">بازکردن API Finder</a>
    </section>
  </main>
  <footer><p>داده ابزارها از فایل‌های Schema-validated پروژه تولید شده‌اند و توصیه امنیتی یا تضمین سازگاری نیستند.</p><p><a href="../catalog-tools.json">Catalog JSON ابزارها</a> · <a href="https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new/choose">گزارش تغییر یا ریسک</a></p></footer>
  <script defer src="./tools.js"></script>
  <script defer src="../analytics.js"></script>
  <script defer data-domain="llm.persiantoolbox.ir" src="../plausible.js"></script>
</body>
</html>`;

await mkdir(toolsDestination, { recursive: true });
await writeFile(path.join(toolsDestination, "index.html"), page);
await cp(catalogPath, path.join(destination, "catalog-tools.json"));

const sitemapPath = path.join(destination, "sitemap.xml");
let sitemap = await readFile(sitemapPath, "utf8");
if (!sitemap.includes(`<loc>${toolsUrl}</loc>`)) {
  const entry = `  <url>\n    <loc>${toolsUrl}</loc>\n    <lastmod>${latestDate}</lastmod>\n    <priority>0.8</priority>\n      <xhtml:link rel="alternate" hreflang="fa-IR" href="${toolsUrl}"/>\n      <xhtml:link rel="alternate" hreflang="x-default" href="${toolsUrl}"/>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  await writeFile(sitemapPath, sitemap);
}

const llmsPath = path.join(destination, "llms.txt");
let llms = await readFile(llmsPath, "utf8");
if (!llms.includes(`Tools and CLI catalog: ${toolsUrl}`)) {
  llms += `Tools and CLI catalog: ${toolsUrl}\nTools machine-readable catalog: ${canonicalOrigin}/catalog-tools.json\n`;
  await writeFile(llmsPath, llms);
}

const buildMetaPath = path.join(destination, "build-meta.json");
const buildMeta = JSON.parse(await readFile(buildMetaPath, "utf8"));
buildMeta.static_product_pages = [...new Set([...(buildMeta.static_product_pages ?? []), "/tools/"])];
buildMeta.tool_count = tools.length;
await writeFile(buildMetaPath, `${JSON.stringify(buildMeta, null, 2)}\n`);

const homepagePath = path.join(destination, "index.html");
let homepage = await readFile(homepagePath, "utf8");
if (!homepage.includes('href="./tools/"')) {
  homepage = homepage.replace('<a href="#catalog">فهرست کامل</a>', '<a href="#catalog">فهرست کامل</a>\n        <a href="./tools/">CLI و ابزارها</a>');
  homepage = homepage.replace(
    "</main>",
    '  <section class="contribute"><div><p class="eyebrow">ابزارهای محلی و Self-hosted</p><h2>CLI، Router و Proxyهای LLM را جدا بررسی کن.</h2><p>روش نصب، ریسک Terms، امنیت Credential و وضعیت ایران را پیش از اجرا ببین.</p></div><a class="button primary" href="./tools/">مشاهده CLI و ابزارها</a></section>\n    </main>'
  );
  await writeFile(homepagePath, homepage);
}

console.log(`Built public tools catalog with ${tools.length} entries and registered /tools/.`);
