# Hacker News Human-authorship Packet

## Launch row

`L-017`

## Default status

`HUMAN_REWRITE_REQUIRED`

طبق Guidelines رسمی Hacker News، Comment تولیدشده یا ویرایش‌شده با AI نباید ارسال شود. متن آغازین Show HN در عمل Comment است؛ بنابراین Hermes نباید یک متن نهایی آماده را در HN Paste یا Submit کند.

Hermes فقط می‌تواند Fact sheet، لینک‌ها، محدودیت‌ها و Checklist را برای نوشتن انسانی مالک آماده کند.

## Fact sheet for the owner

- پروژه: Awesome Free LLM APIs IR
- ماهیت: Open-source, Persian-first, machine-readable catalog/tool
- مسئله: فهرست‌ها معمولاً permanent free tier، trial، credit و free model را با هم مخلوط می‌کنند.
- تفاوت‌های کلیدی:
  - quota type و documented limits
  - payment/signup requirements
  - OpenAI compatibility و Base URL
  - dated regional-access evidence
  - schema validation و CI
  - provider pages، guides و JSON catalog
- محدودیت صریح: Unknown به معنی working نیست؛ نتیجه VPN یا host خارجی، direct-Iran evidence نیست.
- لینک محصول:
  `https://llm.persiantoolbox.ir/?utm_source=hackernews&utm_medium=community&utm_campaign=international_launch`
- Repository:
  `https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir`
- نوع Feedback مطلوب: data model، evidence rules، stale-data handling و missing providers

## Owner-authored fields

مالک باید این قسمت‌ها را شخصاً و با واژگان خودش بنویسد:

```text
OWNER_WRITTEN_TITLE=
OWNER_WRITTEN_OPENING_COMMENT=
OWNER_CONFIRMATION_NO_AI_EDITING=YES|NO
```

عنوان باید توصیفی، بدون Superlative و بدون Clickbait باشد. اگر ساختار Show HN واقعاً مناسب نیست، Submission معمولی یا عدم انتشار انتخاب شود.

## Hermes UI steps

1. HN account display name را به مالک نشان بده.
2. Guidelines جاری را باز و شرط AI-generated/AI-edited text را دوباره کنترل کن.
3. Fact sheet را به مالک نشان بده، اما متن Comment را تولید یا ویرایش نکن.
4. مالک Title و Opening comment را خودش در Browser بنویسد.
5. Hermes فقط این موارد را کنترل کند:
   - لینک مستقیم و سالم
   - نبود درخواست Upvote
   - نبود Promotion language اغراق‌آمیز
   - نبود اطلاعات خصوصی
6. قبل از `submit` متوقف شو.
7. Approval `APPROVE HN OWNER-WRITTEN SUBMISSION` بگیر.
8. Publish و Public URL را ثبت کن.
9. Replies را نیز مالک شخصاً بنویسد؛ Hermes Reply تولید یا ویرایش نکند.

## Stop conditions

- متن نهایی توسط Agent نوشته یا AI-edit شده است.
- حساب تازه فقط برای Promotion ساخته شده و مشارکت واقعی ندارد.
- عنوان Clickbait یا ادعای اثبات‌نشده دارد.
- درخواست Upvote، هماهنگی بیرونی یا Repost برنامه‌ریزی شده است.
- محصول هنوز Demo/Value فنی کافی برای Show HN ندارد.

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

- Hacker News Guidelines: https://news.ycombinator.com/newsguidelines.html
