# Demo Recording Runbook

## Status

`DEMO_REQUIRED`

این Runbook برای تولید Demo امن ۳۰ تا ۴۵ ثانیه‌ای از سایت زنده است. خروجی نباید Dashboard، Terminal، DevTools، Notification، Extension، Account data یا PII را نشان دهد.

## Target outputs

```text
assets/social/demo-launch.mp4
assets/social/demo-poster.png
assets/social/demo-launch-vertical.mp4
assets/social/demo-poster-vertical.png
```

اگر حجم MP4 برای Repository مناسب نیست، نسخه اصلی را به Release asset یا Storage عمومی مورد تأیید مالک منتقل کنید و فقط Poster/نسخه فشرده را Commit کنید.

## Shot list

| Time | Shot | هدف |
|---:|---|---|
| 0–4s | Home | نام پروژه و مسئله |
| 4–10s | Filter/Advisor | مقایسه سریع Providerها |
| 10–18s | Provider page | Free tier و quota |
| 18–24s | Compatibility | OpenAI/Base URL |
| 24–29s | Regional evidence | تفکیک policy/direct/VPN/unknown |
| 29–33s | Copy Base URL | Interaction واقعی |
| 33–38s | Guide | محتوای آموزشی |
| 38–45s | GitHub + End card | CTA و دامنه Canonical |

## Voice-over فارسی

«خیلی از APIهایی که رایگان معرفی می‌شوند، فقط Trial هستند یا محدودیت‌های مهمشان مشخص نیست. در Awesome Free LLM APIs IR می‌توانید نوع Free Tier، محدودیت مصرف، نیاز به کارت، سازگاری OpenAI و شواهد دسترسی منطقه‌ای را جداگانه مقایسه کنید. داده‌ها متن‌باز و ماشین‌خوان‌اند و برای هر Provider صفحه مستقل و Guide کاربردی وجود دارد. لینک پروژه: llm.persiantoolbox.ir»

## English subtitle/voice-over

“Many APIs described as free are actually short trials or limited credits. Awesome Free LLM APIs IR separates tier types, documented quotas, payment requirements, OpenAI compatibility and dated regional-access evidence. The data is open, machine-readable and used to generate provider pages and practical guides.”

## Browser preparation

1. Browser profile تازه و بدون Login شخصی استفاده کن.
2. Bookmark bar، Extensions و Notifications را مخفی کن.
3. Zoom را ثابت نگه دار.
4. Cookie/Consent state را پیش از ضبط تعیین کن.
5. Cursor path را تمرین کن.
6. Provider و Guide نمونه را از قبل انتخاب کن؛ هیچ داده Account لازم نباشد.
7. لینک‌ها را فقط روی دامنه Canonical باز کن.

## Playwright recording skeleton

این نمونه باید بر اساس Selectorهای واقعی سایت تطبیق داده شود؛ اگر Selector نامعتبر است، حدس نزن و ابتدا DOM عمومی را بررسی کن.

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

// Replace selectors only after checking the live, public DOM.
// Interact with filter/advisor, open one provider, copy Base URL,
// open one guide, and finish on the GitHub CTA.

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

## Validation

```bash
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height,r_frame_rate \
  -of json assets/social/demo-launch.mp4
```

Checklist:

- [ ] مدت ۳۰–۴۵ ثانیه
- [ ] Resolution و Aspect ratio صحیح
- [ ] H.264/AAC و `faststart`
- [ ] متن قابل‌خواندن
- [ ] بدون Black frame یا Cursor jump شدید
- [ ] بدون PII، Dashboard، DevTools یا Notification
- [ ] بدون موسیقی دارای Copyright نامشخص
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

تا زمانی که `PII_REVIEW=PASS`، `COPYRIGHT_REVIEW=PASS` و Approval مالک ثبت نشده، Video برای Social یا Video platforms استفاده نشود.
