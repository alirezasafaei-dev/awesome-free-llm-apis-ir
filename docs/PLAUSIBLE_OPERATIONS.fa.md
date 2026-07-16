# راهنمای عملیاتی امن Plausible CE

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

این سند قرارداد عملیاتی Analytics پروژه را تعریف می‌کند. هیچ Password، IP، نام کاربری زیرساخت، Session، Token یا مقدار `.env` نباید در Repository، Issue یا گزارش عمومی ثبت شود.

## معماری مورد انتظار

- Tracker از مسیر همان دامنه Canonical یعنی `/plausible.js` بارگذاری می‌شود.
- Eventها روی دامنه Canonical به `/api/event` ارسال می‌شوند.
- Caddy فقط همین مسیر Event را به سرویس Plausible روی Loopback Proxy می‌کند.
- Dashboard و Registration نباید مستقیماً روی IP عمومی و HTTP بدون TLS در دسترس باشند.
- آینه ایران Analytics را ذخیره نمی‌کند و `/api/event` را صریحاً با پاسخ بدون محتوا خاتمه می‌دهد.

## Bootstrap امن حساب مالک

1. هر Credential آزمایشی یا Credentialی که در Chat، Log یا گزارش دیده شده است Compromised فرض شود و استفاده نشود.
2. برای اولین حساب مالک یک Password کاملاً جدید و یکتا در Password Manager ساخته شود.
3. Dashboard فقط با یکی از روش‌های زیر باز شود:
   - دامنه مدیریتی HTTPS با TLS معتبر و Access control؛ یا
   - SSH tunnel به Listener خصوصی Loopback.
4. پس از ساخت حساب و افزودن دامنه `llm.persiantoolbox.ir`، Registration عمومی محدود شود:
   - `DISABLE_REGISTRATION=true` برای انسداد کامل؛ یا
   - `DISABLE_REGISTRATION=invite_only` در صورت نیاز به دعوت کنترل‌شده.
5. سرویس پس از تغییر Environment با روش استاندارد Compose بازسازی یا Restart کنترل‌شده شود.
6. ورود مجدد مالک، Sessionها و امکان بازیابی حساب بررسی شود.
7. 2FA فعال و Recovery codeها خارج از Repository نگهداری شوند.

## تنظیمات حساس

این مقادیر فقط در Secret file، Docker secret یا Secret Manager خصوصی قرار می‌گیرند:

- `SECRET_KEY_BASE`
- Database credentials
- SMTP credentials
- Dashboard owner password
- TOTP encryption material
- هر Token مدیریتی یا API key

فایل `.env` و Compose override خصوصی نباید Commit شوند.

## تأیید ثبت Event

وجود HTTP `202` به‌تنهایی اثبات ثبت Event نیست.

برای تأیید کامل باید همه موارد زیر برقرار باشند:

- Tracker با HTTP موفق و MIME صحیح JavaScript دریافت شود.
- Console خطای CSP یا JavaScript نداشته باشد.
- POST به `/api/event` پاسخ موفق دریافت کند.
- Header یا علامت Dropped نشان‌دهنده حذف Event نباشد.
- Pageview در Dashboard دیده شود.
- حداقل یک Custom Event در Dashboard دیده شود.
- Propertyهای Event فقط شامل شناسه‌های Sanitized مانند `provider_id`، `guide_slug` یا `page_type` باشند.

تا پیش از مشاهده Dashboard، وضعیت باید یکی از موارد زیر باشد:

```text
not_configured
event_network_reachable_dashboard_pending
event_network_verified_dashboard_blocked
verified
```

## Hardening بعد از Bootstrap

- Registration عمومی بسته یا Invite-only شود.
- Dashboard پشت HTTPS قرار گیرد.
- Listener داخلی Plausible فقط روی Loopback یا Network خصوصی Bind شود.
- Port داخلی Dashboard در Firewall عمومی باز نباشد.
- حساب مالک 2FA داشته باشد.
- Credential افشاشده Rotate شود.
- Sessionهای قدیمی Review و در صورت نیاز Revoke شوند.
- Backup پایگاه Metadata و ClickHouse آزمایش شود.
- Updateهای Plausible CE ابتدا در محیط کنترل‌شده بررسی شوند.

## وضعیت آینه ایران

آینه ایران برای جلوگیری از Duplicate index همچنان باید Header زیر را داشته باشد:

```text
X-Robots-Tag: noindex, nofollow
```

Analytics آینه عمداً غیرفعال است؛ این تصمیم باید در تست Deployment و مستندات حفظ شود مگر اینکه یک طراحی جداگانه و Privacy-reviewed برای اندازه‌گیری آن تصویب شود.
