# نقشهٔ راه پروژه

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

این سند منبع اصلی اولویت‌های پروژه است. نقشه تخصصی رشد در [`docs/SEO_GROWTH_ROADMAP.fa.md`](SEO_GROWTH_ROADMAP.fa.md) نگهداری می‌شود.

## وضعیت پایه

- ۲۲ Provider در Catalog اصلی
- ۸ ابزار، Proxy، Router و Session Bridge در Catalog مستقل
- ۹ Provider با درخواست واقعی موفق از ایران
- ۵ Provider با مسدودیت جغرافیایی تأییدشده
- ۲ Provider با مانع ثبت‌نام یا تأیید حساب
- ۱ Provider با عدم پشتیبانی رسمی ایران
- ۵ Provider با وضعیت دسترسی ایران نامشخص
- قرارداد Schema، Validator، Privacy و Backlog در CI فعال است

## تصمیم راهبردی

تعداد Providerهای موجود برای نسخهٔ اول کافی است. افزودن انبوه API متوقف می‌شود و تمرکز اصلی به این ترتیب تغییر می‌کند:

1. سایت زنده پایدار و سریع
2. ایندکس‌پذیری و SEO فنی
3. صفحات و محتوای پاسخ‌دهنده به Intent فارسی
4. اندازه‌گیری رشد و ترافیک ارگانیک
5. معرفی حرفه‌ای سایت و Repository

Provider جدید فقط در صورت ارزش عملی متمایز، Free Tier اثبات‌شده و داده کامل پذیرفته می‌شود.

## P0 — سایت زنده و SEO فنی

وضعیت: **در حال اجرا**

کارهای اصلی:

- تولید صفحه HTML مستقل و Canonical برای هر Provider
- Sitemap پویا و لینک داخلی Crawlable
- Metadata یکتا، Open Graph و Structured Data
- حفظ دامنه اصلی به‌عنوان تنها نسخه Indexable
- حفظ `noindex` روی Mirror ایران
- کنترل تعداد صفحات و Sitemap در CI
- ثبت Google Search Console و Bing Webmaster Tools
- اتصال Analytics حریم‌خصوصی‌محور و Eventهای اصلی
- پایش Coverage، Canonical و Core Web Vitals

Track اجرایی: Issue #42

معیار خروج:

- صفحه اصلی و همه صفحات Provider در Build تولید شوند
- URLهای Sitemap از دامنه اصلی پاسخ معتبر بگیرند
- صفحات در Search Console Discover شوند
- Duplicate indexable میان دامنه‌ها وجود نداشته باشد
- Baseline داده‌های رشد ثبت شود

## P1 — محتوای SEO فارسی

وضعیت: **برنامه‌ریزی‌شده**

- راهنماهای انتخاب API بر اساس کاربرد و محدودیت
- صفحات مقایسه تولیدشده از Catalog
- راهنماهای OpenAI SDK، Base URL، Fallback و امنیت Key
- لینک داخلی میان Guideها و صفحات Provider
- استفاده از Queryهای Search Console برای اولویت‌بندی محتوا
- جلوگیری از صفحات کم‌ارزش، تکراری یا Keyword stuffing

Track اجرایی: Issue #43

## P1 — معرفی و رشد Repository

وضعیت: **برنامه‌ریزی‌شده**

- تکمیل پیام فارسی و انگلیسی پروژه
- Screenshot، Social card و Demo کوتاه
- بهینه‌سازی README، GitHub Topics و Release
- معرفی در LinkedIn، X، ویرگول و جوامع فنی مرتبط
- Outreach هدفمند برای Mention و Backlink معتبر
- استفاده از UTM و Analytics برای سنجش هر کانال
- ممنوعیت خرید Backlink و Spam

Track اجرایی: Issue #44

## نگهداری داده و امنیت

این Trackها ادامه دارند، اما مانع اجرای برنامه رشد نمی‌شوند مگر ریسک امنیتی یا خرابی داده ایجاد کنند:

- Issue #32: Hardening نهایی میزبان
- Issue #33: تعیین تکلیف پنج Provider وابسته به حساب
- Issue #35: تکمیل ماتریس شبکه
- Issue #39: بررسی Timeout مسیر دوم LLM7.io و OVHcloud
- بازبینی دوره‌ای سهمیه، مدل، کارت بانکی و شرایط ثبت‌نام
- پایش Upstream و Repository Audit

اعتبارسنجی Credential از مسیر غیرایرانی به معنی تکمیل ماتریس VPN نیست. Reachability نیز به معنی موفقیت مدل نیست.

## P2 — توسعه محصول

بعد از ایجاد Baseline ترافیک و Indexing:

- صفحه مستقل Tools و Repository Audits
- Feed تغییرات Catalog
- مقایسه‌های تعاملی و URLهای Shareable
- نسخه انگلیسی کامل صفحات اصلی
- گسترش بنچمارک فارسی فقط در صورت داشتن تقاضای واقعی

## ترتیب اجرای فعلی

1. تکمیل و Deploy زیرساخت SEO صفحات Provider
2. اجرای Issue #42 و ثبت Baseline Search/Analytics
3. انتشار خوشه اول محتوای فارسی در Issue #43
4. اجرای بسته معرفی و توزیع در Issue #44
5. تکمیل Trackهای امنیت و Verification باقی‌مانده
6. توسعه قابلیت‌های محصول بر اساس دادهٔ استفاده واقعی
