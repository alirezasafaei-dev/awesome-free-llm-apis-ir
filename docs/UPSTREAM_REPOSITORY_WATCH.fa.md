# پایش Repositoryهای بالادستی

## هدف

این مکانیزم تغییرات منابع مرجع GitHub را به‌صورت هفتگی کشف می‌کند تا اضافه‌شدن Provider، تغییر Free Tier، حذف مدل، تغییر احراز هویت یا تغییر ماهیت یک Gateway از دید نگهدارندگان پنهان نماند.

پایش **فقط هشدار می‌دهد** و هیچ فایل Provider، جدول README یا `catalog.json` را خودکار تغییر نمی‌دهد.

## منابع و سطوح اعتماد

فهرست ماشین‌خوان در [`data/upstreams.json`](../data/upstreams.json) نگهداری می‌شود.

| Tier | کاربرد | نمونه |
|---:|---|---|
| 1 | مرجع انسانی با سیگنال بالا | `cheahjs/free-llm-api-resources`، `mnfst/awesome-free-llm-apis` |
| 2 | دیتاست خودکار یا سرویس/Gateway قابل بررسی | `open-free-llm-api/awesome-freellm-apis`، FreeTheAI، Pollinations |
| 3 | Proxy، Session Bridge و رادار نوسان | `gpt4free`، FreeLLMAPI، `g4f-working` |

Tier میزان اعتماد به **کشف تغییر** را نشان می‌دهد، نه صحت قطعی ادعا. حتی Tier 1 نیز پیش از ورود به Catalog باید با مستندات رسمی Provider تطبیق داده شود.

## Workflow

فایل [`.github/workflows/upstream-watch.yml`](../.github/workflows/upstream-watch.yml) هر سه‌شنبه اجرا می‌شود و مراحل زیر را انجام می‌دهد:

1. اجرای تست‌های Fixture برای منطق مقایسه.
2. بازیابی آخرین Snapshot از GitHub Actions Cache.
3. دریافت metadata، Head SHA و SHA فایل‌های حساس از GitHub API.
4. مقایسه Snapshot جدید با اجرای قبلی.
5. ذخیرهٔ گزارش Markdown و Snapshot JSON به‌عنوان Artifact سی‌روزه.
6. ایجاد یا به‌روزرسانی یک Issue یکتا فقط در صورت تغییر معنادار.

تغییر Head بدون تغییر فایل‌های حساس صرفاً در بخش اطلاعاتی گزارش می‌شود و Issue ایجاد نمی‌کند.

## تغییر معنادار چیست؟

- اضافه یا حذف‌شدن یک upstream از Registry
- تغییر یا مفقودشدن فایل حساس مانند README، دیتاست یا CHANGELOG
- تغییر Default Branch یا Ref تحت پایش
- Archive یا Disable شدن Repository

## اجرای محلی

تست بدون شبکه:

```bash
npm run upstreams:test
```

اجرای واقعی با GitHub API:

```bash
GITHUB_TOKEN=ghp_xxx npm run upstreams:check
```

Token اختیاری است، اما اجرای بدون Token سریعاً به محدودیت عمومی GitHub API می‌رسد. Token فقط در Header درخواست استفاده می‌شود و در Snapshot، گزارش یا Log نوشته نمی‌شود.

خروجی‌ها:

```text
artifacts/upstream-report.md
artifacts/upstream-snapshot.json
.cache/upstreams/previous.json
```

برای ساخت baseline تازه، فایل `.cache/upstreams/previous.json` را حذف و دستور را دوباره اجرا کنید. اجرای baseline Issue تغییرات ایجاد نمی‌کند.

## چک‌لیست بررسی هشدار

پس از دریافت Issue خودکار:

1. Diff upstream و Commit مرتبط را بررسی کنید.
2. ادعای Free Tier را در مستندات رسمی Provider پیدا کنید.
3. Trial، اعتبار اولیه و سهمیه دائمی را از هم جدا کنید.
4. نیاز به کارت، پرداخت، شماره تلفن، Discord یا OAuth را ثبت کنید.
5. سازگاری OpenAI را با endpoint و نمونه رسمی تأیید کنید.
6. وضعیت ایران را فقط با سیاست رسمی یا تست تاریخ‌دار تغییر دهید.
7. Proxy و Session Bridge را وارد Catalog اصلی نکنید.
8. پس از تغییر داده‌ها `npm run generate` و `npm test` را اجرا کنید.

## افزودن Upstream جدید

هر رکورد باید این فیلدها را داشته باشد:

- `repository`: نام کامل `owner/repo`
- `role`: نقش منبع در فرایند کشف
- `trust_tier`: عدد ۱ تا ۳
- `classification`: نوع Repository یا سرویس
- `paths`: فایل‌های حساس و محدود برای پایش
- `review_policy`: سیاست پذیرش ادعاهای آن منبع
- `notes_fa`: توضیح فارسی برای نگهدارندگان

مسیرها باید نسبی باشند و استفاده از مسیر مطلق یا `..` توسط تست رد می‌شود.

## امنیت و حریم خصوصی

- Workflow فقط `contents: read` و `issues: write` دارد.
- هیچ Secret خارجی در فایل‌ها یا Artifact ذخیره نمی‌شود.
- متن کامل فایل‌های upstream دریافت یا منتشر نمی‌شود؛ فقط SHA فایل‌ها ثبت می‌شود.
- Snapshot شامل metadata عمومی Repository است.
- هیچ ادعایی بدون بازبینی انسانی وارد Catalog نمی‌شود.

## توقف یا بازیابی

برای توقف موقت، Schedule فایل Workflow را حذف یا Workflow را از رابط GitHub Actions غیرفعال کنید. برای بازیابی، Workflow را فعال و یک اجرای دستی انجام دهید؛ اگر Cache منقضی شده باشد، اجرای نخست baseline جدید می‌سازد.
