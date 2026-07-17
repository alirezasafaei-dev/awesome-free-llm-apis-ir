# بسته توزیع محتوای فارسی

این فایل متن‌های آماده را برای بازنشر مقالات Sprint اول فراهم می‌کند. قبل از انتشار، URL نهایی مقاله جایگزین شود.

## قواعد مشترک

- نسخه سایت مرجع اصلی و دارای Canonical است.
- نسخه ویرگول باید خلاصه و بازنویسی شود، نه کپی کامل.
- Telegram و LinkedIn باید یک نکته عملی مستقل ارائه دهند.
- UTM هر کانال جدا باشد.
- در پست‌ها درخواست رأی یا رفتار Spam انجام نشود.
- ادعای سهمیه و دسترسی باید به داده تاریخ‌دار سایت متکی باشد.

---

# کمپین ۱: انتخاب API رایگان از ایران

مقاله اصلی:

```text
https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/
```

## UTMها

```text
Virgool:
https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/?utm_source=virgool&utm_medium=article&utm_campaign=persian_growth&utm_content=practical_api_selection

Telegram:
https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=practical_api_selection

LinkedIn:
https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/?utm_source=linkedin&utm_medium=social&utm_campaign=persian_growth&utm_content=practical_api_selection
```

## عنوان ویرگول

```text
چطور یک API رایگان هوش مصنوعی انتخاب کنیم که واقعاً از ایران قابل استفاده باشد؟
```

## لید ویرگول

```text
بازشدن سایت یک Provider به معنی کارکردن API آن نیست. برای انتخاب واقعی باید ثبت‌نام، ساخت کلید، اجرای مدل، نوع سهمیه و محدودیت منطقه‌ای را جدا بررسی کنیم. در این راهنما یک مسیر عملی از انتخاب سرویس تا اولین درخواست را مرور کرده‌ام.
```

## ساختار نسخه ویرگول

1. چرا شرایط کاربر ایرانی متفاوت است؟
2. تفاوت Free Tier، Trial و Credit
3. چرا تست صفحه اصلی کافی نیست؟
4. OpenAI-compatible دقیقاً یعنی چه؟
5. نمونه امن Python
6. چک‌لیست انتخاب
7. لینک مقاله مرجع و Catalog

## پست Telegram

```text
برای انتخاب API رایگان هوش مصنوعی فقط اسم مدل را نبینید.

قبل از شروع این ۶ مورد را بررسی کنید:

۱) نوع سهمیه: دائمی، مدل رایگان، Credit یا Trial
۲) نیاز به کارت بانکی
۳) امکان ثبت‌نام از ایران
۴) موفقیت درخواست واقعی مدل
۵) محدودیت RPM/RPD/TPM
۶) امکان تعویض Base URL و Provider

بازشدن سایت یا Endpoint عمومی، کارکردن واقعی مدل را ثابت نمی‌کند.

راهنمای مرحله‌به‌مرحله + نمونه Python:
{{TELEGRAM_UTM_URL}}

اگر سرویسی را از ایران تست کرده‌اید، نتیجه تاریخ‌دار را در GitHub ثبت کنید؛ بدون API Key یا اطلاعات حساب.
```

## پست LinkedIn فارسی

```text
مشکل انتخاب API رایگان LLM برای توسعه‌دهنده ایرانی فقط کیفیت مدل نیست.

ممکن است سایت باز شود اما:
- ثبت‌نام کامل نشود؛
- API Key ساخته نشود؛
- مدل برای منطقه یا حساب فعال نباشد؛
- سهمیه رایگان فقط یک Trial کوتاه باشد.

برای همین یک راهنمای عملی نوشتم که انتخاب را از «نام Provider» به یک فرآیند قابل تست تبدیل می‌کند:

• تعریف Use case
• تشخیص نوع سهمیه
• بررسی دسترسی ایران
• اجرای اولین درخواست واقعی
• مدیریت Secret
• طراحی Provider fallback

مقاله و کاتالوگ زنده:
{{LINKEDIN_UTM_URL}}

تجربه‌های تاریخ‌دار کاربران ایرانی می‌تواند این داده را دقیق‌تر کند.
```

## اسکریپت ویدیوی کوتاه

```text
هوک: یک API هوش مصنوعی رایگان پیدا کردی؛ از کجا بفهمی واقعاً برای ایران کار می‌کند؟

صحنه ۱: فقط بازشدن سایت کافی نیست.
صحنه ۲: ثبت‌نام و ساخت API Key را بررسی کن.
صحنه ۳: یک درخواست واقعی مدل بفرست.
صحنه ۴: نوع سهمیه را ببین؛ Free Tier با Trial فرق دارد.
صحنه ۵: Base URL و مدل را در Environment Variable بگذار.
CTA: فهرست و راهنمای کامل در llm.persiantoolbox.ir
```

---

# کمپین ۲: ساخت چت‌بات فارسی با Python

مقاله اصلی:

```text
https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python-free-llm-api/
```

## UTMها

```text
Virgool:
https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python-free-llm-api/?utm_source=virgool&utm_medium=article&utm_campaign=persian_growth&utm_content=python_chatbot

Telegram:
https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python-free-llm-api/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=python_chatbot

LinkedIn:
https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python-free-llm-api/?utm_source=linkedin&utm_medium=social&utm_campaign=persian_growth&utm_content=python_chatbot
```

## عنوان ویرگول

```text
ساخت یک چت‌بات فارسی قابل تعویض با Python و OpenAI SDK
```

## لید ویرگول

```text
در این آموزش به‌جای وابستگی به یک Provider، کلید، Base URL و Model ID را از متغیر محیطی می‌خوانیم. نتیجه یک چت‌بات فارسی ساده است که مدیریت تاریخچه و خطاهای 401، 429 و شبکه را نیز دارد.
```

## پست Telegram

```text
یک چت‌بات فارسی ساده با Python، بدون وابستگی مستقیم به یک Provider:

- OpenAI SDK
- Base URL سفارشی
- API Key در Environment Variable
- تاریخچه محدود برای کنترل توکن
- مدیریت خطای 401، 429 و Network
- امکان تعویض Provider بدون بازنویسی برنامه

آموزش کامل و کد قابل اجرا:
{{TELEGRAM_UTM_URL}}

نکته امنیتی: API Key را هیچ‌وقت داخل سورس یا Frontend قرار ندهید.
```

## پست LinkedIn فارسی

```text
برای ساخت چت‌بات با APIهای مختلف، بهتر است کد را به یک Provider قفل نکنیم.

من یک نمونه Python آماده کرده‌ام که تنظیمات را از این سه متغیر می‌خواند:

LLM_API_KEY
LLM_BASE_URL
LLM_MODEL

با این ساختار:
- Secret وارد Git نمی‌شود؛
- Provider سریع‌تر عوض می‌شود؛
- Timeout و Retry کنترل می‌شوند؛
- خطاهای مهم جدا تشخیص داده می‌شوند؛
- Context بی‌نهایت رشد نمی‌کند.

آموزش کامل:
{{LINKEDIN_UTM_URL}}
```

## اسکریپت ویدیوی کوتاه

```text
هوک: با سه Environment Variable، چت‌باتت را از یک Provider به Provider دیگر منتقل کن.

نمایش کد:
LLM_API_KEY
LLM_BASE_URL
LLM_MODEL

سپس Client OpenAI، ارسال پیام فارسی و مدیریت خطای 429.

CTA: کد کامل و نکات امنیتی در مقاله.
```

---

# کمپین ۳: رفع خطای 429

مقاله اصلی:

```text
https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/
```

## UTMها

```text
Virgool:
https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/?utm_source=virgool&utm_medium=article&utm_campaign=persian_growth&utm_content=rate_limit_429

Telegram:
https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=rate_limit_429

LinkedIn:
https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/?utm_source=linkedin&utm_medium=social&utm_campaign=persian_growth&utm_content=rate_limit_429
```

## عنوان ویرگول

```text
خطای 429 در APIهای هوش مصنوعی را با Retry بی‌نهایت بدتر نکنید
```

## لید ویرگول

```text
429 همیشه به معنی پرشدن RPM نیست. ممکن است سهمیه روزانه، توکن، Concurrency یا Credit تمام شده باشد. راه‌حل درست از تشخیص نوع محدودیت شروع می‌شود و به Backoff، Queue و Fallback می‌رسد.
```

## پست Telegram

```text
خطای 429 همیشه با چند ثانیه صبر حل نمی‌شود.

ممکن است یکی از این سقف‌ها پر شده باشد:
- RPM
- RPD
- TPM
- Concurrency
- Credit

راه‌حل عملی:
۱) Retry-After و Dashboard را بررسی کن
۲) Backoff + Jitter بگذار
۳) Retry را محدود کن
۴) درخواست‌ها را Queue کن
۵) Context را کوچک کن
۶) برای پایان سهمیه Fallback داشته باش

کد Python و توضیح کامل:
{{TELEGRAM_UTM_URL}}
```

## پست LinkedIn فارسی

```text
یکی از خطاهای رایج در پروژه‌های LLM این است:

429 → Retry فوری → 429 بیشتر → Retry Storm

راه‌حل فقط sleep نیست.

باید مشخص شود محدودیت مربوط به RPM، RPD، TPM، Concurrency یا پایان Credit است. بعد می‌توان تصمیم درست گرفت:

• Exponential Backoff + Jitter
• احترام به Retry-After
• Queue و Backpressure
• محدودیت Concurrency
• کاهش Context
• Circuit Breaker
• Provider fallback

راهنمای تخصصی و نمونه کد:
{{LINKEDIN_UTM_URL}}
```

## اسکریپت ویدیوی کوتاه

```text
هوک: وقتی 429 می‌گیری، فوراً دوباره درخواست نفرست.

نمایش زنجیره اشتباه Retry Storm.
سپس سه راه‌حل:
۱) Backoff و Jitter
۲) Queue و Concurrency limit
۳) تشخیص پایان سهمیه و Fallback

CTA: کد کامل Python در مقاله.
```

---

# ترتیب انتشار

1. مقاله انتخاب API
2. نسخه Telegram و LinkedIn همان مقاله
3. مقاله چت‌بات Python
4. نسخه ویرگول مقاله اول
5. مقاله 429
6. نسخه‌های شبکه اجتماعی دو مقاله بعدی
7. ویدیوی کوتاه اول

برای جلوگیری از خستگی مخاطب، بیش از یک محتوای اصلی در یک روز منتشر نشود. خلاصه شبکه اجتماعی می‌تواند همان روز یا روز بعد منتشر شود.
