import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const guidesDir = path.join(destination, "guides");
const canonicalOrigin = "https://llm.persiantoolbox.ir";
const organizationId = `${canonicalOrigin}/#organization`;
const plausibleScript = "./plausible.js";

const freeLabels = {
  permanent_allowance: "سهمیه رایگان دائمی",
  free_models: "مدل‌های رایگان",
  monthly_credit: "اعتبار رایگان ماهانه",
  trial: "دوره آزمایشی",
  unknown: "نامشخص"
};

const accessLabels = {
  verified_working: "✅ مستقیم تست‌شده",
  verified_working_vpn: "🛡️ با VPN تست‌شده",
  direct_blocked_vpn_working: "🛡️ مستقیم مسدود / VPN موفق",
  verified_blocked: "⛔ محدودیت جغرافیایی تأییدشده",
  officially_unsupported: "🚫 پشتیبانی‌نشده رسمی",
  intermittent: "⚠️ ناپایدار",
  signup_blocked: "🧾 مانع ثبت‌نام",
  unknown: "❔ نامشخص"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function providerLink(provider) {
  return `<a href="../../providers/${provider.id}/">${escapeHtml(provider.name)}</a>`;
}

function analyticsTags() {
  return `<script defer src="../../analytics.js"></script>\n  <script defer data-domain="llm.persiantoolbox.ir" src="${plausibleScript}"></script>`;
}

const guides = [
  {
    slug: "best-free-llm-api-iran",
    title: "بهترین API رایگان LLM برای ایران | مقایسه سهمیه و دسترسی",
    description: "مقایسه APIهای رایگان هوش مصنوعی برای توسعه‌دهندگان ایرانی بر اساس نوع سهمیه، سازگاری OpenAI، قابلیت‌ها و شواهد دسترسی از ایران.",
    h1: "راهنمای انتخاب API رایگان LLM برای ایران",
    content: (catalog) => {
      const ordered = [...catalog.providers].sort((a, b) => {
        const rank = { verified_working: 0, unknown: 1, signup_blocked: 2, verified_blocked: 3, officially_unsupported: 4 };
        return (rank[a.iran_access.status] ?? 9) - (rank[b.iran_access.status] ?? 9) || a.name.localeCompare(b.name, "en");
      });
      const tableRows = ordered.slice(0, 10).map((provider) =>
        `<tr><td>${providerLink(provider)}</td><td>${escapeHtml(freeLabels[provider.free_tier.type] ?? provider.free_tier.type)}</td><td>${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</td></tr>`
      ).join("\n");
      return `
        <p>کاتالوگ فعلی شامل ${catalog.provider_count.toLocaleString("fa-IR")} Provider است. انتخاب مناسب باید بر اساس نوع سهمیه، قابلیت موردنیاز، شرایط ثبت‌نام و شواهد تاریخ‌دار دسترسی انجام شود؛ پاسخ ساده یک Endpoint به‌تنهایی موفقیت اجرای مدل را ثابت نمی‌کند.</p>
        <h2>نمونه مقایسه ۱۰ سرویس</h2>
        <div class="table-wrapper"><table>
          <thead><tr><th>سرویس</th><th>نوع سهمیه</th><th>وضعیت ایران</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table></div>
        <p>جزئیات و منابع هر سرویس در صفحه اختصاصی آن قرار دارد. نسخه ماشین‌خوان کامل نیز از <a href="../../catalog.json">Catalog JSON</a> قابل دریافت است.</p>
      `;
    }
  },
  {
    slug: "openai-compatible-api-without-card",
    title: "API سازگار با OpenAI بدون نیاز به کارت بانکی",
    description: "فهرست APIهای LLM سازگار با OpenAI که در منابع بررسی‌شده نیاز به روش پرداخت ندارند؛ همراه با وضعیت دسترسی و صفحه جزئیات هر Provider.",
    h1: "API سازگار با OpenAI بدون نیاز به کارت بانکی",
    content: (catalog) => {
      const compatible = catalog.providers.filter((provider) => provider.api.openai_compatible && provider.free_tier.requires_payment_method === false);
      const list = compatible.map((provider) => `<li>${providerLink(provider)} — ${escapeHtml(freeLabels[provider.free_tier.type] ?? provider.free_tier.type)} — ${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</li>`).join("\n");
      return `
        <p>سازگاری با OpenAI به معنی امکان استفاده از ساختار درخواست و SDK مشابه با تغییر <code>base_url</code> است. نداشتن نیاز به کارت بانکی نیز مستقل از دسترسی شبکه یا امکان تکمیل ثبت‌نام بررسی می‌شود.</p>
        <h2>سرویس‌های دارای وضعیت پرداخت مشخص</h2>
        <ul>${list || "<li>در داده فعلی موردی با این شرایط ثبت نشده است.</li>"}</ul>
        <p>پیش از استفاده، صفحه Provider را برای تاریخ آخرین بررسی، محدودیت مصرف و وضعیت ایران کنترل کنید.</p>
      `;
    }
  },
  {
    slug: "free-coding-api",
    title: "API رایگان برای برنامه‌نویسی و Tool Calling",
    description: "مقایسه APIهای رایگان مناسب تولید کد، خروجی ساخت‌یافته و Tool Calling بر اساس قابلیت‌های ثبت‌شده در کاتالوگ.",
    h1: "API رایگان برای برنامه‌نویسی",
    content: (catalog) => {
      const coding = catalog.providers.filter((provider) =>
        provider.capabilities.includes("tool_calling") ||
        provider.capabilities.includes("structured_output") ||
        provider.models?.notable?.some((model) => /code|coder|codestral/i.test(model))
      );
      const list = coding.map((provider) => `<li>${providerLink(provider)} — ${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</li>`).join("\n");
      return `
        <p>برای ابزارهای برنامه‌نویسی، فقط کیفیت مدل مهم نیست؛ Tool Calling، خروجی ساخت‌یافته، محدودیت درخواست و پایداری Endpoint نیز اهمیت دارند.</p>
        <h2>Providerهای دارای قابلیت مرتبط</h2>
        <ul>${list || "<li>در داده فعلی Provider واجد شرایط ثبت نشده است.</li>"}</ul>
      `;
    }
  },
  {
    slug: "free-embedding-api",
    title: "API رایگان Embedding برای RAG و جست‌وجوی معنایی",
    description: "معرفی APIهای رایگان دارای قابلیت Embedding برای پروژه‌های RAG، بازیابی متن و جست‌وجوی معنایی.",
    h1: "API رایگان Embedding",
    content: (catalog) => {
      const embedding = catalog.providers.filter((provider) => provider.capabilities.includes("embeddings"));
      const list = embedding.map((provider) => `<li>${providerLink(provider)} — ${escapeHtml(accessLabels[provider.iran_access.status] ?? provider.iran_access.status)}</li>`).join("\n");
      return `
        <p>Embedding متن را به بردار عددی تبدیل می‌کند و در RAG، خوشه‌بندی و جست‌وجوی معنایی کاربرد دارد. پیش از انتخاب، ابعاد بردار، مدل، محدودیت توکن و سیاست نگهداری داده را در مستندات رسمی بررسی کنید.</p>
        <h2>سرویس‌های ثبت‌شده با قابلیت Embedding</h2>
        <ul>${list || "<li>در داده فعلی Provider دارای Embedding ثبت نشده است.</li>"}</ul>
      `;
    }
  },
  {
    slug: "free-tier-vs-trial-vs-credit",
    title: "تفاوت Free Tier، Trial و Credit در APIهای LLM",
    description: "توضیح تفاوت سهمیه رایگان مستمر، دوره آزمایشی و اعتبار هدیه در APIهای هوش مصنوعی و نکات انتخاب هرکدام.",
    h1: "تفاوت Free Tier با Trial و Credit",
    content: () => `
      <p>عبارت «رایگان» می‌تواند سه قرارداد کاملاً متفاوت را توصیف کند. برای جلوگیری از توقف ناگهانی پروژه، نوع دسترسی را پیش از پیاده‌سازی مشخص کنید.</p>
      <h2>۱. Free Tier یا سهمیه مستمر</h2>
      <p>مقداری از مصرف طبق سیاست جاری سرویس رایگان می‌ماند و معمولاً در یک بازه زمانی دوباره محاسبه می‌شود. سقف و شرایط ممکن است بدون تضمین دائمی تغییر کنند.</p>
      <h2>۲. Trial یا دوره آزمایشی</h2>
      <p>دسترسی محدود به زمان، اعتبار یا تعداد درخواست است و پس از پایان دوره ممکن است نیاز به ارتقای حساب داشته باشد.</p>
      <h2>۳. Credit یا اعتبار هدیه</h2>
      <p>یک موجودی پولی محدود است که می‌تواند یک‌باره یا دوره‌ای باشد. پس از مصرف اعتبار، ادامه سرویس به سیاست حساب و روش پرداخت وابسته است.</p>
      <p>کاتالوگ این مفاهیم را جدا ثبت می‌کند؛ با این حال همیشه منبع رسمی و تاریخ آخرین بررسی را کنترل کنید.</p>
    `
  },
  {
    slug: "openai-sdk-custom-base-url",
    title: "آموزش استفاده از OpenAI SDK با Base URL سفارشی",
    description: "نمونه امن Python و JavaScript برای اتصال OpenAI SDK به Providerهای سازگار با استفاده از متغیر محیطی و Base URL سفارشی.",
    h1: "آموزش OpenAI SDK با Base URL سفارشی",
    content: (catalog) => {
      const example = catalog.providers.find((provider) => provider.id === "mistral-ai") ?? catalog.providers.find((provider) => provider.api.openai_compatible);
      const baseUrl = example?.api.base_url ?? "https://provider.example/v1";
      const model = example?.models?.notable?.[0] ?? "MODEL_ID";
      return `
        <p>در Providerهای سازگار با OpenAI معمولاً با تغییر <code>base_url</code> و مدل می‌توان از همان SDK استفاده کرد. کلید را در کد یا Git ذخیره نکنید و آن را از متغیر محیطی بخوانید.</p>
        <h2>مثال Python</h2>
        <pre><code>import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url="${escapeHtml(baseUrl)}",
    timeout=30.0,
    max_retries=2,
)

response = client.chat.completions.create(
    model="${escapeHtml(model)}",
    messages=[{"role": "user", "content": "سلام!"}],
)
print(response.choices[0].message.content)</code></pre>
        <h2>مثال JavaScript</h2>
        <pre><code>import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: "${escapeHtml(baseUrl)}",
  timeout: 30_000,
  maxRetries: 2,
});

const response = await client.chat.completions.create({
  model: "${escapeHtml(model)}",
  messages: [{ role: "user", content: "سلام!" }],
});
console.log(response.choices[0].message.content);</code></pre>
        <p>مدل‌ها و شرایط حساب تغییر می‌کنند؛ صفحه ${example ? providerLink(example) : "Provider"} و مستندات رسمی را پیش از اجرا بررسی کنید.</p>
      `;
    }
  }
];

export async function buildGuides(catalog) {
  await mkdir(guidesDir, { recursive: true });
  for (const guide of guides) {
    const guideDir = path.join(guidesDir, guide.slug);
    await mkdir(guideDir, { recursive: true });
    const canonicalUrl = `${canonicalOrigin}/guides/${guide.slug}/`;
    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="description" content="${escapeHtml(guide.description)}">
  <meta property="og:title" content="${escapeHtml(guide.title)}">
  <meta property="og:description" content="${escapeHtml(guide.description)}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${canonicalOrigin}/assets/social/og-default.png">
  <link rel="canonical" href="${canonicalUrl}">
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../seo.css">
  <title>${escapeHtml(guide.title)}</title>
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": organizationId, "name": "Awesome Free LLM APIs IR", "url": canonicalOrigin, "sameAs": ["https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir"] },
    { "@type": "TechArticle", "headline": guide.h1, "description": guide.description, "inLanguage": "fa-IR", "dateModified": catalog.last_updated, "mainEntityOfPage": canonicalUrl, "author": { "@id": organizationId }, "publisher": { "@id": organizationId } },
    { "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "خانه", "item": `${canonicalOrigin}/` },
      { "@type": "ListItem", "position": 2, "name": "راهنماها", "item": `${canonicalOrigin}/#guide` },
      { "@type": "ListItem", "position": 3, "name": guide.h1, "item": canonicalUrl }
    ]}
  ]}).replaceAll("<", "\\u003c")}</script>
</head>
<body data-page-type="guide">
  <a class="skip-link" href="#guide-content">رفتن به محتوای اصلی</a>
  <header class="topbar">
    <a class="brand" href="../../" aria-label="Awesome Free LLM APIs IR"><span class="brand-mark" aria-hidden="true">AI</span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="پیوندهای اصلی"><a href="../../#catalog">همه APIها</a><a href="https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir">GitHub</a></nav>
  </header>
  <main class="provider-page">
    <nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="../../">خانه</a><span>←</span><span>راهنما</span><span>←</span><span>${escapeHtml(guide.h1)}</span></nav>
    <article class="provider-detail" id="guide-content">
      <h1>${escapeHtml(guide.h1)}</h1>
      <div class="freshness-badge">آخرین بررسی داده: ${escapeHtml(catalog.last_updated)}</div>
      <div class="guide-content">${guide.content(catalog)}</div>
      <div class="hero-actions"><a class="button primary" href="../../#catalog">مشاهده همه APIها</a></div>
    </article>
  </main>
  <footer><p>داده‌های این صفحه از Catalog ماشین‌خوان پروژه تولید شده‌اند.</p><a href="../../catalog.json">دریافت Catalog JSON</a></footer>
  ${analyticsTags()}
</body>
</html>`;
    await writeFile(path.join(guideDir, "index.html"), html);
  }
  return guides.length;
}
