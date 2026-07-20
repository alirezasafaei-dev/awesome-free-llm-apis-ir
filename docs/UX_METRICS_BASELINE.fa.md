# خط مبنای سنجش UI/UX و رشد

## اصل گزارش‌دهی

هیچ مقدار ناموجودی نباید `0` گزارش شود. صفر یعنی ابزار اندازه‌گیری شده و رویدادی رخ نداده است؛ نبود دسترسی یا نبود بازه کافی باید با عبارت زیر ثبت شود:

```text
UNAVAILABLE — ACCESS REQUIRED
```

هر گزارش باید بازه زمانی، Timezone، منبع، Filter و تغییرات Tracking را ذکر کند.

## نسخه مرجع

- Homepage clarity merge: `406672dac83a744195911900280a2fd0fef91d4e`
- Developer Quick Start merge: `5bbd29dc570225c71ea8aedcca6327ef0012a8c8`
- API Finder clarity merge: `0a0d7b329faae76777a59cb42e7ff265c8bd89b4`
- شروع دوره Post-refactor: پس از تأیید Deploy شدن SHA آخر روی Production

مقایسه قبل/بعد فقط زمانی معتبر است که بازه‌ها طول مشابه، روزهای هفته مشابه و Tracking سازگار داشته باشند.

## قیف اصلی محصول

### مرحله ۱ — فهم و انتخاب مسیر

رویدادها:

- `ux_path_click`
  - `beginner_explainer`
  - `developer_finder` یا مسیر Quick Start پس از Deploy
  - `hero_finder_primary`
  - `hero_catalog_secondary`
  - `explainer_finder`
- `catalog_advanced_open`

سؤال‌های محصولی:

- چه درصدی مسیر هدایت‌شده را به Catalog ترجیح می‌دهند؟
- آیا کاربران تازه‌کار قبل از فیلتر فنی، توضیح API را باز می‌کنند؟
- چند نفر مستقیم وارد فیلترهای پیشرفته می‌شوند؟

### مرحله ۲ — شروع انتخاب هدایت‌شده

رویدادها:

- `api_finder_started`
- `api_finder_advanced_open`

سؤال‌های محصولی:

- چند نفر پس از ورود به Finder با فرم تعامل می‌کنند؟
- چند نفر برای شروع به تنظیمات پیشرفته نیاز دارند؟
- آیا Advanced Open بسیار بالا است و نشان می‌دهد سه سؤال اصلی کافی نیستند؟

### مرحله ۳ — دریافت پیشنهاد

رویداد:

- `api_finder_completed`
  - Property مجاز: `result_count`

سؤال‌های محصولی:

- نرخ تکمیل Finder چقدر است؟
- چند Session نتیجه دریافت نمی‌کنند؟
- آیا تکمیل پس از تغییر UI افزایش یافته است؟

### مرحله ۴ — بررسی و فعال‌سازی

رویدادها:

- `provider_detail_click`
- `provider_docs_click`
- `provider_page_click`
- `quick_start_code_copy`

سؤال‌های محصولی:

- چند کاربر بعد از پیشنهاد، شواهد Provider را می‌خوانند؟
- چند کاربر به مستندات رسمی می‌روند؟
- کدام نمونه Quick Start بیشتر کپی می‌شود؟

## تعریف KPIها

### Homepage Guided Path Rate

```text
Guided path clicks / all measured homepage path clicks
```

Guided path شامل Beginner Explainer، Hero Finder، Developer Journey و Explainer Finder است. Catalog Secondary و Advanced Filter مسیر فنی محسوب می‌شوند.

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

این KPI فقط کپی نمونه را می‌سنجد و اثبات نمی‌کند درخواست واقعی اجرا شده است.

## جدول Baseline

| Metric | Pre-refactor | Post-refactor | Source | Date range | Notes |
|---|---:|---:|---|---|---|
| Homepage sessions | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible/Analytics | ثبت شود | — |
| Guided Path Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible custom events | ثبت شود | Event schema تغییر کرده است |
| Finder Start Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | رویداد جدید |
| Finder Completion Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | رویداد جدید |
| Advanced Open Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Evidence Review Rate | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Official Docs CTR | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Quick Start Activation Rate | N/A — route did not exist | UNAVAILABLE — ACCESS REQUIRED | Plausible | ثبت شود | — |
| Five-second comprehension ≥2 | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Usability sessions | ثبت شود | حداقل ۵ کاربر عادی |
| Developer task success | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Usability sessions | ثبت شود | حداقل ۵ توسعه‌دهنده |
| Median Homepage→Finder result time | UNAVAILABLE — RESEARCH REQUIRED | UNAVAILABLE — RESEARCH REQUIRED | Moderated sessions | ثبت شود | هدف <۲ دقیقه |
| Homepage organic CTR | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Google Search Console | ثبت شود | Query cluster ثابت |
| Homepage average position | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | Google Search Console | ثبت شود | — |
| Indexed product URLs | UNAVAILABLE — ACCESS REQUIRED | UNAVAILABLE — ACCESS REQUIRED | GSC/Bing | ثبت شود | `/`, `/api-finder/`, `/quick-start/` |

## Query Clusterهای SEO برای مقایسه

داده Search Console باید حداقل برای این نیت‌ها جدا شود:

- API رایگان هوش مصنوعی؛
- API رایگان LLM؛
- API هوش مصنوعی برای ایران؛
- API بدون کارت بانکی؛
- جایگزین OpenAI API؛
- آموزش استفاده از API هوش مصنوعی؛
- API برای چت‌بات فارسی.

تغییر Title/Description ممکن است Impressions و CTR را هم‌زمان تغییر دهد. نتیجه را فقط با CTR یا فقط با Position تفسیر نکن.

## حداقل بازه معتبر

- Analytics: حداقل ۱۴ روز قبل و ۱۴ روز بعد؛ ترجیحاً ۲۸ روز؛
- Search Console: حداقل ۲۸ روز، به‌دلیل تأخیر Indexing و نوسان Query؛
- Usability: تحلیل میان‌مرحله‌ای پس از ۵ جلسه و تصمیم اصلی پس از حداقل ۱۰ جلسه.

## Guardrailها

بهبود Conversion نباید با این هزینه‌ها انجام شود:

- حذف هشدارهای Evidence یا تبدیل امتیاز به ادعای قطعی؛
- افزایش جمع‌آوری اطلاعات شخصی؛
- ثبت مقدار فیلدهای کاربر در Analytics؛
- تغییر Canonical یا Index شدن Iran mirror؛
- کم‌رنگ‌کردن تاریخ بررسی، منبع رسمی یا محدودیت Free Tier؛
- استفاده از Dark Pattern برای کلیک مستندات یا GitHub.

## گزارش هفتگی

هر گزارش هفتگی باید شامل این ساختار باشد:

```text
PERIOD=
TIMEZONE=
DEPLOYED_SHA=
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
DEVELOPER_TASK_SUCCESS_RATE=
CRITICAL_CONFUSION_COUNT=
GSC_CLICKS=
GSC_IMPRESSIONS=
GSC_CTR=
GSC_POSITION=
DATA_GAPS=
DECISIONS=
```

## تصمیم‌گیری

- اگر فهم پنج‌ثانیه‌ای پایین است، Hero و Navigation اولویت دارند؛
- اگر Finder Start پایین است، Handoff صفحه اصلی یا Hero Finder مشکل دارد؛
- اگر Start بالا و Completion پایین است، سؤال‌ها یا Loading/Results مشکل دارند؛
- اگر Completion بالا و Evidence Review پایین است، کارت نتیجه اعتماد کافی یا CTA روشن ندارد؛
- اگر Quick Start View بالا و Code Copy پایین است، نمونه‌ها یا الزامات شروع مبهم‌اند؛
- اگر CTR افزایش و Task Success کاهش یابد، رشد SEO به قیمت تجربه محصول پذیرفته نیست.
