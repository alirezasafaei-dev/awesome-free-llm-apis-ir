---
title: "رفع خطاهای 401، 403، 404 و Model Not Found در APIهای LLM"
slug: "fix-llm-api-401-403-model-not-found"
translation_key: "fix-llm-api-401-403-model-not-found"
description: "راهنمای عیب‌یابی تخصصی خطاهای API Key نامعتبر، مجوز منطقه‌ای، مدل غیرفعال، Base URL اشتباه و Endpoint ناسازگار در APIهای مدل زبانی."
primary_keyword: "رفع خطای 401 API هوش مصنوعی"
secondary_keywords:
  - "خطای 403 OpenAI compatible"
  - "model not found LLM API"
  - "Base URL اشتباه API"
canonical_target: "https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/"
updated_at: "2026-07-17"
status: "READY_FOR_SITE"
---

# رفع خطاهای 401، 403، 404 و Model Not Found در APIهای LLM

خطاهای احراز هویت و مدل در APIهای LLM معمولاً شبیه هم دیده می‌شوند، اما علت و راه‌حل آن‌ها متفاوت است. `401` بیشتر به اعتبار API Key یا روش Authentication مربوط است، `403` معمولاً به مجوز حساب، منطقه، سازمان یا مدل اشاره دارد و `404` یا `model_not_found` اغلب از Base URL، مسیر Endpoint یا Model ID اشتباه می‌آید.

برای بررسی Base URL، Model ID، نوع سهمیه و وضعیت دسترسی ایران از [کاتالوگ APIهای رایگان LLM](https://llm.persiantoolbox.ir/) و مستندات رسمی Provider استفاده کنید. داده‌های حساب، سهمیه و سیاست منطقه‌ای می‌توانند تغییر کنند؛ یک نمونه قدیمی در Blog یا ویدیو ممکن است دیگر معتبر نباشد.

## قبل از عیب‌یابی، خطا را پاک‌سازی کنید

برای Debug به اطلاعات کافی نیاز دارید، اما نباید Secret یا داده شخصی را منتشر کنید. این موارد معمولاً برای عیب‌یابی کافی‌اند:

- کد وضعیت HTTP
- نوع خطا
- پیام کوتاه و پاک‌سازی‌شده
- Base URL بدون Query حساس
- Model ID
- نام SDK و نسخه
- تاریخ تست
- مرحله‌ای که شکست خورده است

این موارد را منتشر نکنید:

- API Key
- Header کامل Authorization
- Cookie یا Session
- ایمیل و شماره تلفن حساب
- IP عمومی
- Request body حاوی داده خصوصی
- Screenshot پنل دارای شناسه حساب

کلید افشاشده را صرفاً از متن حذف نکنید؛ آن را Revoke و Rotate کنید.

## تفاوت خطاهای اصلی

### 401 Unauthorized

سرویس درخواست را دریافت کرده، اما هویت Client را معتبر تشخیص نداده است. دلایل رایج:

- API Key اشتباه یا ناقص است.
- کلید Revoke یا منقضی شده است.
- متغیر محیطی بارگذاری نشده است.
- Prefix یا Header احراز هویت اشتباه است.
- کلید مربوط به محیط یا پروژه دیگری است.
- SDK درخواست را به Host اشتباه می‌فرستد.

### 403 Forbidden

هویت ممکن است معتبر باشد، اما حساب اجازه اجرای عملیات را ندارد. دلایل رایج:

- مدل برای Plan فعلی فعال نیست.
- Provider منطقه یا کشور حساب را پشتیبانی نمی‌کند.
- Workspace یا Organization مجوز لازم ندارد.
- روش پرداخت، KYC یا تأیید حساب کامل نشده است.
- کلید Scope محدود دارد.
- Endpoint برای حساب رایگان مجاز نیست.

### 404 Not Found

مسیر درخواست یا منبع پیدا نشده است. در APIهای OpenAI-compatible معمولاً این موارد را بررسی کنید:

- وجود یا نبود `/v1` در Base URL
- مسیر صحیح `chat/completions` یا `responses`
- تفاوت Endpoint متن، Embedding و Audio
- اشتباه تایپی در Domain
- استفاده از URL Dashboard به‌جای API Host
- Model ID نامعتبر

### Model Not Found

ممکن است با کد `404`، `400` یا حتی `403` برگردد. معنی آن همیشه «مدل وجود ندارد» نیست. احتمال‌ها:

- نام نمایشی با Model ID متفاوت است.
- مدل در Region یا Plan شما فعال نیست.
- مدل بازنشسته شده است.
- Alias مدل تغییر کرده است.
- Provider فهرست مدل‌ها را به‌روز کرده، اما نمونه قدیمی مانده است.
- API Key به Project دیگری متصل است.

## مرحله اول: مطمئن شوید متغیر محیطی واقعاً بارگذاری شده است

در Python فقط وجود متغیر را بررسی کنید؛ مقدار کامل را چاپ نکنید:

```python
import os

key = os.getenv("LLM_API_KEY")
base_url = os.getenv("LLM_BASE_URL")
model = os.getenv("LLM_MODEL")

print({
    "api_key_loaded": bool(key),
    "api_key_length": len(key) if key else 0,
    "base_url": base_url,
    "model": model,
})
```

در Node.js:

```javascript
const summary = {
  apiKeyLoaded: Boolean(process.env.LLM_API_KEY),
  apiKeyLength: process.env.LLM_API_KEY?.length ?? 0,
  baseUrl: process.env.LLM_BASE_URL,
  model: process.env.LLM_MODEL,
};

console.log(summary);
```

طول کلید به‌تنهایی اعتبار آن را ثابت نمی‌کند، اما متغیر خالی، نقل‌قول اضافی و بارگذاری‌نشدن `.env` را آشکار می‌کند.

اشتباه‌های رایج:

```dotenv
LLM_API_KEY=" key-with-leading-space"
LLM_BASE_URL=https://provider.example/v1/
LLM_MODEL=display name instead of model-id
```

Space ابتدایی یا انتهایی، نقل‌قول نامناسب و Slash اضافی می‌توانند در بعضی Clientها مشکل ایجاد کنند.

## مرحله دوم: Base URL را از Endpoint نهایی جدا کنید

در SDK معمولاً `base_url` باید ریشه API باشد، نه مسیر کامل درخواست.

نمونه درست در بسیاری از Providerهای سازگار:

```text
Base URL:
https://provider.example/v1

SDK adds:
/chat/completions
```

نمونه اشتباه:

```text
https://provider.example/v1/chat/completions
```

اگر SDK خودش مسیر را اضافه کند، URL نهایی ممکن است دو بار تکرار شود.

در مقابل، بعضی Providerها Prefix متفاوت دارند. همیشه نمونه رسمی همان Provider را مبنا قرار دهید، نه فرض عمومی.

## مرحله سوم: Host واقعی درخواست را ببینید، بدون چاپ Secret

در محیط توسعه می‌توانید URL نهایی را در سطح Proxy یا Hook امن بررسی کنید. Header Authorization را Mask کنید.

نمونه Curl برای تست مسیر، با کلید از Environment:

```bash
curl --silent --show-error \
  --request POST \
  --url "$LLM_BASE_URL/chat/completions" \
  --header "Authorization: Bearer $LLM_API_KEY" \
  --header "Content-Type: application/json" \
  --data "{\"model\":\"$LLM_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"سلام\"}]}"
```

این دستور را در Shell History مشترک یا محیط ضبط‌شده اجرا نکنید. اگر Provider روش Authentication دیگری دارد، Header را مطابق مستندات رسمی تغییر دهید.

## مرحله چهارم: فهرست مدل‌های قابل دسترسی حساب را بگیرید

اگر Provider Endpoint فهرست مدل‌ها دارد، از همان حساب و همان Base URL استفاده کنید.

Python:

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
)

models = client.models.list()
for item in models.data:
    print(item.id)
```

این تست چند چیز را هم‌زمان بررسی می‌کند:

- کلید بارگذاری شده است.
- Base URL قابل دسترسی است.
- Authentication پذیرفته شده است.
- حساب حداقل اجازه مشاهده مدل‌ها را دارد.

اما موفقیت فهرست مدل‌ها تضمین نمی‌کند اجرای Chat یا Embedding مجاز باشد. درخواست واقعی همان قابلیت را نیز تست کنید.

## مرحله پنجم: یک درخواست حداقلی بسازید

برای جداکردن مشکل مدل از Prompt بزرگ، درخواست را کوچک کنید:

```python
response = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=[{"role": "user", "content": "ping"}],
    max_tokens=8,
)
```

پارامترهای اختیاری مانند Tool Calling، JSON Schema، Streaming و Temperature را موقتاً حذف کنید. اگر درخواست حداقلی موفق شد، مشکل در قابلیت یا پارامتر اضافی است.

## عیب‌یابی 401 به‌ترتیب درست

1. وجود متغیر محیطی را بررسی کنید.
2. کلید را از Dashboard دوباره Copy کنید.
3. Space و newline اضافی را حذف کنید.
4. مطمئن شوید Base URL متعلق به همان Provider است.
5. روش Authentication رسمی را بررسی کنید.
6. در صورت شک به نشت، کلید جدید بسازید.
7. یک درخواست حداقلی بدون Streaming و Tool Calling اجرا کنید.

نمونه مدیریت خطا در Python:

```python
from openai import AuthenticationError

try:
    response = client.chat.completions.create(
        model=os.environ["LLM_MODEL"],
        messages=[{"role": "user", "content": "سلام"}],
    )
except AuthenticationError:
    print("Authentication failed. Check key, base URL and account status.")
```

پیام خطا را به کاربر نهایی با جزئیات داخلی حساب نمایش ندهید.

## عیب‌یابی 403 به‌ترتیب درست

1. مدل را در Dashboard حساب بررسی کنید.
2. Plan و سهمیه فعال را ببینید.
3. وضعیت Verification، KYC یا روش پرداخت را بررسی کنید.
4. سیاست منطقه‌ای رسمی Provider را بخوانید.
5. Project و Organization مرتبط با کلید را کنترل کنید.
6. Scope کلید را بررسی کنید.
7. با یک مدل یا Endpoint مجاز دیگر تست کنید.

برای کاربر ایران، `403` نباید خودکار به «فیلترینگ شبکه» تعبیر شود. ممکن است سیاست حساب، Region، مدل یا Plan باشد. شواهد شبکه، حساب و سیاست رسمی را جدا ثبت کنید.

## عیب‌یابی 404 و Model Not Found

جدول تصمیم:

| نشانه | احتمال بیشتر | اقدام |
|---|---|---|
| همه مسیرها 404 هستند | Base URL یا Host اشتباه | مستندات رسمی را بررسی کنید |
| مدل‌ها List می‌شوند، Chat 404 است | Endpoint ناسازگار | مسیر Chat رسمی را ببینید |
| یک مدل 404 است، مدل دیگر کار می‌کند | Model ID یا دسترسی مدل | ID قابل دسترس حساب را استفاده کنید |
| Dashboard نامی نشان می‌دهد، API رد می‌کند | نام نمایشی متفاوت است | Model ID فنی را پیدا کنید |
| نمونه قدیمی دیگر کار نمی‌کند | مدل بازنشسته یا Alias تغییر کرده | Changelog رسمی را بررسی کنید |

نمونه بررسی رشته Base URL:

```javascript
const baseURL = new URL(process.env.LLM_BASE_URL);

if (!baseURL.protocol.startsWith("http")) {
  throw new Error("LLM_BASE_URL must use http or https");
}

console.log({
  origin: baseURL.origin,
  pathname: baseURL.pathname,
  model: process.env.LLM_MODEL,
});
```

کلید در این Log چاپ نمی‌شود.

## OpenAI-compatible به معنی سازگاری کامل نیست

Provider ممکن است فقط بخشی از قرارداد را پیاده‌سازی کند. این تفاوت‌ها رایج‌اند:

- فقط `chat/completions` و نه `responses`
- Streaming با ساختار متفاوت
- Tool Calling محدود
- JSON Schema ناقص
- Embedding روی Host دیگر
- نام پارامتر یا مقدار مجاز متفاوت
- Header اضافه برای Project یا Version

اگر Client عمومی خطا می‌دهد، نمونه رسمی Provider را با درخواست خود مقایسه کنید.

## خطاهای منطقه‌ای و دسترسی ایران

سه وضعیت را از هم جدا کنید:

1. **شبکه:** آیا Host و Endpoint قابل دسترسی است؟
2. **حساب:** آیا ثبت‌نام، ورود و ساخت کلید ممکن است؟
3. **سیاست:** آیا Provider ایران را رسماً پشتیبانی می‌کند؟

یک درخواست موفق با VPN، دسترسی مستقیم ایران را ثابت نمی‌کند. یک پاسخ `403` نیز بدون متن و منبع کافی، علت منطقه‌ای را قطعی نمی‌کند.

اگر نتیجه تست دارید، آن را با تاریخ و نوع شبکه در [فرم گزارش دسترسی ایران](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml) ثبت کنید. Secret، IP و اطلاعات حساب را حذف کنید.

## خطا را در برنامه طبقه‌بندی کنید

نمونه Python:

```python
from openai import APIConnectionError, APIStatusError


def classify_error(exc):
    if isinstance(exc, APIConnectionError):
        return "network_or_dns"

    if isinstance(exc, APIStatusError):
        return {
            400: "invalid_request",
            401: "authentication",
            403: "authorization_or_policy",
            404: "endpoint_or_model",
            429: "rate_limit_or_quota",
        }.get(exc.status_code, "provider_error")

    return "unknown"
```

این طبقه‌بندی برای Metric و Alert مفید است. پاسخ خام Provider را بدون پاک‌سازی وارد Log عمومی نکنید.

## چه زمانی این روش مناسب نیست؟

این چک‌لیست برای جداکردن خطاهای Client، حساب و قرارداد API است؛ برای اثبات مسدودسازی منطقه‌ای، انتخاب Plan یا تضمین سازگاری کامل Provider کافی نیست. در این موارد به سیاست رسمی Provider، وضعیت حساب و تست مجازِ همان محیط تکیه کنید.

## چه زمانی Retry کنیم؟

برای این خطاها معمولاً Retry خودکار نکنید:

- `401`: تنظیمات یا کلید باید اصلاح شود.
- `403`: مجوز یا سیاست باید بررسی شود.
- `404`: مسیر یا مدل باید اصلاح شود.
- `400`: درخواست نامعتبر است.

برای `429` و `5xx` Retry محدود می‌تواند مناسب باشد. راهنمای تخصصی: [رفع خطای 429 و مدیریت Rate Limit](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/)

## چک‌لیست نهایی عیب‌یابی

- متغیرهای محیطی واقعاً بارگذاری شده‌اند.
- API Key با Space یا newline اضافه ذخیره نشده است.
- کلید مربوط به همان Provider و Project است.
- Base URL ریشه API است، نه صفحه Dashboard.
- `/v1` طبق مستندات درست اضافه یا حذف شده است.
- Endpoint با قابلیت موردنظر هماهنگ است.
- Model ID از حساب فعلی گرفته شده است.
- مدل برای Plan و Region فعال است.
- درخواست حداقلی بدون قابلیت اضافی تست شده است.
- خطاهای شبکه، حساب و سیاست منطقه‌ای جدا تحلیل شده‌اند.
- Secretها در Log یا Issue قرار نگرفته‌اند.

## راهنماهای مرتبط

- [راهنمای API رایگان هوش مصنوعی](https://llm.persiantoolbox.ir/guides/free-ai-api/) — نمای کلی APIهای رایگان هوش مصنوعی
- [مدیریت محدودیت نرخ 429](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/) — راهنمای مدیریت Rate limit
- [راهنمای عملی API رایگان در ایران](https://llm.persiantoolbox.ir/guides/practical-free-llm-api-iran/) — از ثبت‌نام تا اولین درخواست

## منابع رسمی بررسی‌شده

این منابع الگوی خطا، احراز هویت و درخواست API را توضیح می‌دهند؛ برای Endpoint، مدل، Plan و سیاست منطقه‌ای هر Provider، مستندات همان Provider مرجع نهایی است. تاریخ بررسی: ۲۲ ژوئیه ۲۰۲۶.

- [کدهای خطای OpenAI API](https://developers.openai.com/api/docs/guides/error-codes) — مرجع رفتار خطاهای API و شناسهٔ درخواست برای عیب‌یابی.
- [نمای کلی مرجع OpenAI API](https://developers.openai.com/api/reference/overview) — الگوی احراز هویت و اصول نگهداری امن کلید API.
- [سیاست و روش گزارش دسترسی ایران این پروژه](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/blob/main/docs/IRAN_LIVE_VERIFICATION.fa.md) — تفکیک شواهد شبکه، حساب و سیاست؛ نه اثبات دسترسی یک Provider.

## جمع‌بندی

برای رفع `401`، اول کلید و روش Authentication را بررسی کنید. برای `403`، مجوز حساب، مدل، Plan و سیاست منطقه‌ای را ببینید. برای `404` و `model_not_found`، Base URL، Endpoint و Model ID را با نمونه رسمی Provider مقایسه کنید.

با یک درخواست حداقلی و ثبت پاک‌سازی‌شده کد وضعیت می‌توان بیشتر خطاها را سریع‌تر جدا کرد. برای مشاهده Providerهای فعلی، وضعیت سهمیه و شواهد دسترسی ایران از [کاتالوگ زنده](https://llm.persiantoolbox.ir/) استفاده کنید.

برای اصلاح داده یا ثبت تجربه، به [Repository پروژه در GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) مراجعه کنید.
