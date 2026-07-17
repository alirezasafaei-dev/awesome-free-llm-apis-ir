# Instagram Publication Packet

سه Publication مستقل:

- Carousel: `L-007`
- Story: `L-008`
- Reel: `L-009`

هرکدام Approval و Public URL مستقل می‌خواهند.

## UTM

`https://llm.persiantoolbox.ir/?utm_source=instagram&utm_medium=social&utm_campaign=initial_launch`

## Carousel — شش اسلاید

### Slide 1

دنبال API رایگان هوش مصنوعی هستی؟

زیرتیتر: قبل از ثبت‌نام، «رایگان» را دقیق بررسی کن.

### Slide 2

خیلی از سرویس‌هایی که رایگان معرفی می‌شوند، فقط Trial یا Credit محدود هستند.

### Slide 3

Free Tier واقعی، نیاز به کارت و محدودیت RPM / RPD / TPM را جداگانه مقایسه کن.

### Slide 4

ببین کدام APIها با OpenAI SDK سازگارند و Base URL آن‌ها چیست.

### Slide 5

سیاست رسمی منطقه‌ای، مشاهده مستقیم ایران و تست VPN جداگانه ثبت شده‌اند.

### Slide 6

فهرست کامل و به‌روز:

`llm.persiantoolbox.ir`

CTA: لینک در Bio

## Caption

یک API رایگان LLM فقط زمانی مفید است که بدانیم سهمیه‌اش واقعی است، کارت بانکی می‌خواهد یا نه، با OpenAI SDK سازگار است و شواهد دسترسی منطقه‌ای آن چگونه ثبت شده است.

**Awesome Free LLM APIs IR** این اطلاعات را در یک فهرست فارسی، متن‌باز و ماشین‌خوان جمع‌آوری می‌کند.

در سایت می‌توانید Providerها، محدودیت‌ها، Base URLها، Guideها و تاریخ آخرین بررسی را ببینید.

لینک در Bio:
https://llm.persiantoolbox.ir/?utm_source=instagram&utm_medium=social&utm_campaign=initial_launch

#هوش_مصنوعی #برنامه_نویسی #API #LLM #متن_باز

## Story sequence

1. «API رایگان LLM پیدا کردی؛ ولی واقعاً Free Tier است؟»
2. «کارت می‌خواهد؟ محدودیتش چیست؟ شواهد دسترسی‌اش چیست؟»
3. «همه این موارد را یکجا مقایسه کن.»
4. CTA + Link Sticker با UTM اینستاگرام

## Reel script

### Voice-over

«خیلی از APIهایی که رایگان معرفی می‌شوند، فقط Trial هستند یا محدودیت‌های مهمشان مشخص نیست. در Awesome Free LLM APIs IR می‌توانی Free Tier، محدودیت مصرف، نیاز به کارت، سازگاری OpenAI و شواهد دسترسی ایران را یکجا بررسی کنی. لینک کامل در Bio.»

### Shot list

1. Home و عنوان پروژه
2. Filter یا Advisor
3. بازکردن یک Provider
4. نمایش Quota و OpenAI compatibility
5. نمایش Evidence status ایران
6. Copy Base URL
7. Guide و GitHub CTA
8. End card با دامنه

## Asset requirements

Carousel:

```text
assets/social/instagram-carousel-01.png
assets/social/instagram-carousel-02.png
assets/social/instagram-carousel-03.png
assets/social/instagram-carousel-04.png
assets/social/instagram-carousel-05.png
assets/social/instagram-carousel-06.png
```

Story:

```text
assets/social/instagram-story-01.png
assets/social/instagram-story-02.png
assets/social/instagram-story-03.png
assets/social/instagram-story-04.png
```

Reel:

```text
assets/social/demo-launch-vertical.mp4
assets/social/demo-poster-vertical.png
```

اگر این Assetها وجود ندارند، وضعیت `ASSET_REQUIRED` یا `DEMO_REQUIRED` باقی بماند و Publish انجام نشود.

## Hermes UI steps — Carousel

1. Account را تأیید کن.
2. شش فایل را به ترتیب شماره Upload کن.
3. Crop و ترتیب را Preview کن.
4. Caption را درج کن.
5. Link in Bio را با UTM کنترل کن؛ اگر Bio تغییر نیاز دارد، Approval جداگانه بگیر.
6. قبل از `Share` متوقف شو.
7. `APPROVE INSTAGRAM CAROUSEL` بگیر.
8. Publish و Public URL را ثبت کن.

## Hermes UI steps — Story

1. چهار Story را به ترتیب آماده کن.
2. در Story آخر Link Sticker را با UTM قرار بده.
3. Sticker URL را دوباره بازخوانی و Host را کنترل کن.
4. قبل از Share، Preview همه Storyها را نشان بده.
5. `APPROVE INSTAGRAM STORY` بگیر.
6. پس از انتشار، در صورت نبود Public URL پایدار، URL پروفایل/Highlight جایگزین را به‌عنوان Public URL ثبت نکن؛ وضعیت را `BLOCKED_NO_STABLE_PUBLIC_URL` نگه دار مگر Log policy اصلاح شود.

## Hermes UI steps — Reel

1. Video و Cover را Upload کن.
2. Caption و Audience را Preview کن.
3. Audio copyright risk را کنترل کن.
4. قبل از Share متوقف شو.
5. `APPROVE INSTAGRAM REEL` بگیر.
6. Publish و Public URL را ثبت کن.

## Pre-publish checklist

- [ ] Account صحیح
- [ ] Assetهای نهایی وجود دارند
- [ ] ترتیب اسلاید/Story درست است
- [ ] هیچ Dashboard، Notification یا PII دیده نمی‌شود
- [ ] UTM در Bio/Sticker صحیح است
- [ ] Copyright risk ندارد
- [ ] Approval مستقل Publication دریافت شده

## Evidence

```text
CAROUSEL_PUBLIC_URL=
CAROUSEL_PUBLISHED_AT_UTC=
STORY_PUBLIC_URL=
STORY_PUBLISHED_AT_UTC=
REEL_PUBLIC_URL=
REEL_PUBLISHED_AT_UTC=
ACCOUNT_DISPLAY_NAME=
BIO_URL_CONFIRMED=
ASSET_SHA256_LIST=
LOG_PR_URL=
```
