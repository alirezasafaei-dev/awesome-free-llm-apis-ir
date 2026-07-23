# خط مبنای سنجش UI/UX و رشد

## اصل گزارش‌دهی

هیچ مقدار ناموجودی نباید `0` گزارش شود. صفر یعنی ابزار اندازه‌گیری شده و رویدادی رخ نداده است. نبود دسترسی، نبود ترافیک کافی یا نبود پژوهش باید با یکی از وضعیت‌های زیر ثبت شود:

```text
UNAVAILABLE — ACCESS REQUIRED
UNAVAILABLE — RESEARCH REQUIRED
INSUFFICIENT SAMPLE — DO NOT INTERPRET
```

هر گزارش باید بازه زمانی، Timezone، منبع، Filter، Revision و هر تغییر Tracking را ذکر کند.

## نسخه مرجع جاری

```text
DEPLOYED_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
EXACT_RELEASE_RUN=30040826620
EXACT_REVISION=PASS
GENERIC_SMOKE=PASS
UX_SMOKE=PASS
BROWSER_PRODUCT_GATE=PASS
```

این Revision تنها Baseline معتبر برای دور فعلی سنجش UX است. مقایسه قبل/بعد فقط زمانی معتبر است که:

- بازه‌ها طول مشابه داشته باشند؛
- روزهای هفته و فصل ترافیکی قابل مقایسه باشند؛
- Event schema و Consent/Privacy behavior یکسان باشد؛
- هیچ تغییر عمده دیگری در محتوا، SEO یا Distribution هم‌زمان رخ نداده باشد؛
- داده Bot، Preview و Mirror غیرCanonical از تحلیل حذف شود.

## کنترل‌های فنی تکمیل‌شده

- Homepage، Finder، Quick Start، Compare و Provider pages در هر سه Target منتشر شده‌اند.
- Exact-SHA، Generic Smoke و UX Smoke روی Global، Iran mirror و GitHub Pages فعال‌اند.
- Browser Product Gate، JavaScript واقعی Finder، Shortlist، Compare، Theme، Keyboard focus و Mobile overflow را اجرا می‌کند.
- Language-quality scoring غیرقابل‌اثبات حذف شده است.
- RPM به‌عنوان ظرفیت درخواست نمایش داده می‌شود؛ نه Latency یا سرعت مدل.
- Finder source و رفتار Production همگرا شده‌اند.
- Analytics روی Mirrorهای غیرCanonical Suppress می‌شود.

این کنترل‌ها سلامت فنی را اثبات می‌کنند؛ نه فهم کاربر، رضایت، موفقیت Task یا Conversion.

## قیف اصلی محصول

### مرحله ۱ — فهم و انتخاب مسیر

رویدادها:

- `ux_path_click`
  - `beginner_explainer`
  - `developer_finder`
  - `hero_finder_primary`
  - `hero_catalog_secondary`
  - `explainer_finder`
- `catalog_advanced_open`

سؤال‌ها:

- چه درصدی مسیر هدایت‌شده را به Catalog ترجیح می‌دهند؟
- آیا کاربر تازه‌کار هدف محصول را پیش از ورود به فیلترها می‌فهمد؟
- آیا Advanced Open بالا نشان می‌دهد مسیر اصلی پاسخ کافی نمی‌دهد؟

### مرحله ۲ — شروع انتخاب هدایت‌شده

رویدادها:

- `api_finder_started`
- `api_finder_advanced_open`

سؤال‌ها:

- چند نفر پس از مشاهده Finder با آن تعامل می‌کنند؟
- آیا دو سؤال اصلی برای شروع کافی هستند؟
- آیا کاربران برای تکمیل کار مجبور به بازکردن تنظیمات پیشرفته می‌شوند؟

### مرحله ۳ — دریافت پیشنهاد

رویداد:

- `api_finder_completed`
  - Property مجاز: `result_count`

سؤال‌ها:

- نرخ تکمیل Finder چقدر است؟
- چند Session نتیجه دریافت نمی‌کنند؟
- زمان شروع تا نتیجه چقدر است؟

### مرحله ۴ — بررسی و فعال‌سازی

رویدادها:

- `provider_detail_click`
- `provider_docs_click`
- `provider_page_click`
- `quick_start_code_copy`

سؤال‌ها:

- چند کاربر بعد از پیشنهاد، Evidence را بررسی می‌کنند؟
- چند کاربر به مستندات رسمی می‌روند؟
- چند کاربر Quick Start را به Copy code می‌رسانند؟

## تعریف KPIها

### Homepage Guided Path Rate

```text
Guided path clicks / all measured homepage path clicks
```

### Finder Start Rate

```text
Sessions with api_finder_started / sessions viewing /api-finder/
```

### Finder Completion Rate

```text
Sessions with api_finder_completed / sessions with api_finder_started
```

### Evidence Review Rate

```text
Sessions with provider_detail_click / sessions with api_finder_completed
```

### Official Docs CTR

```text
Sessions with provider_docs_click / sessions viewing Provider or Finder result
```

### Quick Start Activation Rate

```text
Sessions with quick_start_code_copy / sessions viewing /quick-start/
```

Copy code اثبات نمی‌کند درخواست واقعی با موفقیت اجرا شده است.

## جدول Baseline

| Metric | Pre-refactor | Current product | Source | Date range | Notes |
|---|---:|---:|---|---|---|
| Homepage sessions | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible/Analytics | ثبت شود | Canonical only |
| Guided Path Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible custom events | ثبت شود | Event schema ثابت بماند |
| Finder Start Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Finder Completion Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Advanced Open Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Evidence Review Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Official Docs CTR | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Quick Start Activation Rate | N/A — route did not exist | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Five-second comprehension ≥2 | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Usability sessions | ثبت شود | حداقل ۵ کاربر عادی |
| Primary path success | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Usability sessions | ثبت شود | هدف ≥۸۰٪ |
| Developer task success | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Usability sessions | ثبت شود | هدف ≥۸۰٪ |
| Median Homepage→Finder result | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Moderated sessions | ثبت شود | هدف <۲ دقیقه |
| Homepage organic CTR | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Google Search Console | ثبت شود | Query cluster ثابت |
| Homepage average position | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Google Search Console | ثبت شود | — |
| Indexed product URLs | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | GSC/Bing | ثبت شود | Product routes |

## Query clusterهای SEO

- API رایگان هوش مصنوعی
- API رایگان LLM
- API هوش مصنوعی برای ایران
- API بدون کارت بانکی
- جایگزین OpenAI API
- آموزش استفاده از API هوش مصنوعی
- API برای چت‌بات فارسی

تغییر Title/Description می‌تواند Impressions، Position و CTR را هم‌زمان تغییر دهد. نتیجه را فقط با یک Metric تفسیر نکن.

## حداقل بازه معتبر

- Analytics: حداقل ۱۴ روز قبل و ۱۴ روز بعد؛ ترجیحاً ۲۸ روز
- Search Console: حداقل ۲۸ روز
- Usability: تحلیل میان‌مرحله‌ای پس از ۵ جلسه و تصمیم اصلی پس از ۱۰ جلسه
- هر Segment با نمونه ناکافی: `INSUFFICIENT SAMPLE — DO NOT INTERPRET`

## Guardrailها

بهبود Conversion نباید با این هزینه‌ها انجام شود:

- حذف هشدار Evidence یا تبدیل امتیاز به ادعای قطعی
- جمع‌آوری اطلاعات شخصی یا مقدار فیلدهای کاربر
- Index شدن Iran mirror
- کم‌رنگ‌کردن تاریخ بررسی، منبع رسمی یا محدودیت Free Tier
- Dark Pattern برای کلیک مستندات، Signup یا GitHub
- نسبت‌دادن رفتار Mirror یا Bot به کاربر واقعی

## گزارش هفتگی

```text
PERIOD=
TIMEZONE=Europe/Sofia
DEPLOYED_SHA=00e6cf20539921117619e8b95b0fb0ab7378fd78
HOMEPAGE_SESSIONS=
GUIDED_PATH_RATE=
FINDER_START_RATE=
FINDER_COMPLETION_RATE=
ADVANCED_OPEN_RATE=
EVIDENCE_REVIEW_RATE=
OFFICIAL_DOCS_CTR=
QUICK_START_ACTIVATION_RATE=
USABILITY_SESSIONS_TOTAL=
COMPREHENSION_SUCCESS_RATE=
PRIMARY_PATH_SUCCESS_RATE=
DEVELOPER_TASK_SUCCESS_RATE=
MEDIAN_HOMEPAGE_TO_RESULT_MINUTES=
CRITICAL_CONFUSION_COUNT=
GSC_CLICKS=
GSC_IMPRESSIONS=
GSC_CTR=
GSC_POSITION=
DATA_GAPS=
DECISIONS=
```

## تصمیم‌گیری

- فهم پنج‌ثانیه‌ای پایین: Hero و Navigation
- Finder Start پایین: Handoff صفحه اصلی یا ارزش پیشنهادی Finder
- Start بالا و Completion پایین: سؤال‌ها، Loading، Error یا Result cards
- Completion بالا و Evidence Review پایین: اعتماد، توضیح Score یا CTA جزئیات
- Quick Start View بالا و Copy پایین: نمونه‌ها، پیش‌نیازها یا Provider context
- CTR بالا و Task Success پایین: رشد SEO به قیمت تجربه محصول پذیرفته نیست

کار پژوهش انسانی در Issue #129 و تصمیم محصولی در Issue #124 ثبت می‌شود.
