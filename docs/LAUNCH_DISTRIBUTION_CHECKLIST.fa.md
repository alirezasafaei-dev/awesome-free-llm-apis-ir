# چک‌لیست لانچ و توزیع پروژه

این سند مرجع اجرایی لانچ و توزیع عمومی پروژه **Awesome Free LLM APIs IR** است و باید توسط مالک پروژه و Agentها، از جمله Mimo، به‌روزرسانی شود.

- سایت Canonical: `https://llm.persiantoolbox.ir/`
- Repository: `alirezasafaei-dev/awesome-free-llm-apis-ir`
- Issue پیگیری لانچ: `#44`
- وضعیت‌های مجاز: `NOT_STARTED`، `DRAFT_READY`، `REVIEWED`، `SCHEDULED`، `PUBLISHED`، `MONITORING`، `COMPLETED`، `BLOCKED`

## قواعد اجرایی

- [ ] هیچ Password، IP، Username زیرساخت، Recovery Code، DNS Verification Token یا URL مدیریتی در متن عمومی ثبت نشود.
- [ ] همه لینک‌های انتشار به دامنه Canonical اشاره کنند.
- [ ] برای هر کانال UTM جداگانه استفاده شود.
- [ ] هیچ درخواست رأی هماهنگ‌شده، خرید Backlink، Comment Spam یا ارسال انبوه انجام نشود.
- [ ] قوانین هر Community پیش از انتشار خوانده شود.
- [ ] هر انتشار و نتیجه آن در Launch Log ثبت شود.
- [ ] متن هر Community متناسب با مخاطب همان Community نوشته شود؛ Copy/Paste انبوه ممنوع است.
- [ ] ادعاهایی مانند «بهترین» یا «کاملاً رایگان» فقط با معیار و شواهد روشن استفاده شوند.

---

# ۰. دروازه قبل از انتشار

- [ ] Production Canonical بدون خطا باز می‌شود.
- [ ] آخرین Revision روی Canonical و Mirror مستقر است.
- [ ] Iran Mirror دارای `X-Robots-Tag: noindex, nofollow` است.
- [ ] Plausible Pageview و حداقل یک Custom Event را ثبت می‌کند.
- [ ] Password حساب Plausible تعویض شده است.
- [ ] 2FA فعال و Recovery Codeها امن ذخیره شده‌اند.
- [ ] Search Console متصل است.
- [ ] Sitemap در Search Console ثبت و پذیرفته شده است.
- [ ] Bing Webmaster Tools متصل است.
- [ ] Sitemap در Bing ثبت شده است.
- [ ] Social/Open Graph Assetها روی سایت Live هستند.
- [ ] Social Preview در LinkedIn، Telegram و X بررسی شده است.
- [ ] Issue امنیتی `#48` بسته شده است.
- [ ] هیچ Endpoint عملیاتی در Workflow عمومی Hardcode نشده است.

---

# ۱. UTMهای استاندارد

## قالب

```text
https://llm.persiantoolbox.ir/?utm_source=<source>&utm_medium=<medium>&utm_campaign=initial_launch
```

## لینک‌های پیشنهادی

- GitHub:
  `https://llm.persiantoolbox.ir/?utm_source=github&utm_medium=community&utm_campaign=initial_launch`
- LinkedIn:
  `https://llm.persiantoolbox.ir/?utm_source=linkedin&utm_medium=social&utm_campaign=initial_launch`
- Instagram:
  `https://llm.persiantoolbox.ir/?utm_source=instagram&utm_medium=social&utm_campaign=initial_launch`
- Telegram:
  `https://llm.persiantoolbox.ir/?utm_source=telegram&utm_medium=community&utm_campaign=initial_launch`
- X:
  `https://llm.persiantoolbox.ir/?utm_source=x&utm_medium=social&utm_campaign=initial_launch`
- Virgool:
  `https://llm.persiantoolbox.ir/?utm_source=virgool&utm_medium=article&utm_campaign=initial_launch`
- Persian Toolbox Blog:
  `https://llm.persiantoolbox.ir/?utm_source=persiantoolbox&utm_medium=article&utm_campaign=initial_launch`
- YouTube:
  `https://llm.persiantoolbox.ir/?utm_source=youtube&utm_medium=video&utm_campaign=initial_launch`
- Aparat:
  `https://llm.persiantoolbox.ir/?utm_source=aparat&utm_medium=video&utm_campaign=initial_launch`
- Product Hunt:
  `https://llm.persiantoolbox.ir/?utm_source=producthunt&utm_medium=launch&utm_campaign=international_launch`
- Hacker News:
  `https://llm.persiantoolbox.ir/?utm_source=hackernews&utm_medium=community&utm_campaign=international_launch`
- Reddit:
  `https://llm.persiantoolbox.ir/?utm_source=reddit&utm_medium=community&utm_campaign=international_launch`

---

# ۲. GitHub Release

- [ ] Version و Tag تعیین شود؛ نمونه: `v1.0.0`.
- [ ] عنوان Release واضح باشد.
- [ ] معرفی کوتاه فارسی نوشته شود.
- [ ] معرفی کوتاه انگلیسی نوشته شود.
- [ ] لینک Canonical اضافه شود.
- [ ] تعداد Providerها و Guideها با داده فعلی ذکر شود.
- [ ] تفاوت `Free Tier`، `Trial` و Credit توضیح داده شود.
- [ ] وضعیت دسترسی ایران توضیح داده شود.
- [ ] OpenAI compatibility و Base URLها معرفی شوند.
- [ ] Catalog ماشین‌خوان، Sitemap و `llms.txt` معرفی شوند.
- [ ] محدودیت‌ها و مواردی که نیاز به گزارش Community دارند نوشته شوند.
- [ ] روش Contribution اضافه شود.
- [ ] Screenshot یا Social Card اضافه شود.
- [ ] Release منتشر شود.
- [ ] لینک Release در Issue `#44` و Launch Log ثبت شود.

**Status:** `NOT_STARTED`

---

# ۳. GitHub Discussion

- [ ] GitHub Discussions فعال باشد.
- [ ] Discussion در دسته `Announcements` ساخته شود.
- [ ] لینک Release اضافه شود.
- [ ] لینک Canonical اضافه شود.
- [ ] سؤال مشخص برای دریافت Feedback مطرح شود.
- [ ] از کاربران درخواست شود Providerهای قدیمی یا ناقص را گزارش کنند.
- [ ] Discussion در صورت امکان Pin شود.
- [ ] تمام سؤال‌های فنی روزهای اول پاسخ داده شوند.

سؤال پیشنهادی:

> کدام Provider یا API رایگان باید در نسخه بعدی اضافه یا دوباره بررسی شود؟

**Status:** `NOT_STARTED`

---

# ۴. LinkedIn

## پست اصلی

- [ ] انتشار از حساب شخصی مؤسس.
- [ ] انتشار جداگانه از صفحه Persian Toolbox، در صورت وجود.
- [ ] شروع پست با مسئله کاربران، نه صرفاً معرفی محصول.
- [ ] توضیح تشخیص Free Tier واقعی از Trial.
- [ ] توضیح چالش دسترسی کاربران ایران.
- [ ] اشاره به OpenAI compatibility.
- [ ] تصویر OG یا Screenshot اضافه شود.
- [ ] لینک UTM مخصوص LinkedIn استفاده شود.
- [ ] حداکثر ۳ تا ۵ Hashtag مرتبط استفاده شود.
- [ ] CTA برای Feedback یا Contribution نوشته شود.
- [ ] Commentها در ۲۴ ساعت اول پاسخ داده شوند.
- [ ] نتیجه در Launch Log ثبت شود.

## Carousel اختیاری

- [ ] اسلاید ۱: مسئله چیست؟
- [ ] اسلاید ۲: Free Tier با Trial چه فرقی دارد؟
- [ ] اسلاید ۳: پروژه چه داده‌ای ارائه می‌کند؟
- [ ] اسلاید ۴: وضعیت دسترسی ایران چگونه ثبت شده است؟
- [ ] اسلاید ۵: لینک سایت و GitHub.

**Status:** `NOT_STARTED`

---

# ۵. Instagram

## Carousel چهاردرپنج

- [ ] طراحی در ابعاد ۴:۵.
- [ ] اسلاید اول Hook واضح داشته باشد.
- [ ] مشکل پیدا کردن API رایگان توضیح داده شود.
- [ ] تفاوت Free Tier و Trial نمایش داده شود.
- [ ] نمونه Providerها یا جدول سایت نمایش داده شود.
- [ ] وضعیت دسترسی ایران ذکر شود.
- [ ] OpenAI-compatible بودن سرویس‌ها توضیح داده شود.
- [ ] CTA به Link in Bio اضافه شود.
- [ ] Caption فارسی آماده شود.
- [ ] UTM اینستاگرام در Bio قرار گیرد.
- [ ] پست در Highlight پروژه ذخیره شود.

## Story

- [ ] استوری معرفی پروژه.
- [ ] استوری قابلیت Filter.
- [ ] استوری Provider Page.
- [ ] استوری تفاوت Free Tier و Trial.
- [ ] استوری درخواست معرفی Provider جدید.
- [ ] Link Sticker با UTM اضافه شود.
- [ ] Highlight با نام `Free LLM APIs` ساخته شود.

## Reel

- [ ] مدت ۲۰ تا ۴۵ ثانیه.
- [ ] Hook در سه ثانیه اول.
- [ ] نمایش نسخه موبایل سایت.
- [ ] نمایش Filter و Advisor.
- [ ] نمایش Provider Page.
- [ ] نمایش Copy Base URL.
- [ ] نمایش GitHub.
- [ ] زیرنویس فارسی.
- [ ] CTA نهایی.

**Status:** `NOT_STARTED`

---

# ۶. Telegram و Communityهای فارسی

## کانال رسمی

- [ ] متن کوتاه معرفی آماده شود.
- [ ] تصویر OG اضافه شود.
- [ ] لینک UTM تلگرام استفاده شود.
- [ ] Open Source بودن پروژه ذکر شود.
- [ ] تعداد Providerها و Guideها ذکر شود.
- [ ] پست برای چند روز Pin شود.

## گروه‌ها

- [ ] قوانین هر گروه خوانده شود.
- [ ] گروه‌های مرتبط با AI، Python، JavaScript، Backend و Open Source انتخاب شوند.
- [ ] برای هر گروه متن متناسب نوشته شود.
- [ ] هر گروه فقط یک‌بار هدف قرار گیرد.
- [ ] ارسال مجدد فقط هنگام Update مهم انجام شود.
- [ ] برای پاسخ به سؤال‌ها حضور فعال وجود داشته باشد.
- [ ] نام گروه، تاریخ و نتیجه در Launch Log ثبت شود.

**Status:** `NOT_STARTED`

---

# ۷. X / Twitter

- [ ] یک پست کوتاه با Hook فنی آماده شود.
- [ ] سه مزیت اصلی پروژه ذکر شود.
- [ ] لینک UTM مخصوص X استفاده شود.
- [ ] Social Card اضافه شود.
- [ ] Hashtagها محدود باشند.
- [ ] پست Launch Pin شود.
- [ ] Thread اختیاری درباره روش Verification داده‌ها منتشر شود.
- [ ] سؤال‌ها و نقدها پاسخ داده شوند.

**Status:** `NOT_STARTED`

---

# ۸. WhatsApp

- [ ] پیام بسیار کوتاه آماده شود.
- [ ] فقط برای گروه‌ها یا مخاطبان مرتبط ارسال شود.
- [ ] Social Card اضافه شود.
- [ ] لینک UTM اختصاصی استفاده شود.
- [ ] ارسال انبوه به مخاطبان نامرتبط انجام نشود.
- [ ] درخواست Forward عمومی و تهاجمی نوشته نشود.

**Status:** `NOT_STARTED`

---

# ۹. ویرگول

عنوان پیشنهادی:

> چطور یک API رایگان LLM مناسب برای کاربران ایران انتخاب کنیم؟

- [ ] مقدمه درباره مشکل انتخاب Provider.
- [ ] تعریف Free Tier، Trial و Credit.
- [ ] توضیح نیاز یا عدم نیاز به کارت بانکی.
- [ ] توضیح RPM، RPD و TPM.
- [ ] توضیح OpenAI compatibility.
- [ ] توضیح وضعیت دسترسی ایران.
- [ ] معرفی چند Provider به‌عنوان نمونه.
- [ ] جدول مقایسه اضافه شود.
- [ ] Screenshot سایت اضافه شود.
- [ ] لینک Guide مرتبط اضافه شود.
- [ ] لینک UTM ویرگول اضافه شود.
- [ ] لینک GitHub اضافه شود.
- [ ] تاریخ آخرین بررسی نوشته شود.
- [ ] متن عیناً از Guide سایت کپی نشود.
- [ ] Commentها پاسخ داده شوند.

**Status:** `NOT_STARTED`

---

# ۱۰. وبلاگ Persian Toolbox

- [ ] نسخه عمیق‌تر مقاله ویرگول نوشته شود.
- [ ] جدول Providerها اضافه شود.
- [ ] مثال Python اضافه شود.
- [ ] مثال JavaScript اضافه شود.
- [ ] لینک داخلی به سایت LLM اضافه شود.
- [ ] لینک Catalog JSON اضافه شود.
- [ ] لینک GitHub اضافه شود.
- [ ] FAQ اضافه شود.
- [ ] Structured Data مناسب اضافه شود.
- [ ] مقاله هنگام تغییر Providerها به‌روزرسانی شود.

**Status:** `NOT_STARTED`

---

# ۱۱. YouTube و آپارات

## ویدئوی اصلی

- [ ] مدت ۱ تا ۳ دقیقه.
- [ ] معرفی مسئله.
- [ ] نمایش صفحه اصلی.
- [ ] نمایش Filter و Advisor.
- [ ] نمایش Provider Page.
- [ ] نمایش Guideها.
- [ ] نمایش Catalog JSON.
- [ ] نمایش Repository.
- [ ] زیرنویس فارسی.
- [ ] Thumbnail اختصاصی.
- [ ] لینک UTM در Description.
- [ ] لینک GitHub در Description.

## نسخه کوتاه

- [ ] نسخه عمودی ۳۰ تا ۶۰ ثانیه‌ای استخراج شود.
- [ ] در Instagram Reels منتشر شود.
- [ ] در YouTube Shorts منتشر شود.
- [ ] در آپارات منتشر شود.

**Status:** `NOT_STARTED`

---

# ۱۲. DEV Community، Hashnode و Medium

- [ ] مقاله انگلیسی نوشته شود.
- [ ] ساختار داده و Open Source بودن پروژه محور اصلی باشد.
- [ ] Free Tier classification توضیح داده شود.
- [ ] Evidence مربوط به دسترسی منطقه‌ای توضیح داده شود.
- [ ] نمونه استفاده از Catalog ارائه شود.
- [ ] Code snippet اضافه شود.
- [ ] لینک Canonical اضافه شود.
- [ ] لینک GitHub اضافه شود.
- [ ] نسخه‌های هر پلتفرم بازنویسی شوند و Duplicate کامل نباشند.

عنوان پیشنهادی:

> How we built a machine-readable catalog of free LLM APIs

**Status:** `NOT_STARTED`

---

# ۱۳. Reddit

- [ ] Subreddit مرتبط انتخاب شود.
- [ ] قوانین Self-promotion خوانده شود.
- [ ] حساب دارای سابقه مشارکت واقعی باشد.
- [ ] متن آموزشی و شفاف نوشته شود.
- [ ] روش Verification توضیح داده شود.
- [ ] محدودیت‌های پروژه ذکر شوند.
- [ ] درخواست Feedback مطرح شود.
- [ ] هم‌زمان در تعداد زیادی Community Cross-post نشود.
- [ ] نقدهای منفی حذف یا نادیده گرفته نشوند.
- [ ] نتیجه در Launch Log ثبت شود.

Communityهای قابل بررسی:

- `r/LocalLLaMA`
- `r/opensource`
- `r/SideProject`
- `r/webdev`
- `r/Python`
- `r/javascript`

**Status:** `NOT_STARTED`

---

# ۱۴. Product Hunt

فقط بعد از آماده‌شدن نسخه انگلیسی کامل و Demo انجام شود.

- [ ] Landing Page انگلیسی قابل فهم باشد.
- [ ] محصول بدون ثبت‌نام قابل استفاده باشد.
- [ ] Maker Profile کامل باشد.
- [ ] Tagline آماده شود.
- [ ] توضیح کوتاه آماده شود.
- [ ] Gallery آماده شود.
- [ ] Demo Video آماده شود.
- [ ] First Comment آماده شود.
- [ ] لینک مستقیم Canonical استفاده شود.
- [ ] Open Source بودن ذکر شود.
- [ ] در روز Launch پاسخ‌گویی فعال انجام شود.
- [ ] درخواست Upvote ساختگی یا هماهنگ‌شده انجام نشود.

**Status:** `NOT_STARTED`

---

# ۱۵. Hacker News

- [ ] بررسی شود پروژه برای `Show HN` مناسب است یا Submission عادی.
- [ ] محصول مستقیماً قابل امتحان باشد.
- [ ] عنوان غیرتبلیغاتی نوشته شود.
- [ ] روش جمع‌آوری و Verification داده توضیح داده شود.
- [ ] محدودیت‌ها شفاف ذکر شوند.
- [ ] لینک Canonical و Repository اضافه شود.
- [ ] هیچ درخواست Upvote یا Comment هماهنگ‌شده انجام نشود.
- [ ] برای پاسخ به سؤال‌های فنی زمان اختصاص داده شود.

عنوان پیشنهادی:

> Show HN: A machine-readable catalog of free LLM APIs with regional access evidence

**Status:** `NOT_STARTED`

---

# ۱۶. Outreach محدود و هدفمند

## Maintainerهای Repositoryها و Awesome Listها

- [ ] فهرست ۱۰ تا ۲۰ Repository مرتبط تهیه شود.
- [ ] Contribution Guidelines هر Repository خوانده شود.
- [ ] Issue تبلیغاتی باز نشود.
- [ ] PR فقط در صورت تطابق واقعی ارسال شود.
- [ ] پیام برای هر Maintainer شخصی‌سازی شود.
- [ ] Machine-readable catalog و Evidence ایران توضیح داده شود.
- [ ] نتیجه هر Outreach ثبت شود.

## نویسندگان و بلاگرها

- [ ] افراد واقعاً مرتبط انتخاب شوند.
- [ ] حداقل یک محتوای اخیر آن‌ها خوانده شود.
- [ ] پیام شخصی‌سازی‌شده نوشته شود.
- [ ] در پیام اول درخواست مستقیم Backlink مطرح نشود.
- [ ] داده یا جدول قابل استناد ارائه شود.
- [ ] فقط یک Follow-up ارسال شود.

## خبرنامه‌ها و رسانه‌ها

- [ ] Press Kit کوچک آماده شود.
- [ ] توضیح فارسی و انگلیسی آماده شود.
- [ ] Social Card ارائه شود.
- [ ] لینک سایت و GitHub ارائه شود.
- [ ] یک Insight یا آمار واقعی ارائه شود.

## دانشگاه‌ها و انجمن‌های دانشجویی

- [ ] انجمن‌های کامپیوتر و AI شناسایی شوند.
- [ ] متن آموزشی آماده شود.
- [ ] پیشنهاد Demo یا Workshop کوتاه ارائه شود.
- [ ] ارسال انبوه انجام نشود.

**Status:** `NOT_STARTED`

---

# ۱۷. Discord و Slack Communityها

- [ ] قوانین Workspace خوانده شود.
- [ ] فقط Channel مربوط به `showcase` یا `self-promotion` استفاده شود.
- [ ] پیام کوتاه انگلیسی نوشته شود.
- [ ] Open Source بودن و ارزش عملی پروژه توضیح داده شود.
- [ ] در چند Channel یک Workspace تکرار نشود.
- [ ] سؤال‌ها پاسخ داده شوند.

**Status:** `NOT_STARTED`

---

# ۱۸. برنامه زمانی پیشنهادی

## روز اول

- [ ] GitHub Release
- [ ] GitHub Discussion
- [ ] LinkedIn
- [ ] X
- [ ] Telegram رسمی
- [ ] Instagram Story اولیه

## روز دوم

- [ ] Instagram Carousel
- [ ] Instagram Reel
- [ ] Communityهای منتخب Telegram
- [ ] Communityهای مرتبط WhatsApp
- [ ] مقاله ویرگول

## روز سوم

- [ ] مقاله وبلاگ Persian Toolbox
- [ ] YouTube
- [ ] Aparat
- [ ] YouTube Shorts

## روز چهارم تا هفتم

- [ ] DEV Community
- [ ] Hashnode
- [ ] Medium
- [ ] Reddit هدفمند
- [ ] Discord و Slack
- [ ] Outreach به Maintainerها
- [ ] Outreach به خبرنامه‌ها

## پس از تکمیل نسخه انگلیسی

- [ ] Product Hunt
- [ ] Hacker News
- [ ] Outreach بین‌المللی

---

# ۱۹. پایش بعد از انتشار

## ۲۴ ساعت اول

- [ ] پاسخ به Commentهای GitHub.
- [ ] پاسخ به LinkedIn.
- [ ] پاسخ به Telegram.
- [ ] پاسخ به Instagram DM و Comment.
- [ ] بررسی Visitors و Pageviews در Plausible.
- [ ] بررسی Referral Sources.
- [ ] بررسی Custom Eventها.
- [ ] ثبت GitHub Stars و Issueهای جدید.
- [ ] ثبت خطاهای فنی احتمالی.

## ۷۲ ساعت اول

- [ ] کانال‌های ورودی مقایسه شوند.
- [ ] محبوب‌ترین Provider مشخص شود.
- [ ] محبوب‌ترین Guide مشخص شود.
- [ ] کانال‌های کم‌کیفیت یا نامرتبط مشخص شوند.
- [ ] Search Console بررسی شود.
- [ ] Bing بررسی شود.
- [ ] Follow-up مفید منتشر شود.

## پایان هفته اول

- [ ] Visitors هفتگی ثبت شود.
- [ ] Pageviews ثبت شود.
- [ ] GitHub Stars ثبت شود.
- [ ] Provider page clickها ثبت شود.
- [ ] Guide page clickها ثبت شود.
- [ ] Documentation clickها ثبت شود.
- [ ] Copy Base URL Eventها ثبت شود.
- [ ] Search Impressions و Clicks ثبت شوند.
- [ ] CTR و Average Position ثبت شوند.
- [ ] موضوع محتوای بعدی بر اساس داده انتخاب شود.
- [ ] Issue `#44` در صورت تکمیل Distribution اولیه بسته شود.

---

# ۲۰. Launch Log

برای هر انتشار یک ردیف ثبت شود:

| تاریخ | کانال | وضعیت | لینک انتشار | UTM | Visitors | GitHub Clicks | Stars | نتیجه/یادداشت |
|---|---|---|---|---|---:|---:|---:|---|
|  |  | `NOT_STARTED` |  |  |  |  |  |  |

---

# ۲۱. خروجی مورد انتظار Agent Mimo

Agent باید پس از هر نوبت کار، بدون اطلاعات حساس، این گزارش را تکمیل کند:

```text
LAUNCH_STATUS=
CURRENT_PHASE=
CHANNEL=
CHANNEL_STATUS=
DRAFT_PATH_OR_URL=
PUBLICATION_URL=
UTM_USED=
ANALYTICS_BASELINE_RECORDED=
COMMENTS_REVIEWED=
ISSUE_44_UPDATED=
BLOCKERS=
NEXT_SINGLE_ACTION=
```

## اقدام بعدی

```text
NEXT_SINGLE_ACTION=Prepare and publish the GitHub Release, then update Issue #44 with its public URL.
```
