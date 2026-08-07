# نقشه راه سایت، SEO و رشد ارگانیک

آخرین بازبینی: ۲۰۲۶-۰۸-۰۷

## تصمیم محصول — Maintenance + Growth Mode

Repository و سایت Production فعال می‌مانند، اما Product Development و Provider Expansion در این فاز فریز هستند. تعداد Providerهای فعلی برای اجرای برنامهٔ رشد کافی است و هدف عددی قبلی «رسیدن به ۵۰ Provider» در این فاز فعال نیست.

اولویت پروژه از «افزودن API و Feature» به این موارد منتقل شده است:

1. قابل‌اعتماد نگه‌داشتن دادهٔ فعلی؛
2. Google Search Console و Indexing سالم؛
3. بهبود محتوای موجود بر اساس Query واقعی؛
4. توزیع و بازاریابی قابل‌اندازه‌گیری؛
5. امنیت، Privacy و Production reliability.

Provider جدید فقط پس از تصمیم صریح مالک برای بازگشایی Product Development بررسی می‌شود. `unknown`های فعلی عمداً `unknown` باقی می‌مانند تا Evidence کافی وجود داشته باشد.

Policy کامل: `docs/MAINTENANCE_GROWTH_MODE.fa.md`

برنامه اجرایی: `docs/GROWTH_90_DAY_EXECUTION.fa.md`

Issue اصلی Growth: `#235`

## North Star

رشد پایدار کاربرانی که از جست‌وجوی ارگانیک یا توزیع معتبر وارد سایت می‌شوند، پاسخ مرتبط پیدا می‌کنند و سپس یک اقدام معنی‌دار انجام می‌دهند:

- ورود به صفحهٔ اختصاصی Provider؛
- استفاده از Finder، Compare یا Quick Start؛
- مشاهده مستندات رسمی؛
- کپی‌کردن Base URL یا الگوی پیاده‌سازی؛
- مراجعه به GitHub؛
- ثبت گزارش یا مشارکت معتبر.

## KPIهای اصلی

Baseline فقط از ابزار واقعی اندازه‌گیری ثبت می‌شود. نبود دسترسی با `UNAVAILABLE — ACCESS REQUIRED` گزارش می‌شود و صفر فرض نمی‌شود.

| KPI | دوره بررسی | تصمیم مبتنی بر آن |
|---|---|---|
| صفحات معتبر ایندکس‌شده | هفتگی | رفع Indexing/Canonical defects |
| Organic impressions | هفتگی | تشخیص Query/Topic demand |
| Organic clicks | هفتگی | سنجش رشد واقعی Search |
| CTR جست‌وجو | هفتگی/ماهانه | بهبود Title/Description صفحات دارای Impression کافی |
| Average position | هفتگی | اولویت صفحات نزدیک Top 10/20 |
| Top queries | هفتگی | Intent و Content backlog |
| Top landing pages | هفتگی | اولویت Optimization |
| Finder/Provider/Docs conversions | هفتگی | سنجش Intent عملی در صورت دسترسی |
| GitHub referrals/stars/contributions | هفتگی/ماهانه | سنجش Referral طبیعی و مشارکت |

## P0 — Search Console، Indexing و Measurement

معیار فنی:

- صفحه HTML مستقل برای هر Provider؛
- Canonical یکتا برای همه صفحات؛
- Sitemap پویا و هم‌راستا با Catalog؛
- لینک داخلی Crawlable؛
- Metadata یکتا، Open Graph و Structured Data معتبر؛
- `robots.txt` روی دامنه اصلی و `noindex` روی Mirror ایران؛
- تست CI برای شمار صفحات، Canonicalها و Sitemap.

معیار عملیاتی Growth:

- Google Search Console Property دامنه اصلی تأیید شود؛
- Sitemap Submit/Revalidate شود؛
- Coverage و URL Inspection صفحات اصلی بررسی شود؛
- Baseline تاریخ‌دار برای Impressions، Clicks، CTR، Average Position، Indexed Pages، Top Queries و Top Landing Pages ثبت شود؛
- Analytics کم‌حجم و Privacy-conscious در صورت دسترسی Baseline شود؛
- Bing Webmaster Tools پس از پایدارشدن Baseline گوگل بررسی شود.

## P1 — معماری محتوا بر اساس Search Intent

### خوشه ۱: انتخاب API

- بهترین API رایگان LLM برای ایران؛
- API رایگان سازگار با OpenAI؛
- API رایگان بدون کارت بانکی؛
- API رایگان برای برنامه‌نویسی؛
- API رایگان برای Embedding؛
- تفاوت Free Tier، Trial و Credit.

### خوشه ۲: صفحات مقایسه و تصمیم‌گیری

- مقایسه Providerها فقط با Evidence معتبر؛
- مقایسه محدودیت RPM/RPD/TPM؛
- Gateway رسمی در برابر Community Gateway؛
- Free models در برابر recurring credit/trial؛
- مسیر انتخاب برای MVP یا پروژهٔ دانشجویی.

### خوشه ۳: راهنماهای اجرایی

- تغییر Base URL در OpenAI SDK؛
- مدیریت چند Provider و Fallback؛
- جلوگیری از افشای API Key؛
- Rate limit / 429 handling؛
- Python و Node.js Quick Start؛
- تفسیر صحیح Iran evidence.

معیار محتوای قابل انتشار:

- پاسخ مستقیم به یک Intent مشخص؛
- Evidence یا دادهٔ Catalog به‌جای حدس؛
- لینک داخلی به مسیر بعدی کاربر؛
- تاریخ بررسی و منابع؛
- بدون Keyword stuffing یا متن کم‌ارزش؛
- عدم ساخت صفحه صرفاً برای افزایش تعداد URL.

## P1 — Optimization بر اساس دادهٔ واقعی

ترتیب اولویت:

1. Impression بالا + CTR پایین؛
2. Average Position حدود 4–20 با Intent مرتبط؛
3. Landing page دارای ترافیک ولی Conversion ضعیف؛
4. Query mismatch روشن؛
5. صفحهٔ مهم با Internal linking ضعیف.

تغییرات مجاز می‌تواند شامل Title، Meta Description، Intro، FAQ معتبر، Structured Data صحیح، Internal Links و CTA باشد؛ اما فقط وقتی Search Console/Analytics یا یک defect فنی دلیل روشن ارائه کند.

## P1 — معرفی Repository و Distribution

دارایی‌های پایه:

- توضیح یک‌خطی ثابت و شفاف؛
- Social card و Screenshot حرفه‌ای؛
- Demo کوتاه فقط برای مسیرهایی که Visual demonstration ارزش دارد؛
- متن معرفی فارسی و انگلیسی؛
- UTM contract؛
- Launch/Growth log.

کانال‌های اولویت‌دار:

1. Google organic search؛
2. GitHub README / Release / Discussion در صورت تناسب؛
3. LinkedIn فارسی و انگلیسی؛
4. Telegram؛
5. Virgool و رسانه‌های فنی فارسی؛
6. Outreach شخصی‌سازی‌شده به Maintainerها و Newsletterها؛
7. Aparat/YouTube برای Demo مفید؛
8. Product Hunt، Hacker News یا Reddit فقط با آمادگی و رعایت قوانین جاری Community.

Trackهای اجرایی موجود: `#44`، `#69` و `#235`.

## P2 — چرخهٔ رشد هفتگی

چرخهٔ ثابت:

1. Snapshot Search Console/Analytics؛
2. تشخیص حداکثر سه فرصت یا defect با بیشترین Impact؛
3. تغییر کوچک و قابل‌اندازه‌گیری؛
4. انتشار یا Optimization؛
5. ثبت Source/UTM/زمان؛
6. اندازه‌گیری 24h/72h/7d برای Campaignها یا بازهٔ مناسب برای SEO؛
7. تصمیم هفتهٔ بعد بر اساس داده.

Feature یا Provider جدید وارد این چرخه نمی‌شود مگر اینکه مالک Product Development را صریحاً باز کند.

## Change Admission Gate در دورهٔ Freeze

هر تغییر باید حداقل در یکی از این دسته‌ها باشد:

1. Security/Privacy؛
2. Production/Release reliability؛
3. Fact correction با Evidence؛
4. Indexing/Canonical/Sitemap/Structured Data defect؛
5. Search Console/Analytics-measured SEO improvement؛
6. Growth instrumentation/attribution defect؛
7. Accessibility/User-flow defect قابل بازتولید.

کارهای دیگر Deferred هستند.

## مرزهای کیفیت

- خرید Backlink، Comment spam، رأی‌گیری هماهنگ و پیام انبوه ناخواسته ممنوع است.
- دامنه اصلی تنها نسخه Indexable است؛ Mirror ایران Duplicate indexable نمی‌شود.
- آمار رشد بدون Analytics یا Search Console حدس زده نمی‌شود.
- محتوا نباید ادعای دسترسی یا سهمیه‌ای فراتر از Catalog داشته باشد.
- `unknown` با حدس پر نمی‌شود.
- Provider Expansion نباید در این فاز دوباره به Backlog فعال برگردد مگر با تصمیم صریح مالک.
