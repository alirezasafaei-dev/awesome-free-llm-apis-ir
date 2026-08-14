# راهنمای عملیات Discover — لینک‌های ریلز اینستاگرام

این راهنما فقط برای `llm.persiantoolbox.ir` و سرویس مستقل Discover همین repository است.

## هدف عملیاتی

بعد از activation اولیه، اضافه‌کردن یا ویرایش ابزار، آیکون، توضیح، لینک، ترتیب نمایش، Featured، Publish/Unpublish و حذف از پنل ادمین انجام می‌شود و **برای تغییر محتوای کاتالوگ build/deploy سایت لازم نیست**.

## آدرس‌ها

- عمومی: `https://llm.persiantoolbox.ir/discover/`
- ادمین: `https://llm.persiantoolbox.ir/discover/admin/`
- API عمومی: `/discover/api/tools`
- Health: `/discover/api/health`
- آیکون برند محلی: `/discover/api/icons/simple-icons/<key>.svg`

## معماری

- HTML/CSS/JS عمومی و ادمین داخل release استاتیک سایت قرار می‌گیرند.
- سرویس داینامیک Node.js فقط روی `127.0.0.1:8003` اجرا می‌شود.
- Caddy درخواست‌های `/discover/api/*` را فقط به loopback proxy می‌کند و `/discover/admin/*` و API ادمین را با Basic Auth محافظت می‌کند.
- SQLite در `/var/lib/persiantoolbox-discover/discover.sqlite3` قرار دارد و مستقل از release استاتیک است.
- کد سرویس در `/opt/persiantoolbox-discover/current` قرار می‌گیرد.
- تنظیمات خصوصی سرویس در `/etc/persiantoolbox-discover/` نگه داشته می‌شوند.
- runtime سرویس از `node:http`، `node:sqlite` و داده محلی `simple-icons` استفاده می‌کند؛ هیچ icon CDN/API خارجی در مسیر request وجود ندارد.
- Admin برای drag-and-drop از SortableJS self-hosted در `/discover/admin/vendor/sortable.min.js` استفاده می‌کند؛ فیلد عددی `sort_order` همیشه fallback دستی باقی می‌ماند.

## مدل آیکون

آیکون دیگر داخل badge ذخیره نمی‌شود. دو field مستقل وجود دارد:

- `icon_provider`: در این فاز فقط `simple-icons` یا `generic`
- `icon_key`: کلید معتبر provider؛ برای `generic` مقدار `sparkles`

DBهای قدیمی به‌صورت additive migrate می‌شوند. اگر badge قدیمی `icon:<value>` وجود داشته باشد، فقط همان metadata به fieldهای جدید منتقل و از badgeها حذف می‌شود؛ badgeهای عادی حفظ می‌شوند.

برای `simple-icons`، sidecar فقط داده package محلی و lockfile-resolved را می‌خواند و یک SVG حداقلی same-origin می‌سازد. key ناشناخته یا نامعتبر به remote proxy/fetch تبدیل نمی‌شود. UI در خطای icon از asset محلی `/discover/assets/sparkles.svg` استفاده می‌کند.

## Dependency policy

Policy رسمی در این فایل است:

`docs/superpowers/specs/2026-08-14-oss-dependency-policy-design.md`

در cycle فعلی فقط این OSSها مجاز شده‌اند:

- `simple-icons` با نسخه دقیق lockfile برای brand icon data سرویس
- `sortablejs` با نسخه دقیق lockfile برای interaction ادمین و asset self-hosted

React/Vue/Next/Tailwind/Bootstrap/Prisma/Supabase/Firebase/Astro/Fuse/Alpine/Iconify runtime در scope این release نیستند. production page نباید dependency CDN داشته باشد.

## تست واحد Discover

Source of truth تست این feature:

```bash
npm ci
npm run discover:test
```

`discover:test` قراردادهای DB/migration، API/security، public/admin UI، icon endpoint، Sortable asset، Caddy، service/install و workflow deployment را اجرا می‌کند. Workflow `Discover pilot smoke` نیز همین command را روی Node 22 اجرا می‌کند.

برای release کامل، gateهای عادی repository همچنان لازم‌اند:

```bash
npm test
npm run site:build
npm run site:check
```

هیچ provider date/evidence برای سبزکردن این تست‌ها نباید بدون evidence معتبر تغییر کند.

## پیش‌نیاز activation اولیه

- Node.js `22.13+` روی VPS canonical/global.
- دسترسی sudo برای systemd/Caddy و directoryهای سرویس.
- Caddy فعال برای `llm.persiantoolbox.ir`.
- secretهای خصوصی در GitHub Environment `production-global`:
  - `SSH_PRIVATE_KEY`
  - `SSH_KNOWN_HOSTS`
  - `SSH_HOST`
  - `SSH_USER`
  - `SSH_PORT`
  - `DISCOVER_ADMIN_USER`
  - `DISCOVER_ADMIN_PASSWORD_HASH`
  - `DISCOVER_ADMIN_PASSWORD`

`DISCOVER_ADMIN_PASSWORD_HASH` باید bcrypt متناظر با plaintext ادمین باشد. هیچ‌یک از این مقادیر نباید در Git، issue، PR، artifact عمومی یا log منتشر شوند.

## Workflow کنترل‌شده deployment

فایل:

`.github/workflows/deploy-discover.yml`

ویژگی‌ها:

- فقط `workflow_dispatch`؛ trigger خودکار push/PR ندارد.
- فقط environment `production-global`.
- Node 22 + `npm ci` + `npm run discover:test` + build verification قبل از mutation سرور.
- package محدود شامل Discover service/deploy/Caddy و `node_modules/simple-icons` است؛ روی VPS `npm install` اجرا نمی‌شود.
- SSH فقط با known-host pinning، `BatchMode=yes` و `StrictHostKeyChecking=yes`.
- installer sidecar را اتمیک فعال و DB موجود را قبل از release backup می‌کند.
- Caddy credentialها در EnvironmentFile خصوصی سرور قرار می‌گیرند.
- health loopback/public و challenge/credential ادمین بعد از activation بررسی می‌شوند.
- staging و SSH material موقت پاک می‌شوند.

## عملیات روزانه از پنل ادمین

برای یک ریلز جدید:

1. وارد `/discover/admin/` شوید.
2. «ابزار جدید» را انتخاب کنید.
3. نام، slug پایدار، توضیح فارسی، URL HTTPS، پلتفرم، دسته، capabilities و badgeها را وارد کنید.
4. برای آیکون، `generic:sparkles` یا یک key معتبر Simple Icons انتخاب کنید.
5. ابزار را ابتدا Draft ذخیره و مقصد را بررسی کنید.
6. Published را فعال و ذخیره کنید؛ رکورد بدون deploy در `/discover/` ظاهر می‌شود.

برای ترتیب:

- روش سریع: دستگیره هر ردیف را drag کنید؛ Admin ترتیب را به integerهای deterministic تبدیل و با API ذخیره می‌کند.
- fallback: مقدار `sort_order` را دستی ویرایش کنید.

برای حذف موقت Published را خاموش کنید. Delete حذف دائمی است و UI confirmation صریح می‌گیرد.

## قرارداد امنیتی

- فقط مقصد `https://` پذیرفته می‌شود و URL دارای username/password رد می‌شود.
- فقط رکورد Published از API عمومی برمی‌گردد.
- mutation ادمین علاوه بر Basic Auth به `application/json`، `X-Discover-CSRF: 1` و same-origin semantics نیاز دارد.
- CORS permissive فعال نیست.
- `icon_key` فقط slug محدود است؛ raw SVG/HTML/data URI/remote URL از Admin پذیرفته نمی‌شود.
- SVG برند فقط از package trusted محلی تولید می‌شود و script/event/foreignObject از ورودی کاربر وارد آن نمی‌شود.
- CSP فعلی same-origin باقی می‌ماند؛ هیچ CDN جدیدی اضافه نشده است.
- دیتابیس/credential داخل static release یا response عمومی قرار نمی‌گیرند.

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

`/discover/admin/` بدون credential باید `401` و Basic Auth challenge بدهد.

## Backup / rollback

installer قبل از تغییر service release از DB موجود backup timestamped می‌گیرد و تعداد backupهای pre-release را محدود نگه می‌دارد. DB اصلی:

`/var/lib/persiantoolbox-discover/discover.sqlite3`

rollback کد سرویس نباید این DB را حذف یا recreate کند. migration icon additive است. اگر health release جدید fail شود، installer symlink کد را به release قبلی برمی‌گرداند.

## Analytics

صفحه عمومی eventهای coarse زیر را دارد:

- `discover_view`
- `discover_tool_click`
- `discover_search`
- `discover_filter`
- `discover_persiantoolbox_click`

عبارت خام جستجو یا URL مقصد به property analytics فرستاده نمی‌شود و client برای analytics شناسه پایدار، `localStorage` یا `sessionStorage` ایجاد نمی‌کند.

## Phase 1 و mirror ایران

Source of truth داینامیک این pilot فقط canonical/global یعنی `llm.persiantoolbox.ir` است. mirror ایران نباید DB، credential یا sidecar مستقل Discover داشته باشد. asset استاتیک mirror فقط به canonical هدایت می‌شود.

## Definition of Done اولین release

- `npm run discover:test` و gateهای الزامی repository سبز باشند.
- sidecar فقط روی `127.0.0.1:8003` باشد.
- SQLite persistent و خارج از static release باشد.
- Health داخلی/خارجی سبز باشد.
- Admin پشت Basic Auth باشد.
- Create/Edit/Publish/Public visibility/Unpublish/Delete روی production واقعاً اثبات شود.
- Icon schema جدید، local brand icon و generic fallback کار کنند.
- drag ordering و fallback دستی کار کنند.
- routine content CRUD همچنان zero-deploy باشد.
- mirror ایران data plane مستقل نداشته باشد.
- release revision و rollback boundary طبق `AGENTS.md` verify شوند.
