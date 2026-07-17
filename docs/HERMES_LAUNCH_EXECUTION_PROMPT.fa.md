# پرامپت اجرایی Hermes برای لانچ Human-in-the-loop

این Prompt برای اجرای تعاملی Hermes در Sessionهای از قبل Login‌شده مالک است. ابتدا `AGENTS.md` و `.hermes.md` را بخوان.

## PROMPT START

Repository:

`alirezasafaei-dev/awesome-free-llm-apis-ir`

Canonical site:

`https://llm.persiantoolbox.ir/`

ماموریت: آماده‌سازی، Preview، انتشار مجاز و ثبت Evidence برای Launch؛ بدون افشای Credential، بدون Spam و بدون ادعای بدون مدرک.

## منابع الزامی

1. `AGENTS.md`
2. `.hermes.md`
3. `docs/LAUNCH_DISTRIBUTION_CHECKLIST.fa.md`
4. `docs/LAUNCH_COPY_PACK.fa-en.md`
5. `docs/LAUNCH_LOG.md`
6. `artifacts/owner-actions/README.md`
7. Packet همان کانال
8. `docs/PRIVATE_INFRASTRUCTURE_POLICY.fa.md`

Issueها:

- `#44` — Launch
- `#42` — Growth/analytics
- `#48` — Security؛ بسته بماند

## قواعد قطعی

- Never use YOLO mode.
- روی `main` Push نکن، PR را Merge نکن و Deploy انجام نده.
- هیچ Cookie، Password، Token، Recovery Code، Session dump، IP، SSH detail یا URL مدیریتی را چاپ/Commit نکن.
- Credential یا Browser session را به Terminal container Forward نکن.
- Browser فقط از Session موجود مالک استفاده کند؛ Cookie export ممنوع است.
- قبل از هر `Publish`, `Post`, `Submit`, `Send`, `Upload` عمومی یا تغییر Visibility متوقف شو.
- Account، Destination، متن، Asset، UTM و Action نهایی را Preview کن.
- هر Publication Approval مستقل می‌خواهد.
- هیچ Mass-post، Mass-DM، BCC، Vote solicitation، Cross-post chain یا Metric جعلی انجام نده.
- عدد Provider/Guide را از Catalog/Build جاری بگیر.
- CTA اصلی فقط Canonical host با UTM همان کانال است.
- `PUBLISHED` فقط با Public URL واقعی و قابل‌مشاهده.
- مقدار ناموجود `N/A`؛ مقدار حدسی ممنوع.

## Preflight

در Worktree ایزوله:

```bash
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm test
npm run site:build
```

ثبت کن:

```text
MAIN_SHA=
NPM_TEST=
SITE_BUILD=
PROVIDER_COUNT=
GUIDE_COUNT=
CANONICAL_HOME=
OG_IMAGE_OK=
LAUNCH_LINK_TESTS=
LAUNCH_LOG_TESTS=
```

اگر Gate شکست خورد:

1. انتشار عمومی را متوقف کن.
2. علت را بدون اطلاعات حساس ثبت کن.
3. اصلاح را روی Branch جدا و Draft PR آماده کن.
4. وضعیت `BLOCKED_REPOSITORY_GATE` بده.

## Approval block

```text
CHANNEL=
ACCOUNT_DISPLAY_NAME=
DESTINATION=
CONTENT_LANGUAGE=
FINAL_TEXT_SHA256=
ASSET_PATHS=
UTM_URL=
IRREVERSIBLE_ACTION=
APPROVAL_REQUIRED=YES
```

فقط Approval دقیق همان Action معتبر است؛ نمونه:

- `APPROVE LINKEDIN FA`
- `APPROVE INSTAGRAM CAROUSEL`
- `APPROVE YOUTUBE PUBLIC`

## ترتیب اجرا

1. GitHub Release موجود را Verify و URL آن را کنترل کن.
2. GitHub Discussion، اگر فعال است.
3. LinkedIn فارسی.
4. Telegram رسمی.
5. X فارسی/Thread.
6. Instagram Carousel و Story.
7. Virgool.
8. Demo امن.
9. Instagram Reel، YouTube و Aparat.
10. LinkedIn انگلیسی.
11. Reddit پس از Community review.
12. Hacker News فقط با متن انسانی مالک.
13. Product Hunt فقط پس از Eligibility gate.
14. Outreach تک‌گیرنده‌ای.

## Workflow هر Publication

1. Packet کانال را بخوان.
2. متن/عدد/UTM را با وضعیت جاری تطبیق بده.
3. `npm run launch:links:test` را اجرا کن.
4. Draft و Asset را آماده کن.
5. Approval block و Preview را نمایش بده.
6. قبل از Action نهایی متوقف شو.
7. پس از Approval، فقط همان Action را انجام بده.
8. صفحه عمومی را باز و Public URL را استخراج کن.
9. UTC را ثبت کن.
10. Launch row را به `PUBLISHED` تغییر بده.
11. `npm run launch:log:test && npm test` را اجرا کن.
12. Log change را روی Branch جدا Commit و Draft PR کن.
13. طبق `artifacts/owner-actions/MEASUREMENT.md` Checkpoint بساز.

## Gateهای ویژه

### Instagram

Carousel، Story و Reel سه Action مستقل‌اند. Story بدون Public URL پایدار نباید به‌صورت غیرقابل‌راستی‌آزمایی `PUBLISHED` ثبت شود.

### Video platforms

ابتدا Private/Unlisted یا Save-without-publish؛ عمومی‌کردن Approval مستقل دارد. Copyright و PII review الزامی است.

### Product Hunt

پیش‌فرض `DEFER_NOT_ELIGIBLE` است، چون Directory/List معمولاً Featured نمی‌شود. فقط پس از عبور از Gate فایل `PRODUCT_HUNT.md` Draft بساز. درخواست Upvote ممنوع.

### Hacker News

Hermes فقط Fact sheet آماده می‌کند. Title، Opening comment و Replyها را مالک شخصاً و بدون AI editing می‌نویسد.

### Reddit

Subreddit را مالک مشخص می‌کند. Rules همان Community باید بررسی شود. یک متن در چند Community تکرار نشود.

### Outreach

هر Recipient یک Approval مستقل. Scraping، Bulk send و Follow-up خودکار ممنوع.

## Measurement

برای هر Publication:

```text
24H_DUE=PUBLISHED_AT_UTC + 24h
72H_DUE=PUBLISHED_AT_UTC + 72h
7D_DUE=PUBLISHED_AT_UTC + 7d
```

فقط Aggregate data ثبت کن؛ Dashboard screenshot، Username، Email، IP یا PII Commit نشود.

## Final run status

```text
FINAL_STATUS=
MAIN_SHA=
CHANNEL=
ACCOUNT_CONFIRMED=
APPROVAL_RECEIVED=
PUBLISHED=
PUBLIC_URL=
PUBLISHED_AT_UTC=
LAUNCH_ID=
LAUNCH_LOG_UPDATED=
LOG_PR_URL=
NPM_TEST=
MEASUREMENT_24H_DUE=
MEASUREMENT_72H_DUE=
MEASUREMENT_7D_DUE=
EXTERNAL_BLOCKERS=
NEXT_SINGLE_ACTION=
```

`PUBLISHED=YES` بدون Public URL معتبر ممنوع است.

## PROMPT END
