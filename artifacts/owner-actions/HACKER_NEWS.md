# Hacker News Human-authorship Packet

## Launch row

`L-017`

## Default status

`HUMAN_REWRITE_REQUIRED`

Guidelines رسمی Hacker News می‌گوید Comment تولیدشده یا AI-edited ارسال نشود. متن آغازین Show HN عملاً Comment است؛ بنابراین Hermes نباید متن نهایی را در HN Paste، ویرایش یا Submit کند.

Hermes فقط Fact sheet، لینک‌ها، محدودیت‌ها و Checklist را آماده می‌کند. مالک باید Title و Opening comment را شخصاً و با واژگان خودش بنویسد.

## Fact sheet for the owner

- پروژه: Awesome Free LLM APIs IR
- ماهیت: Open-source, Persian-first, machine-readable catalog/tool
- مسئله: منابع معمولاً permanent free tier، trial، credit و free model را مخلوط می‌کنند.
- تفاوت‌ها:
  - quota type و documented limits
  - payment/signup requirements
  - OpenAI compatibility و Base URL
  - dated regional-access evidence
  - schema validation و CI
  - provider pages، guides و JSON catalog
- محدودیت: Unknown به معنی working نیست؛ نتیجه VPN یا host خارجی direct-Iran evidence نیست.
- Product URL:
  `https://llm.persiantoolbox.ir/?utm_source=hackernews&utm_medium=community&utm_campaign=international_launch`
- Repository:
  `https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir`
- Feedback مطلوب: data model، evidence rules، stale-data handling و missing providers

## Owner-authored fields

```text
OWNER_WRITTEN_TITLE=
OWNER_WRITTEN_OPENING_COMMENT=
OWNER_CONFIRMATION_NO_AI_EDITING=YES|NO
```

عنوان باید توصیفی، بدون Clickbait و بدون ادعای اثبات‌نشده باشد.

## Hermes workflow

1. HN account display name را نشان بده.
2. Guidelines جاری را دوباره بازبینی کن.
3. Fact sheet را نمایش بده، اما Comment تولید یا ویرایش نکن.
4. مالک Title و Opening comment را خودش در Browser بنویسد.
5. Hermes فقط لینک، نبود Vote request، نبود PII و نبود ادعای اغراق‌آمیز را کنترل کند.
6. قبل از `submit` متوقف شو.
7. Approval `APPROVE HN OWNER-WRITTEN SUBMISSION` بگیر.
8. Publish و Public URL را ثبت کن.
9. Replyها نیز توسط مالک نوشته شوند؛ Hermes متن Reply تولید یا AI-edit نکند.

## Stop conditions

- متن نهایی توسط Agent نوشته یا AI-edit شده است.
- هدف اصلی Promotion است.
- عنوان Clickbait یا ادعای اثبات‌نشده دارد.
- درخواست Upvote، Repost یا هماهنگی بیرونی برنامه‌ریزی شده است.

## Evidence

```text
OWNER_CONFIRMATION_NO_AI_EDITING=
SUBMISSION_TYPE=SHOW_HN|URL_SUBMISSION|DEFERRED
PUBLIC_URL=
PUBLISHED_AT_UTC=
ACCOUNT_DISPLAY_NAME=
LOG_PR_URL=
```

## Official reference

- https://news.ycombinator.com/newsguidelines.html
