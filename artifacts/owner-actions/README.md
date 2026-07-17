# Owner Action Packets

این پوشه برای عملیات‌هایی است که به Session یا Account شخصی مالک نیاز دارند. Hermes می‌تواند Draft، Preview، UTM validation و ثبت Evidence را انجام دهد؛ اقدام نهایی هر کانال فقط با Approval صریح مالک مجاز است.

## منابع مرجع

- Prompt اجرایی Hermes: `docs/HERMES_LAUNCH_EXECUTION_PROMPT.fa.md`
- متن‌های اصلی: `docs/LAUNCH_COPY_PACK.fa-en.md`
- Launch Log: `docs/LAUNCH_LOG.md`
- Social assets: `assets/social/`
- سایت Canonical: `https://llm.persiantoolbox.ir/`

## ترتیب پیشنهادی انتشار

| Order | Channel | Packet | Launch ID | Default status | شرط اجرا |
|---:|---|---|---|---|---|
| 1 | LinkedIn FA | `LINKEDIN.md` | L-003 | OWNER_READY | تأیید حساب و Preview |
| 2 | Telegram | `TELEGRAM.md` | L-006 | OWNER_READY | کانال رسمی مالک |
| 3 | X FA/Thread | `X.md` | L-005 | OWNER_READY | Preview ترتیب Thread |
| 4 | Instagram Carousel | `INSTAGRAM.md` | L-007 | ASSET_REQUIRED | خروجی نهایی اسلایدها |
| 5 | Instagram Story | `INSTAGRAM.md` | L-008 | ASSET_REQUIRED | Link Sticker با UTM |
| 6 | Instagram Reel | `INSTAGRAM.md` | L-009 | DEMO_REQUIRED | Video و Cover نهایی |
| 7 | Virgool | `VIRGOOL.md` | L-010 | OWNER_READY | مقاله مستقل و بازبینی‌شده |
| 8 | YouTube | `YOUTUBE_APARAT.md` | L-012 | DEMO_REQUIRED | Upload امن و Preview |
| 9 | Aparat | `YOUTUBE_APARAT.md` | L-013 | DEMO_REQUIRED | Approval مستقل |
| 10 | LinkedIn EN | `LINKEDIN.md` | L-004 | OWNER_READY | انتشار مستقل |
| 11 | Reddit | `REDDIT.md` | L-015 | COMMUNITY_REVIEW | Ruleهای Subreddit |
| 12 | Hacker News | `HACKER_NEWS.md` | L-017 | HUMAN_REWRITE_REQUIRED | متن نهایی توسط مالک |
| 13 | Product Hunt | `PRODUCT_HUNT.md` | L-016 | DEFER_NOT_ELIGIBLE | عبور از Eligibility gate |
| 14 | Outreach | `OUTREACH.md` | — | PER_RECIPIENT_APPROVAL | شخصی‌سازی تک‌گیرنده‌ای |

## State machine

- `OWNER_READY`: متن و UTM آماده؛ نیازمند Preview و Approval.
- `ASSET_REQUIRED`: متن آماده ولی Asset نهایی هنوز لازم است.
- `DEMO_REQUIRED`: انتشار وابسته به Demo video است.
- `COMMUNITY_REVIEW`: قوانین مقصد باید بررسی شود.
- `HUMAN_REWRITE_REQUIRED`: Agent فقط Fact sheet می‌دهد؛ متن نهایی باید انسانی باشد.
- `DEFER_NOT_ELIGIBLE`: در وضعیت فعلی توصیه به انتشار نمی‌شود.
- `PUBLISHED`: فقط با Public URL واقعی.
- `MONITORING`: انتشار ثبت شده و Checkpointهای آماری فعال‌اند.
- `COMPLETED`: آمار 24h، 72h و 7d ثبت شده‌اند.

## روند مشترک هر انتشار

1. `git pull --ff-only origin main`
2. `npm ci && npm test && npm run site:build`
3. کنترل تعداد Provider/Guide از Catalog/Build
4. کنترل UTM با `npm run launch:links:test`
5. آماده‌سازی Draft و Asset
6. نمایش Account، Destination، متن، Asset و UTM به مالک
7. دریافت Approval مستقل همان کانال
8. Publish
9. بازکردن صفحه عمومی و استخراج Public URL
10. ثبت UTC و URL در `docs/LAUNCH_LOG.md`
11. `npm run launch:log:test && npm test`
12. Draft PR برای Launch Log
13. ثبت Checkpointهای 24h، 72h و 7d

## Approval template

```text
APPROVE_CHANNEL=
ACCOUNT_DISPLAY_NAME=
DESTINATION=
LANGUAGE=
FINAL_TEXT_SHA256=
ASSETS=
UTM_URL=
```

Approval یک کانال به کانال دیگر تعمیم داده نمی‌شود.

## Evidence template

```text
CHANNEL=
LAUNCH_ID=
PUBLIC_URL=
PUBLISHED_AT_UTC=
ACCOUNT_DISPLAY_NAME=
UTM_SOURCE=
CAMPAIGN=
ASSET_PATHS=
LOG_PR_URL=
24H_DUE=
72H_DUE=
7D_DUE=
```

## ممنوعیت‌ها

- ذخیره Cookie، Password، Token یا Session dump
- Commit کردن Screenshotهای Dashboard یا اطلاعات شخصی
- Mass-posting، Mass-DM، BCC، رأی‌سازی یا درخواست Upvote
- ثبت عدد حدسی یا نسبت‌دادن نتیجه VPN/Host خارجی به دسترسی مستقیم ایران
- اعلام `PUBLISHED` بدون Public URL
