# Provider editorial content

این پوشه محتوای تحریریه‌ای صفحات Provider را نگهداری می‌کند. داده‌های factual و Evidence همچنان فقط در `data/providers/` قرار می‌گیرند.

## فایل‌ها

برای هر Provider حداکثر یک فایل با نام زیر ایجاد کنید:

```text
content/providers/<provider-id>.json
```

نام فایل و `provider_id` باید با شناسه موجود در Catalog یکسان باشند.

Schema:

```text
schema/provider-content.schema.json
```

## مرز داده و محتوا

در این فایل‌ها نباید مقدار سهمیه، وضعیت ایران، مدل فعال، نیاز به پرداخت یا نتیجه تست جدید ساخته یا بازتعریف شود. این موارد از رکورد Provider و Evidence تاریخ‌دار خوانده می‌شوند.

محتوای این پوشه فقط شامل موارد زیر است:

- توضیح هدف استفاده؛
- مراحل ثبت‌نام بر اساس منبع رسمی؛
- نمونه درخواست امن با placeholder؛
- خطاهای رایج و روش رفع آن‌ها؛
- مواردی که Provider انتخاب مناسبی نیست؛
- لینک به راهنماهای داخلی؛
- تاریخ بازبینی محتوا.

## الزامات امنیتی

- هیچ API Key، Token، Cookie، Session، IP، ایمیل شخصی یا شناسه حساب ثبت نشود.
- نمونه کد باید از متغیر محیطی یا placeholder واضح استفاده کند.
- `source_url` باید HTTPS و رسمی باشد.
- تاریخ منبع یا محتوا نمی‌تواند از `verification.last_checked` Provider جدیدتر باشد؛ ابتدا Evidence را به‌روزرسانی کنید.

## اعتبارسنجی

```bash
npm run content:providers:validate
npm run content:providers:test
npm run content:audit -- --json
npm test
```

## نمونه ساختار

```json
{
  "schema_version": "1.0.0",
  "provider_id": "provider-id",
  "intent_fa": "توضیح دقیق درباره نوع پروژه و نیت کاربر...",
  "signup_steps_fa": [
    "ورود از لینک رسمی ثبت‌نام...",
    "ساخت و نگهداری امن کلید..."
  ],
  "first_request": {
    "language": "curl",
    "code": "curl ... $LLM_API_KEY ...",
    "notes_fa": "توضیح محدودیت‌های نمونه و placeholderها...",
    "source_url": "https://docs.example.com/quickstart",
    "checked_at": "YYYY-MM-DD"
  },
  "common_errors": [
    {
      "code": "401",
      "title_fa": "عنوان خطا",
      "resolution_fa": "راه‌حل پاک‌سازی‌شده و قابل اجرا",
      "source_url": "https://docs.example.com/errors",
      "checked_at": "YYYY-MM-DD"
    }
  ],
  "when_not_to_use_fa": [
    "شرایطی که این سرویس گزینه مناسبی نیست"
  ],
  "related_guides": [
    "openai-sdk-custom-base-url"
  ],
  "last_reviewed": "YYYY-MM-DD"
}
```
