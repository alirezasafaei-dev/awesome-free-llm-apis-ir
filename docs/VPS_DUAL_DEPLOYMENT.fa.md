# انتشار دوگانه روی VPS خارج و ایران

این راهنما انتشار مستقل وب‌سایت `awesome-free-llm-apis-ir` را روی دو سرور توضیح می‌دهد. هیچ فایل یا Process مربوط به PersianToolbox، ASDEV یا AuditSystems تغییر نمی‌کند.

| نقش | دامنه | IP | SSH | وب‌سرور |
|---|---|---|---|---|
| اصلی جهانی | `llm.persiantoolbox.ir` | `91.107.153.223` | `asdev@...:22` | Caddy |
| آینهٔ ایران | `ir.llm.persiantoolbox.ir` | `193.93.169.32` | `ubuntu@...:22` | Nginx |

نسخهٔ جهانی Canonical است. آینهٔ ایران Header برابر `X-Robots-Tag: noindex, nofollow` برمی‌گرداند تا محتوای تکراری وارد نتایج جست‌وجو نشود. GitHub Pages نیز به‌عنوان نسخهٔ پشتیبان مستقل باقی می‌ماند.

## مدل انتشار

هر Build با SHA کامل Git در مسیر زیر Extract می‌شود:

```text
/srv/awesome-free-llm-apis-ir/
├── current -> releases/<sha>-<timestamp>
├── previous -> releases/<previous-sha>-<timestamp>
└── releases/
```

پس از اعتبارسنجی `index.html`، `catalog.json` و `build-meta.json`، لینک `current` به‌صورت اتمیک جابه‌جا می‌شود. Workflow سپس دامنهٔ عمومی را بررسی می‌کند؛ اگر SHA منتشرشده دیده نشود، اسکریپت Rollback اجرا و Job ناموفق اعلام می‌شود. پنج Release آخر نگهداری می‌شوند و نسخه‌های `current` و `previous` هرگز در Cleanup حذف نمی‌شوند.

## ۱. آماده‌سازی کاربر و مسیر انتشار

روی سرور خارج:

```bash
sudo install -d -o asdev -g asdev -m 0755 /srv/awesome-free-llm-apis-ir
sudo -u asdev install -d -m 0755 /srv/awesome-free-llm-apis-ir/releases
```

روی سرور ایران:

```bash
sudo install -d -o ubuntu -g ubuntu -m 0755 /srv/awesome-free-llm-apis-ir
sudo -u ubuntu install -d -m 0755 /srv/awesome-free-llm-apis-ir/releases
```

برای اولین بار یک Release اولیه باید توسط Workflow منتشر شود؛ تا قبل از آن Root وب‌سرور خالی است.

## ۲. کلید اختصاصی GitHub Actions

برای هر سرور یک کلید Ed25519 جداگانه بسازید. از کلید شخصی روزمره یا یک کلید مشترک میان دو سرور استفاده نکنید. Private Key را در Terminal، Issue، Commit یا پیام عمومی چاپ نکنید.

Public Key سرور خارج باید فقط به `~asdev/.ssh/authorized_keys` و Public Key سرور ایران فقط به `~ubuntu/.ssh/authorized_keys` اضافه شود. Permissionها:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Fingerprint کلید میزبان SSH را از Console خود VPS یا یک نشست ازقبل‌اعتمادشده تأیید کنید. خروجی تأییدشدهٔ `ssh-keyscan` برای همان IP در Secret مربوط به `SSH_KNOWN_HOSTS` قرار می‌گیرد؛ خروجی تأییدنشده را کورکورانه قبول نکنید.

## ۳. GitHub Environments و Secrets

در مخزن، دو Environment بسازید:

- `production-global`
- `production-iran`

در هر Environment دقیقاً این دو Secret را با مقدار مخصوص همان سرور قرار دهید:

| Secret | مقدار |
|---|---|
| `SSH_PRIVATE_KEY` | Private Key اختصاصی Deployment همان سرور |
| `SSH_KNOWN_HOSTS` | Host key تأییدشدهٔ IP همان سرور |

لینک تنظیمات:

`https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/settings/environments`

## ۴. تنظیم Caddy سرور خارج

فایل مرجع: `deploy/caddy/llm.persiantoolbox.ir.caddy`

روی سرور خارج و داخل Clone موقت همین ریپو:

```bash
sudo install -d -m 0755 /etc/caddy/sites-enabled
sudo install -m 0644 deploy/caddy/llm.persiantoolbox.ir.caddy /etc/caddy/sites-enabled/llm.persiantoolbox.ir.caddy
grep -qF 'import /etc/caddy/sites-enabled/*' /etc/caddy/Caddyfile || echo 'import /etc/caddy/sites-enabled/*' | sudo tee -a /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/sites-enabled/llm.persiantoolbox.ir.caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy پس از دسترسی صحیح پورت‌های ۸۰ و ۴۴۳، گواهی TLS را خودکار دریافت می‌کند. قبل از Reload، `caddy validate` باید موفق باشد.

## ۵. تنظیم Nginx و TLS سرور ایران

فایل مرجع: `deploy/nginx/ir.llm.persiantoolbox.ir.conf`

```bash
sudo install -m 0644 deploy/nginx/ir.llm.persiantoolbox.ir.conf /etc/nginx/sites-available/ir.llm.persiantoolbox.ir.conf
sudo ln -sfn /etc/nginx/sites-available/ir.llm.persiantoolbox.ir.conf /etc/nginx/sites-enabled/ir.llm.persiantoolbox.ir.conf
sudo nginx -t
sudo systemctl reload nginx
```

پس از پاسخ HTTP صحیح، TLS را با ایمیل واقعی مالک فعال کنید:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ir.llm.persiantoolbox.ir --redirect
sudo nginx -t
sudo systemctl reload nginx
```

اگر UFW فعال است، فقط پورت‌های موردنیاز را باز کنید:

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## ۶. اولین انتشار

از Actions، Workflow با نام **Deploy VPS mirrors** را اجرا و ابتدا Target را جداگانه انتخاب کنید:

1. `global`
2. پس از موفقیت کامل، `iran`
3. در اجراهای بعدی `both`

انتشار هم‌زمان اولیه توصیه نمی‌شود؛ خطاهای Permission، TLS یا Host key باید برای هر سرور جدا تشخیص داده شوند.

## ۷. معیار پذیرش

برای هر دامنه:

```bash
curl -fsS https://DOMAIN/build-meta.json
curl -fsS https://DOMAIN/catalog.json
curl -fsSI https://DOMAIN/
```

- `source_revision` باید با SHA اجرای Workflow برابر باشد.
- `provider_count` باید عدد مثبت باشد.
- HTTPS باید بدون Redirect loop و خطای گواهی کار کند.
- دامنهٔ ایران باید `X-Robots-Tag: noindex, nofollow` داشته باشد.
- دامنهٔ اصلی باید Canonical و Sitemap را به `llm.persiantoolbox.ir` اشاره دهد.
- GitHub Pages باید همچنان مستقل قابل دسترسی باشد.

پس از دو اجرای دستی موفق، می‌توان Trigger انتشار VPS را از `workflow_dispatch` به Push روی `main` گسترش داد. این تغییر باید در PR جدا انجام شود تا انتشار Production بدون اثبات اولیه خودکار نشود.

## ۸. مانیتور هفتگی سلامت

یک systemd timer روی سرور ایران (`ubuntu@193.93.169.32`) نصب شده که هر دوشنبه ساعت ۰۶:۰۰ تهران موارد زیر را بررسی می‌کند:

- وضعیت nginx و fail2ban
- وجود فایل‌های `build-meta.json` و `catalog.json`
- آمار مسدودیت‌های fail2ban
- مصرف دیسک و RAM

جزئیات کامل در [WEEKLY_MONITOR.fa.md](WEEKLY_MONITOR.fa.md).

## قواعد ایمنی

- Private Key، Password، Token و محتوای `.env` هرگز در Git قرار نمی‌گیرد.
- Workflow دسترسی `sudo` ندارد و فقط مسیر اختصاصی `/srv/awesome-free-llm-apis-ir` را مدیریت می‌کند.
- کلید هر Environment فقط به همان VPS دسترسی دارد.
- فایل‌های PersianToolbox و Virtual Hostهای موجود Overwrite نمی‌شوند.
- تغییر Caddy/Nginx فقط پس از Validation و با Reload انجام می‌شود، نه Restart کورکورانه.
- اگر Health Check شکست خورد، علت اصلی از Log خوانده می‌شود؛ Re-run بی‌پایان جایگزین رفع علت نیست.
