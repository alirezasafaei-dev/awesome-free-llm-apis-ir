# Runbook ادغام و انتشار موتور محتوای فارسی

## هدف

این Runbook ترتیب امن Review، Merge، Deploy و بررسی Live برای PRهای محتوای فارسی را مشخص می‌کند.

## مرزهای اجرایی

طبق `AGENTS.md`، Agent نباید:

- PR را Merge کند؛
- مستقیم به `main` Push کند؛
- Deploy تولید را اجرا کند؛
- محدودیت‌های Review یا Environment را دور بزند.

Merge و تأیید Environment باید توسط مالک Repository انجام شود. Agent می‌تواند وضعیت، تست، Diff و URLهای Live را بررسی و گزارش کند.

## ساختار PRها

### PR پایه

```text
#67 feat(growth): add Persian content acquisition engine
base: main
```

شامل:

- موتور تولید مقاله
- سه مقاله Sprint اول
- فرم گزارش دسترسی ایران
- Sitemap و Homepage integration
- تست محتوا و Production rendering

### PR دوم

```text
#68 feat(growth): add Persian Node.js, troubleshooting and conversion analytics
base: feat/persian-growth-content-engine-20260717
```

این PR به‌صورت Stacked ساخته شده است. **بعد از Merge شدن #67، Base PR #68 باید از شاخه Feature به `main` تغییر کند.**

## مرحله ۱: Review و Merge PR #67

قبل از Merge بررسی شود:

- PR باز و Mergeable است.
- Draft نیست.
- آخرین Workflow `Validate data` سبز است.
- `npm test` پاس شده است.
- Review thread حل‌نشده وجود ندارد.
- Diff شامل Secret یا فایل محلی نیست.

ترتیب محلی اختیاری برای مالک:

```bash
git fetch origin
git switch feat/persian-growth-content-engine-20260717
git pull --ff-only
npm ci
npm test
npm run site:build
```

سپس PR #67 از رابط GitHub با روش Merge مورد تأیید Repository ادغام شود.

## مرحله ۲: بررسی Deploy اول

Push به `main` باید Workflow زیر را فعال کند:

```text
Deploy VPS mirrors
```

موارد مورد انتظار:

- `privacy-check`: success
- `build`: success
- `deploy-global`: success
- `deploy-iran`: success
- `verify-mirror-consistency`: success، وقتی هر دو مقصد انتخاب شده‌اند

استقرار باید Artifact را با `npm run site:build` بسازد؛ بنابراین مقاله‌های فارسی داخل Release قرار می‌گیرند.

## مرحله ۳: Live verification برای Sprint اول

پس از پایان Deploy، روی Checkout جدید `main` اجرا شود:

```bash
git switch main
git pull --ff-only
npm ci
npm run content:fa:live:verify
```

Verifier این موارد را کنترل می‌کند:

- HTTP موفق برای هر مقاله
- Canonical صحیح
- وجود در Sitemap
- دقیقاً یک H1
- `data-guide-slug`
- `TechArticle` JSON-LD
- نبود `noindex` در Header و HTML
- شمارش صحیح `persian_article_count` در `build-meta.json`

برای Mirror ایران می‌توان Origin را تغییر داد، اما انتظار `noindex` آن Mirror با Verifier Canonical متفاوت است. Verifier پیش‌فرض فقط دامنه Canonical را بررسی می‌کند.

```bash
CONTENT_ORIGIN=https://llm.persiantoolbox.ir npm run content:fa:live:verify
```

## مرحله ۴: Retarget کردن PR #68

پس از Merge شدن #67:

1. PR #68 را باز کنید.
2. Base branch را از:

```text
feat/persian-growth-content-engine-20260717
```

به:

```text
main
```

تغییر دهید.

3. Diff را دوباره بررسی کنید.
4. باید فقط تغییرات Sprint دوم باقی بمانند:
   - دو مقاله جدید
   - Analytics conversion events
   - بسته توزیع Sprint دوم
   - قرارداد Measurement
   - Live verifier و Runbook
5. Workflow جدید باید روی Base تازه اجرا و سبز شود.

اگر PR پس از Retarget دارای Conflict یا فایل‌های تکراری شد، Merge انجام نشود؛ ابتدا Branch با `main` همگام و Diff دوباره بررسی شود.

## مرحله ۵: Merge و Deploy PR #68

پس از سبزشدن CI و Review انسانی، PR #68 Merge شود. Workflow Deploy باید دوباره اجرا شود.

پس از Deploy:

```bash
git switch main
git pull --ff-only
npm ci
npm run content:fa:live:verify
```

در این مرحله Verifier باید هر پنج مقاله را Pass کند.

## مرحله ۶: فعال‌کردن کمپین فارسی

انتشار شبکه اجتماعی فقط بعد از Pass شدن Live verifier انجام شود.

ترتیب پیشنهادی:

1. مقاله انتخاب API
2. Telegram و LinkedIn همان مقاله
3. مقاله Python
4. نسخه ویرگول مقاله اول
5. مقاله 429
6. مقاله Node.js
7. مقاله خطاهای 401/403/404

UTMها از فایل‌های زیر برداشته شوند:

- `docs/PERSIAN_CONTENT_DISTRIBUTION_PACK.fa.md`
- `docs/PERSIAN_CONTENT_DISTRIBUTION_SPRINT_2.fa.md`

## مرحله ۷: ثبت زمان و Evidence

برای هر انتشار ثبت شود:

- زمان UTC
- Canonical URL
- Public channel URL
- UTM Source/Medium/Content
- Snapshotهای 24h، 72h، 7d و 28d

قالب سنجش در:

```text
docs/PERSIAN_GROWTH_MEASUREMENT.fa.md
```

## Rollback

اگر Deploy verification شکست بخورد، Workflow موجود باید Release را Rollback کند. بعد از Rollback:

- انتشار شبکه اجتماعی متوقف شود.
- URL خراب منتشر نشود.
- Log خطا بدون Secret ثبت شود.
- مشکل در Branch جدید اصلاح و PR مستقل ساخته شود.

## Definition of Done

Sprint فقط زمانی منتشرشده محسوب می‌شود که:

- PR انسانی Merge شده باشد.
- Deploy هر مقصد موردنیاز سبز باشد.
- Live verifier دامنه Canonical را Pass کند.
- URLها در Sitemap باشند.
- Article count در Build metadata صحیح باشد.
- اولین Campaign URL با UTM ساخته شده باشد.
- زمان Snapshotهای سنجش ثبت شده باشد.
