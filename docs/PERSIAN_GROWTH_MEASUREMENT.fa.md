# قرارداد سنجش رشد محتوای فارسی

## هدف

اندازه‌گیری مسیر واقعی زیر، بدون جمع‌آوری اطلاعات شخصی:

```text
کانال فارسی
   ↓
Landing روی مقاله
   ↓
حرکت به Catalog یا Provider
   ↓
کلیک به GitHub
   ↓
گزارش دسترسی یا مشارکت
```

این سند معیارهای ساده، Eventهای Plausible و روش ثبت نتیجه کمپین را تعریف می‌کند.

## Eventهای اصلی

### `persian_campaign_landing`

زمانی ارسال می‌شود که `utm_campaign=persian_growth` باشد.

Properties مجاز:

- `guide_slug`
- `source`
- `medium`
- `content`

مقادیر فقط وقتی ثبت می‌شوند که شامل حروف، عدد، خط تیره یا زیرخط و حداکثر ۶۴ کاراکتر باشند. Queryهای آزاد یا مقادیر دارای داده شخصی ثبت نمی‌شوند.

### `guide_catalog_click`

کلیک کاربر از یک مقاله به بخش Catalog اصلی.

Properties:

- `guide_slug`

### `github_click`

کلیک مقاله، Provider یا صفحه اصلی به GitHub.

Properties:

- `page_type`
- `guide_slug` در صورت وجود

### `iran_access_report_click`

کلیک مستقیم روی فرم گزارش دسترسی Provider از ایران.

Properties:

- `guide_slug`

### Eventهای موجود

- `guide_page_click`
- `provider_page_click`
- `provider_docs_click`
- `provider_website_click`
- `copy_base_url`
- `catalog_download`

## UTM استاندارد

```text
utm_source=<channel>
utm_medium=<article|social|video>
utm_campaign=persian_growth
utm_content=<article_or_creative_id>
```

مقادیر پیشنهادی Source:

- `virgool`
- `telegram`
- `linkedin`
- `aparat`
- `instagram`
- `github`

نمونه:

```text
https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=nodejs_integration
```

## KPIهای هفتگی

### ۱. Landingهای کمپین

تعداد Eventهای `persian_campaign_landing` بر اساس Source و مقاله.

### ۲. نرخ مقاله به Catalog

```text
Guide Catalog CTR = guide_catalog_click / article pageviews
```

### ۳. نرخ مقاله به GitHub

```text
Guide GitHub CTR = github_click from guide / article pageviews
```

### ۴. نرخ علاقه به گزارش ایران

```text
Iran Report Intent Rate = iran_access_report_click / article pageviews
```

کلیک به فرم با ثبت Issue نهایی یکسان نیست. ثبت واقعی Issue باید جدا از GitHub شمارش شود.

### ۵. مشارکت واقعی

- Issue جدید معتبر
- PR جدید معتبر
- گزارش دسترسی قابل استفاده
- Star جدید
- Contributor جدید

## پنجره بررسی

برای هر انتشار این Snapshotها ثبت شوند:

- ۲۴ ساعت
- ۷۲ ساعت
- ۷ روز
- ۲۸ روز

برای محتوای SEO، قضاوت اصلی نباید فقط بر اساس ۲۴ ساعت اول باشد. داده Search معمولاً به بازه طولانی‌تر نیاز دارد.

## قالب ثبت کمپین

```markdown
## Campaign: <article slug>

- Published UTC: YYYY-MM-DDTHH:MM:SSZ
- Canonical URL: https://...
- Channel URL: https://...
- Source: telegram | virgool | linkedin | aparat | instagram
- Medium: social | article | video
- Content ID: ...

### 24h
- Landing events:
- Article pageviews:
- Catalog clicks:
- GitHub clicks:
- Iran report clicks:
- Valid issues/PRs:

### 72h
- Landing events:
- Article pageviews:
- Catalog clicks:
- GitHub clicks:
- Iran report clicks:
- Valid issues/PRs:

### 7d
- Landing events:
- Article pageviews:
- Catalog clicks:
- GitHub clicks:
- Iran report clicks:
- Valid issues/PRs:
```

## تصمیم‌گیری بر اساس داده

### مقاله Pageview دارد ولی کلیک Catalog کم است

- CTA را واضح‌تر کنید.
- لینک Catalog را نزدیک پاسخ اصلی قرار دهید.
- مثال Provider واقعی و تاریخ‌دار اضافه کنید.
- عنوان CTA را از عبارت عمومی به اقدام مشخص تغییر دهید.

### مقاله Catalog click دارد ولی GitHub click کم است

- دلیل مشارکت را توضیح دهید.
- فرم گزارش ایران را مستقیم لینک کنید.
- نشان دهید گزارش کاربر چگونه وارد داده پروژه می‌شود.
- CTA را به پایان مقاله محدود نکنید.

### Landing یک کانال پایین است

- Hook و عنوان را بازنویسی کنید.
- زمان انتشار و تناسب کانال را بررسی کنید.
- متن کوتاه باید یک نکته مستقل داشته باشد، نه فقط تبلیغ لینک.

### Landing خوب ولی Retention پایین است

- پاسخ مستقیم را در ابتدای مقاله بیاورید.
- مقدمه را کوتاه کنید.
- Table of contents یا تیترهای روشن اضافه کنید.
- نمونه‌کد را زودتر نمایش دهید.

## قواعد حریم خصوصی

- هیچ User ID، ایمیل، IP، API Key یا شناسه حساب در Event properties ثبت نشود.
- UTMهای دارای داده آزاد یا کاراکترهای غیرمجاز نادیده گرفته شوند.
- Prompt و پاسخ مدل وارد Analytics نشوند.
- گزارش عمومی فقط Aggregate باشد.
- URLهای دارای Token یا Query حساس در سند کمپین ثبت نشوند.

## Definition of Done برای یک انتشار

- URL اصلی Live و Canonical است.
- UTM کانال صحیح است.
- `persian_campaign_landing` دریافت می‌شود.
- CTA Catalog و GitHub قابل کلیک است.
- فرم گزارش ایران فعال است.
- زمان انتشار UTC ثبت شده است.
- Snapshotهای ۲۴h، ۷۲h و ۷d برنامه‌ریزی شده‌اند.
