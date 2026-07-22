# راهنمای Analytics و معیارها — Awesome Free LLM APIs IR

آخرین بازبینی: ۲۰۲۶-۰۷-۲۲

## ابزار

**Plausible Analytics** به‌صورت Self-hosted و بدون Cookie برای اندازه‌گیری Aggregate سایت استفاده می‌شود.

- مسیر Tracker: same-origin در `/plausible.js`
- Site domain: `llm.persiantoolbox.ir`
- Pageview: توسط Tracker رسمی Plausible
- Product events: توسط `site/analytics.js` و تابع `plausible()`
- Tracker باید فقط یک بار در هر صفحه بارگذاری شود.
- CSP فقط باید `'self'` را در `script-src` و `connect-src` مجاز کند؛ Tracker خارجی بازنشسته شده است.
- در Caddy، مسیر `/api/event` باید داخل `route` و پیش از fallback فایل‌های استاتیک تعریف شود؛ در غیر این صورت مرتب‌سازی directiveها، POST را زودتر به 404 تبدیل می‌کند.

## وضعیت استقرار

وجود فایل و Script tag به‌تنهایی اثبات جمع‌آوری داده نیست. وضعیت Analytics فقط زمانی `verified` است که تمام موارد زیر در Production تأیید شوند:

1. Tracker با HTTP موفق بارگذاری شود.
2. درخواست Event به `/api/event` ارسال شود.
3. پاسخ Event دریافت شود و Header حذف‌شدن توسط Bot filter مشاهده نشود.
4. Pageview و حداقل یک Custom Event در Dashboard ظاهر شوند.
5. Console خطای CSP یا JavaScript نداشته باشد.

تا قبل از این بررسی، وضعیت باید `deployed_unverified` ثبت شود.

## رویدادهای تعریف‌شده

| رویداد | توضیح | Property مجاز |
|---|---|---|
| `pageview` | بازدید صفحه؛ خودکار توسط Plausible | URL و Referrer طبق Tracker |
| `provider_page_click` | کلیک روی لینک صفحه Provider | `provider_id` |
| `guide_page_click` | کلیک روی لینک Guide | `guide_slug` |
| `copy_base_url` | کپی Base URL | `provider_id` |
| `provider_docs_click` | کلیک روی مستندات رسمی | `provider_id` |
| `provider_website_click` | کلیک روی وب‌سایت Provider | `provider_id` |
| `github_click` | کلیک روی GitHub | `page_type` |
| `catalog_download` | بازکردن یا دریافت Catalog JSON | `page_type` |
| `persian_campaign_landing` | ورود از کمپین‌های `persian_growth` یا `offsite_articles` | `campaign`، `guide_slug`، `source`، `medium` و `content` |

مقادیر Property در سمت Client به رشته‌های کوتاه و غیرحساس محدود می‌شوند. متن جست‌وجو، Base URL کپی‌شده، کلید، Header، IP، Query دلخواه کاربر یا محتوای Clipboard به‌عنوان Property ارسال نمی‌شود.

## حریم خصوصی

- Cookie یا شناسه دائمی مرورگر توسط پیاده‌سازی پروژه ایجاد نمی‌شود.
- Plausible برای شمارش بازدیدکننده یکتا، IP و User-Agent موجود در Request را به‌صورت موقت پردازش می‌کند و شناسه روزانه با Salt چرخشی می‌سازد؛ مقدار خام نباید در Log یا Database تحلیلی ذخیره شود.
- داده‌ها برای تحلیل Aggregate ترافیک استفاده می‌شوند، نه ساخت پروفایل فردی یا Cross-site tracking.
- دسترسی به Dashboard باید محدود به مالک یا افراد مجاز باشد.
- Retention، Backup و دسترسی Instance Self-hosted باید در سطح سرور جداگانه ممیزی شوند.

## داشبوردهای پیشنهادی

### داشبورد Acquisition

- Organic landing pages
- Referrerها
- UTM campaignها
- Provider و Guide landing pages

### داشبورد Product

- `provider_docs_click`
- `copy_base_url`
- `provider_page_click`
- `guide_page_click`
- `github_click`
- `catalog_download`

### API و Export

Plausible می‌تواند Stats API و Export آماری ارائه کند؛ در دسترس‌بودن آن به نسخه و تنظیمات Instance بستگی دارد. نباید بدون بررسی Instance ادعا شود که API یا Export وجود ندارد.

## کنترل Production

پس از اعمال CSP روی هر دو Server:

```text
script-src 'self'
connect-src 'self'
```

موارد زیر بررسی شوند:

- Home page فقط یک Tracker دارد.
- Provider و Guide pages نیز Tracker و `analytics.js` را بارگذاری می‌کنند.
- یک کلیک آزمایشی Event تولید می‌کند.
- Event در Dashboard ثبت می‌شود.
- Analytics failure مانع Render یا Navigation سایت نمی‌شود.
- Iran mirror همچنان `noindex, nofollow` باقی می‌ماند.

## منابع فنی

- Plausible custom events documentation
- Plausible Events API reference
- Plausible security and data-handling documentation

گزارش هفتگی فقط از داده واقعی Dashboard و Search Console تهیه می‌شود. مقدار ناموجود باید `not_available` ثبت شود و نباید تخمین یا جعل شود.
