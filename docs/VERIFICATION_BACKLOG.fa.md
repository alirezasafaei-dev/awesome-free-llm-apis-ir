# Backlog اجرایی راستی‌آزمایی ایران

مرجع ماشین‌خوان این Backlog فایل [`data/verification-backlog.json`](../data/verification-backlog.json) است. این فایل باید دقیقاً با Providerهایی که در Catalog وضعیت `unknown` دارند هم‌راستا بماند.

## مسیرهای اجرایی

| Issue | وضعیت | دامنه |
|---|---|---|
| #32 | بخشی انجام‌شده | تکمیل Hardening و بازبینی دسترسی میزبان اعتبارسنجی |
| #33 | باز | درخواست واقعی مدل برای پنج Provider وابسته به دسترسی حساب |
| #34 | تکمیل‌شده | مستندسازی موانع Signup و الزامات هویتی |
| #35 | بخشی انجام‌شده | ثبت ASN مسیر دوم ایران و تکمیل ماتریس مستقل شبکه |

## Providerهای باقی‌مانده

- `agnes-ai`
- `fireworks-ai`
- `freetheai`
- `nvidia-nim`
- `vercel-ai-gateway`

ModelScope و SiliconFlow دیگر `unknown` نیستند و به‌دلیل مانع ثبت‌نام مستند، `signup_blocked` هستند.

## قواعد اجرا

- `unknown` تا زمان وجود Evidence کافی حفظ می‌شود.
- `live_test` با `connectivity_test` یکسان نیست؛ Reachability به‌تنهایی موفقیت مدل را ثابت نمی‌کند.
- تست مستقیم، ماتریس شبکه و اعتبارسنجی Credential نتیجه‌های مستقل هستند.
- خطای 401، 403، 429، DNS، Timeout یا Connection refused به‌تنهایی اثبات محدودیت جغرافیایی نیست.
- کنترل‌های Signup، هویت، پرداخت یا محدودیت‌های پلتفرم دور زده نمی‌شوند.
- اطلاعات حساب، Header، متن پاسخ، نشانی کامل شبکه و جزئیات اتصال منتشر نمی‌شوند.
- هر تغییر Provider باید خروجی‌های Generated را بازسازی و `npm test` را سبز نگه دارد.

## کنترل Drift

```bash
npm run verification:backlog:test
```

این کنترل بخشی از `npm test` است. وقتی وضعیت یک Provider تغییر می‌کند، همان PR باید ورودی آن Provider را از Backlog حذف یا اصلاح کند.
