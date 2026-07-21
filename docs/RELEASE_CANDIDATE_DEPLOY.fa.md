# راهنمای نهایی Release Candidate و استقرار

این Runbook برای انتشار یک Revision مشخص و قابل‌ردیابی طراحی شده است. هیچ «آخرین نسخه»، Branch شناور یا نتیجه حدسی نباید جای SHA کامل را بگیرد.

## اصل غیرقابل‌مذاکره

یک Release فقط زمانی قابل استقرار است که:

1. SHA کامل ۴۰ کاراکتری آن ثبت شده باشد؛
2. تمام Gateهای محلی و GitHub Actions روی همان SHA موفق باشند؛
3. `build-meta.json` هر Target دقیقاً همان SHA را گزارش کند؛
4. Smoke و UX Smoke روی نسخه Deploy‌شده موفق باشند؛
5. در صورت شکست یا عدم تطابق، انتشار Rollback شود و نتیجه موفق اعلام نشود.

موفق بودن CI به‌تنهایی به معنی موفق بودن Production نیست.

## مرحله ۱ — تثبیت Candidate

```bash
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
```

خروجی `git status --short` باید خالی باشد. SHA را در متغیر زیر نگه دارید:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
test "${#RELEASE_SHA}" -eq 40
```

قبل از ادامه، هیچ Pull Request باز و Mergeable مرتبط با Release نباید باقی مانده باشد. اگر PR جدیدی Merge شد، Candidate قبلی باطل است و مراحل باید با SHA جدید تکرار شوند.

## مرحله ۲ — Gate محلی واحد

```bash
npm ci
npm run release:check -- --revision="$RELEASE_SHA"
```

این فرمان موارد زیر را روی همان Revision اجرا می‌کند:

- کل Test suite؛
- Build Production با `SOURCE_REVISION` مشخص؛
- قرارداد Built site؛
- Regression check؛
- SEO سخت‌گیرانه؛
- قراردادهای Deploy و Rollback؛
- تست Smoke checker و UX Smoke checker.

پس از Build، فایل زیر باید دقیقاً Candidate را گزارش کند:

```bash
node -e '
  const fs = require("node:fs");
  const meta = JSON.parse(fs.readFileSync(".site-dist/build-meta.json", "utf8"));
  if (meta.source_revision !== process.env.RELEASE_SHA) process.exit(1);
  console.log(meta);
' 
```

برای فرمان بالا، `RELEASE_SHA` را Export کنید:

```bash
export RELEASE_SHA
```

## مرحله ۳ — بررسی GitHub Actions همان SHA

روی Commit Candidate، Checkهای الزامی زیر باید موفق باشند:

- `Validate data / validate`
- `Validate data / privacy-check`
- `Validate data / build`
- `SEO PR gate` در صورت وجود PR

Check نهایی `build` فقط وقتی موفق می‌شود که:

- سایت با SHA دقیق ساخته شود؛
- GitHub Pages artifact با Action واقعی ساخته شود؛
- VPS artifact ساخته و SHA-256 آن ثبت شود؛
- Artifact با `download-artifact` واقعی دریافت شود؛
- Hash، Tar archive، Shell syntax و `build-meta.json` دوباره اعتبارسنجی شوند.

Branch protection یا Required check را برای عبور سریع‌تر غیرفعال نکنید.

## مرحله ۴ — استقرار همان SHA

Push به `main` باید Workflowهای زیر را برای همان SHA اجرا کند:

- `Deploy website`
- `Deploy VPS mirrors`

در صورت اجرای دستی، Workflow را از Ref همان Candidate اجرا کنید؛ نه از Branch یا Commit دیگری.

Targetهای Production:

- Global canonical: `https://llm.persiantoolbox.ir/`
- Iran mirror: `https://ir.llm.persiantoolbox.ir/`
- GitHub Pages: `https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/`

Workflow VPS باید هر دو Mirror را به‌صورت Atomic منتشر کند، Headerهای Canonical/Iran را کنترل کند و در شکست Verify، Rollback را اجرا کند.

## مرحله ۵ — Post-launch Operations با Revision اجباری

Workflow زیر را Dispatch کنید:

```text
Workflow: Post-launch operations
target: all
expected_revision: <RELEASE_SHA>
```

بدون `expected_revision`، اجرای نهایی Release قابل‌قبول نیست.

این Workflow باید موارد زیر را Pass کند:

- Build و Regression؛
- Production smoke؛
- Production UX smoke؛
- Provider endpoint health؛
- Provider documentation drift؛
- Strict SEO.

در صورت شکست، Issue خودکار Operations را بررسی کنید. گزارش شکست را حذف یا دور نزنید.

## مرحله ۶ — تأیید مستقیم Revision و Policy

برای هر سه Target، `build-meta.json` باید `source_revision` برابر `RELEASE_SHA` داشته باشد. JSON endpointها نباید HTML fallback برگردانند.

موارد ضروری:

- Global canonical نباید `X-Robots-Tag: noindex` داشته باشد؛
- Iran mirror باید `X-Robots-Tag: noindex` داشته باشد؛
- Homepage، `/en/`، API Finder، Quick Start فارسی و انگلیسی، Compare، Tools و Provider pages باید قابل دسترس باشند؛
- `catalog.json`، `catalog-tools.json`، `data.json`، Sitemap و Robots باید Content-Type و محتوای معتبر داشته باشند؛
- یک مسیر ساختگی باید 404 واقعی برگرداند، نه Homepage fallback.

## مرحله ۷ — تصمیم Go/No-Go

### GO

فقط وقتی اعلام شود که:

- تمام Gateهای Candidate سبز هستند؛
- هر سه Target همان SHA را سرو می‌کنند؛
- Post-launch Operations با `target=all` و `expected_revision` همان SHA موفق است؛
- هیچ Incident باز ناشی از Release وجود ندارد.

### NO-GO و Rollback

در یکی از شرایط زیر Release موفق نیست:

- اختلاف SHA میان Targetها؛
- Failure در Deploy، Smoke، UX Smoke یا SEO؛
- HTML fallback برای JSON؛
- Header اشتباه Canonical/Iran؛
- Artifact ناقص یا Hash نامعتبر؛
- انتشار Revision قدیمی‌تر پس از Revision جدید.

در VPS از مکانیزم Rollback خودکار استفاده کنید. برای GitHub Pages، آخرین Revision سالم را از طریق PR/Commit شفاف Restore کنید. Force-push به `main` ممنوع است.

## کارهایی که نباید برای Deploy جعل شوند

موارد زیر ممکن است پس از Technical deployment همچنان باز بمانند، اما وضعیتشان باید صادقانه ثبت شود:

- جلسات Usability شماره ۱۲۹: نیازمند مشارکت‌کننده واقعی؛
- درخواست واقعی پنج Provider شماره ۳۳: نیازمند Credential مجاز؛
- ماتریس ASN/VPN شماره ۳۵: نیازمند شبکه مجاز؛
- Analytics baseline شماره ۱۳۵: نیازمند Dashboard access؛
- Benchmark شماره ۱۱۴: نیازمند `BENCHMARK_*` Secretهای معتبر.

این موارد را با داده ساختگی، Credential آزمایشی نامعتبر، VPN بدون مجوز یا نتیجه حدسی نبندید. وضعیت صحیح آن‌ها یکی از موارد زیر است:

- `BLOCKED — HUMAN PARTICIPANTS REQUIRED`
- `BLOCKED — VALID CREDENTIAL REQUIRED`
- `BLOCKED — AUTHORIZED NETWORK REQUIRED`
- `BLOCKED — DASHBOARD ACCESS REQUIRED`
- `BLOCKED — BENCHMARK SECRETS REQUIRED`

## گزارش نهایی Release

گزارش باید حداقل شامل این فیلدها باشد:

```text
RELEASE_SHA=
LOCAL_RELEASE_GATE=
VALIDATE_WORKFLOW=
PAGES_DEPLOY=
VPS_GLOBAL_DEPLOY=
VPS_IRAN_DEPLOY=
POST_LAUNCH_OPERATIONS_RUN=
GLOBAL_BUILD_META_SHA=
IRAN_BUILD_META_SHA=
PAGES_BUILD_META_SHA=
OPEN_INCIDENTS=
ROLLBACK_STATUS=
DECISION=GO|NO-GO
BLOCKERS=
```

هیچ فیلدی را بدون Evidence واقعی `PASS` یا `GO` ثبت نکنید.
