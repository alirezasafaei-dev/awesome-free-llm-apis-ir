# Product Hunt Eligibility and Publication Packet

## Launch row

`L-016`

## Default decision

`DEFER_NOT_ELIGIBLE`

طبق Featuring Guidelines رسمی Product Hunt که در ۱۰ مارس ۲۰۲۶ به‌روزرسانی شده، «Directories or lists» معمولاً Featured نمی‌شوند. پروژه در شکل فعلی یک Catalog/Directory است؛ بنابراین Hermes نباید Product Hunt را صرفاً برای کامل‌کردن Checklist منتشر کند.

## Eligibility gate

Track فقط وقتی از `DEFER_NOT_ELIGIBLE` خارج شود که مالک با Evidence تأیید کند:

- Advisor یا Workflow تعاملی، Value اصلی محصول است؛
- محصول فراتر از فهرست لینک‌ها Outcome عملی ایجاد می‌کند؛
- Demo واقعی آماده است؛
- Landing page انگلیسی کامل است؛
- Direct product URL کار می‌کند؛
- مالک آگاهانه ریسک Featured نشدن را پذیرفته است.

```text
INTERACTIVE_PRODUCT_VALUE=
ENGLISH_LANDING_READY=
DEMO_READY=
DIRECT_PRODUCT_URL_READY=
OWNER_ACCEPTS_DIRECTORY_RISK=
ELIGIBILITY_DECISION=DEFER_NOT_ELIGIBLE|DRAFT_ALLOWED
```

## Draft metadata — فقط در صورت `DRAFT_ALLOWED`

### Name

Awesome Free LLM APIs IR

### Tagline

Compare free LLM APIs by quotas, compatibility and regional evidence

### Short description

An open, machine-readable tool for comparing free LLM APIs by tier type, documented quotas, payment requirements, OpenAI compatibility and dated regional-access evidence.

### Product URL

`https://llm.persiantoolbox.ir/?utm_source=producthunt&utm_medium=launch&utm_campaign=international_launch`

### Maker comment

We built Awesome Free LLM APIs IR because most “free LLM API” resources mix permanent free tiers, trials, credits and temporarily free models.

The project separates those categories and exposes documented quotas, payment requirements, OpenAI compatibility, Base URLs and dated regional-access evidence. The same validated data powers an interactive website, provider pages and a machine-readable catalog.

We would value feedback on the comparison workflow, evidence model and stale-data handling. We are not asking for coordinated votes.

## Hermes workflow

1. Personal Product Hunt account و Maker identity را نمایش بده.
2. بررسی کن محصول قبلاً Submit نشده است.
3. Direct product URL، Gallery و Demo را کنترل کن.
4. Draft یا Schedule بساز؛ فوراً Launch نکن.
5. Preview کامل را نشان بده.
6. قبل از Publish متوقف شو.
7. Approval دقیق `APPROVE PRODUCT HUNT DESPITE DIRECTORY RISK` بگیر.
8. هیچ درخواست Upvote یا Vote ring ایجاد نکن.
9. فقط پس از Public شدن، URL را در `L-016` ثبت کن.

## Stop conditions

- محصول عمدتاً Directory/List است.
- Demo یا English landing کامل نیست.
- Direct product URL کار نمی‌کند.
- هدف اصلی Backlink یا رأی‌گیری است.

در Stop condition، وضعیت `BLOCKED` یا `DRAFT_READY` بماند؛ `PUBLISHED` نشود.

## Evidence

```text
ELIGIBILITY_DECISION=
OWNER_RISK_APPROVAL=
PUBLIC_URL=
PUBLISHED_AT_UTC=
MAKER_ACCOUNT_DISPLAY_NAME=
LOG_PR_URL=
```

## Official references

- https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines
- https://help.producthunt.com/en/articles/479557-how-to-post-a-product
