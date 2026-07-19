# راهنمای عملیات پس از انتشار

این سند چرخهٔ عملیاتی سایت Awesome Free LLM APIs IR را پس از Merge شدن قابلیت‌های اصلی تعریف می‌کند. هدف این چرخه، جداکردن «Build سالم» از «عملکرد واقعی Production» و تبدیل داده‌های رشد به تصمیم‌های قابل اندازه‌گیری است.

## دامنه‌ها و نقش هر کدام

| هدف | نشانی | سیاست ایندکس |
|---|---|---|
| نسخهٔ اصلی جهانی | `https://llm.persiantoolbox.ir/` | قابل ایندکس و Canonical |
| آینهٔ ایران | `https://ir.llm.persiantoolbox.ir/` | `X-Robots-Tag: noindex, nofollow` |
| نسخهٔ پشتیبان GitHub Pages | `https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/` | قابل دسترسی و مستقل |

## گیت Production Smoke

اسکریپت زیر سه Deployment را بررسی می‌کند:

```bash
npm run production:smoke
```

برای بررسی یک Target:

```bash
npm run production:smoke -- --target=global
npm run production:smoke -- --target=iran
npm run production:smoke -- --target=pages
```

برای الزام SHA منتشرشده:

```bash
npm run production:smoke -- \
  --expected-revision=FULL_GIT_SHA \
  --report=production-smoke-report.json
```

Smoke Check موارد زیر را کنترل می‌کند:

- صفحهٔ اصلی، صفحهٔ انگلیسی و API Finder؛
- `catalog.json`، `data.json` و `build-meta.json` با Content-Type واقعی JSON؛
- جلوگیری از HTML fallback برای Endpointهای JSON؛
- `sitemap.xml` و `robots.txt`؛
- پاسخ واقعی HTTP 404 برای یک مسیر ناموجود؛
- همهٔ صفحات Provider استخراج‌شده از Catalog؛
- JSON-LD و شناسهٔ Provider در هر صفحه؛
- Header مربوط به noindex روی آینهٔ ایران؛
- نبود noindex روی نسخهٔ Canonical و GitHub Pages؛
- تطابق `provider_count` میان Catalog، Data و Build Metadata؛
- تطابق SHA در صورت ارائهٔ `--expected-revision`.

تست بدون شبکهٔ Checker نیز در `npm test` اجرا می‌شود:

```bash
npm run production:smoke:test
```

## Workflow عملیاتی

Workflow با نام **Post-launch operations** به‌صورت هفتگی و دستی قابل اجراست. اجرای دستی این ورودی‌ها را دارد:

- `target`: یکی از `all`، `global`، `iran` یا `pages`؛
- `expected_revision`: SHA اختیاری برای اثبات اینکه Deployment دقیقاً نسخهٔ موردنظر را سرو می‌کند.

Workflow این گیت‌ها را به ترتیب اجرا می‌کند:

1. Build، Site Check و Regression Check؛
2. Production Smoke؛
3. Provider Endpoint Health؛
4. Provider Documentation Drift؛
5. Strict SEO Audit.

اگر هر گیت شکست بخورد، یک Issue واحد با Marker پایدار ساخته یا به‌روزرسانی می‌شود. پس از Recovery کامل، همان Issue با Evidence اجرای موفق بسته می‌شود. این رفتار از ایجاد Issueهای تکراری جلوگیری می‌کند.

## تفسیر درست Health و Iran Access

نتیجه‌های زیر معادل یکدیگر نیستند و نباید در داده ادغام شوند:

1. DNS و اتصال شبکه برقرار است؛
2. Website یا Docs پاسخ می‌دهد؛
3. صفحهٔ ثبت‌نام قابل دسترسی است؛
4. Account واقعاً ساخته می‌شود؛
5. API Key صادر می‌شود؛
6. فهرست مدل قابل دریافت است؛
7. یک درخواست واقعی Inference پاسخ معتبر می‌دهد؛
8. Provider استفاده از ایران را در سیاست رسمی مجاز می‌داند.

Health Check فقط وضعیت Endpointها و اسناد را نشان می‌دهد. تغییر `iran_access.status` باید بر پایهٔ Evidence تاریخ‌دار، قابل بازتولید و Sanitized انجام شود.

## انتشار Benchmark 2026

کلیدها فقط در GitHub Actions Secrets یا محیط محلی مورداعتماد قرار می‌گیرند. هیچ کلید، Cookie، Header احراز هویت یا Artifact حساب نباید Commit شود.

روند پیشنهادی:

```bash
npm run benchmark:v2:validate
npm run benchmark:v2:dry
npm run benchmark:v2:run
npm run benchmark:report
```

پیش از انتشار گزارش:

- تعداد Promptهای موفق برای هر Provider ثبت شود؛
- Sampleهای Failed یا Incomparable از Ranking حذف شوند؛
- Timestamp، مدل دقیق، Region اجرای تست و محدودیت‌ها درج شوند؛
- Latency شبکه از کیفیت مدل جدا گزارش شود؛
- Provider فاقد دادهٔ کافی رتبه نگیرد؛
- Raw Response حاوی اطلاعات حساس منتشر نشود.

## قرارداد خط مبنای KPI

پیش از تغییر بزرگ بعدی در UI، SEO یا محتوا، یک Snapshot هفتگی با ساختار زیر ثبت شود:

| گروه | KPI | مقدار خط مبنا | بازه | منبع |
|---|---|---:|---|---|
| Search | Organic clicks |  | ۷ روز | Google Search Console |
| Search | Impressions |  | ۷ روز | Google Search Console |
| Search | Average CTR |  | ۷ روز | Google Search Console |
| Search | Average position |  | ۷ روز | Google Search Console |
| Indexing | Indexed canonical URLs |  | Snapshot | Search Console |
| Indexing | Indexed Bing URLs |  | Snapshot | Bing Webmaster Tools |
| UX | LCP p75 |  | ۲۸ روز | Core Web Vitals |
| UX | INP p75 |  | ۲۸ روز | Core Web Vitals |
| UX | CLS p75 |  | ۲۸ روز | Core Web Vitals |
| Product | API Finder starts |  | ۷ روز | Privacy-preserving analytics |
| Product | API Finder completions |  | ۷ روز | Privacy-preserving analytics |
| Product | Completion rate |  | ۷ روز | محاسبه‌شده |
| Engagement | Provider page views |  | ۷ روز | Analytics |
| Engagement | Outbound Provider clicks |  | ۷ روز | Analytics |
| Engagement | Returning visitors |  | ۷ روز | Analytics |

فرمول‌ها:

```text
API Finder completion rate = completions / starts
Provider outbound CTR = outbound provider clicks / provider page views
Organic CTR = organic clicks / impressions
```

هر Snapshot باید تاریخ شروع و پایان، Timezone، منبع، روش استخراج و هر تغییر Tracking را ثبت کند. مقایسهٔ قبل و بعد بدون Baseline معتبر، Evidence رشد محسوب نمی‌شود.

## چرخهٔ هفتگی پیشنهادی

1. اجرای Workflow عملیات؛
2. بررسی Incidentهای خودکار؛
3. Triage تغییرات Provider Drift؛
4. ثبت KPI Snapshot؛
5. انتخاب حداکثر سه اقدام با بیشترین Impact؛
6. اجرای تغییرات از طریق PR؛
7. ثبت نتیجه پس از یک بازهٔ قابل مقایسه.

## شرایط بسته‌شدن Issue #114

Issue پس از تحقق همهٔ موارد زیر بسته می‌شود:

- هر سه Deployment Smoke Check موفق و SHA نهایی تأیید شده باشد؛
- Drift و Health خروجی بازبینی‌شده داشته باشند؛
- Benchmark واقعی منتشر شده باشد یا نبود Credential/Data به‌صراحت ثبت شود؛
- شش Landing Page فارسی واقعی اضافه و Hreflangها معتبر باشند؛
- همهٔ یافته‌های actionable سئو رفع یا به Issue مستقل تبدیل شده باشند؛
- KPI Baseline ثبت شده باشد؛
- `npm test`، `npm run site:build`، `npm run site:check` و `npm run check:regression` سبز باشند.
