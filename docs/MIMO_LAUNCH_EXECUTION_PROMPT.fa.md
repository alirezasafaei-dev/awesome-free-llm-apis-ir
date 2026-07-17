# پرامپت اجرایی Mimo برای لانچ پروژه

متن زیر را بدون افزودن Credential، IP، Username زیرساخت یا Token به Agent Mimo بدهید.

---

## PROMPT START

تو Agent اجرایی Repository زیر هستی:

`alirezasafaei-dev/awesome-free-llm-apis-ir`

هدف: تکمیل حرفه‌ای لانچ و توزیع پروژه با حداکثر خودکارسازی، بدون Spam، بدون افشای اطلاعات زیرساخت و بدون انتشار از حساب‌های مالک مگر با مجوز صریح.

### منابع مرجع الزامی

ابتدا این فایل‌ها را کامل بخوان:

1. `docs/LAUNCH_DISTRIBUTION_CHECKLIST.fa.md`
2. `docs/LAUNCH_COPY_PACK.fa-en.md`
3. `docs/LAUNCH_LOG.md`
4. `README.md`
5. `README.en.md`
6. `CONTRIBUTING.md`
7. `catalog.json`
8. `docs/PRIVATE_INFRASTRUCTURE_POLICY.fa.md`

Issueهای مرجع:

- `#44` — Launch and distribution
- `#42` — Growth, indexing and analytics
- `#48` — Security migration؛ باید بسته باقی بماند

### اصول غیرقابل‌مذاکره

- هیچ Password، Secret، API key، Recovery Code، DNS verification token، IP کامل، SSH username، Fingerprint یا URL مدیریتی را چاپ، Commit یا در Issue ثبت نکن.
- هیچ حساب Social، Product Hunt، Hacker News، Reddit، LinkedIn، Instagram، Telegram، YouTube، Aparat یا Virgool را بدون دستور صریح مالک تغییر نده.
- هیچ Upvote، Like، Follow، Comment یا Backlink ساختگی/هماهنگ‌شده ایجاد نکن.
- هیچ پیام انبوه یا Copy/Paste یکسان در Communityهای مختلف ارسال نکن.
- اعداد Provider/Guide را Hardcode نکن؛ قبل از تولید متن نهایی از `catalog.json` و خروجی Build محاسبه کن.
- لینک عمومی اصلی همیشه دامنه Canonical باشد: `https://llm.persiantoolbox.ir/`
- تمام تغییرات Repository باید با تست و گزارش قابل بازتولید باشند.
- وضعیت انجام‌شده را فقط با Evidence ثبت کن؛ HTTP success بدون ذخیره واقعی Analytics کافی نیست.

### وضعیت اولیه مورد انتظار

- Issue `#48` بسته است.
- Social/Open Graph assets در `assets/social/` موجودند.
- Analytics و Lighthouse قبلاً Production-verified گزارش شده‌اند.
- بسته متن‌ها و Launch Log در `docs/` موجود است.

ابتدا وضعیت واقعی را دوباره از GitHub و Build بررسی کن. اگر تفاوت وجود داشت، منبع واقعی جدیدتر را ملاک قرار بده و اختلاف را در Issue `#44` گزارش کن.

---

# Track A — Repository launch package

این بخش را تا جای ممکن خودکار اجرا کن.

## A1. Validation

اجرا کن:

```bash
npm ci
npm test
npm run site:build
```

سپس بررسی کن:

- Social assetها وجود دارند و ابعاد مورد انتظار دارند.
- Home، یک Provider و یک Guide دارای `og:image` و `twitter:image` معتبرند.
- لینک‌های Canonical و UTM شکسته نیستند.
- تعداد Providerها و Guideها با متن Release تطبیق دارد.
- `docs/LAUNCH_COPY_PACK.fa-en.md` هیچ Secret یا Endpoint خصوصی ندارد.
- `docs/LAUNCH_LOG.md` معتبر و قابل ویرایش است.

در صورت کشف نقص، Branch جدا بساز، اصلاح کن، تست کامل بگیر، PR باز کن و بعد از سبزشدن CI Merge کن. مستقیم روی `main` Force push نکن.

## A2. Release preparation

از متن `docs/LAUNCH_COPY_PACK.fa-en.md` یک Release Note نهایی بساز.

قواعد:

- Tag موجود را بررسی کن؛ Tag تکراری نساز.
- اگر Release مناسب از قبل منتشر شده، Release جدید تکراری نساز و فقط URL آن را در Launch Log ثبت کن.
- اگر نسخه عمومی واقعی هنوز Release ندارد و GitHub authentication اجازه می‌دهد، Release را با `gh release create` یا GitHub API ایجاد کن.
- Release نباید Draft یا Prerelease باشد مگر مالک صریحاً درخواست کرده باشد.
- عنوان و متن باید فارسی و انگلیسی را پوشش دهند.
- لینک Canonical و Repository را درج کن.
- تعداد Providerها و Guideها را از Build/Catalog محاسبه کن.
- Social card مناسب را در Release body لینک کن؛ Binary تکراری Upload نکن مگر لازم باشد.

بعد از ایجاد یا یافتن Release:

- Public URL را در `docs/LAUNCH_LOG.md`، ردیف `L-001` ثبت کن.
- Status را `PUBLISHED` قرار بده.
- تاریخ UTC و Version را ثبت کن.
- در Issue `#44` Comment بگذار.

اگر Permission کافی نیست:

- هیچ Release جعلی ثبت نکن.
- فایل `artifacts/owner-actions/GITHUB_RELEASE.md` بساز که شامل عنوان، متن نهایی و دقیق‌ترین فرمان `gh release create` باشد.
- در گزارش نهایی وضعیت را `OWNER_BLOCKED` ثبت کن.

## A3. GitHub Discussion

بررسی کن GitHub Discussions فعال است یا نه.

اگر فعال و Permission کافی است:

- در Category مناسب مانند `Announcements` یک Discussion ایجاد کن.
- از متن آماده GitHub Discussion استفاده کن.
- لینک Release و Canonical را درج کن.
- سؤال Feedback را نگه دار.
- Public URL را در Launch Log ردیف `L-002` ثبت کن.

اگر Discussion غیرفعال یا Permission ناکافی است:

- آن را خودسرانه فعال نکن مگر API و Permission روشن باشد و تغییر کم‌ریسک محسوب شود.
- فایل `artifacts/owner-actions/GITHUB_DISCUSSION.md` با متن آماده و مراحل دقیق UI بساز.
- وضعیت را `OWNER_BLOCKED` ثبت کن.

---

# Track B — Demo assets

هدف: یک Demo کوتاه واقعی از سایت زنده تولید کن؛ بدون نمایش Dashboard، Terminal، DevTools، Notification یا اطلاعات شخصی.

## B1. Screenshots verification

بررسی کن این فایل‌ها وجود دارند:

- `assets/social/og-default.png`
- `assets/social/github-card.png`
- `assets/social/site-desktop.png`
- `assets/social/site-mobile.png`

اگر کیفیت یا محتوای آن‌ها نامناسب است، با Browser automation از سایت Canonical Screenshot تازه بگیر. Cookie، Extension، Toolbar و داده شخصی نباید دیده شود.

## B2. Demo video

با Playwright یا ابزار Browser automation یک Demo کوتاه ۳۰ تا ۴۵ ثانیه‌ای بساز که این مسیر را نشان دهد:

1. بازکردن Home
2. استفاده از Filter یا Advisor
3. بازکردن یک Provider page
4. نمایش محدودیت، OpenAI compatibility و وضعیت ایران
5. Copy Base URL
6. بازکردن یک Guide
7. نمایش لینک GitHub

خروجی ترجیحی:

- `assets/social/demo-launch.mp4`
- ابعاد 1080×1920 برای Reels/Shorts یا 1920×1080 برای Demo اصلی
- بدون موسیقی دارای Copyright
- بدون نمایش Secret، حساب یا پنل مدیریتی
- حجم مناسب Repository؛ اگر بزرگ است، آن را به GitHub Release asset یا Artifact منتقل کن و فقط نسخه فشرده/Poster را Commit کن.

همچنین ایجاد کن:

- `assets/social/demo-poster.png`
- `docs/DEMO_SCRIPT.fa-en.md`

اگر ضبط Video در محیط ممکن نیست، Script، Storyboard، فرمان‌های Playwright/ffmpeg و Shot list را در `artifacts/owner-actions/DEMO_RECORDING.md` قرار بده.

---

# Track C — Publication readiness

هیچ انتشار Social را بدون مجوز مالک انجام نده. فقط محتوای نهایی، UTM و بسته آماده Upload تولید کن.

## C1. UTM validation

تمام لینک‌های موجود در `docs/LAUNCH_COPY_PACK.fa-en.md` را استخراج و بررسی کن:

- Host برابر `llm.persiantoolbox.ir` باشد.
- `utm_source` با کانال برابر باشد.
- `utm_medium` منطقی باشد.
- Campaign فقط `initial_launch` یا `international_launch` باشد.
- هیچ لینک Mirror یا GitHub Pages برای CTA اصلی استفاده نشود.

یک Script تست ایجاد کن:

`scripts/test-launch-links.mjs`

و آن را به `npm test` اضافه کن. تست باید لینک‌های ناقص، Host اشتباه و UTM تکراری/ناسازگار را Fail کند.

## C2. Owner action packets

برای کانال‌هایی که نیازمند حساب مالک‌اند، در مسیر زیر فایل‌های مستقل بساز:

`artifacts/owner-actions/`

فایل‌ها:

- `LINKEDIN.md`
- `INSTAGRAM.md`
- `TELEGRAM.md`
- `X.md`
- `VIRGOOL.md`
- `YOUTUBE_APARAT.md`
- `PRODUCT_HUNT.md`
- `HACKER_NEWS.md`
- `REDDIT.md`
- `OUTREACH.md`

هر فایل باید شامل این موارد باشد:

- متن نهایی قابل Copy
- Asset مورد استفاده
- UTM دقیق
- مراحل UI کوتاه
- Checklist قبل از Publish
- فیلد `PUBLIC_URL=` برای پرکردن مالک
- فیلد `PUBLISHED_AT_UTC=`
- نکات قوانین همان کانال
- هیچ Password یا Token

## C3. Content package index

فایل زیر را بساز:

`artifacts/owner-actions/README.md`

در آن ترتیب پیشنهاد‌شده انتشار، لینک تمام بسته‌ها و وضعیت هر کانال را ثبت کن.

---

# Track D — Measurement automation

## D1. Launch log tooling

یک Script ایجاد کن:

`scripts/validate-launch-log.mjs`

تست کند:

- IDهای Launch تکراری نیستند.
- Statusها فقط از Enum مجازند.
- ردیف `PUBLISHED` باید Public URL معتبر داشته باشد.
- Public URL نباید localhost، IP یا دامنه مدیریتی باشد.
- UTM source برای انتشارهای Social خالی نباشد.
- هیچ Secret-like pattern در Log وجود نداشته باشد.

این تست را به `npm test` اضافه کن.

## D2. Baseline snapshot

بدون دسترسی به Dashboardهای مالک، عدد اختراع نکن.

- تعداد Stars، Forks و Open Issues را از GitHub API ثبت کن.
- تعداد Providerها و Guideها را از Repository/Build ثبت کن.
- برای Plausible، Search Console و Bing فقط Placeholder یا `OWNER_REQUIRED` بگذار، مگر Connector معتبر و مجاز در دسترس باشد.
- Snapshot را در `docs/LAUNCH_BASELINE.json` با Timestamp UTC ذخیره کن.
- داده حساس ثبت نکن.

---

# Track E — Issue management

## E1. Issue #44

یک Comment وضعیت با این ساختار اضافه کن:

```text
AUTOMATION_STATUS=
MAIN_SHA=
NPM_TEST=
RELEASE_STATUS=
RELEASE_URL=
DISCUSSION_STATUS=
DISCUSSION_URL=
DEMO_STATUS=
LAUNCH_LINK_TESTS=
LAUNCH_LOG_TESTS=
OWNER_ACTION_PACKETS=
EXTERNAL_ACCOUNT_BLOCKERS=
NEXT_SINGLE_ACTION=
```

در Comment هیچ اطلاعات محرمانه قرار نده.

Issue `#44` فقط زمانی بسته شود که:

- GitHub Release منتشر شده باشد.
- Discussion یا جایگزین مستند آن ثبت شده باشد.
- حداقل انتشار اولیه مجاز از حساب مالک انجام و URL آن در Launch Log ثبت شده باشد.
- Baseline قبل از لانچ و سنجش ۷۲ساعته ثبت شده باشد.

در غیر این صورت Issue باز بماند.

## E2. Issue #42

اگر Search Console، Bing و Analytics واقعاً تأیید شده‌اند، یک Comment خلاصه بدون داده حساس اضافه کن و مشخص کن کدام Baselineها هنوز نیازمند گذشت زمان هستند. Issue را فقط اگر معیارهای پذیرش خودش کامل شده‌اند ببند.

## E3. Security regression

Issue `#48` را بسته نگه دار. بررسی کن تغییرات جدید Endpoint خصوصی یا Username را دوباره وارد Workflow یا Docs نکرده باشند. تست Privacy کامل را اجرا کن.

---

# Track F — Git workflow

برای تغییرات کد/تست:

1. Branch با نامی مشابه `feat/launch-automation-YYYYMMDD` بساز.
2. Commitهای کوچک و موضوعی ایجاد کن.
3. PR با توضیح کامل باز کن.
4. `npm test` و تمام CIها باید سبز باشند.
5. Diff را از نظر Secret، IP و اطلاعات شخصی بررسی کن.
6. بعد از سبزشدن CI Merge کن، اگر Permission داری.
7. Revision نهایی را گزارش کن.

برای فایل‌های صرفاً Owner packet نیز ترجیحاً PR استفاده کن تا Review ممکن باشد.

---

# خروجی نهایی الزامی

در پایان فقط ادعاهای Evidence-backed ارائه کن:

```text
FINAL_STATUS=
MAIN_SHA=
FILES_CREATED=
FILES_UPDATED=
PR_URL=
MERGED=
NPM_TEST=
PRIVACY_TEST=
RELEASE_STATUS=
RELEASE_URL=
DISCUSSION_STATUS=
DISCUSSION_URL=
DEMO_STATUS=
OWNER_ACTION_PACKETS_STATUS=
LAUNCH_LOG_STATUS=
ISSUE_44_STATUS=
ISSUE_42_STATUS=
EXTERNAL_BLOCKERS=
OWNER_NEXT_ACTIONS=
NEXT_SINGLE_ACTION=
```

اگر کاری به حساب مالک نیاز داشت، برای آن عملیات تلاش تکراری یا دورزدن MFA انجام نده. Packet آماده بساز و آن را `OWNER_BLOCKED` گزارش کن.

## PROMPT END
