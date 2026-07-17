# Product Hunt Eligibility and Publication Packet

## Launch row

`L-016`

## Default decision

`DEFER_NOT_ELIGIBLE`

طبق Featuring Guidelines رسمی Product Hunt که در ۱۰ مارس ۲۰۲۶ به‌روزرسانی شده، «Directories or lists» معمولاً Featured نمی‌شوند. پروژه در شکل فعلی یک Catalog/Directory است؛ بنابراین Hermes نباید Product Hunt را صرفاً برای کامل‌کردن Checklist منتشر کند.

## Eligibility gate

فقط وقتی Track از `DEFER_NOT_ELIGIBLE` خارج شود که مالک با Evidence نشان دهد محصول فراتر از یک Directory ساده است، برای مثال:

- Advisor یا ابزار تعاملی، بخش اصلی Value proposition باشد؛
- Workflow کاربردی مستقل برای انتخاب و Integration ارائه شود؛
- Demo روشن از Interaction و Outcome وجود داشته باشد؛
- Landing page انگلیسی کامل و مستقیم آماده باشد؛
- محصول قابل استفاده باشد، نه صرفاً فهرست لینک‌ها؛
- مالک آگاهانه ریسک Featured نشدن را بپذیرد.

نتیجه Gate:

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

### Direct product URL

`https://llm.persiantoolbox.ir/?utm_source=producthunt&utm_medium=launch&utm_campaign=international_launch`

### Repository

`https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir`

### Maker comment draft

We built Awesome Free LLM APIs IR because most “free LLM API” resources mix permanent free tiers, trials, credits and temporarily free models.

The project separates those categories and exposes the information developers need before integrating an API: documented quotas, payment requirements, OpenAI compatibility, Base URLs and dated regional-access evidence. The same validated data powers an interactive website, dedicated provider pages and a machine-readable catalog.

We would value feedback on the comparison workflow, evidence model and stale-data handling. We are not asking for coordinated votes.

## Required gallery

- Social card
- Desktop product screenshot
- Mobile screenshot
- Demo video or GIF showing Advisor/Filter and Provider comparison

## Hermes UI steps — فقط پس از Eligibility approval

1. Personal Product Hunt account و Maker identity را به مالک نشان بده.
2. بررسی کن محصول قبلاً Submit نشده است.
3. Direct product URL را وارد کن؛ لینک Repository جایگزین Product URL نیست.
4. Name، Tagline، Description، Topics و Gallery را آماده کن.
5. Maker comment را Preview کن.
6. Draft یا Schedule را انتخاب کن؛ فوراً Launch نکن.
7. Preview کامل را به مالک نشان بده.
8. Approval دقیق `APPROVE PRODUCT HUNT DESPITE DIRECTORY RISK` بگیر.
9. Publish/Schedule کن.
10. Public URL را ثبت کن.
11. هیچ پیام درخواست Upvote، Vote ring یا Outreach هماهنگ‌شده ایجاد نکن.

## Stop conditions

- محصول فقط Directory/List باقی مانده است.
- Demo یا English landing کامل نیست.
- Direct product URL کار نمی‌کند.
- محصول قبلاً Submit شده است.
- مالک صرفاً برای Backlink یا رأی‌گیری قصد Submission دارد.

در هر Stop condition، ردیف `L-016` باید `BLOCKED` یا `DRAFT_READY` بماند، نه `PUBLISHED`.

## Evidence

```text
ELIGIBILITY_DECISION=
OWNER_RISK_APPROVAL=
PUBLIC_URL=
PUBLISHED_AT_UTC=
MAKER_ACCOUNT_DISPLAY_NAME=
DIRECT_PRODUCT_URL=
LOG_PR_URL=
```

## Official references

- Featuring Guidelines: https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines
- How to post: https://help.producthunt.com/en/articles/479557-how-to-post-a-product
