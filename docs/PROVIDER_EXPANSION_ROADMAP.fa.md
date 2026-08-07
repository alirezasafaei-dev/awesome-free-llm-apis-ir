# نقشه راه گسترش Provider

آخرین بازبینی: ۲۰۲۶-۰۸-۰۵

## هدف

رشد تعداد Providerهای پذیرفته‌شده از **۲۲** به حداقل **۵۰** Provider با مدرک واقعی.

> **تذکر مهم:** تحقیق مستنداتی به‌تنهایی برای پذیرش یک Provider کافی نیست. هر Provider باید حداقل یک درخواست واقعی احراز هویت‌شده با موفقیت انجام داده باشد.

## تاریخ تحقیق

۲۰۲۶-۰۸-۰۵

## وضعیت پایه

| شاخص | مقدار |
|---|---|
| تعداد فعلی Provider در Catalog | ۲۲ |
| هدف | ≥ ۵۰ |
| کاندیدهای غربال‌شده | ۳۳ |
| شکاف باقی‌مانده | ≥ ۲۸ |

## معیارهای پذیرش

یک Provider فقط وقتی به‌عنوان «پذیرفته‌شده» شمرده می‌شود که **تمامی شرایط زیر** برقرار باشد:

| شرط | توضیح |
|---|---|
| `OFFICIAL_DOCUMENTED_API` | API عمومی مستندشده در مستندات رسمی وجود دارد |
| `AUTHORIZED_AUTH_FLOW` | جریان احراز هویت مجاز و قابل تکرار وجود دارد |
| `AUTHENTICATED_INFERENCE` | حداقل یک درخواست واقعی احراز هویت‌شده با موفقیت انجام شده |
| `QUALIFYING_FREE_ACCESS` | دسترسی رایگان واجد شرایط (غیر Trial یا Trial با برچسب صریح) وجود دارد |
| `OFFICIAL_PRICING_OR_QUOTA_SOURCE` | منبع رسمی قیمت‌گذاری یا سهمیه ثبت شده |
| `EXACT_MODEL_OR_CAPABILITY_RECORDED` | مدل یا قابلیت دقیق ثبت شده |
| `LIMITS_RECORDED_WITHOUT_GUESSING` | محدودیت‌ها بدون حدس ثبت شده‌اند |
| `PAYMENT_AND_KYC_STATUS_RECORDED_OR_UNKNOWN` | وضعیت پرداخت و KYC ثبت شده یا `unknown` |
| `PRIVACY_VALIDATION` | حریم‌خصوصی رعایت شده |
| `GENERATED_OUTPUTS_SYNCED` | خروجی‌های تولیدشده همگام‌سازی شده‌اند |
| `CI` | تمام تست‌های CI سبز هستند |

### وضعیت ایران

وضعیت ایران **جداگانه** و تا زمان تکمیل تست جفتی ثبت می‌شود:

```text
IRAN_STATUS=unknown
```

تست جفتی شامل موارد زیر است:
- `country=IR, route=direct`
- `country=non-IR, route=direct`

در یک پنجره زمانی قابل مقایسه.

## طبقه‌بندی انواع دسترسی رایگان

| نوع | توضیح | اولویت رتبه‌بندی |
|---|---|---|
| `permanent_allowance` | سهمیه رایگان دائمی بدون انقضا | بالا |
| `free_models` | مدل‌های رایگان بدون نیاز به پرداخت | بالا |
| `community_funded` | تأمین‌شده توسط جامعه | بالا |
| `host_your_own_compute_credit` | اعتبار میزبانی شخصی | بالا |
| `recurring_credit` | اعتبار تکرارشونده دوره‌ای | متوسط |
| `monthly_credit` | اعتبار ماهانه رایگان | متوسط |
| `one_time_credit` | اعتبار یک‌بار مصرف | پایین |
| `time_limited_credit` | اعتبار محدود به زمان | پایین |
| `conditional_program` | برنامه مشروط | پایین |
| `trial` | دوره آزمایشی | پایین |

## طبقه‌بندی انواع سرویس

| نوع | توضیح | در فهرست اصلی |
|---|---|---|
| `official_provider` | سرویس رسمی سازنده مدل | ✅ |
| `official_gateway` | Gateway رسمی با مستندات عمومی | ✅ |
| `community_gateway` | Gateway اجتماعی با API منتشرشده | ✅ با برچسب |
| `managed_model_hosting` | میزبانی مدیریت‌شده مدل | ✅ |
| `integrated_inference` | اینference یکپارچه | ✅ |
| `session_bridge` | تبدیل Session/Cookie به API | ❌ |
| `self_hosted` | نرم‌افزار قابل میزبانی شخصی | ❌ |

> **مهم:** `managed_model_hosting` نباید به‌عنوان Gateway فوری (instant gateway) معرفی شود مگر اینکه مدرک رسمی خلاف آن را ثابت کند.

## موج‌های اجرایی

### موج A — اولویت فوری

| Provider | نوع سرویس مورد انتظار | نوع دسترسی رایگان مورد انتظار | وضعیت |
|---|---|---|---|
| Z.AI | official_gateway | free_models | کاندید |
| Jina AI | official_provider | free_models | کاندید |
| IBM watsonx.ai | official_provider | recurring_credit | کاندید |
| Pinecone Inference | official_gateway | free_models | کاندید |
| Weaviate Embeddings | official_provider | free_models | کاندید |

### موج B — دسترسی پایدار یا اعتبار تکرارشونده

| Provider | نوع سرویس مورد انتظار | نوع دسترسی رایگان مورد انتظار |
|---|---|---|
| Ollama Cloud | managed_model_hosting | community_funded |
| ElevenLabs | official_provider | free_models |
| Modal | managed_model_hosting | host_your_own_compute_credit |
| Beam | managed_model_hosting | host_your_own_compute_credit |
| Roboflow | official_provider | free_models |
| AI Horde | community_gateway | community_funded |
| Bytez | official_gateway | free_models |
| Pollinations | official_provider | free_models |

> **مهم:** `Modal` و `Beam` باید به‌عنوان `managed_model_hosting` طبقه‌بندی شوند مگر اینکه مدرک رسمی فعلی خلاف آن را ثابت کند.

### موج C — Gatewayهای جدید نیازمند بررسی تکمیلی

| Provider | نوع سرویس مورد انتظار |
|---|---|
| AINative Studio | official_gateway |
| ZyloAI | official_gateway |
| BazaarLink | official_gateway |
| Speka | official_gateway |
| ApiFreeLLM | community_gateway |
| InferGrove | official_gateway |

**بررسی تکمیلی برای هر کاندید موج C شامل موارد زیر است:**

- هویت اپراتور
- شرایط استفاده و حریم‌خصوصی
- سیاست نگهداری و آموزش
- فهرست مدل احراز هویت‌شده
- اصالت مدل
- جایگزینی خاموش مدل
- سازگاری توکن استفاده
- اندازه‌گیری سهمیه
- رفتار بازنشانی
- رفتار پس از اتمام سهمیه
- خطر اضافه‌برداشت تصادفی
- هدرهای Rate-limit
- پایداری در پنجره‌های زمانی متعدد

> **مهم:** زیرساخت طرف سوم را تحت فشار آزمایش نکنید.

### موج D — Trial، اعتبار یک‌بار مصرف یا برنامه مشروط

| Provider | نوع سرویس مورد انتظار |
|---|---|
| Alibaba Cloud Model Studio | official_provider |
| Mixedbread | official_provider |
| AssemblyAI | official_provider |
| Deepgram | official_provider |
| Voyage AI | official_provider |
| Eden AI | official_gateway |
| Stability AI Platform | official_provider |
| Baseten | managed_model_hosting |
| AI21 Labs | official_provider |
| Novita AI | official_gateway |
| Bento Inference Platform | managed_model_hosting |
| Nebius Builder Program | managed_model_hosting |
| KushCompute Embeddings | official_provider |
| Clarifai | official_provider |

> **مهم:** این موارد فقط با برچسب صریح Trial/Credit/Conditional و رتبه پایین‌تر از سهمیه‌های پایدار قابل ثبت هستند.

## کاندیداهای رد شده

این موارد بدون مدرک رسمی جدید وارد فعالیت onboard نمی‌شوند:

| Provider | دلیل | تاریخ تحقیق |
|---|---|---|
| Together AI | سهمیه رایگان دائمی ارائه نمی‌دهد | ۲۰۲۶-۰۸-۰۵ |
| Chutes | سطح رایگان پایدار مستند نشده | ۲۰۲۶-۰۸-۰۵ |
| Nscale | سهمیه رایگان دائمی مستند نشده | ۲۰۲۶-۰۸-۰۵ |
| Nebius Standard Token Factory | فقط Trial اولیه | ۲۰۲۶-۰۸-۰۵ |
| Nomic Atlas Starter | محدود به Playgrounds | ۲۰۲۶-۰۸-۰۵ |
| Segmind | سهمیه رایگان API پایدار مستند نشده | ۲۰۲۶-۰۸-۰۵ |
| Replicate | نیاز به پرداخت | ۲۰۲۶-۰۸-۰۵ |
| DeepInfra | نیاز به پرداخت اولیه | ۲۰۲۶-۰۸-۰۵ |

> **توجه:** این رد دائمی نیست. با ظهور مدرک رسمی جدید، بازبینی می‌شود.

## مرزهای Evidence

### چه چیزی به‌عنوان مدرک پذیرفته می‌شود

- مستندات رسمی ارائه‌دهنده (pricing, quota, models)
- تست زنده احراز هویت‌شده با موفقیت
- تست مستقیم از ایران (با تاریخ، ASN و مدرک)
- تست VPN از خارج (با کشور خروج)
- ثبت‌نام موفق و صدور Credential
- فهرست مدل احراز هویت‌شده

### چه چیزی به‌عنوان مدرک پذیرفته نمی‌شود

- Reachability شبکه به‌تنهایی
- HTTP 401/403/404 به‌تنهایی
- DNS موفق به‌تنهایی
- موفقیت ثبت‌نام به‌تنهایی (بدون تست مدل)
- ادعاها یا گزارش‌های جامعه بدون مدرک تاریخی
- نتیجه تست از میزبان خارجی به‌عنوان دسترسی ایران

## جریان کاری Repository

### ساختار PR

1. **PR ۱ — نقشه راه و زیرساخت:** نقشه‌های گسترش، لینک‌های نقشه اصلی، مرجع Issues والد و موج A، پسوندهای Schema، Backlog کاندیدا، تست خشک Verification Harness، قرارداد تست‌ها، حفاظت‌های رتبه‌بندی
2. **PRهای بعدی:** یک Provider در هر PR، مگر اینکه چند رکورد از نظر فنی یکسان باشند و مسیر Evidence مشترک داشته باشند

### قواعد

- هر Provider فقط پس از وجود مدرک واقعی پذیرفته می‌شود
- وضعیت ایران جداگانه ثبت می‌شود
- اطلاعات حساب، کلیدها، IP کامل و پاسخ خصوصی منتشر نمی‌شوند
- خروجی‌های تولیدشده باید در CI بازسازی شوند

## تعریف تکمیل (Definition of Done)

یک Provider فقط وقتی «تکمیل» شمرده می‌شود که:

- [ ] مدارک رسمی API و Pricing بررسی شده
- [ ] ثبت‌نام و وضعیت پرداخت ثبت شده
- [ ] Credential صادر شده
- [ ] فهرست مدل (در صورت پشتیبانی) بررسی شده
- [ ] حداقل یک درخواست کم‌حجم احراز هویت‌شده با موفقیت انجام شده
- [ ] اندازه‌گیری قبل و بعد مشاهده شده
- [ ] هدرهای Rate-limit مشاهده شده
- [ ] مدل/قابلیت استفاده‌شده ثبت شده
- [ ] نوع پایداری Free-tier ثبت شده
- [ ] رفتار بازنشانی/انقضا ثبت شده
- [ ] نتیجه کنترل خارجی ثبت شده
- [ ] نتیجه ایران نامشخص باقی مانده (مگر تست جفتی انجام شده)
- [ ] رکورد Provider JSON به‌روز شده
- [ ] خروجی‌های تولیدشده بازسازی شده
- [ ] `npm test` سبز است

## اقدام بعدی

تایید Z.AI: بررسی مستندات رسمی، وضعیت ثبت‌نام، و امکان صدور Credential.

## ارتباط با Issues

- Issue والد: `[P0][Provider Expansion] Grow the verified catalog from 22 to 50 providers`
- Issue #33: تعیین تکلیف Providerهای وابسته به حساب
- Issue #35: تکمیل ماتریس شبکه
- Issue #114: عملیات هوشمند زنده، بنچمارک و تلهمتری
- Issue #170: تأیید وضعیت AI Router

> **مهم:** AI Router نباید تکرار شود. اگر یک Provider از قبل در Catalog حضور دارد، رکورد جداگانه ایجاد نکنید.
