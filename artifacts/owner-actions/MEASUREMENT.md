# Launch Measurement Runbook

این Runbook برای ثبت آمار واقعی هر انتشار در `24h`، `72h` و `7d` است. مقدار تخمینی و PII ممنوع است.

## Inputs

```text
LAUNCH_ID=
PUBLIC_URL=
PUBLISHED_AT_UTC=
UTM_SOURCE=
CAMPAIGN=
```

## Due times

```text
24H_DUE=PUBLISHED_AT_UTC + 24 hours
72H_DUE=PUBLISHED_AT_UTC + 72 hours
7D_DUE=PUBLISHED_AT_UTC + 7 days
```

محاسبه قابل‌بازتولید:

```bash
node -e '
const d = new Date(process.argv[1]);
if (Number.isNaN(d.getTime())) process.exit(2);
for (const [label,h] of [["24h",24],["72h",72],["7d",168]])
  console.log(`${label}=${new Date(d.getTime()+h*3600_000).toISOString()}`);
' "<PUBLISHED_AT_UTC>"
```

## Metrics

Website/Plausible aggregate:

- Visitors
- Pageviews
- Provider clicks
- Guide clicks
- Docs clicks
- Copy Base URL
- GitHub clicks

GitHub:

- Stars gained نسبت به Baseline
- Forks gained
- Issues/PRs قابل‌انتساب با Evidence

Channel-native:

- Impressions/views
- Reactions
- Comments/replies
- Saves/bookmarks و Link clicks، اگر موجود
- Qualified feedback

Metricهایی که در Schema فعلی Launch Log ستون ندارند در Notes خلاصه شوند؛ Schema خودسرانه تغییر نکند.

## Data protection

- فقط Aggregate metrics
- بدون Username، Email، IP، Message header یا Dashboard screenshot
- Credential و Cookie وارد Terminal container نشود
- در نبود Connector امن، مالک عدد Aggregate را دستی وارد کند
- مقدار ناموجود: `N/A`
- مقدار نرسیده: خالی، نه صفر
- صفر فقط وقتی Dashboard واقعاً صفر نشان می‌دهد

## Workflow

1. Publication row را در `docs/LAUNCH_LOG.md` پیدا کن.
2. Public URL، UTC و UTM را دوباره کنترل کن.
3. بازه دقیق Checkpoint را از Timestamp انتشار بگیر.
4. Aggregate website و channel metrics را بخوان.
5. Qualified feedback را بدون PII خلاصه کن.
6. Measurement row را اضافه کن.
7. `npm run launch:log:test && npm test` را اجرا کن.
8. تغییر را روی Branch جدا Commit و Draft PR کن.
9. در Issue `#44` فقط خلاصه Evidence-backed ثبت کن.

## Row template

```markdown
| <LAUNCH_ID> | 24h | <Visitors> | <Pageviews> | <Provider clicks> | <Guide clicks> | <Docs clicks> | <Copy Base URL> | <GitHub clicks> | <Stars gained> | <Comments> | <Qualified feedback> | <Notes> |
```

برای `72h` و `7d` تکرار شود.

## Qualified feedback

فقط موارد زیر Qualified هستند:

- گزارش Provider/quota همراه Source
- Bug قابل‌بازتولید
- پیشنهاد مشخص Schema/Data model
- درخواست Guide/Feature با Use case روشن
- پیشنهاد مشارکت یا Editorial review واقعی

Reaction عمومی، تعریف کوتاه، Spam و تبلیغ متقابل Qualified feedback نیست.

## 7-day decisions

- Visitor بالا ولی GitHub click/feedback پایین: CTA یا Audience mismatch را بررسی کن.
- Visitor متوسط و Qualified feedback بالا: کانال اولویت دارد.
- حذف پست یا Rule conflict: کانال تکرار نشود.
- Provider/Guide پرتقاضا: Issue قابل اقدام بساز.
- ادعای داده قدیمی: Verification issue بساز؛ خودکار تغییر نده.

## Checkpoint evidence

```text
LAUNCH_ID=
WINDOW=24h|72h|7d
COLLECTED_AT_UTC=
WEBSITE_DATA_SOURCE=
CHANNEL_DATA_SOURCE=
VISITORS=
PAGEVIEWS=
PROVIDER_CLICKS=
GUIDE_CLICKS=
DOCS_CLICKS=
COPY_BASE_URL=
GITHUB_CLICKS=
STARS_GAINED=
COMMENTS=
QUALIFIED_FEEDBACK=
PR_URL=
LIMITATIONS=
```

## Completion

Publication فقط وقتی `COMPLETED` شود که Public URL معتبر، هر سه Checkpoint، `N/A`های صریح، تست‌های سبز و Privacy review داشته باشد.
