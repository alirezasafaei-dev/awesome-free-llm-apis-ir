# Backlog اجرایی راستی‌آزمایی ایران

مرجع ماشین‌خوان این Backlog فایل [`data/verification-backlog.json`](../data/verification-backlog.json) است. این فایل باید دقیقاً با Providerهایی که در Catalog وضعیت `unknown` دارند هم‌راستا بماند.

## مسیرهای فعال

| Issue | اولویت | دامنه |
|---|---|---|
| #32 | P0 | بازبینی و سخت‌سازی دسترسی میزبان اعتبارسنجی |
| #33 | P0 | تکمیل تست چهار Provider وابسته به دسترسی حساب |
| #34 | P1 | مستندسازی موانع Signup و الزامات هویتی سه Provider |
| #35 | P0 | اجرای مسیر مستقیم با ASN مستقل و ماتریس جداگانه VPN |

## Providerهای باقی‌مانده

- `agnes-ai`
- `fireworks-ai`
- `freetheai`
- `modelscope`
- `nvidia-nim`
- `siliconflow`
- `vercel-ai-gateway`

## قواعد اجرا

- `unknown` تا زمان وجود Evidence کافی حفظ می‌شود.
- تست مستقیم، تست VPN و اعتبارسنجی دسترسی حساب سه نتیجه مستقل هستند.
- خطای `401`، `403`، `429`، DNS یا Timeout به‌تنهایی اثبات محدودیت جغرافیایی نیست.
- کنترل‌های Signup، هویت، پرداخت یا محدودیت‌های پلتفرم دور زده نمی‌شوند.
- اطلاعات حساب، Header، متن پاسخ، نشانی کامل شبکه و جزئیات اتصال منتشر نمی‌شوند.
- هر تغییر Provider باید خروجی‌های Generated را بازسازی و `npm test` را سبز نگه دارد.

## کنترل Drift

دستور زیر بررسی می‌کند که فهرست Backlog دقیقاً با مجموعه Providerهای `unknown` برابر باشد و شمارنده‌ها یا Issueهای اجرایی از Catalog جدا نشوند:

```bash
npm run verification:backlog:test
```

این کنترل بخشی از `npm test` است. وقتی وضعیت یک Provider تغییر می‌کند، همان PR باید ورودی آن Provider را از Backlog حذف یا اصلاح کند.
