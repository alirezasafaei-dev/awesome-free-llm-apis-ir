# برنامه اجرایی ۹۰روزه SEO، Search Console و Growth

شروع فاز: ۲۰۲۶-۰۸-۰۷
مالک Track: Issue `#235`

## اصل اجرایی

در این دوره Product/Provider Expansion فریز است. هدف، رشد استفاده از Catalog و محتوای موجود از طریق Search demand واقعی، Indexing سالم، توزیع قابل‌اندازه‌گیری و حلقهٔ بهبود هفتگی است.

هر عدد باید منبع و بازهٔ زمانی داشته باشد. دادهٔ در دسترس‌نبودن با `UNAVAILABLE — ACCESS REQUIRED` ثبت می‌شود و هرگز صفر فرض نمی‌شود.

---

## فاز ۱ — روز ۱ تا ۱۴: Baseline و Indexing

### Google Search Console

- [ ] Property دامنهٔ اصلی `https://llm.persiantoolbox.ir/` تأیید شود.
- [ ] Sitemap اصلی Submit یا Revalidate شود.
- [ ] وضعیت Indexing صفحهٔ اصلی بررسی شود.
- [ ] Indexing تمام Guideهای اصلی نمونه‌برداری شود.
- [ ] Indexing Provider pages نمونه‌برداری و سپس Coverage کلی ثبت شود.
- [ ] Finder، Compare و Quick Start بررسی شوند.
- [ ] Canonical انتخاب‌شده توسط Google با Canonical اعلام‌شده مقایسه شود.
- [ ] Excluded/Not indexed URLها بر اساس علت دسته‌بندی شوند.

### Baseline دقیق

در یک Snapshot تاریخ‌دار ثبت شود:

```text
PERIOD_START=
PERIOD_END=
GSC_PROPERTY=
TOTAL_IMPRESSIONS=
TOTAL_CLICKS=
SITE_CTR=
AVERAGE_POSITION=
INDEXED_PAGES=
TOP_QUERIES=
TOP_LANDING_PAGES=
INDEXING_ERRORS=
SOURCE=Google Search Console
```

### Analytics

در صورت دسترسی، برای همان بازه ثبت شود:

- Landing pageviews؛
- Finder starts/completions؛
- Provider detail views؛
- Official Docs clicks؛
- Quick Start activation/copy events؛
- Campaign landing events by source.

اگر دسترسی موجود نیست:

```text
ANALYTICS_BASELINE=UNAVAILABLE — ACCESS REQUIRED
```

### Gate پایان فاز ۱

- [ ] Baseline با تاریخ و Source ثبت شده است.
- [ ] Sitemap وضعیت مشخص دارد.
- [ ] مشکل Critical در Canonical/robots/noindex وجود ندارد یا Issue جدا دارد.
- [ ] Mirror ایران همچنان non-indexable است.

---

## فاز ۲ — روز ۱۵ تا ۴۵: بهینه‌سازی محتوای موجود

### ترتیب اولویت URL

1. Impression بالا + CTR پایین؛
2. Position حدود 4–20 با Intent مناسب؛
3. Landing page با ترافیک ولی Conversion ضعیف؛
4. Page ایندکس‌شده با Query mismatch روشن؛
5. Page مهمی که Internal Link کافی ندارد.

### تغییرات مجاز

برای هر URL فقط بر اساس Evidence:

- Title و Meta Description؛
- H1/Intro برای هم‌راستایی با Intent؛
- FAQ واقعی و Structured Data معتبر؛
- Internal links به Guide/Provider/Finder/Compare/Quick Start مرتبط؛
- توضیح بهتر Free Tier / Trial / Credit؛
- CTA روشن‌تر به مسیر بعدی کاربر؛
- اصلاح محتوای stale با منبع معتبر.

### Content clusters اصلی

#### خوشه ۱ — انتخاب API برای ایران

- بهترین API رایگان LLM برای ایران؛
- API سازگار با OpenAI؛
- API بدون کارت بانکی؛
- Free Tier در برابر Trial/Credit؛
- دسترسی ایران و روش تفسیر Evidence.

#### خوشه ۲ — Use case

- Coding API؛
- Embeddings؛
- MVP/دانشجویی؛
- Provider fallback؛
- محدودیت RPM/RPD/TPM.

#### خوشه ۳ — Implementation

- OpenAI SDK با Base URL سفارشی؛
- migration بین Providerها؛
- مدیریت امن API Key؛
- 429 و rate-limit handling؛
- Python/Node.js quick starts.

### قواعد انتشار

- [ ] صفحه فقط برای Keyword count ساخته نشود.
- [ ] Intent مشخص داشته باشد.
- [ ] Claims از Catalog فراتر نروند.
- [ ] تاریخ بررسی و منابع روشن باشند.
- [ ] Internal links منطقی و Crawlable باشند.
- [ ] Keyword stuffing ممنوع است.

---

## فاز ۳ — روز ۳۰ تا ۷۵: Distribution و Marketing

این فاز با فاز ۲ هم‌پوشانی دارد؛ فقط محتوایی توزیع شود که Landing page آماده و قابل‌اندازه‌گیری دارد.

### Track فارسی

Issue `#69` مرجع Campaign 1 است.

کانال‌های اولویت‌دار:

1. Telegram؛
2. LinkedIn فارسی؛
3. Virgool؛
4. Aparat در صورت وجود Demo مفید؛
5. رسانه‌ها/گروه‌های فنی فقط با رعایت قوانین Community.

### Track انگلیسی

- LinkedIn English؛
- GitHub Release/Discussion در صورت تناسب؛
- Maintainer/newsletter outreach شخصی‌سازی‌شده؛
- Hacker News / Reddit / Product Hunt فقط در صورت آمادگی محتوا و تطابق با قوانین جاری.

### UTM contract

هر انتشار باید حداقل داشته باشد:

```text
utm_source=
utm_medium=
utm_campaign=
utm_content=
PUBLISHED_AT_UTC=
PUBLIC_URL=
LANDING_URL=
```

### ممنوعیت‌ها

- خرید Backlink؛
- Link exchange انبوه؛
- Comment spam؛
- پیام انبوه ناخواسته؛
- Vote manipulation؛
- ادعای «بهترین» یا «قابل استفاده از ایران» بدون Evidence مناسب؛
- انتشار Secret یا اطلاعات زیرساخت.

---

## فاز ۴ — روز ۷ تا ۹۰: حلقهٔ هفتگی Measurement

هر ۷ روز Snapshot تهیه شود.

### Search

```text
WEEK=
IMPRESSIONS=
CLICKS=
CTR=
AVERAGE_POSITION=
INDEXED_PAGES=
TOP_GROWING_QUERIES=
TOP_DECLINING_QUERIES=
TOP_GROWING_PAGES=
LOW_CTR_HIGH_IMPRESSION_PAGES=
INDEXING_ERRORS=
```

### Product/Growth

در صورت دسترسی:

```text
CAMPAIGN_LANDINGS_BY_SOURCE=
FINDER_START_RATE=
FINDER_COMPLETION_RATE=
PROVIDER_DETAIL_RATE=
OFFICIAL_DOCS_CTR=
QUICK_START_ACTIVATION_RATE=
GITHUB_REFERRALS=
GITHUB_STAR_DELTA=
VALID_CONTRIBUTIONS=
```

### تصمیم هفتگی

حداکثر سه اقدام برای هفتهٔ بعد انتخاب شود. هر اقدام باید یکی از این Evidenceها را داشته باشد:

- Search Console query/page data؛
- Analytics funnel data؛
- indexing defect؛
- reproducible accessibility defect؛
- stale/incorrect factual evidence؛
- production/security incident.

تغییرات سلیقه‌ای یا Feature expansion وارد Sprint نمی‌شوند.

---

## KPIهای پایان ۹۰ روز

هدف‌ها به‌صورت trend و نه عدد ساختگی تعریف می‌شوند تا پس از Baseline واقعی مقدارگذاری شوند:

- رشد Organic impressions نسبت به Baseline؛
- رشد Organic clicks نسبت به Baseline؛
- بهبود CTR صفحات دارای Impression کافی؛
- کاهش Indexing errors قابل‌کنترل؛
- افزایش تعداد Queryهای مرتبط که وارد Top 20 می‌شوند؛
- افزایش Conversion از Guide به مسیرهای عملی سایت؛
- افزایش Referral طبیعی GitHub و مشارکت معتبر؛
- حداقل یک چرخهٔ کامل Campaign → Snapshot 24h → 72h → 7d → Decision.

## Definition of Done این برنامه

پس از روز ۹۰:

1. Baseline و حداقل ۸ Snapshot هفتگی معتبر وجود داشته باشد؛
2. Search Console backlog بر اساس Query واقعی شکل گرفته باشد؛
3. Campaignهای اجراشده Public URL و UTM و Measurement داشته باشند؛
4. حداقل چند Optimization مبتنی بر داده انجام و اثر قبل/بعد ثبت شده باشد؛
5. تصمیم ادامهٔ Growth یا بازگشایی محدود Product Development بر اساس داده گرفته شود، نه صرفاً ترجیح.

## Related

- `docs/MAINTENANCE_GROWTH_MODE.fa.md`
- `docs/SEO_GROWTH_ROADMAP.fa.md`
- `docs/PERSIAN_GROWTH_MEASUREMENT.fa.md`
- `docs/PERSIAN_GROWTH_LOG.md`
- Issue `#44`
- Issue `#69`
- Issue `#235`
