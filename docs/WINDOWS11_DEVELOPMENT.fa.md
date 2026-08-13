# توسعه روی Windows 11

این راهنما برای توسعهٔ Native روی Windows 11 است. محیط Production همچنان Linux/VPS است و اسکریپت‌های Caddy/Nginx/SSH نباید برای Windows بازنویسی شوند.

## مسیر استاندارد

```powershell
New-Item -ItemType Directory -Force C:\asdev | Out-Null
Set-Location C:\asdev
git clone https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir.git
Set-Location C:\asdev\awesome-free-llm-apis-ir
```

پیش‌نیازها:

- Git for Windows
- Node.js 22 ترجیحی؛ حداقل نسخهٔ پشتیبانی‌ض ه 20
- npm همراه Node.js

اگر ابزاره ابزارها نصب نیستند، با `winget` از بسته‌های رسمی نصب کنید و یک PowerShell جدید باز کنید.

## Bootstrap کامل

از ریشهٔ ریپو:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\bootstrap.ps1
```

این اسکریپت نسخه‌ها و Git را بررسی می‌کند و سپس به‌ترتیب `npm ci`، `npm test`، `npm run site:build` و `npm run site:check` را اجرا می‌کند.

برای Build و اجرای لوکال:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\bootstrap.ps1 -Serve
```

یا بعد از Build:

```powershell
node .\scripts\serve-site.mjs --port 4173
```

آدرس پیش‌فرض:

`http://127.0.0.1:4173/`

سرور لوکال فقط روی loopback گوش می‌دهد و وابستگی npm اضافی ندارد.

## قواعد مهاجرت از Ubuntu

- WSL برای توسعهٔ عادی لازم نیست؛ ابتدا Native Windows را استفاده کنید.
- مسیرهای `/srv`، `systemctl`، Caddy/Nginx، `chmod/chown` و اسکریپت‌های `.sh` مربوط به Production/Linux هستند و صرفاً به‌دلیل Linux-specific بودن نباید تغییر کنند.
- اگر یک تست واقعاً روی Windows شکست خورد، ابتدا root cause را مشخص کنید؛ تست را ضعیف یا حذف نکنید.
- `.env` و credential واقعی را commit نکنید. تست‌های نیازمند credential یا موقعیت شبکه را fake نکنید.
- `node_modules`، `.site-dist` و فایل‌های machine-local نباید وارد Git شوند.

## بازیابی یک Clone موجود

قبل از هر Reset یا Clean:

```powershell
git status
git remote -v
git branch --show-current
git log -1 --oneline
```

اگر تغییر محلی وجود دارد، آن را حفظ کنید. برای Clone تمیز:

```powershell
git fetch origin
git pull --ff-only
npm ci
powershell -ExecutionPolicy Bypass -File .\scripts\windows\bootstrap.ps1
```

## Production/VPS

عملیات Production فقط از Runbookهای موجود و release workflow کنترل‌شده انجام می‌شود. روی لپ‌تاپ Windows مستقیماً فایل‌های `/srv` یا تنظیمات زندهٔ Caddy/Nginx را شبیه‌سازی یا overwrite نکنید. هر انتشار باید SHA، health check و rollback قابل اثبات داشته باشد.
