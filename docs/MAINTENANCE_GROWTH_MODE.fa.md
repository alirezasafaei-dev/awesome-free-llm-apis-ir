# حالت نگه‌داری و رشد پروژه

آخرین تصمیم مالک: ۲۰۲۶-۰۸-۰۷

## وضعیت فعلی

این پروژه آرشیو نشده است. Repository، سایت اصلی، آینهٔ ایران، CI، مسیر Release و نگه‌داری داده‌ها فعال می‌مانند؛ اما توسعهٔ محصول و گسترش تعداد Providerها در این فاز متوقف است.

اولویت فعال پروژه از این تاریخ:

1. SEO فنی و Google Search Console؛
2. بهبود محتوای موجود بر اساس Query و دادهٔ واقعی؛
3. توزیع و بازاریابی قابل‌اندازه‌گیری و غیر Spam؛
4. امنیت و حریم خصوصی؛
5. پایداری Production و Release؛
6. اصلاح واقعیت‌های قدیمی یا نادرست فقط با Evidence کافی.

## کارهای فریز شده

تا زمانی که مالک صریحاً توسعه را دوباره باز نکند، موارد زیر انجام نمی‌شوند:

- افزودن Provider جدید صرفاً برای افزایش تعداد Catalog؛
- ادامهٔ هدف عددی ۵۰ Provider؛
- Feature جدید بدون Evidence از نیاز کاربر یا دادهٔ Growth؛
- Redesign یا تغییر UX بر اساس سلیقه؛
- Benchmark expansion مستقل؛
- اجرای برنامهٔ جدید احراز هویت Providerها فقط برای کامل‌کردن Coverage؛
- Research انسانی UX مگر اینکه دادهٔ Search Console/Analytics یا مشکل تکرارشونده آن را توجیه کند.

Providerهای فعلی که مقدار `unknown` دارند با همان وضعیت صادقانه باقی می‌مانند. Freeze نباید `unknown` را به ادعای مثبت یا منفی تبدیل کند.

## تغییرات مجاز در دورهٔ Freeze

یک تغییر فقط وقتی وارد Backlog فعال می‌شود که حداقل یکی از این شروط را داشته باشد:

1. رفع آسیب‌پذیری، Credential incident یا مشکل Privacy؛
2. رفع اختلال Production، Deploy، Rollback یا Release gate؛
3. اصلاح یک Fact منتشرشده که با Evidence معتبر قدیمی یا نادرست بودن آن ثابت شده است؛
4. رفع مشکل Indexing، Canonical، Sitemap، Structured Data، robots یا Crawlability؛
5. بهبود SEO که بر Search Console یا Analytics واقعی متکی است؛
6. رفع نقص Attribution، UTM یا Growth instrumentation؛
7. رفع Accessibility/User-flow defect که قابل بازتولید و مستند است.

هر کار دیگر Deferred است مگر اینکه مالک Repository به‌صورت صریح Product Development را دوباره فعال کند.

## مسیر اصلی Growth

Issue اصلی اجرای این فاز: `#235` — 90-day SEO, Search Console and distribution program.

Trackهای اجرایی موجود:

- `#44` — Launch / Distribution؛
- `#69` — Persian Campaign 1؛
- `#235` — برنامهٔ ۹۰روزه Growth؛
- `#155` — Security credential lifecycle، مستقل و P0؛
- `#195` — Production hardening، مستقل و P0 تا رفع وابستگی خارجی مستندشده.

## قواعد SEO و بازاریابی

- دامنهٔ اصلی تنها نسخهٔ Canonical و Indexable است؛ آینهٔ ایران باید `noindex` بماند.
- خرید Backlink، Comment spam، ارسال انبوه پیام ناخواسته و رأی‌گیری هماهنگ ممنوع است.
- محتوای جدید فقط برای Intent واقعی و ارزش روشن کاربر ساخته می‌شود؛ افزایش مصنوعی تعداد URL هدف نیست.
- ادعاهای Provider، سهمیه، دسترسی ایران یا محدودیت‌ها نباید از Catalog و Evidence تاریخ‌دار فراتر بروند.
- هر Campaign باید UTM مشخص و Snapshot قابل‌اندازه‌گیری داشته باشد.
- نبود دسترسی به Analytics یا Search Console به معنی صفر نیست؛ با `UNAVAILABLE — ACCESS REQUIRED` ثبت می‌شود.

## چرخهٔ تصمیم‌گیری

هر هفته داده‌های زیر بررسی می‌شوند:

- Organic impressions و clicks؛
- CTR و Average Position بر اساس Query و Landing Page؛
- Indexed-page delta و Indexing errors؛
- Campaign landing events بر اساس Source؛
- تبدیل Guide به Finder / Provider / Official Docs، در صورت دسترسی؛
- Referral و مشارکت GitHub، در صورت قابل‌اندازه‌گیری بودن؛
- صفحات پربازدید شکسته یا قدیمی.

اولویت تغییرات بعدی از این داده‌ها تعیین می‌شود، نه از ترجیح ظاهری.

## بازگشایی توسعه

Product Development فقط با تصمیم صریح مالک باز می‌شود. در آن زمان Issueهای Deferred می‌توانند به‌صورت انتخابی و بر اساس Search demand، User demand، Security need یا ارزش عملی Provider دوباره باز شوند. هدف قدیمی ۵۰ Provider به‌صورت خودکار برنمی‌گردد.

## منابع

- `docs/SEO_GROWTH_ROADMAP.fa.md`
- `docs/GROWTH_90_DAY_EXECUTION.fa.md`
- `docs/superpowers/specs/2026-08-07-maintenance-growth-mode-design.md`
- `docs/superpowers/plans/2026-08-07-maintenance-growth-mode.md`
