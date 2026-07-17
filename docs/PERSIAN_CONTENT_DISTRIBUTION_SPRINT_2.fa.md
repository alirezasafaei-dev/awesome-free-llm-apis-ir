# بسته توزیع فارسی — Sprint 2

این بسته برای دو مقاله Node.js و عیب‌یابی خطاهای API آماده شده است. نسخه مرجع روی دامنه اصلی منتشر می‌شود و متن هر شبکه باید مستقل از مقاله کامل باشد.

## قواعد انتشار

- ابتدا URL مقاله روی دامنه اصلی Live و قابل دریافت باشد.
- Canonical مقاله باید به همان URL اصلی اشاره کند.
- یک مقاله کامل در چند دامنه Copy/Paste نشود.
- UTM هر کانال حفظ شود.
- ادعای سهمیه و دسترسی ایران فقط از Catalog و شواهد تاریخ‌دار گرفته شود.
- API Key، Cookie، IP یا اطلاعات حساب در تصویر و متن قرار نگیرد.

---

# کمپین ۴: Node.js و Base URL سفارشی

مقاله اصلی:

```text
https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/
```

## UTMها

```text
Virgool:
https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/?utm_source=virgool&utm_medium=article&utm_campaign=persian_growth&utm_content=nodejs_integration

Telegram:
https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=nodejs_integration

LinkedIn:
https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/?utm_source=linkedin&utm_medium=social&utm_campaign=persian_growth&utm_content=nodejs_integration
```

## عنوان ویرگول

```text
چطور در Node.js بدون قفل‌شدن به یک Provider از APIهای LLM استفاده کنیم؟
```

## لید ویرگول

```text
با جداکردن API Key، Base URL و Model ID از سورس، می‌توان یک Client قابل تعویض ساخت. اما اتصال Production فقط ارسال یک Request نیست؛ Timeout، Retry، Streaming، Context و امنیت Backend باید از ابتدا طراحی شوند.
```

## پست Telegram

```text
اتصال Node.js به APIهای سازگار با OpenAI با سه متغیر:

LLM_API_KEY
LLM_BASE_URL
LLM_MODEL

در راهنمای جدید:
- ساخت Client مشترک
- Streaming
- مدیریت 401، 403، 404 و 429
- Timeout و Cancellation
- Endpoint امن Express
- کنترل Context
- جلوگیری از افشای API Key در Frontend

کد کامل:
{{TELEGRAM_UTM_URL}}
```

## پست LinkedIn فارسی

```text
برای مهاجرت سریع میان Providerهای LLM، کد Application نباید مستقیماً به یک Host و Model قفل شود.

یک نمونه Node.js آماده کرده‌ام که:

• تنظیمات را از Environment می‌خواند؛
• Streaming و Timeout دارد؛
• خطاهای Authentication، Model و Rate Limit را جدا می‌کند؛
• API Key را در Backend نگه می‌دارد؛
• تعویض Provider را به تغییر Config محدود می‌کند.

مقاله و کد:
{{LINKEDIN_UTM_URL}}
```

## اسکریپت ویدیوی کوتاه

```text
هوک: برای عوض‌کردن Provider کل پروژه را بازنویسی نکن.

صحنه ۱: سه متغیر LLM_API_KEY، LLM_BASE_URL و LLM_MODEL
صحنه ۲: ساخت OpenAI Client در Node.js
صحنه ۳: Streaming پاسخ
صحنه ۴: API Key فقط در Backend
صحنه ۵: مدیریت 429 و Timeout

CTA: نمونه کامل در llm.persiantoolbox.ir
```

---

# کمپین ۵: خطاهای 401، 403 و Model Not Found

مقاله اصلی:

```text
https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/
```

## UTMها

```text
Virgool:
https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/?utm_source=virgool&utm_medium=article&utm_campaign=persian_growth&utm_content=auth_model_errors

Telegram:
https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/?utm_source=telegram&utm_medium=social&utm_campaign=persian_growth&utm_content=auth_model_errors

LinkedIn:
https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/?utm_source=linkedin&utm_medium=social&utm_campaign=persian_growth&utm_content=auth_model_errors
```

## عنوان ویرگول

```text
خطای 401، 403 یا Model Not Found؟ مشکل را مرحله‌به‌مرحله جدا کنید
```

## لید ویرگول

```text
401، 403 و 404 شبیه هم نیستند. اولی بیشتر به کلید و Authentication مربوط است، دومی به مجوز حساب یا سیاست Provider و سومی به Base URL، Endpoint یا Model ID. در این راهنما یک مسیر تشخیص بدون افشای Secret ارائه شده است.
```

## پست Telegram

```text
راهنمای سریع خطاهای API مدل زبانی:

401 → کلید، Environment و روش Authentication
403 → Plan، مدل، Region، Scope یا وضعیت حساب
404 → Base URL، Endpoint یا Model ID
429 → Rate Limit یا پایان سهمیه

قبل از Debug:
- کلید را چاپ نکن
- Base URL و Model را ثبت کن
- یک Request حداقلی بفرست
- فهرست مدل‌های قابل دسترسی حساب را بررسی کن

راهنمای کامل:
{{TELEGRAM_UTM_URL}}
```

## پست LinkedIn فارسی

```text
یکی از دلایل طولانی‌شدن Debug در پروژه‌های LLM این است که همه خطاها «مشکل API Key» فرض می‌شوند.

در حالی که:

• 401 معمولاً Authentication است؛
• 403 بیشتر Authorization، Plan یا Policy است؛
• 404 اغلب Base URL، Endpoint یا Model ID است؛
• model_not_found ممکن است به دسترسی حساب مربوط باشد، نه نبودن مدل.

یک چک‌لیست عیب‌یابی و نمونه Python/Node.js آماده کرده‌ام که بدون چاپ Secret مشکل را جدا می‌کند:

{{LINKEDIN_UTM_URL}}
```

## اسکریپت ویدیوی کوتاه

```text
هوک: هر خطای API را با ساختن کلید جدید حل نکن.

کارت ۱: 401 = Authentication
کارت ۲: 403 = Permission / Policy
کارت ۳: 404 = Endpoint / Model
کارت ۴: Request حداقلی و List Models
کارت ۵: Secret را هیچ‌وقت در Log چاپ نکن

CTA: چک‌لیست کامل در مقاله.
```

---

# ترتیب پیشنهادی

1. انتشار مقاله Node.js
2. خلاصه Telegram در همان روز
3. LinkedIn فارسی روز بعد
4. انتشار مقاله خطاها سه تا چهار روز بعد
5. نسخه ویرگول مقاله Node.js
6. ویدیوی کوتاه خطاها

بین انتشارهای اصلی حداقل یک روز فاصله باشد تا داده هر Landing page قابل تفکیک بماند.
