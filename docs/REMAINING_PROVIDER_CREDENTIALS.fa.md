# راهنمای دریافت Credential پنج Provider باقی‌مانده

این سند برای Issueهای #33 و #35 است. هیچ کلید واقعی، توکن، IP کامل، اطلاعات حساب یا جزئیات SSH نباید در Repository، Issue، Log یا Screenshot عمومی ثبت شود.

## متغیرهای Secret

کلیدها فقط در Secret store مجاز قرار می‌گیرند:

```text
AGNES_AI_API_KEY
FIREWORKS_API_KEY
FREETHEAI_API_KEY
NVIDIA_API_KEY
VERCEL_AI_GATEWAY_API_KEY
```

شناسه مدل‌ها Secret نیستند، اما باید پیش از تست از Model list جاری هر سرویس تأیید شوند.

## Agnes AI

- وب‌سایت: https://agnes-ai.com/
- مستندات: https://agnes-ai.com/en/docs/overview
- صفحه کلیدها پس از ورود: https://platform.agnes-ai.com/settings/apiKeys
- Base URL: `https://apihub.agnes-ai.com/v1`
- متغیر کلید: `AGNES_AI_API_KEY`
- مدل شروع پیشنهادی: `agnes-2.0-flash`

مراحل:

1. حساب بسازید یا وارد شوید.
2. در API Key management یک Free/Default key بسازید.
3. کلید را فقط یک‌بار در Secret store ذخیره کنید.
4. ابتدا `GET /v1/models` و سپس یک Chat Completion کوتاه اجرا کنید.

## Fireworks AI

- وب‌سایت: https://fireworks.ai/
- ورود: https://app.fireworks.ai/login
- مستندات: https://docs.fireworks.ai/getting-started/quickstart
- Base URL: `https://api.fireworks.ai/inference/v1`
- متغیر کلید: `FIREWORKS_API_KEY`

مراحل:

1. وارد Dashboard شوید.
2. Profile/User Settings → API Keys → Create API Key.
3. وضعیت حساب و اعتبار اولیه را بررسی کنید؛ حساب معلق یا بدون اعتبار برای نتیجه منطقه‌ای معتبر نیست.
4. Exact model ID را از Dashboard یا Model list بگیرید.
5. ابتدا Credential را روی سرور خارج تأیید و سپس همان کلید/مدل/Payload را روی VPS ایران اجرا کنید.

## FreeTheAI

- وب‌سایت: https://freetheai.xyz/
- مستندات: https://freetheai.xyz/docs/
- Discord: https://discord.com/invite/secrets
- Base URL: `https://api.freetheai.xyz/v1`
- متغیر کلید: `FREETHEAI_API_KEY`
- مدل شروع پیشنهادی: `opc/deepseek-v4-flash-free`

مراحل:

1. با حساب Discord وارد Server شوید.
2. دستور `/signup` را اجرا و Modal و Human challenge را کامل کنید.
3. کلید صادرشده را در Secret store ذخیره کنید.
4. پیش از استفاده روزانه `/checkin` را اجرا کنید.
5. با `GET /v1/models` مدل مجاز همان حساب را تأیید کنید.
6. سپس Chat Completion کوتاه اجرا کنید.

## NVIDIA NIM API Catalog

- کاتالوگ: https://build.nvidia.com/explore/discover
- ورود/ثبت‌نام: https://developer.nvidia.com/login
- راهنمای API key: https://docs.api.nvidia.com/nim/docs/api-quickstart
- Base URL: `https://integrate.api.nvidia.com/v1`
- متغیر کلید: `NVIDIA_API_KEY`
- مدل شروع پیشنهادی: `meta/llama-3.1-8b-instruct`

مراحل:

1. وارد NVIDIA Developer Program شوید.
2. یک مدل دارای Free Endpoint را باز کنید.
3. روی `Generate API Key` یا `Get API Key` کلیک کنید.
4. کلید را در Secret store ذخیره کنید.
5. از کد OpenAI-compatible همان صفحه برای تست استفاده کنید.

دسترسی رایگان Developer Program برای Prototype، Research، Development و Testing است؛ Production واقعی به مجوز مناسب نیاز دارد.

## Vercel AI Gateway

- ثبت‌نام: https://vercel.com/signup
- مستندات: https://vercel.com/docs/ai-gateway
- احراز هویت: https://vercel.com/docs/ai-gateway/authentication-and-byok
- مدل‌ها: https://vercel.com/ai-gateway/models?freeTier=true
- Base URL: `https://ai-gateway.vercel.sh/v1`
- متغیر کلید: `VERCEL_AI_GATEWAY_API_KEY`

مراحل:

1. وارد Dashboard تیم Vercel شوید.
2. AI Gateway → API Keys → Create key.
3. کلید را در Secret store ذخیره کنید.
4. با `GET /v1/models` مدل‌های در دسترس حساب را بررسی کنید.
5. از شناسه کامل `creator/model-name` استفاده کنید؛ برای نمونه `openai/gpt-4o-mini` فقط در صورتی که Model list حساب آن را مجاز نشان دهد.

## ماتریس شبکه جایگزین VPN

VPN برای این پروژه لازم نیست. مقایسه معتبر با دو محیط مستقل انجام می‌شود:

```text
A. VPS ایران — route=direct, country=IR
B. سرور خارج — route=direct, country=<actual country>
```

برای هر Provider باید دقیقاً همان موارد در هر دو محیط استفاده شوند:

- API key یکسان؛
- model ID یکسان؛
- endpoint یکسان؛
- payload یکسان؛
- timeout یکسان؛
- حداکثر خروجی کوتاه و ثابت.

اطلاعات مجاز برای Evidence:

- کشور؛
- ASN؛
- نوع مسیر `direct`؛
- timestamp UTC؛
- HTTP status؛
- latency rounded؛
- error class sanitized؛
- موفق/ناموفق بودن inference؛
- model ID.

اطلاعات ممنوع:

- IP کامل؛
- API key یا prefix قابل شناسایی؛
- header کامل؛
- response body حاوی داده حساب؛
- ایمیل، نام کاربر، team/account ID؛
- مشخصات SSH یا VPS.

اگر VPS ایران همان ASN شواهد قبلی باشد، نتیجه فقط برای همان مسیر معتبر است و نباید به تمام اینترنت ایران تعمیم داده شود.

## ترتیب اجرای تست

1. Credential را از سرور خارج اعتبارسنجی کنید.
2. Model list را ذخیره نکنید؛ فقط شناسه مدل منتخب و نتیجه sanitize‌شده ثبت شود.
3. یک Prompt ثابت و غیرحساس اجرا کنید: `Reply with exactly: OK`.
4. همان درخواست را از VPS ایران اجرا کنید.
5. خطاها را به یکی از دسته‌های زیر تفکیک کنید:
   - credential/account
   - quota/rate limit
   - model unavailable
   - network/DNS/timeout
   - regional restriction
   - successful inference
6. Provider JSON، verification backlog و Generated outputs را فقط بر پایه Evidence به‌روزرسانی کنید.
7. `npm test`، Release gates و CI باید سبز بمانند.
