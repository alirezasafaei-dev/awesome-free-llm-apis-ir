# YouTube and Aparat Publication Packet

دو Publication مستقل:

- YouTube: `L-012`
- Aparat: `L-013`

عمومی‌کردن هر پلتفرم Approval مستقل می‌خواهد.

## Required assets

```text
assets/social/demo-launch.mp4
assets/social/demo-poster.png
```

نسخه عمودی اختیاری برای Shorts/Reels:

```text
assets/social/demo-launch-vertical.mp4
assets/social/demo-poster-vertical.png
```

اگر Video یا Poster آماده نیست، وضعیت هر دو Track برابر `DEMO_REQUIRED` باقی بماند.

## Video specification

- مدت هدف: ۳۰ تا ۴۵ ثانیه
- Container ترجیحی: MP4
- Video: H.264 progressive
- Audio: AAC-LC یا Opus
- Frame rate: همان Frame rate ضبط
- بدون موسیقی یا Asset دارای Copyright نامشخص
- بدون Dashboard، DevTools، Notification، Account details یا PII

## Demo sequence

1. Home و معرفی پروژه
2. Filter یا Advisor
3. بازکردن Provider page
4. نمایش نوع Free Tier و محدودیت‌ها
5. نمایش OpenAI compatibility و Base URL
6. نمایش تفکیک Evidence منطقه‌ای
7. Copy Base URL
8. بازکردن Guide
9. GitHub CTA و End card

## YouTube metadata

### Title

مقایسه APIهای رایگان LLM برای کاربران ایران | Awesome Free LLM APIs IR

### Description

در این Demo کوتاه، پروژه متن‌باز Awesome Free LLM APIs IR را می‌بینید؛ فهرستی فارسی و ماشین‌خوان برای مقایسه APIهای رایگان مدل‌های زبانی بر اساس:

- Free Tier، Trial و Credit
- محدودیت RPM، RPD و TPM
- نیاز به کارت یا روش پرداخت
- سازگاری با OpenAI SDK و Base URL
- نوع و تاریخ Evidence دسترسی منطقه‌ای
- Guideهای کاربردی و Catalog JSON

مشاهده سایت:
https://llm.persiantoolbox.ir/?utm_source=youtube&utm_medium=video&utm_campaign=initial_launch

GitHub:
https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

اگر Provider جدیدی می‌شناسید یا داده‌ای تغییر کرده است، Issue یا Pull Request ثبت کنید.

#LLM #API #OpenSource #هوش_مصنوعی

### UTM

`https://llm.persiantoolbox.ir/?utm_source=youtube&utm_medium=video&utm_campaign=initial_launch`

### Upload mode

ابتدا `Private` یا `Unlisted`. عمومی‌کردن فقط بعد از Preview و Approval مستقل.

## Aparat metadata

### Title

مقایسه APIهای رایگان LLM برای کاربران ایران

### Description

Awesome Free LLM APIs IR یک پروژه متن‌باز و فارسی برای مقایسه APIهای رایگان مدل‌های زبانی است. در این ویدئو نحوه بررسی Free Tier، Trial، محدودیت مصرف، نیاز به کارت، سازگاری OpenAI، Base URL و شواهد دسترسی منطقه‌ای را می‌بینید.

سایت:
https://llm.persiantoolbox.ir/?utm_source=aparat&utm_medium=video&utm_campaign=initial_launch

GitHub:
https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

### Tags

`هوش مصنوعی`، `LLM`، `API`، `برنامه نویسی`، `متن باز`

### UTM

`https://llm.persiantoolbox.ir/?utm_source=aparat&utm_medium=video&utm_campaign=initial_launch`

### Upload mode

ابتدا ذخیره بدون انتشار یا زمان‌بندی امن. انتشار عمومی فقط پس از Preview و Approval مستقل.

## Hermes UI steps — YouTube

1. YouTube Studio و Channel display name را به مالک نشان بده.
2. Video را Upload کن.
3. Title، Description، Thumbnail و Audience را وارد کن.
4. Checks و Processing status را بررسی کن.
5. Visibility را `Private` یا `Unlisted` نگه دار.
6. Watch page آزمایشی و Metadata را Preview کن.
7. قبل از Public کردن متوقف شو.
8. Approval `APPROVE YOUTUBE PUBLIC` بگیر.
9. Public کن و Watch URL را ثبت کن.
10. ردیف `L-012` را به `PUBLISHED` تغییر بده.

## Hermes UI steps — Aparat

1. Account/Channel display name را به مالک نشان بده.
2. Video را Upload کن.
3. عنوان، توضیح، ۳ تا ۵ Tag و Cover را وارد کن.
4. حالت ذخیره بدون انتشار یا Schedule را انتخاب کن.
5. Preview نهایی را نشان بده.
6. قبل از انتشار عمومی متوقف شو.
7. Approval `APPROVE APARAT PUBLIC` بگیر.
8. Publish و Public URL را ثبت کن.
9. ردیف `L-013` را به `PUBLISHED` تغییر بده.

## Pre-publish checklist

- [ ] Video و Poster نهایی وجود دارند
- [ ] H.264/MP4 و Audio سالم
- [ ] Copyright risk بررسی شده
- [ ] هیچ PII یا Dashboard دیده نمی‌شود
- [ ] UTM هر پلتفرم صحیح است
- [ ] عنوان و توضیح در محدودیت واقعی UI قرار دارند
- [ ] Visibility پیش از Approval عمومی نیست
- [ ] Approval هر پلتفرم مستقل دریافت شده

## Evidence

```text
YOUTUBE_PUBLIC_URL=
YOUTUBE_PUBLISHED_AT_UTC=
YOUTUBE_CHANNEL_DISPLAY_NAME=
APARAT_PUBLIC_URL=
APARAT_PUBLISHED_AT_UTC=
APARAT_CHANNEL_DISPLAY_NAME=
VIDEO_SHA256=
POSTER_SHA256=
LOG_PR_URL=
```

## Official references

- YouTube upload workflow: https://support.google.com/youtube/answer/57407
- YouTube encoding recommendations: https://support.google.com/youtube/answer/1722171
- Aparat upload guide: https://support.aparat.com/kb/articles/article-20
- Aparat copyright rules: https://support.aparat.com/kb/articles/article-16
