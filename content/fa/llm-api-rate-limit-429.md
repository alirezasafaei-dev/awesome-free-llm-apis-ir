---
title: "رفع خطای 429 و مدیریت Rate Limit در APIهای رایگان LLM"
slug: "llm-api-rate-limit-429"
description: "راهنمای تخصصی تشخیص سهمیه، Retry با Backoff و Jitter، صف درخواست، Circuit Breaker و Provider fallback برای APIهای رایگان مدل زبانی."
primary_keyword: "رفع خطای 429 API هوش مصنوعی"
secondary_keywords:
  - "Rate Limit API LLM"
  - "Too Many Requests OpenAI"
  - "مدیریت محدودیت API رایگان"
canonical_target: "https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/"
updated_at: "2026-07-17"
status: "READY_FOR_SITE"
---

# رفع خطای 429 و مدیریت Rate Limit در APIهای رایگان LLM

**پاسخ سریع:** خطای `429 Too Many Requests` همیشه به معنی ارسال سریع درخواست نیست. ممکن است سقف درخواست دقیقه‌ای، سهمیه روزانه، توکن دقیقه‌ای، تعداد درخواست هم‌زمان یا اعتبار رایگان تمام شده باشد. ابتدا نوع محدودیت را تشخیص دهید؛ سپس Retry محدود با Exponential Backoff و Jitter، صف درخواست، کاهش Context یا Provider جایگزین را اجرا کنید.

محدودیت‌های نمونه Providerها در [کاتالوگ APIهای رایگان LLM](https://llm.persiantoolbox.ir/) ثبت می‌شوند، اما منبع رسمی و Dashboard حساب همیشه مرجع نهایی‌اند.

## خطای 429 دقیقاً چه می‌گوید؟

HTTP 429 یعنی سرویس در شرایط فعلی درخواست را به‌دلیل محدودیت مصرف یا ظرفیت نپذیرفته است. علت واقعی باید از پیام پاسخ، Headerها، مستندات و پنل حساب مشخص شود.

محدودیت‌های رایج:

- **RPM:** تعداد Requests Per Minute از سقف عبور کرده است.
- **RPD:** سهمیه Requests Per Day تمام شده است.
- **TPM:** مجموع Tokens Per Minute بیش از حد مجاز است.
- **TPD:** سهمیه توکن روزانه پر شده است.
- **Concurrency:** تعداد درخواست‌های هم‌زمان زیاد است.
- **Credit:** اعتبار Trial یا ماهانه تمام شده است.
- **Shared quota:** چند برنامه، Agent یا عضو تیم از سهمیه مشترک استفاده می‌کنند.
- **Dynamic capacity:** Provider به‌دلیل فشار لحظه‌ای محدودیت موقت اعمال کرده است.

Retry بدون شناخت علت می‌تواند مشکل را بدتر کند.

## اول خطا را طبقه‌بندی کنید

اطلاعات زیر را بررسی کنید:

1. کد وضعیت HTTP
2. نوع و پیام خطا
3. Headerهای مربوط به Rate Limit
4. زمان Reset یا `Retry-After`
5. مصرف ثبت‌شده در Dashboard
6. Model ID و Endpoint
7. تعداد Workerها و درخواست‌های هم‌زمان

نام Headerها میان Providerها یکسان نیست. بعضی سرویس‌ها اطلاعاتی شبیه Limit، Remaining و Reset برمی‌گردانند و بعضی فقط پیام عمومی دارند.

پاسخ خام خطا را بدون پاک‌سازی منتشر نکنید؛ ممکن است شناسه حساب، Request ID یا اطلاعات عملیاتی داشته باشد. API Key نباید در Log ظاهر شود.

## تفاوت محدودیت کوتاه‌مدت و پایان سهمیه

اگر سقف RPM پر شده باشد، صبرکردن چند ثانیه و Retry منطقی است. اگر RPD یا Credit تمام شده باشد، Retry هر چند ثانیه فقط درخواست‌های ناموفق بیشتری تولید می‌کند.

قاعده ساده:

- محدودیت دقیقه‌ای: Backoff و صف
- محدودیت روزانه: توقف تا Reset یا Fallback
- محدودیت توکن: کاهش Context و خروجی
- محدودیت هم‌زمانی: Semaphore یا Worker کمتر
- پایان اعتبار: تغییر Plan یا Provider

## Retry درست با Exponential Backoff و Jitter

Exponential Backoff فاصله تلاش‌ها را به‌صورت افزایشی زیاد می‌کند. Jitter مقدار تصادفی کوچکی اضافه می‌کند تا چند Worker دقیقاً هم‌زمان دوباره درخواست نفرستند.

نمونه Python:

```python
import os
import random
import time

from openai import (
    APIConnectionError,
    APIStatusError,
    OpenAI,
    RateLimitError,
)

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    timeout=30.0,
    max_retries=0,
)


def create_completion(messages, attempts=5):
    for attempt in range(attempts):
        try:
            return client.chat.completions.create(
                model=os.environ["LLM_MODEL"],
                messages=messages,
            )

        except RateLimitError:
            if attempt == attempts - 1:
                raise

            delay = min(
                30.0,
                (2**attempt) + random.uniform(0.0, 1.0),
            )
            time.sleep(delay)

        except APIConnectionError:
            if attempt == attempts - 1:
                raise

            time.sleep(min(10.0, 1.5**attempt))

        except APIStatusError as exc:
            if exc.status_code < 500 or attempt == attempts - 1:
                raise

            time.sleep(min(15.0, 2**attempt))

    raise RuntimeError("Request failed after retries")
```

نکات این پیاده‌سازی:

- Retry داخلی SDK غیرفعال شده تا سیاست Retry فقط در یک لایه باشد.
- تعداد تلاش محدود است.
- برای 429 از Backoff و Jitter استفاده می‌شود.
- خطاهای 4xx غیرموقت Retry نمی‌شوند.
- خطاهای شبکه و 5xx رفتار جدا دارند.

در برنامه واقعی، `Retry-After` یا زمان Reset Provider را در صورت وجود بر تأخیر محاسبه‌شده ترجیح دهید.

## چه زمانی نباید Retry کنیم؟

Retry برای همه خطاها درست نیست.

### خطای 400

درخواست نامعتبر، پارامتر اشتباه یا Context بیش‌ازحد بزرگ با تکرار حل نمی‌شود.

### خطای 401 و 403

کلید، مجوز مدل، وضعیت حساب یا سیاست منطقه‌ای باید اصلاح شود.

### خطای 404

Base URL، مسیر یا Model ID را بررسی کنید.

### پایان سهمیه روزانه

تا زمان Reset صبر کنید یا درخواست را به Provider جایگزین منتقل کنید.

### عملیات غیر idempotent

اگر درخواست باعث عملیات خارجی، ارسال پیام، خرید یا تغییر داده می‌شود، Retry بدون Idempotency Key می‌تواند عمل را تکرار کند.

## قبل از 429، ترافیک را محدود کنید

بهتر است Client پیش از رسیدن به سقف، درخواست‌ها را صف‌بندی کند.

نمونه ساده Sliding Window:

```python
from collections import deque
from time import monotonic, sleep


class SlidingWindowLimiter:
    def __init__(self, requests, window_seconds):
        self.requests = requests
        self.window = window_seconds
        self.timestamps = deque()

    def wait(self):
        now = monotonic()

        while self.timestamps and now - self.timestamps[0] >= self.window:
            self.timestamps.popleft()

        if len(self.timestamps) >= self.requests:
            delay = self.window - (now - self.timestamps[0])
            sleep(max(0.0, delay))

        now = monotonic()
        while self.timestamps and now - self.timestamps[0] >= self.window:
            self.timestamps.popleft()

        self.timestamps.append(now)


limiter = SlidingWindowLimiter(requests=10, window_seconds=60)

limiter.wait()
# API request
```

عدد `10` فقط نمونه است. مقدار واقعی را از مستندات و حساب خودتان بگیرید.

برای چند Process یا چند Server، محدودکننده داخل حافظه کافی نیست. از Redis یا Queue مرکزی استفاده کنید.

## کنترل درخواست‌های هم‌زمان

گاهی مشکل نرخ نیست، بلکه Concurrency است. با Semaphore تعداد درخواست فعال را محدود کنید.

نمونه Async Python:

```python
import asyncio

semaphore = asyncio.Semaphore(3)


async def guarded_request(call_api):
    async with semaphore:
        return await call_api()
```

مقدار مناسب به Provider، مدل، Latency و سهمیه حساب وابسته است.

## مصرف توکن را کاهش دهید

TPM فقط با کاهش تعداد درخواست حل نمی‌شود. ممکن است یک درخواست با Context بسیار بزرگ سهمیه را پر کند.

روش‌های کاهش مصرف:

- تاریخچه قدیمی را خلاصه کنید.
- فقط پیام‌های مرتبط را نگه دارید.
- `max_tokens` یا سقف خروجی را منطقی تنظیم کنید.
- متن‌های تکراری را Cache کنید.
- درخواست‌های مشابه را Deduplicate کنید.
- برای طبقه‌بندی ساده از مدل کوچک‌تر استفاده کنید.
- اسناد RAG را قبل از ارسال بهتر رتبه‌بندی کنید.
- Batch size را با محدودیت Provider هماهنگ کنید.

کاهش Context نباید باعث حذف اطلاعات لازم و افت کیفیت شود؛ تغییر را با داده واقعی ارزیابی کنید.

## صف درخواست و Backpressure

اگر ورودی سیستم بیشتر از ظرفیت Provider است، Retry به‌تنهایی کافی نیست. باید Backpressure ایجاد کنید.

الگوی مناسب:

```text
User/API
   ↓
Validation
   ↓
Queue
   ↓
Rate-limited workers
   ↓
LLM Provider
   ↓
Result store / response
```

ویژگی‌های Queue حرفه‌ای:

- حداکثر اندازه صف
- Timeout برای Job
- تعداد Retry محدود
- Dead-letter queue
- اولویت درخواست
- لغو Job منقضی
- Idempotency key
- Metric برای سن صف

وقتی صف بیش‌ازحد بزرگ است، درخواست جدید را با پیام روشن رد کنید؛ نگه‌داشتن نامحدود درخواست تجربه کاربر و هزینه را بدتر می‌کند.

## Provider fallback

Fallback یعنی در شرایط تعریف‌شده درخواست به Provider جایگزین منتقل شود. این کار باید از قبل طراحی و تست شود.

تنظیمات پایه:

```dotenv
PRIMARY_LLM_BASE_URL=https://primary.example/v1
PRIMARY_LLM_MODEL=primary-model

FALLBACK_LLM_BASE_URL=https://fallback.example/v1
FALLBACK_LLM_MODEL=fallback-model
```

Fallback را فقط برای خطاهای مناسب فعال کنید:

- 429 با Reset طولانی
- پایان سهمیه روزانه
- خطاهای 5xx پایدار
- Circuit Breaker باز
- اختلال شبکه تأییدشده

برای 401، 400 یا ورودی نامعتبر، رفتن به Provider دوم معمولاً علت اصلی را پنهان می‌کند.

همچنین Provider جایگزین ممکن است در کیفیت فارسی، Context، Tool Calling، Structured Output و سیاست داده متفاوت باشد. خروجی باید دوباره اعتبارسنجی شود.

## Circuit Breaker

وقتی Provider پی‌درپی خطا می‌دهد، ادامه درخواست می‌تواند Recovery را سخت‌تر کند. Circuit Breaker پس از عبور خطا از آستانه، مسیر را موقتاً می‌بندد.

سه وضعیت معمول:

- **Closed:** درخواست‌ها عادی ارسال می‌شوند.
- **Open:** درخواست مستقیم متوقف و Fallback فعال می‌شود.
- **Half-open:** تعداد کمی درخواست آزمایشی برای بررسی Recovery ارسال می‌شود.

برای پروژه کوچک می‌توان از کتابخانه آماده استفاده کرد. مهم است که آستانه و زمان بازیابی بیش‌ازحد حساس نباشند.

## از Retry Storm جلوگیری کنید

Retry Storm زمانی رخ می‌دهد که تعداد زیادی Client بعد از اختلال هم‌زمان دوباره درخواست بفرستند.

راه‌های پیشگیری:

- Jitter
- سقف Retry
- Queue مرکزی
- Circuit Breaker
- محدودیت هم‌زمانی
- احترام به `Retry-After`
- حذف درخواست منقضی
- Cache پاسخ‌های قابل استفاده مجدد

## پایش حداقلی

برای تشخیص مشکل این Metricها کافی‌اند:

- تعداد درخواست
- درصد پاسخ موفق
- درصد 429
- درصد 5xx
- Latency
- تعداد Retry
- طول و سن Queue
- مصرف تقریبی توکن
- Provider و Model فعال
- تعداد Fallback

داده‌ها را Aggregate ثبت کنید. API Key، Prompt خصوصی، پاسخ حساس و اطلاعات شخصی نباید در Dashboard عمومی قرار گیرند.

## الگوی تصمیم عملی

1. اگر `Retry-After` کوتاه است، همان زمان را رعایت کنید.
2. اگر RPM پر شده، Queue و Backoff را فعال کنید.
3. اگر TPM پر شده، Context و خروجی را کاهش دهید.
4. اگر Concurrency پر شده، Workerها را محدود کنید.
5. اگر RPD یا Credit تمام شده، تا Reset صبر کنید یا Fallback انجام دهید.
6. اگر 5xx تکرار شد، Circuit Breaker را باز کنید.
7. اگر 401 یا 403 است، تنظیمات و حساب را اصلاح کنید.

## اشتباه‌های رایج

- Retry فوری در حلقه بدون Delay
- Retry نامحدود
- چند لایه Retry هم‌زمان در SDK، Proxy و Application
- ثبت API Key در Log خطا
- فرض اینکه تمام 429ها دقیقه‌ای‌اند
- ارسال همان Context بزرگ بعد از خطای TPM
- Fallback میان مدل‌هایی با خروجی ناسازگار
- استفاده از سهمیه رایگان بدون کنترل مصرف

## جمع‌بندی

رفع خطای 429 فقط افزودن `sleep` نیست. باید نوع محدودیت را بفهمید، ترافیک را قبل از ارسال کنترل کنید، Retry محدود و تصادفی داشته باشید، Context را کوچک نگه دارید و Provider جایگزین تست‌شده تعریف کنید.

برای مشاهده محدودیت‌های ثبت‌شده و وضعیت دسترسی، [کاتالوگ زنده APIها](https://llm.persiantoolbox.ir/) را بررسی کنید.

اگر محدودیت یک Provider تغییر کرده است، یک [گزارش Provider](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new/choose) ثبت کنید؛ Secret یا اطلاعات حساب را وارد نکنید.
