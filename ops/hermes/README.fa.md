# راه‌اندازی Pilot امن Hermes روی سرور اتوماسیون

این Runbook، Hermes را برای پروژه `awesome-free-llm-apis-ir` به‌صورت محافظت‌شده آماده می‌کند. در فاز نخست، Hermes فقط تحقیق عمومی، تشخیص Drift، اجرای تست‌ها و گزارش‌سازی انجام می‌دهد.

## معماری Pilot

```text
AUTOMATION_HOST / dedicated user
├── pinned Hermes Agent source
├── ~/.hermes/config.yaml
├── provider-evidence-ir skill
├── isolated Docker terminal
├── project worktree
└── read-only daily drift cron

OWNER_PC / authorized Iran runners
└── direct Iran, ASN, VPN, signup and credential checks (human-only)
```

سرور اتوماسیون خارجی مجاز نیست نتیجهٔ دسترسی مستقیم ایران تولید کند.

## ۱. پیش‌نیازهای میزبان

روی سرور:

- یک کاربر Linux جدا و بدون دسترسی root دائمی؛
- Git، Bash، Curl، Docker، Node.js 20+ و npm؛
- حداقل 2 CPU، چهار گیگابایت RAM و ده گیگابایت فضای آزاد؛
- عدم Mount کردن مسیرهای Production، SSH یا Secretهای دیگر پروژه‌ها در Workspace؛
- خروجی اینترنت برای مستندات عمومی و GitHub.

نمونهٔ ساخت کاربر باید توسط مدیر سرور و خارج از Hermes انجام شود. Pilot را با root اجرا نکنید.

## ۲. Bootstrap

پس از Merge شدن PR مربوط به این Pilot، با کاربر اختصاصی اجرا کنید:

```bash
git clone https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir.git
cd awesome-free-llm-apis-ir
bash ops/hermes/bootstrap-automation-host.sh
```

Bootstrap اقدامات زیر را انجام می‌دهد:

1. Hermes را از Commit کامل و Pin‌شده نصب می‌کند؛
2. نسخهٔ نصب‌شده را کنترل می‌کند؛
3. Config محافظت‌شده را بدون Overwrite کردن Config موجود نصب می‌کند؛
4. Skill پروژه را در `~/.hermes/skills/` قرار می‌دهد؛
5. Workspace پروژه را Clone/به‌روزرسانی می‌کند؛
6. `npm ci` و تمام `npm test` را اجرا می‌کند؛
7. هیچ Credential، Cron، Gateway، Deploy یا تست زنده‌ای را خودکار فعال نمی‌کند.

## ۳. تنظیم مدل

بعد از Bootstrap:

```bash
hermes setup
hermes doctor
```

Credential مدل را فقط در Credential Store خود Hermes یا فایل خصوصی با Permission برابر `0600` نگه دارید. Credential را در Repo، `AGENTS.md`، `.hermes.md`، Issue یا Log وارد نکنید.

در مرحلهٔ اول از مدل/حساب دارای سقف هزینه مشخص استفاده کنید. Cron باید Provider و Model مشخص و تأییدشده داشته باشد تا تغییر مدل اصلی باعث هزینهٔ ناخواسته نشود.

## ۴. دسترسی GitHub

### فاز مشاهده

حداقل Permission:

- Metadata: Read
- Contents: Read
- Issues: Read
- Pull requests: Read
- Actions: Read

توکن GitHub را به Docker terminal ارسال نکنید. GitHub write access در فاز مشاهده لازم نیست.

### فاز Draft PR

فقط بعد از چند اجرای موفق:

- Contents: Read and Write
- Pull requests: Read and Write

موارد زیر همچنان ممنوع بمانند:

- Administration
- Actions/Workflow write
- Secrets write
- Merge خودکار
- Push مستقیم یا Force Push روی `main`

## ۵. تست دستی Job قبل از زمان‌بندی

از داخل Workspace پروژه:

```bash
hermes
```

در Chat از Hermes بخواهید:

```text
Read AGENTS.md and use provider-evidence-ir. Run a read-only provider drift audit. Do not edit files, use credentials, run live Iran/VPN tests, create a PR, or deploy anything.
```

خروجی باید Sanitized باشد و تغییرات Workspace صفر بماند:

```bash
git status --short
```

## ۶. فعال‌سازی Cron خواندنی

پس از تأیید تست دستی:

```bash
bash ops/hermes/enable-readonly-drift-cron.sh
hermes cron list
hermes cron run "LLM provider drift read-only"
```

این Job روزانه اجرا می‌شود و فقط:

- مستندات عمومی First-party را بررسی می‌کند؛
- `upstreams:check`، `check:freshness` و `npm test` را اجرا می‌کند؛
- Conflict و Unknown را گزارش می‌دهد؛
- برای تغییر وضعیت ایران، فقط `live_verification_required` اعلام می‌کند.

Cron اجازهٔ ویرایش، Credential، Live Test، Branch، PR، Merge یا Deploy ندارد.

## ۷. Gateway

پس از موفقیت اجرای دستی Cron، Gateway را فقط برای همان کاربر نصب کنید:

```bash
hermes gateway install
hermes cron status
```

از نصب System/root service در Pilot خودداری کنید. اتصال Telegram نیز بعد از تأیید Sanitization گزارش‌ها انجام شود.

## ۸. ارتقا به Draft PR

ارتقا فقط وقتی مجاز است که:

- چند اجرای Read-only بدون تخلف انجام شده باشد؛
- `npm test` پایدار باشد؛
- GitHub Token محدود و قابل Rotation آماده باشد؛
- PR همچنان Draft و بدون Auto-merge باشد؛
- Provider access از ایران به‌صورت خودکار تغییر نکند؛
- Owner ارتقا را صریحاً تأیید کند.

## ۹. تست‌های ایران و VPN

این موارد روی AUTOMATION_HOST اجرا نمی‌شوند:

- Direct Iran verification
- Independent ASN matrix
- Authorized VPN matrix
- Signup/CAPTCHA/KYC
- Provider credential validation

این نتایج باید از Runner درست، با اجرای انسانی و خروجی Sanitized وارد Workflow شوند. IP، Hostname، Username، Header، Token و Raw body منتشر نشود.

## ۱۰. توقف و Rollback

```bash
hermes cron pause "LLM provider drift read-only"
hermes cron list
```

برای حذف Job پس از بررسی:

```bash
hermes cron remove "LLM provider drift read-only"
```

برای توقف Gateway از فرمان‌های رسمی نسخهٔ نصب‌شده استفاده کنید و ابتدا `hermes gateway --help` را بررسی کنید. Config موجود توسط Bootstrap Overwrite نمی‌شود و Workspace کثیف نیز به‌صورت خودکار Update نخواهد شد.
