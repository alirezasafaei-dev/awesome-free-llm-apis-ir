# GitHub Release Verification Packet

## Launch row

`L-001`

## Current evidence

Issue `#44` previously reports an existing Release named `v0.1.0-seo`. Do not create a duplicate Release until the existing tag and public Release URL are verified.

## Verification workflow

1. Open the Repository Releases page.
2. Check whether tag `v0.1.0-seo` exists.
3. Confirm the Release is public, not Draft, and not an unintended Prerelease.
4. Confirm its body points to the Canonical site and Repository.
5. Compare Provider/Guide counts against current `catalog.json` and Build; do not preserve stale counts.
6. Record the exact public Release URL and publication UTC.
7. Update `L-001` from `DRAFT_READY` to `PUBLISHED` only after the URL opens publicly.

## Decision

```text
EXISTING_TAG_FOUND=YES|NO
EXISTING_RELEASE_PUBLIC=YES|NO
EXISTING_RELEASE_URL=
RELEASE_BODY_CURRENT=YES|NO
PROVIDER_COUNT=
GUIDE_COUNT=
DECISION=REUSE_EXISTING|UPDATE_EXISTING|CREATE_NEW|BLOCKED
```

## Release title — only if a new Release is genuinely required

`Awesome Free LLM APIs IR — Public Launch`

## Release body

### فارسی

نسخه عمومی **Awesome Free LLM APIs IR** آماده است؛ یک فهرست آزاد، فارسی و ماشین‌خوان برای مقایسه APIهای رایگان مدل‌های زبانی.

این پروژه Free Tier دائمی، Trial، Credit، محدودیت‌های مصرف، نیاز به پرداخت، سازگاری OpenAI و شواهد تاریخ‌دار دسترسی منطقه‌ای را به‌صورت جداگانه ثبت می‌کند.

امکانات اصلی:

- Providerها و Gatewayهای رسمی
- RPM، RPD، TPM و محدودیت‌های مستند
- نیاز یا عدم نیاز به کارت و روش ثبت‌نام
- OpenAI-compatible endpoints و Base URL
- تفکیک سیاست رسمی، مشاهده مستقیم، VPN و وضعیت نامشخص
- صفحات مستقل Provider و Guide
- Catalog ماشین‌خوان، Sitemap و `llms.txt`
- Schema عمومی، CI و هشدار داده قدیمی

وب‌سایت:
https://llm.persiantoolbox.ir/

Repository:
https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

Catalog:
https://llm.persiantoolbox.ir/catalog.json

اطلاعات Free Tierها و محدودیت‌های منطقه‌ای مرتب تغییر می‌کنند. برای گزارش داده قدیمی، افزودن Provider یا ارائه Evidence تاریخ‌دار، Issue یا Pull Request ثبت کنید.

### English

**Awesome Free LLM APIs IR** is an open, Persian-first and machine-readable catalog for comparing free LLM APIs.

It keeps permanent free tiers, trials, credits, documented quotas, payment requirements, OpenAI compatibility and dated regional-access evidence separate.

Highlights:

- Official providers and gateways
- RPM, RPD, TPM and other documented quota fields
- Payment-method and signup requirements
- OpenAI-compatible endpoints and Base URLs
- Separate official-policy, direct-observation, VPN and unknown evidence classes
- Dedicated provider pages and practical guides
- Machine-readable catalog, sitemap and `llms.txt`
- Public schemas, CI validation and stale-data warnings

Website:
https://llm.persiantoolbox.ir/

Repository:
https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

Catalog:
https://llm.persiantoolbox.ir/catalog.json

Reports and contributions are welcome. `Unknown` means there is not enough evidence; it does not mean the service works.

## Owner command — only after verification says `CREATE_NEW`

Choose a new semantic tag deliberately; do not reuse the example blindly.

```bash
gh release create <NEW_TAG> \
  --repo alirezasafaei-dev/awesome-free-llm-apis-ir \
  --title "Awesome Free LLM APIs IR — Public Launch" \
  --notes-file artifacts/owner-actions/GITHUB_RELEASE_BODY.tmp.md \
  --target main
```

Do not commit the temporary file if it contains environment-specific notes.

## Hermes rules

- Reuse an existing suitable Release instead of creating a duplicate.
- Before any create/update action, show Tag, Target SHA, Title and complete Body.
- Obtain `APPROVE GITHUB RELEASE <tag>`.
- Do not upload duplicate binary assets unless necessary.
- Do not mark `PUBLISHED` without a public Release URL.

## Evidence

```text
RELEASE_TAG=
RELEASE_URL=
PUBLISHED_AT_UTC=
TARGET_SHA=
PROVIDER_COUNT=
GUIDE_COUNT=
LOG_PR_URL=
ISSUE_44_COMMENT_URL=
```
