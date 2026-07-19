import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const siteDir = path.join(root, ".site-dist");
const canonicalOrigin = "https://llm.persiantoolbox.ir";

const englishHomeSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${canonicalOrigin}/#organization`,
      name: "Awesome Free LLM APIs IR",
      url: `${canonicalOrigin}/`,
      sameAs: ["https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir"]
    },
    {
      "@type": "WebSite",
      "@id": `${canonicalOrigin}/#website`,
      url: `${canonicalOrigin}/`,
      name: "Awesome Free LLM APIs IR",
      inLanguage: ["fa-IR", "en"],
      publisher: { "@id": `${canonicalOrigin}/#organization` }
    },
    {
      "@type": "CollectionPage",
      "@id": `${canonicalOrigin}/en/#webpage`,
      url: `${canonicalOrigin}/en/`,
      name: "Free LLM APIs for Iran | Quota & Access Comparison",
      description: "A verified, machine-readable catalog of free LLM APIs with quotas, payment requirements, capabilities and dated Iran-access evidence.",
      inLanguage: "en",
      isPartOf: { "@id": `${canonicalOrigin}/#website` },
      about: { "@type": "Thing", name: "Free large language model APIs" },
      publisher: { "@id": `${canonicalOrigin}/#organization` }
    }
  ]
};

const guideEnrichments = {
  "best-free-llm-api-iran": `
      <section data-seo-enrichment="best-free-llm-api-iran">
        <h2>چگونه این جدول را برای پروژه خود تفسیر کنیم؟</h2>
        <p>رتبه‌بندی ثابت برای همه پروژه‌ها وجود ندارد. ابتدا کاربرد را مشخص کنید: چت فارسی، تولید کد، پردازش دسته‌ای، Embedding یا Tool Calling. سپس محدودیت درخواست و توکن را با بار واقعی مقایسه کنید. Providerی که درخواست روزانه بیشتری دارد ممکن است به‌دلیل TPM پایین برای سندهای طولانی مناسب نباشد. همچنین Free Tier، Trial و اعتبار موقت قراردادهای متفاوتی هستند و نباید یکسان معرفی شوند.</p>
        <p>وضعیت ایران نیز باید لایه‌به‌لایه خوانده شود. بازشدن مستندات یا دریافت پاسخ 401 فقط Reachability را نشان می‌دهد؛ موفقیت واقعی زمانی ثبت می‌شود که ساخت حساب، صدور Credential، دسترسی به مدل و یک درخواست Inference معتبر با Evidence تاریخ‌دار بررسی شده باشد. مقدار «نامشخص» به معنی مثبت یا منفی نیست و تا وجود مدرک کافی باید حفظ شود.</p>
        <h2>چک‌لیست انتخاب نهایی</h2>
        <ol>
          <li>صفحه اختصاصی Provider و تاریخ آخرین بررسی را بخوانید.</li>
          <li>نیاز یا عدم نیاز به کارت بانکی و احراز هویت را از منبع رسمی کنترل کنید.</li>
          <li>RPM، RPD، TPM، Context و محدودیت هم‌زمانی را جدا بسنجید.</li>
          <li>کیفیت فارسی را با Promptهای واقعی پروژه و چند اجرای تکراری آزمایش کنید.</li>
          <li>کلید API را فقط در Backend یا Secret Manager نگه دارید.</li>
          <li>برای تغییر مدل، اختلال یا پایان سهمیه یک Provider جایگزین داشته باشید.</li>
        </ol>
        <p>برای تصمیم Production، یک تست کوتاه کافی نیست. نرخ خطا، زمان اولین توکن، Latency کامل، رفتار 429 و سیاست نگهداری داده را نیز ثبت کنید. این صفحه نقطه شروع مقایسه است و جای بررسی Terms و مستندات رسمی هر سرویس را نمی‌گیرد.</p>
      </section>`,
  "openai-compatible-api-without-card": `
      <section data-seo-enrichment="openai-compatible-api-without-card">
        <h2>پیش از انتخاب سرویس بدون کارت چه چیزهایی را بررسی کنیم؟</h2>
        <p>نداشتن الزام کارت بانکی فقط یکی از مراحل دسترسی است. ممکن است ثبت‌نام به شماره تلفن، حساب ابری، دعوت‌نامه یا تأیید هویت نیاز داشته باشد. همچنین سازگاری OpenAI معمولاً به Chat Completions محدود می‌شود و پشتیبانی از Streaming، Tool Calling، JSON Mode و Embedding باید جداگانه آزمایش شود.</p>
        <ul>
          <li>نوع دسترسی رایگان و زمان Reset سهمیه را مشخص کنید.</li>
          <li>Base URL، شناسه مدل و فرمت خطا را از مستندات رسمی بگیرید.</li>
          <li>کلید را در Frontend یا Repository قرار ندهید.</li>
          <li>وضعیت ایران را از Signup تا Inference واقعی بررسی کنید.</li>
          <li>برای تغییر شرایط Free Tier، Adapter و مسیر مهاجرت داشته باشید.</li>
        </ul>
        <p>شرایط Providerها پویاست. تاریخ Evidence و صفحه جزئیات سرویس را پیش از انتشار برنامه دوباره کنترل کنید و هیچ ادعای «بدون کارت» یا «قابل استفاده از ایران» را بدون مدرک تازه دائمی فرض نکنید.</p>
      </section>`
};

async function enrichEnglishHome() {
  const pagePath = path.join(siteDir, "en", "index.html");
  let html = await readFile(pagePath, "utf8");
  const marker = 'data-seo-enrichment="english-home-schema"';

  if (html.includes(marker)) return false;
  if (html.includes("application/ld+json")) {
    throw new Error("English homepage already has JSON-LD without the expected enrichment marker");
  }
  const anchor = "</head>";
  if (!html.includes(anchor)) throw new Error("English homepage is missing </head>");

  const script = `  <script type="application/ld+json" ${marker}>${JSON.stringify(englishHomeSchema).replaceAll("<", "\\u003c")}</script>\n`;
  html = html.replace(anchor, `${script}${anchor}`);
  await writeFile(pagePath, html, "utf8");
  return true;
}

async function enrichGuide(slug, section) {
  const pagePath = path.join(siteDir, "guides", slug, "index.html");
  let html = await readFile(pagePath, "utf8");
  const marker = `data-seo-enrichment="${slug}"`;

  if (html.includes(marker)) return false;
  const anchor = '      <div class="hero-actions"><a class="button primary" href="../../#catalog">مشاهده همه APIها</a></div>';
  if (!html.includes(anchor)) throw new Error(`${slug}: guide action anchor not found`);
  html = html.replace(anchor, `${section}\n${anchor}`);
  await writeFile(pagePath, html, "utf8");
  return true;
}

const englishHomeChanged = await enrichEnglishHome();
let guideChanges = 0;
for (const [slug, section] of Object.entries(guideEnrichments)) {
  if (await enrichGuide(slug, section)) guideChanges += 1;
}

console.log(`SEO enrichment complete: English home ${englishHomeChanged ? "updated" : "unchanged"}, ${guideChanges} guide(s) updated.`);
