# راهنمای عملیات Discover — لینک‌های ریلز اینستاگرام

این بخش یک کاتالوگ داینامیک برای لینک ابزارهایی است که در ریلزهای PersianToolbox معرفی می‌شوند.

## هدف عملیاتی

بعد از نصب اولیه، اضافه‌کردن یا ویرایش ابزار، توضیح، لینک، ترتیب نمایش، Featured و Publish/Unpublish فقط از پنل ادمین انجام می‌شود و **هیچ build یا deploy سایت برای تغییر محتوا لازم نیست**.

## آدرس‌ها

- عمومی: `https://llm.persiantoolbox.ir/discover/`
- ادمین: `https://llm.persiantoolbox.ir/discover/admin/`
- API عمومی: `/discover/api/tools`
- Health: `/discover/api/health`

## معماری

- HTML/CSS/JS عمومی و ادمین داخل release استاتیک سایت قرار می‌گیرند.
- سرویس داینامیک مستقل با Node.js روی `127.0.0.1:8003` اجرا می‌شود.
- Caddy درخواست‌های `/discover/api/*` را فقط به loopback proxy می‌کند.
- SQLite در `/var/lib/persiantoolbox-discover/discover.sqlite3` است؛ خارج از `/srv/awesome-free-llm-apis-ir/current` و در نتیجه مستقل از deploy/rollback استاتیک.
- واحد systemd: `deploy/discover/persiantoolbox-discover.service`.
- کد سرویس در `/opt/persiantoolbox-discover/current` قرار می‌گیرد.
- تنظیمات خصوصی سرویس در `/etc/persiantoolbox-discover/` نگه داشته می‌شوند.

## پیش‌نیاز نصب اولیه

- Node.js `22.13+` روی VPS canonical/global.
- دسترسی sudo برای نصب systemd unit و ساخت user/directoryهای سرویس.
- Caddy فعال برای `llm.persiantoolbox.ir`.
- مقدار واقعی Basic Auth باید فقط در environment خصوصی سرویس Caddy تنظیم شود:
  - `DISCOVER_ADMIN_USER`
  - `DISCOVER_ADMIN_PASSWORD_HASH`

این مقادیر نباید در Git، issue، PR، log یا فایل عمومی ذخیره شوند. Hash رمز را روی سرور با ابزار مورد اعتماد Caddy تولید کنید و plaintext را در repository ننویسید.

## نصب اولیه — ترتیب کنترل‌شده

1. از revision مورد نظر checkout/package بگیرید و فقط `services/discover/` و unit مربوط را به یک release directory جدید زیر `/opt/persiantoolbox-discover/releases/` منتقل کنید.
2. user سیستمی غیر-login به نام `persiantoolbox-discover` بسازید، اگر از قبل وجود ندارد.
3. مسیر `/var/lib/persiantoolbox-discover` را با مالکیت سرویس و permission محدود بسازید.
4. مسیر `/etc/persiantoolbox-discover` را با permission محدود بسازید.
5. symlink `/opt/persiantoolbox-discover/current` را اتمیک به release جدید تغییر دهید.
6. فایل `persiantoolbox-discover.service` را در systemd نصب، `daemon-reload` و سرویس را enable/start کنید.
7. روی خود VPS بررسی کنید که `http://127.0.0.1:8003/discover/api/health` دقیقاً `{ "ok": true }` برگرداند.
8. environment خصوصی Caddy برای Basic Auth را تنظیم کنید؛ سپس config را validate و reload کنید.
9. public health و صفحه `/discover/` را از بیرون smoke-test کنید.
10. `/discover/admin/` بدون credential باید challenge احراز هویت بدهد و با credential معتبر پنل باز شود.

## عملیات روزانه از پنل ادمین

برای یک ریلز جدید:

1. وارد `/discover/admin/` شوید.
2. «ابزار جدید» را بزنید.
3. نام، slug پایدار، توضیح فارسی، لینک HTTPS، پلتفرم، دسته، قابلیت‌ها، badgeها و تاریخ آخرین تست را وارد کنید.
4. ابزار را ابتدا به‌صورت Draft ذخیره کنید.
5. لینک و متن را بررسی کنید.
6. گزینه Published را فعال و ذخیره کنید.
7. ابزار بدون deploy در `/discover/` ظاهر می‌شود.

برای برداشتن یک لینک از دید عموم، Published را خاموش کنید. در Phase 1 پنل روی lifecycle غیرمخرب طراحی شده و Unpublish روش استاندارد خروج از صفحه عمومی است.

## قرارداد داده و ایمنی

- فقط URL با `https://` پذیرفته می‌شود.
- URL دارای username/password رد می‌شود.
- فقط رکورد Published از API عمومی برمی‌گردد.
- mutationهای ادمین علاوه بر Basic Auth، `Content-Type: application/json` و `X-Discover-CSRF: 1` و same-origin semantics را enforce می‌کنند.
- CORS permissive فعال نیست.
- اطلاعات دیتابیس یا credential در response عمومی منتشر نمی‌شود.
- فایل APK یا binary اپ‌های دیگر در این سیستم میزبانی نمی‌شود؛ فقط لینک مقصد نگه داشته می‌شود.

## Health و عیب‌یابی

روی VPS:

```bash
systemctl status persiantoolbox-discover --no-pager
journalctl -u persiantoolbox-discover -n 100 --no-pager
curl -fsS http://127.0.0.1:8003/discover/api/health
```

از بیرون:

```bash
curl -fsS https://llm.persiantoolbox.ir/discover/api/health
curl -I https://llm.persiantoolbox.ir/discover/
```

در خروجی عمومی نباید path دیتابیس، stack trace یا credential دیده شود.

## Backup

قبل از هر migration یا تغییر schema، سرویس را در یک پنجره کوتاه کنترل‌شده متوقف کنید یا از روش backup سازگار با SQLite استفاده کنید و یک نسخه timestamped از database به محل خصوصی backup بگیرید. فایل backup نباید در web root یا Git قرار گیرد.

حداقل invariant بازیابی:

- database اصلی: `/var/lib/persiantoolbox-discover/discover.sqlite3`
- rollback سایت استاتیک نباید این فایل را حذف یا جایگزین کند.
- restore فقط با انتخاب صریح backup مورد نظر انجام شود؛ restore خودکار روی DB سالم ممنوع است.

## Analytics

صفحه عمومی eventهای coarse زیر را می‌فرستد:

- `discover_view`
- `discover_tool_click`
- `discover_search`
- `discover_filter`

عبارت خام جستجو و URL مقصد به‌عنوان property analytics ارسال نمی‌شوند.

## Phase 1 و mirror ایران

Source of truth این pilot فقط canonical/global یعنی `llm.persiantoolbox.ir` است. mirror ایران نباید API یا پنل مستقل داشته باشد. در صورت انتشار asset استاتیک روی mirror، client به canonical هدایت می‌شود و هیچ دیتابیس/credential/sidecar جدا روی mirror نصب نمی‌شود.

## Definition of Done برای اولین release

- سرویس فقط روی loopback گوش می‌دهد.
- Health داخلی و خارجی سبز است.
- `/discover/` صفحه عمومی را لود می‌کند و داده را از API می‌گیرد.
- `/discover/admin/` پشت Basic Auth است.
- Create/Edit/Publish/Unpublish از پنل کار می‌کند.
- بعد از یک deploy استاتیک آزمایشی، رکوردهای DB بدون تغییر باقی می‌مانند.
- هیچ credential یا DB داخل release artifact قرار ندارد.

هر merge/release production همچنان باید طبق `AGENTS.md` و runbookهای repository با verification و rollback boundary انجام شود.
