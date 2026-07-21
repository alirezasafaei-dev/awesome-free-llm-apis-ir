import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { hreflangLinks } from "./locales.mjs";

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
  account_activation_blocked: "🔒 فعال‌سازی حساب مسدود",
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

function providerLimitText(provider) {
  const first = provider.free_tier?.limits?.[0];
  if (!first) return "وابسته به مدل یا حساب";
  const values = [];
  if (first.rpm != null) values.push(`${first.rpm} RPM`);
  if (first.rpd != null) values.push(`${first.rpd} RPD`);
  if (first.rph != null) values.push(`${first.rph} RPH`);
  if (first.tpm != null) values.push(`${first.tpm} TPM`);
  if (first.monthly_requests != null) values.push(`${first.monthly_requests} درخواست در ماه`);
  if (first.monthly_credit_usd != null) values.push(`$${first.monthly_credit_usd} اعتبار ماهانه`);
  return values.slice(0, 3).join(" · ") || "وابسته به مدل یا حساب";
}

function providerRows(providers) {
  return providers.map((provider) => `<tr>
    <td>${providerLink(provider)}</td>
    <td>${escapeHtml(freeLabels[provider.free_tier?.type] ?? provider.free_tier?.type ?? "نامشخص")}</td>
    <td>${escapeHtml(providerLimitText(provider))}</td>
    <td>${escapeHtml(accessLabels[provider.iran_access?.status] ?? provider.iran_access?.status ?? "نامشخص")}</td>
    <td>${escapeHtml(provider.verification?.last_checked ?? "ثبت نشده")}</td>
  </tr>`).join("\n");
}

function providerTable(providers, emptyMessage = "در داده فعلی Provider واجد شرایط ثبت نشده است.") {
  if (!providers.length) return `<p>${escapeHtml(emptyMessage)}</p>`;
  return `<div class="table-wrapper"><table>
    <thead><tr><th>Provider</th><th>نوع دسترسی رایگان</th><th>محدودیت ثبت‌شده</th><th>وضعیت ایران</th><th>آخرین بررسی</th></tr></thead>
    <tbody>${providerRows(providers)}</tbody>
  </table></div>`;
}

function officialSourceList(providers) {
  const unique = [...new Map(providers.map((provider) => [provider.id, provider])).values()];
  if (!unique.length) return "<li>برای این دسته هنوز منبع Provider در Catalog ثبت نشده است.</li>";
  return unique.map((provider) => `<li>${providerLink(provider)} — <a href="${escapeHtml(provider.docs)}" rel="nofollow noopener" target="_blank">مستندات رسمی</a> — تاریخ بررسی داده: ${escapeHtml(provider.verification?.last_checked ?? "ثبت نشده")}</li>`).join("\n");
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
        const rank = { verified_working: 0, unknown: 1, account_activation_blocked: 2, signup_blocked: 2, verified_blocked: 3, officially_unsupported: 4 };
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
      const example = coding.find((provider) => provider.api?.openai_compatible) ?? coding[0];
      const baseUrl = example?.api?.base_url ?? "https://provider.example/v1";
      const model = example?.models?.notable?.find((item) => /code|coder|codestral/i.test(item)) ?? example?.models?.notable?.[0] ?? "MODEL_ID";

      return `
        <h2>هدف این راهنما و نیت جست‌وجو</h2>
        <p>این صفحه برای توسعه‌دهنده‌ای است که یک API رایگان یا دارای سهمیه رایگان برای تولید کد، توضیح خطا، خروجی ساخت‌یافته یا Tool Calling می‌خواهد. وجود نام یک مدل کدنویسی به‌تنهایی کافی نیست؛ Endpoint، محدودیت مصرف، امکان ساخت حساب و وضعیت دسترسی از ایران باید جداگانه بررسی شوند.</p>

        <h2>مقایسه Providerهای دارای قابلیت مرتبط</h2>
        ${providerTable(coding)}

        <h2>مراحل ثبت‌نام امن</h2>
        <ol>
          <li>از جدول بالا وارد صفحه اختصاصی Provider شوید و تاریخ آخرین بررسی را کنترل کنید.</li>
          <li>فقط از لینک مستندات رسمی همان Provider وارد فرایند ثبت‌نام شوید.</li>
          <li>شرایط کشور، نیاز به روش پرداخت و محدودیت حساب رایگان را پیش از ساخت کلید بخوانید.</li>
          <li>کلید API را فقط در Secret Manager یا متغیر محیطی ذخیره کنید؛ آن را در Git، Screenshot یا پیام عمومی قرار ندهید.</li>
        </ol>

        <h2>نمونه اولین درخواست API</h2>
        <p>نمونه زیر فقط برای Provider سازگار با OpenAI است. Base URL و شناسه مدل باید با مستندات رسمی حساب شما تطبیق داده شود.</p>
        <pre><code>export LLM_API_KEY="..."
export LLM_BASE_URL="${escapeHtml(baseUrl)}"
export LLM_MODEL="${escapeHtml(model)}"

curl "$LLM_BASE_URL/chat/completions" \\
  -H "Authorization: Bearer $LLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "'"$LLM_MODEL"'",
    "messages": [{"role": "user", "content": "یک تابع امن برای اعتبارسنجی ایمیل بنویس"}],
    "temperature": 0.2
  }'</code></pre>
        <p>پاسخ موفق باید محتوای مدل را برگرداند؛ پاسخ ۲۰۰ از صفحه اصلی یا Endpoint عمومی، اجرای واقعی مدل را ثابت نمی‌کند.</p>

        <h2>سهمیه و محدودیت‌ها</h2>
        <p>برای ابزارهای Coding علاوه بر RPM و RPD، طول Context، سقف خروجی، محدودیت Tool Calling و مدل‌های مجاز حساب رایگان مهم‌اند. مقدارهای جدول از Catalog فعلی می‌آیند و ممکن است با سیاست Provider تغییر کنند؛ قبل از استفاده در CI یا محصول، منبع رسمی و تاریخ بررسی را دوباره کنترل کنید.</p>

        <h2>وضعیت ایران و شواهد دسترسی</h2>
        <p>برچسب‌های جدول بین «دسترسی مستقیم تست‌شده»، «VPN»، «مانع ثبت‌نام»، «محدودیت رسمی» و «نامشخص» تفاوت می‌گذارند. Reachability شبکه، ساخت حساب و درخواست واقعی مدل سه Evidence جدا هستند؛ هیچ‌کدام را از دیگری استنباط نکنید.</p>

        <h2>خطاهای رایج و رفع اشکال</h2>
        <ul>
          <li><strong>401:</strong> کلید اشتباه، منقضی یا متعلق به محیط دیگری است؛ Secret و Header را بررسی کنید.</li>
          <li><strong>403:</strong> محدودیت کشور، حساب، مدل یا Policy محتمل است؛ از تغییر مکرر Endpoint بدون خواندن پیام خطا خودداری کنید.</li>
          <li><strong>404 یا model not found:</strong> شناسه مدل یا Base URL با مستندات Provider هماهنگ نیست.</li>
          <li><strong>429:</strong> RPM، TPM یا سهمیه روزانه تمام شده است؛ Backoff نمایی و Queue اضافه کنید.</li>
          <li><strong>خروجی JSON نامعتبر:</strong> Structured Output را فقط وقتی استفاده کنید که Provider و مدل آن را صریحاً پشتیبانی کنند.</li>
        </ul>

        <h2>چه زمانی این گزینه مناسب نیست؟</h2>
        <p>اگر به SLA، نگهداری طولانی Context، اجرای پایدار Agent، پردازش داده حساس یا Tool Calling کاملاً سازگار نیاز دارید، صرفاً رایگان‌بودن معیار مناسبی نیست. برای Production باید هزینه خروج از سهمیه رایگان، سیاست داده، Failover و محدودیت مدل را نیز ارزیابی کنید.</p>

        <h2>منابع رسمی تاریخ‌دار</h2>
        <ul>${officialSourceList(coding)}</ul>

        <h2>مطالب مرتبط و پیوندهای داخلی</h2>
        <ul>
          <li><a href="../openai-sdk-custom-base-url/">استفاده از OpenAI SDK با Base URL سفارشی</a></li>
          <li><a href="../free-tier-vs-trial-vs-credit/">تفاوت Free Tier، Trial و Credit</a></li>
          <li><a href="../../#catalog">مقایسه کامل Providerها در Catalog</a></li>
          ${example ? `<li>صفحه جزئیات نمونه: ${providerLink(example)}</li>` : ""}
        </ul>
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
      const example = embedding[0];

      return `
        <h2>هدف این راهنما و نیت جست‌وجو</h2>
        <p>این راهنما برای انتخاب API Embedding در RAG، جست‌وجوی معنایی، خوشه‌بندی یا Deduplication است. برچسب <code>embeddings</code> در Catalog فقط وجود قابلیت را نشان می‌دهد؛ ابعاد بردار، مدل، سقف توکن، زبان‌های مناسب و سیاست نگهداری داده باید در مستندات رسمی بررسی شوند.</p>

        <h2>مقایسه سرویس‌های ثبت‌شده با قابلیت Embedding</h2>
        ${providerTable(embedding, "در داده فعلی Provider دارای Embedding ثبت نشده است.")}

        <h2>مراحل ثبت‌نام و آماده‌سازی</h2>
        <ol>
          <li>Provider را بر اساس قابلیت Embedding و وضعیت ایران از جدول انتخاب کنید.</li>
          <li>در مستندات رسمی، Endpoint دقیق، مدل Embedding، سقف ورودی و ابعاد خروجی را پیدا کنید.</li>
          <li>پس از ثبت‌نام، یک کلید محدود برای محیط آزمایشی بسازید و آن را در متغیر محیطی نگه دارید.</li>
          <li>پیش از Index کردن داده زیاد، چند متن فارسی و انگلیسی نماینده را آزمایش و کیفیت Retrieval را اندازه‌گیری کنید.</li>
        </ol>

        <h2>نمونه اولین درخواست API</h2>
        <p>چون مسیر و Schema میان Providerها متفاوت است، Endpoint و Model را مستقیماً از مستندات رسمی وارد کنید:</p>
        <pre><code>export EMBEDDING_API_KEY="..."
export EMBEDDING_ENDPOINT="https://provider.example/v1/embeddings"
export EMBEDDING_MODEL="MODEL_ID"

curl "$EMBEDDING_ENDPOINT" \\
  -H "Authorization: Bearer $EMBEDDING_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "'"$EMBEDDING_MODEL"'",
    "input": ["نمونه متن فارسی برای جست‌وجوی معنایی"]
  }'</code></pre>
        <p>در پاسخ، وجود آرایه عددی و تطابق تعداد خروجی‌ها با تعداد ورودی‌ها را بررسی کنید. ابعاد بردار را Hard-code نکنید مگر آنکه مدل ثابت و مستند باشد.</p>

        <h2>سهمیه و محدودیت‌ها</h2>
        <p>محدودیت درخواست، توکن هر Batch، تعداد ورودی، ابعاد بردار و حجم ذخیره‌سازی Vector DB هزینه واقعی را تعیین می‌کنند. سهمیه رایگان ممکن است برای Prototype کافی باشد اما برای Re-index کامل یا Corpus بزرگ کافی نباشد.</p>

        <h2>وضعیت ایران و شواهد دسترسی</h2>
        <p>وضعیت‌های Catalog بر اساس Evidence تاریخ‌دار ثبت می‌شوند. موفقیت Chat Completion لزوماً فعال‌بودن Endpoint Embedding را ثابت نمی‌کند؛ Endpoint قابلیت موردنظر باید جداگانه در حساب مجاز بررسی شود.</p>

        <h2>خطاهای رایج و رفع اشکال</h2>
        <ul>
          <li><strong>مدل نامعتبر:</strong> مدل Chat را به Endpoint Embedding فرستاده‌اید یا مدل برای حساب فعال نیست.</li>
          <li><strong>ورودی طولانی:</strong> متن را بر اساس Token و منطق Chunking تقسیم کنید، نه فقط تعداد کاراکتر.</li>
          <li><strong>429:</strong> Batch کوچک‌تر، Queue و Backoff اضافه کنید.</li>
          <li><strong>کیفیت Retrieval پایین:</strong> مدل، Chunk size، Overlap، زبان داده و معیار شباهت را جداگانه آزمایش کنید.</li>
          <li><strong>عدم تطابق ابعاد:</strong> Index قدیمی را با مدل یا ابعاد جدید مخلوط نکنید.</li>
        </ul>

        <h2>چه زمانی این گزینه مناسب نیست؟</h2>
        <p>اگر داده محرمانه است، محل پردازش و سیاست نگهداری روشن نیست، مدل برای زبان فارسی ارزیابی نشده یا تغییر مدل باعث Re-index پرهزینه می‌شود، انتخاب صرفاً بر اساس سهمیه رایگان ریسک بالایی دارد. در این شرایط مدل محلی یا قرارداد پایدارتر را بررسی کنید.</p>

        <h2>منابع رسمی تاریخ‌دار</h2>
        <ul>${officialSourceList(embedding)}</ul>

        <h2>مطالب مرتبط و پیوندهای داخلی</h2>
        <ul>
          <li><a href="../free-tier-vs-trial-vs-credit/">تفاوت سهمیه رایگان، Trial و Credit</a></li>
          <li><a href="../openai-sdk-custom-base-url/">تنظیم Base URL در SDK سازگار</a></li>
          <li><a href="../../#catalog">مشاهده Catalog کامل</a></li>
          ${example ? `<li>صفحه جزئیات نمونه: ${providerLink(example)}</li>` : ""}
        </ul>
      `;
    }
  },
  {
    slug: "free-tier-vs-trial-vs-credit",
    title: "تفاوت Free Tier، Trial و Credit در APIهای LLM",
    description: "توضیح تفاوت سهمیه رایگان مستمر، دوره آزمایشی و اعتبار هدیه در APIهای هوش مصنوعی و نکات انتخاب هرکدام.",
    h1: "تفاوت Free Tier با Trial و Credit",
    content: (catalog) => {
      const grouped = new Map();
      for (const provider of catalog.providers) {
        const type = provider.free_tier?.type ?? "unknown";
        if (!grouped.has(type)) grouped.set(type, []);
        grouped.get(type).push(provider);
      }
      const summaryRows = [...grouped.entries()].map(([type, providers]) => `<tr><td>${escapeHtml(freeLabels[type] ?? type)}</td><td>${providers.length.toLocaleString("fa-IR")}</td><td>${providers.slice(0, 4).map(providerLink).join("، ")}</td></tr>`).join("\n");
      const referencedProviders = [...grouped.values()].flatMap((providers) => providers.slice(0, 2));

      return `
        <h2>هدف این راهنما و نیت جست‌وجو</h2>
        <p>این صفحه تفاوت قراردادهای رایج «رایگان» را روشن می‌کند تا توسعه‌دهنده Trial کوتاه‌مدت را با سهمیه دائمی یا Credit پولی اشتباه نگیرد. نوع سهمیه، نیاز به روش پرداخت، تاریخ انقضا و محدودیت مدل باید جدا ثبت شوند.</p>

        <h2>تعریف Free Tier، Trial و Credit</h2>
        <h3>Free Tier یا سهمیه مستمر</h3>
        <p>مقداری از مصرف طبق سیاست جاری سرویس رایگان می‌ماند و معمولاً در یک بازه زمانی دوباره محاسبه می‌شود. «مستمر» به معنی تضمین دائمی یا بدون محدودیت نیست.</p>
        <h3>Trial یا دوره آزمایشی</h3>
        <p>دسترسی محدود به زمان، اعتبار یا تعداد درخواست است. پس از پایان Trial ممکن است مدل، Endpoint یا کل حساب رایگان غیرفعال شود.</p>
        <h3>Credit یا اعتبار هدیه</h3>
        <p>یک موجودی پولی محدود است که یک‌باره یا دوره‌ای اعطا می‌شود. پس از مصرف، ادامه استفاده ممکن است به Billing و روش پرداخت وابسته باشد.</p>

        <h2>مقایسه وضعیت ثبت‌شده در Catalog</h2>
        <div class="table-wrapper"><table>
          <thead><tr><th>نوع</th><th>تعداد Provider</th><th>نمونه‌ها</th></tr></thead>
          <tbody>${summaryRows}</tbody>
        </table></div>

        <h2>مراحل ثبت‌نام و چک‌لیست قبل از ساخت حساب</h2>
        <ol>
          <li>صفحه Provider و منبع رسمی Pricing یا Limits را باز کنید.</li>
          <li>مشخص کنید سهمیه با زمان Reset می‌شود یا یک اعتبار یک‌باره است.</li>
          <li>نیاز به کارت، Billing account، شماره تلفن، KYC یا کشور پشتیبانی‌شده را جدا بررسی کنید.</li>
          <li>مدل‌ها و Endpointهای مشمول طرح رایگان را یادداشت کنید.</li>
          <li>تاریخ انقضا و رفتار سرویس پس از پایان سهمیه را قبل از اتصال محصول مشخص کنید.</li>
        </ol>

        <h2>نمونه اولین درخواست برای اعتبارسنجی حساب</h2>
        <p>بعد از ساخت کلید، یک درخواست حداقلی به Endpoint رسمی بفرستید و مصرف آن را در Dashboard حساب کنترل کنید. مقادیر زیر Placeholder هستند و باید از مستندات همان Provider گرفته شوند:</p>
        <pre><code>export LLM_API_KEY="..."
export LLM_ENDPOINT="https://provider.example/v1/chat/completions"
export LLM_MODEL="MODEL_ID"

curl "$LLM_ENDPOINT" \\
  -H "Authorization: Bearer $LLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"'"$LLM_MODEL"'","messages":[{"role":"user","content":"ping"}],"max_tokens":8}'</code></pre>

        <h2>سهمیه و محدودیت‌ها را چگونه بخوانیم؟</h2>
        <ul>
          <li><strong>RPM/RPD:</strong> تعداد درخواست در دقیقه یا روز.</li>
          <li><strong>TPM:</strong> مجموع Token ورودی و خروجی در دقیقه.</li>
          <li><strong>Credit:</strong> سقف پولی؛ قیمت مدل سرعت مصرف آن را تغییر می‌دهد.</li>
          <li><strong>Free models:</strong> فقط مدل‌های مشخص رایگان‌اند و سایر مدل‌ها ممکن است Billing بخواهند.</li>
          <li><strong>Trial expiry:</strong> پایان زمان می‌تواند مستقل از باقی‌مانده مصرف باشد.</li>
        </ul>

        <h2>وضعیت ایران مستقل از رایگان‌بودن است</h2>
        <p>رایگان بودن هیچ تضمینی برای ثبت‌نام یا دسترسی از ایران ایجاد نمی‌کند. ممکن است Endpoint قابل دسترس باشد اما Signup، شماره تلفن، Billing یا Policy کشور مانع استفاده شود. وضعیت ایران را فقط از Evidence تاریخ‌دار صفحه Provider بخوانید.</p>

        <h2>خطاهای رایج و رفع اشکال</h2>
        <ul>
          <li><strong>insufficient quota:</strong> Credit یا سهمیه تمام شده، حتی اگر کلید معتبر باشد.</li>
          <li><strong>billing required:</strong> مدل یا Endpoint انتخابی داخل طرح رایگان نیست.</li>
          <li><strong>429:</strong> Rate limit کوتاه‌مدت است و لزوماً به معنی پایان Credit نیست.</li>
          <li><strong>trial expired:</strong> زمان Trial تمام شده و ساخت کلید جدید راه‌حل معتبر نیست.</li>
          <li><strong>مدل در Dashboard هست ولی API رد می‌شود:</strong> دسترسی UI و API یا Region حساب می‌تواند متفاوت باشد.</li>
        </ul>

        <h2>چه زمانی این گزینه مناسب نیست؟</h2>
        <p>Trial برای محصولی که باید بدون وقفه کار کند، Credit نامشخص برای بودجه‌ریزی بلندمدت و Free Tier بدون SLA برای بار حساس مناسب نیست. برای Production، سقف هزینه، مسیر ارتقا، حذف داده و Provider جایگزین را از ابتدا مشخص کنید.</p>

        <h2>منابع رسمی تاریخ‌دار</h2>
        <ul>${officialSourceList(referencedProviders)}</ul>

        <h2>مطالب مرتبط و پیوندهای داخلی</h2>
        <ul>
          <li><a href="../best-free-llm-api-iran/">راهنمای انتخاب API رایگان برای ایران</a></li>
          <li><a href="../openai-compatible-api-without-card/">API سازگار با OpenAI بدون کارت</a></li>
          <li><a href="../../#catalog">فیلتر و مقایسه همه Providerها</a></li>
          <li><a href="../../catalog.json">داده ماشین‌خوان Catalog</a></li>
        </ul>
      `;
    }
  },
  {
    slug: "openai-sdk-custom-base-url",
    title: "آموزش استفاده از OpenAI SDK با Base URL سفارشی",
    description: "نمونه امن Python و JavaScript برای اتصال OpenAI SDK به Providerهای سازگار با استفاده از متغیر محیطی و Base URL سفارشی.",
    h1: "آموزش OpenAI SDK با Base URL سفارشی",
    content: (catalog) => {
      const compatible = catalog.providers.filter((provider) => provider.api?.openai_compatible);
      const example = compatible.find((provider) => provider.id === "mistral-ai") ?? compatible[0];
      const baseUrl = example?.api.base_url ?? "https://provider.example/v1";
      const model = example?.models?.notable?.[0] ?? "MODEL_ID";

      return `
        <h2>هدف این راهنما و نیت جست‌وجو</h2>
        <p>این راهنما نشان می‌دهد چگونه یک SDK سازگار با OpenAI را به Provider دیگری متصل کنید، بدون اینکه کلید یا Base URL داخل کد ذخیره شود. «سازگار» به معنی یکسان‌بودن کامل همه قابلیت‌ها نیست؛ مدل‌ها، Tool Calling، Embedding، Streaming و پیام‌های خطا ممکن است تفاوت داشته باشند.</p>

        <h2>Providerهای سازگار ثبت‌شده</h2>
        ${providerTable(compatible)}

        <h2>مراحل ثبت‌نام و آماده‌سازی</h2>
        <ol>
          <li>از Catalog یک Provider با <code>openai_compatible=true</code> انتخاب کنید.</li>
          <li>در مستندات رسمی همان Provider ثبت‌نام و یک API key محدود ایجاد کنید.</li>
          <li>Base URL و شناسه مدل را دقیقاً از مستندات یا Dashboard حساب کپی کنید.</li>
          <li>کلید را در <code>LLM_API_KEY</code> و تنظیمات غیرحساس را در متغیرهای محیطی قرار دهید.</li>
          <li>قبل از فعال‌کردن Streaming یا Tool Calling، یک درخواست ساده و قابل تکرار اجرا کنید.</li>
        </ol>

        <h2>نمونه اولین درخواست با Python</h2>
        <pre><code>import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ.get("LLM_BASE_URL", "${escapeHtml(baseUrl)}"),
    timeout=30.0,
    max_retries=2,
)

response = client.chat.completions.create(
    model=os.environ.get("LLM_MODEL", "${escapeHtml(model)}"),
    messages=[{"role": "user", "content": "سلام!"}],
    max_tokens=64,
)
print(response.choices[0].message.content)</code></pre>

        <h2>نمونه اولین درخواست با JavaScript</h2>
        <pre><code>import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL ?? "${escapeHtml(baseUrl)}",
  timeout: 30_000,
  maxRetries: 2,
});

const response = await client.chat.completions.create({
  model: process.env.LLM_MODEL ?? "${escapeHtml(model)}",
  messages: [{ role: "user", content: "سلام!" }],
  max_tokens: 64,
});
console.log(response.choices[0].message.content);</code></pre>

        <h2>سهمیه و محدودیت‌ها</h2>
        <p>Retry خودکار نباید Rate Limit را تشدید کند. RPM، TPM، Context، مدل‌های مجاز و هزینه خروج از سهمیه رایگان را از صفحه Provider بررسی کنید. Timeout و تعداد Retry را محدود نگه دارید و برای 429 از Backoff همراه با Jitter استفاده کنید.</p>

        <h2>وضعیت ایران و شواهد دسترسی</h2>
        <p>سازگاری OpenAI مستقل از وضعیت ایران است. قبل از استفاده، Evidence ثبت‌نام، دسترسی شبکه و درخواست واقعی مدل را در صفحه Provider بخوانید. استفاده از Base URL جایگزین نباید برای دورزدن Terms، محدودیت کشور یا احراز هویت به کار رود.</p>

        <h2>خطاهای رایج و رفع اشکال</h2>
        <ul>
          <li><strong>401:</strong> نام متغیر محیطی، کلید و Header را بررسی کنید.</li>
          <li><strong>404:</strong> معمولاً Base URL فاقد نسخه API است یا شناسه مدل اشتباه است.</li>
          <li><strong>422/400:</strong> Provider بخشی از Schema یا پارامترهای SDK را پشتیبانی نمی‌کند؛ درخواست را به حداقل کاهش دهید.</li>
          <li><strong>429:</strong> Retry بی‌نهایت نکنید؛ Headerهای Rate Limit و سیاست Provider را بخوانید.</li>
          <li><strong>Streaming یا Tool Calling ناقص:</strong> سازگاری Chat Completion لزوماً این قابلیت‌ها را تضمین نمی‌کند.</li>
        </ul>

        <h2>چه زمانی این روش مناسب نیست؟</h2>
        <p>اگر Provider فقط شباهت سطحی به Schema OpenAI دارد، نیاز به API اختصاصی با قابلیت‌های ویژه دارید، یا تفاوت رفتار مدل برای محصول حساس مهم است، Adapter اختصاصی بهتر از تکیه بر سازگاری عمومی SDK است.</p>

        <h2>منابع رسمی تاریخ‌دار</h2>
        <ul>${officialSourceList(compatible)}</ul>

        <h2>مطالب مرتبط و پیوندهای داخلی</h2>
        <ul>
          <li><a href="../openai-compatible-api-without-card/">Providerهای سازگار بدون روش پرداخت ثبت‌شده</a></li>
          <li><a href="../free-coding-api/">APIهای مناسب Coding و Tool Calling</a></li>
          <li><a href="../free-tier-vs-trial-vs-credit/">تفاوت انواع سهمیه رایگان</a></li>
          <li><a href="../../#catalog">Catalog کامل Providerها</a></li>
          ${example ? `<li>نمونه استفاده‌شده در کد: ${providerLink(example)}</li>` : ""}
        </ul>
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
  ${hreflangLinks([
    { hreflang: "fa-IR", href: canonicalUrl },
    { hreflang: "x-default", href: canonicalUrl }
  ])}
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
    <a class="brand" href="../../" aria-label="Awesome Free LLM APIs IR"><span class="brand-mark" aria-hidden="true"><img src="../../assets/logo-symbol.svg" alt="" width="40" height="40"></span><span>Awesome Free LLM APIs IR</span></a>
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
