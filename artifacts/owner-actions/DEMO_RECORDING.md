# Secure Demo Recording Runbook

## Status

`DEMO_REQUIRED`

هدف: Demo واقعی ۳۰ تا ۴۵ ثانیه‌ای بدون Dashboard، Terminal، DevTools، Notification، Extension، Account data یا PII.

## Outputs

```text
assets/social/demo-launch.mp4
assets/social/demo-poster.png
assets/social/demo-launch-vertical.mp4
assets/social/demo-poster-vertical.png
```

اگر حجم MP4 برای Repository مناسب نیست، نسخه اصلی در Release asset یا Storage عمومی مورد تأیید مالک نگهداری شود و Poster/نسخه فشرده Commit شود.

## Shot list

| Time | Shot | هدف |
|---:|---|---|
| 0–4s | Home | نام پروژه و مسئله |
| 4–10s | Filter/Advisor | مقایسه Providerها |
| 10–18s | Provider page | Free tier و quota |
| 18–24s | Compatibility | OpenAI/Base URL |
| 24–29s | Regional evidence | policy/direct/VPN/unknown |
| 29–33s | Copy Base URL | Interaction واقعی |
| 33–38s | Guide | محتوای آموزشی |
| 38–45s | GitHub + End card | CTA و Canonical domain |

## Voice-over فارسی

«خیلی از APIهایی که رایگان معرفی می‌شوند، فقط Trial هستند یا محدودیت‌های مهمشان مشخص نیست. در Awesome Free LLM APIs IR می‌توانید نوع Free Tier، محدودیت مصرف، نیاز به کارت، سازگاری OpenAI و شواهد دسترسی منطقه‌ای را جداگانه مقایسه کنید. داده‌ها متن‌باز و ماشین‌خوان‌اند و برای هر Provider صفحه مستقل و Guide کاربردی وجود دارد. لینک پروژه: llm.persiantoolbox.ir»

## Browser preparation

1. Profile تازه و بدون Login شخصی استفاده کن.
2. Bookmark bar، Extensions و Notifications را مخفی کن.
3. Zoom و viewport را ثابت نگه دار.
4. Cookie state را قبل از ضبط تعیین کن.
5. Cursor path را تمرین کن.
6. Provider و Guide نمونه را بدون Account data انتخاب کن.
7. فقط Canonical domain را نشان بده.

## Playwright skeleton

Selectorها باید پس از بررسی DOM عمومی سایت تنظیم شوند؛ Selector حدسی Commit نشود.

```js
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: "reports/local/demo-video",
    size: { width: 1920, height: 1080 }
  }
});
const page = await context.newPage();
await page.goto("https://llm.persiantoolbox.ir/", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
// Filter/Advisor -> Provider -> Copy Base URL -> Guide -> GitHub CTA
await context.close();
await browser.close();
```

`reports/local/` نباید Commit شود.

## ffmpeg normalization

Landscape:

```bash
ffmpeg -i input.webm \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 21 -preset medium \
  -c:a aac -b:a 160k -movflags +faststart \
  assets/social/demo-launch.mp4
```

Vertical:

```bash
ffmpeg -i input.webm \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 21 -preset medium \
  -c:a aac -b:a 160k -movflags +faststart \
  assets/social/demo-launch-vertical.mp4
```

Poster:

```bash
ffmpeg -ss 00:00:03 -i assets/social/demo-launch.mp4 -frames:v 1 -q:v 2 assets/social/demo-poster.png
```

Validation:

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of json assets/social/demo-launch.mp4
```

## Checklist

- [ ] مدت ۳۰–۴۵ ثانیه
- [ ] Resolution/Aspect ratio صحیح
- [ ] H.264/AAC و faststart
- [ ] متن خوانا
- [ ] بدون PII، Dashboard، DevTools یا Notification
- [ ] بدون Copyright risk نامشخص
- [ ] CTA به `llm.persiantoolbox.ir`
- [ ] Video و Poster توسط مالک Preview شده‌اند

## Approval

```text
VIDEO_SHA256=
POSTER_SHA256=
DURATION_SECONDS=
RESOLUTION=
PII_REVIEW=PASS|FAIL
COPYRIGHT_REVIEW=PASS|FAIL
OWNER_APPROVAL=
```

تا وقتی Privacy، Copyright و Owner approval پاس نشده‌اند، Video منتشر نشود.
