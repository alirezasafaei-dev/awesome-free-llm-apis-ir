# Launch Measurement Runbook

این Runbook برای ثبت آمار واقعی هر انتشار در بازه‌های `24h`، `72h` و `7d` است. هیچ مقدار تخمینی یا PII نباید وارد Repository شود.

## Inputs

```text
LAUNCH_ID=
PUBLIC_URL=
PUBLISHED_AT_UTC=
UTM_SOURCE=
CAMPAIGN=
```

## Due times

از Timestamp انتشار محاسبه شوند:

```text
MEASUREMENT_24H_DUE=PUBLISHED_AT_UTC + 24 hours
MEASUREMENT_72H_DUE=PUBLISHED_AT_UTC + 72 hours
MEASUREMENT_7D_DUE=PUBLISHED_AT_UTC + 7 days
```

برای محاسبه قابل‌بازتولید:

```bash
node -e '
const published = new Date(process.argv[1]);
if (Number.isNaN(published.getTime())) process.exit(2);
for (const [label, hours] of [["24h",24],["72h",72],["7d",168]]) {
  console.log(`${label}=${new Date(published.getTime()+hours*3600_000).toISOString()}`);
}
' "<PUBLISHED_AT_UTC>"
```

## Metrics

### Plausible / Website aggregate

- Visitors filtered by UTM source/campaign
- Pageviews
- Provider clicks
- Guide clicks
- Docs clicks
- Copy Base URL events
- GitHub clicks

### GitHub

- Stars gained relative to pre-launch baseline
- Forks gained
- New Issues/PRs attributable to the publication when Evidence exists

### Channel-native

- Impressions/views
- Reactions/likes
- Comments/replies
- Saves/bookmarks when available
- Link clicks when available
- Qualified feedback

Channel-native metrics that do not map to the current `docs/LAUNCH_LOG.md` table should be summarized in Notes rather than changing the schema ad hoc.

## Data protection

- فقط Aggregate metrics
- بدون نام، Username، Email، IP، Referrer query containing PII یا Screenshot Dashboard
- Dashboard credential، Cookie و API token نباید وارد Terminal container یا Repository شود
- اگر Connector امن و مجاز وجود ندارد، مالک عدد Aggregate را دستی وارد کند
- مقدار ناموجود: `N/A`
- مقدار هنوز نرسیده: خالی، نه صفر
- صفر فقط وقتی Dashboard واقعاً صفر نشان می‌دهد

## Collection workflow

1. `docs/LAUNCH_LOG.md` را باز کن و Publication row را پیدا کن.
2. Public URL و UTC را دوباره کنترل کن.
3. UTM source/campaign را برای Filter Dashboard استفاده کن.
4. بازه دقیق را از زمان انتشار تا Checkpoint محاسبه کن.
5. Aggregate metrics را بخوان.
6. Channel-native metrics را جداگانه بخوان.
7. Qualified feedback را خلاصه کن؛ متن خصوصی یا Username را Copy نکن.
8. Measurement row متناظر را اضافه کن.
9. `npm run launch:log:test` و `npm test` را اجرا کن.
10. تغییر را روی Branch جدا Commit و Draft PR کن.
11. در Issue `#44` فقط خلاصه Evidence-backed ثبت کن.

## Measurement row template

```markdown
| <LAUNCH_ID> | 24h | <Visitors> | <Pageviews> | <Provider clicks> | <Guide clicks> | <Docs clicks> | <Copy Base URL> | <GitHub clicks> | <Stars gained> | <Comments> | <Qualified feedback> | <Notes> |
```

برای `72h` و `7d` همان قالب تکرار شود.

## Qualified feedback rubric

`Qualified feedback` فقط یکی از این موارد است:

- گزارش Provider یا quota همراه Source
- Bug قابل‌بازتولید
- پیشنهاد مشخص برای Schema/Data model
- درخواست Guide یا Feature با Use case روشن
- پیشنهاد مشارکت یا Editorial review واقعی

Reaction عمومی، تعریف کوتاه، Spam و درخواست تبلیغ متقابل Qualified feedback محسوب نمی‌شوند.

## Decision rules after 7 days

- کانال با Visitor بالا ولی GitHub click/feedback پایین: CTA یا Audience mismatch را بررسی کن.
- کانال با Visitor متوسط و Qualified feedback بالا: برای انتشار بعدی اولویت دارد.
- Channel با Spam، حذف پست یا Rule conflict: تکرار نشود.
- Provider/Guide پرتقاضا: Issue قابل اقدام بساز.
- ادعای داده قدیمی: Verification issue ایجاد کن؛ خودکار تغییر نده.

## Final checkpoint record

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

## Completion condition

Launch row فقط وقتی `COMPLETED` شود که:

- Public URL معتبر باشد؛
- 24h، 72h و 7d ثبت شده باشند؛
- داده ناموجود با `N/A` مشخص شده باشد؛
- Log tests و `npm test` سبز باشند؛
- هیچ PII یا Secret ثبت نشده باشد.
