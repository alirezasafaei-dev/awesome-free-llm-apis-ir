# Instagram Carousel, Story and Reel Packet

سه Publication مستقل:

- Carousel: `L-007`
- Story: `L-008`
- Reel: `L-009`

هرکدام Approval و Public URL مستقل می‌خواهند.

## UTM

`https://llm.persiantoolbox.ir/?utm_source=instagram&utm_medium=social&utm_campaign=initial_launch`

## Carousel — شش اسلاید

1. دنبال API رایگان هوش مصنوعی هستی؟
2. خیلی از سرویس‌های «رایگان» فقط Trial یا Credit محدود هستند.
3. Free Tier واقعی، نیاز به کارت و RPM/RPD/TPM را جداگانه مقایسه کن.
4. ببین کدام APIها با OpenAI SDK سازگارند و Base URL آن‌ها چیست.
5. سیاست رسمی منطقه‌ای، مشاهده مستقیم ایران و تست VPN جدا ثبت شده‌اند.
6. فهرست کامل: `llm.persiantoolbox.ir` — لینک در Bio

### Caption

یک API رایگان LLM فقط زمانی مفید است که بدانیم سهمیه‌اش واقعی است، کارت بانکی می‌خواهد یا نه، با OpenAI SDK سازگار است و شواهد دسترسی منطقه‌ای آن چگونه ثبت شده است.

**Awesome Free LLM APIs IR** این اطلاعات را در یک فهرست فارسی، متن‌باز و ماشین‌خوان جمع‌آوری می‌کند.

لینک در Bio:
https://llm.persiantoolbox.ir/?utm_source=instagram&utm_medium=social&utm_campaign=initial_launch

#هوش_مصنوعی #برنامه_نویسی #API #LLM #متن_باز

## Story sequence

1. «API رایگان LLM پیدا کردی؛ ولی واقعاً Free Tier است؟»
2. «کارت می‌خواهد؟ محدودیتش چیست؟ Evidence دسترسی‌اش چیست؟»
3. «همه این موارد را یکجا مقایسه کن.»
4. CTA + Link Sticker با UTM اینستاگرام

## Reel voice-over

«خیلی از APIهایی که رایگان معرفی می‌شوند، فقط Trial هستند یا محدودیت‌های مهمشان مشخص نیست. در Awesome Free LLM APIs IR می‌توانی Free Tier، محدودیت مصرف، نیاز به کارت، سازگاری OpenAI و شواهد دسترسی ایران را یکجا بررسی کنی. لینک کامل در Bio.»

## Required assets

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

اگر Assetها وجود ندارند، وضعیت `ASSET_REQUIRED` یا `DEMO_REQUIRED` بماند و Publish انجام نشود.

## Hermes workflow

### Carousel

1. شش فایل را به ترتیب Upload و Crop را Preview کن.
2. Caption و Bio URL را کنترل کن.
3. قبل از `Share` متوقف شو.
4. `APPROVE INSTAGRAM CAROUSEL` بگیر.

### Story

1. چهار Story را مرتب کن.
2. در Story آخر Link Sticker را با UTM قرار بده.
3. Sticker URL را بازخوانی کن.
4. قبل از Share متوقف شو.
5. `APPROVE INSTAGRAM STORY` بگیر.
6. اگر Public URL پایدار وجود ندارد، `PUBLISHED` ثبت نکن تا Log policy مسیر Evidence قابل‌قبول را مشخص کند.

### Reel

1. Video و Cover را Upload کن.
2. Caption، Audio و Audience را Preview کن.
3. قبل از Share متوقف شو.
4. `APPROVE INSTAGRAM REEL` بگیر.

## Checklist

- [ ] Account صحیح
- [ ] Assetهای نهایی موجود
- [ ] ترتیب صحیح
- [ ] بدون Dashboard، Notification یا PII
- [ ] UTM در Bio/Sticker صحیح
- [ ] Copyright review پاس
- [ ] Approval مستقل دریافت شده

## Evidence

```text
CAROUSEL_PUBLIC_URL=
CAROUSEL_PUBLISHED_AT_UTC=
STORY_PUBLIC_URL=
STORY_PUBLISHED_AT_UTC=
REEL_PUBLIC_URL=
REEL_PUBLISHED_AT_UTC=
ACCOUNT_DISPLAY_NAME=
ASSET_SHA256_LIST=
LOG_PR_URL=
```
