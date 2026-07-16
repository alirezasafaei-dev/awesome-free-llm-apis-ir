import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const catalogPath = path.join(root, "catalog.json");
const destination = path.join(root, ".site-dist");
const guidesDir = path.join(destination, "guides");
const canonicalOrigin = "https://llm.persiantoolbox.ir";

const guides = [
  {
    slug: "best-free-llm-api-iran",
    title: "بهترین API رایگان LLM برای ایران | مقایسه ۲۲ سرویس",
    description: " مقایسه جامع ۲۲ API رایگان هوش مصنوعی برای توسعه‌دهندگان ایرانی: سهمیه، مدل‌ها، سازگاری OpenAI و وضعیت دسترسی مستقیم از ایران.",
    h1: "بهترین API رایگان LLM برای ایران",
    content: (catalog) => {
      const tableRows = catalog.providers.slice(0, 10).map(p => 
        `<tr><td><a href="../providers/${p.id}/">${p.name}</a></td><td>${p.free_tier.type === 'permanent_allowance' ? 'دائمی' : 'آزمایشی'}</td><td>${p.iran_access.status === 'verified_working' ? '✅ مستقیم' : p.iran_access.status === 'verified_blocked' ? '❌ مسدود' : '⚠️ نامشخص'}</td></tr>`
      ).join("\n");
      return `
        <p>انتخاب بهترین API رایگان LLM برای توسعه‌دهندگان ایرانی نیاز به مقایسه دقیق سهمیه‌ها، مدل‌ها و وضعیت دسترسی دارد. در این صفحه، ۲۲ سرویس موجود در کاتالوگ ما را مقایسه می‌کنیم.</p>
        <h2>جدول مقایسه ۱۰ سرویس برتر</h2>
        <table>
          <thead><tr><th>سرویس</th><th>نوع سهمیه</th><th>وضعیت ایران</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <p>برای مشاهده جزئیات کامل هر سرویس، روی نام آن در جدول بالا کلیک کنید. همچنین می‌توانید کاتالوگ کامل را به صورت ماشین‌خوان از <a href="../catalog.json">اینجا</a> دریافت کنید.</p>
      `;
    }
  },
  {
    slug: "openai-compatible-api-without-card",
    title: "API سازگار با OpenAI بدون نیاز به کارت اعتباری",
    description: "فهرست APIهای رایگان LLM که با SDK OpenAI سازگار هستند و نیازی به وارد کردن کارت اعتباری ندارند.",
    h1: "API سازگار با OpenAI بدون نیاز به کارت",
    content: (catalog) => {
      const compatible = catalog.providers.filter(p => p.api.openai_compatible && !p.free_tier.requires_payment_method);
      const list = compatible.map(p => `<li><a href="../providers/${p.id}/">${p.name}</a>: ${p.free_tier.notes_fa}</li>`).join("\n");
      return `
        <p>بسیاری از توسعه‌دهندگان به دنبال APIهایی هستند که با کتابخانه‌های استاندارد OpenAI (مانند openai-python یا openai-node) کار کنند اما نیازی به وارد کردن کارت اعتباری نداشته باشند.</p>
        <h2>فهرست سرویس‌های سازگار بدون کارت</h2>
        <ul>${list}</ul>
        <p>برای استفاده از این سرویس‌ها، کافی است مقدار <code>base_url</code> را در تنظیمات SDK OpenAI تغییر دهید.</p>
      `;
    }
  },
  {
    slug: "free-coding-api",
    title: "API رایگان برای برنامه‌نویسی و کد نویسی با هوش مصنوعی",
    description: "بهترین APIهای رایگان برای تولید کد، دیباگ و توضیح کد با استفاده از مدل‌های زبانی پیشرفته.",
    h1: "API رایگان برای برنامه‌نویسی",
    content: (catalog) => {
      const coding = catalog.providers.filter(p => p.capabilities.includes('code_generation') || p.name.includes('Code') || p.models?.notable?.some(m => m.includes('code')));
      const list = coding.length ? coding.map(p => `<li><a href="../providers/${p.id}/">${p.name}</a></li>`).join("\n") : catalog.providers.slice(0, 5).map(p => `<li><a href="../providers/${p.id}/">${p.name}</a></li>`).join("\n");
      return `
        <p>استفاده از هوش مصنوعی برای برنامه‌نویسی رایگان‌تر از همیشه شده است. بسیاری از ارائه‌دهندگان API مدل‌هایی با توانایی بالا در تولید کد ارائه می‌دهند.</p>
        <h2>سرویس‌های پیشنهادی</h2>
        <ul>${list}</ul>
      `;
    }
  },
  {
    slug: "free-embedding-api",
    title: "API رایگان Embedding برای جستجوی معنایی",
    description: "معرفی APIهای رایگان برای تبدیل متن به بردار (Embedding) و استفاده در پروژه‌های RAG و جستجوی معنایی.",
    h1: "API رایگان Embedding",
    content: (catalog) => {
      const embedding = catalog.providers.filter(p => p.capabilities.includes('embeddings'));
      const list = embedding.map(p => `<li><a href="../providers/${p.id}/">${p.name}</a></li>`).join("\n");
      return `
        <p>Embedding یا تبدیل متن به بردارهای عددی، پایه و اساس سیستم‌های جستجوی معنایی و RAG است. خوشبختانه چندین سرویس رایگان این قابلیت را ارائه می‌دهند.</p>
        <h2>سرویس‌های موجود</h2>
        <ul>${list}</ul>
      `;
    }
  },
  {
    slug: "free-tier-vs-trial-vs-credit",
    title: "تفاوت Free Tier با Trial و Credit در APIهای LLM",
    description: "توضیح تفاوت سهمیه رایگان دائمی، دوره آزمایشی و اعتبار هدیه در APIهای هوش مصنوعی.",
    h1: "تفاوت Free Tier با Trial و Credit",
    content: () => `
      <p>در دنیای APIها، سه مدل رایج برای دسترسی رایگان وجود دارد که درک تفاوت آنها برای انتخاب بهترین سرویس ضروری است.</p>
      <h2>۱. Free Tier (سهمیه رایگان دائمی)</h2>
      <p>سرویسی که تا زمانی که از سقف مشخصی (مثلاً ۱۰۰۰ درخواست در روز) استفاده کنید، هزینه‌ای ندارد و این سقف ماهانه یا سالانه ریست نمی‌شود.</p>
      <h2>۲. Trial (دوره آزمایشی)</h2>
      <p>بودجه‌ای رایگان که برای مدت محدود (مثلاً ۳ ماه) فعال است و پس از آن نیاز به پرداخت دارد.</p>
      <h2>۳. Credit (اعتبار هدیه)</h2>
      <p>مبلغی مشخص (مثلاً ۵ دلار) که هنگام ثبت‌نام به حساب شما اضافه می‌شود و پس از اتمام آن، سرویس قطع می‌شود مگر اینکه حساب خود را شارژ کنید.</p>
    `
  },
  {
    slug: "openai-sdk-custom-base-url",
    title: "آموزش استفاده از SDK OpenAI با Base URL سفارشی",
    description: "نحوه تنظیم OpenAI Python و Node.js SDK برای اتصال به APIهای رایگان جایگزین مانند Groq و Cerebras.",
    h1: "آموزش SDK OpenAI با Base URL سفارشی",
    content: () => `
      <p>اکثر APIهای رایگان LLM از جمله Groq، Cerebras و SambaNova از فرمت درخواست‌های OpenAI پشتیبانی می‌کنند. این یعنی می‌توانید از همان کتابخانه‌هایی که برای OpenAI می‌شناسید استفاده کنید.</p>
      <h2>مثال پایتون</h2>
      <pre><code>from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.groq.com/openai/v1"
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "سلام!"}]
)
print(response.choices[0].message.content)</code></pre>
      <h2>مثال Node.js</h2>
      <pre><code>import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_API_KEY",
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "سلام!" }],
});
console.log(response.choices[0].message.content);</code></pre>
    `
  }
];

export async function buildGuides(catalog) {
  await mkdir(guidesDir, { recursive: true });
  for (const guide of guides) {
    const guideDir = path.join(guidesDir, guide.slug);
    await mkdir(guideDir, { recursive: true });
    
    const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="description" content="${guide.description}">
  <meta property="og:title" content="${guide.title}">
  <meta property="og:description" content="${guide.description}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:url" content="${canonicalOrigin}/guides/${guide.slug}/">
  <link rel="canonical" href="${canonicalOrigin}/guides/${guide.slug}/">
  <link rel="stylesheet" href="../../styles.css">
  <link rel="stylesheet" href="../../seo.css">
  <title>${guide.title}</title>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${guide.h1}","description":"${guide.description}","inLanguage":"fa-IR","dateModified":"${new Date().toISOString().split('T')[0]}","mainEntityOfPage":"${canonicalOrigin}/guides/${guide.slug}/","author":{"@type":"Organization","name":"Awesome Free LLM APIs IR","url":"${canonicalOrigin}"}}</script>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="../../"><span class="brand-mark" aria-hidden="true">AI</span><span>Awesome Free LLM APIs IR</span></a>
    <nav aria-label="پیوندهای اصلی"><a href="../../#catalog">همه APIها</a><a href="https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir">GitHub</a></nav>
  </header>
  <main class="provider-page">
    <nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="../../">خانه</a><span>←</span><span>راهنما</span><span>←</span><span>${guide.h1}</span></nav>
    <article class="provider-detail">
      <h1>${guide.h1}</h1>
      <div class="freshness-badge">آخرین بررسی: ${new Date().toISOString().split('T')[0]}</div>
      <div class="guide-content">
        ${guide.content(catalog)}
      </div>
      <div class="hero-actions"><a class="button primary" href="../../#catalog">مشاهده همه APIها</a></div>
    </article>
  </main>
  <footer><p>داده‌های این صفحه از Catalog ماشین‌خوان پروژه تولید شده‌اند.</p><a href="../../catalog.json">دریافت Catalog JSON</a></footer>
</body>
</html>`;
    
    await writeFile(path.join(guideDir, "index.html"), html);
  }
  return guides.length;
}
