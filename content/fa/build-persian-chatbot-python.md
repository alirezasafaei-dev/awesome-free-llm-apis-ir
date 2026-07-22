---
title: "ساخت چت‌بات فارسی با Python و API رایگان سازگار با OpenAI"
slug: "build-persian-chatbot-python-free-llm-api"
translation_key: "build-persian-chatbot-python-free-llm-api"
description: "آموزش عملی ساخت چت‌بات فارسی با Python، OpenAI SDK، Base URL سفارشی، مدیریت تاریخچه، Timeout و خطاهای API."
primary_keyword: "ساخت چت بات فارسی با پایتون"
secondary_keywords:
  - "API رایگان هوش مصنوعی پایتون"
  - "OpenAI compatible Python"
  - "ساخت چت بات با API"
canonical_target: "https://llm.persiantoolbox.ir/guides/build-persian-chatbot-python-free-llm-api/"
updated_at: "2026-07-17"
status: "READY_FOR_SITE"
---

# ساخت چت‌بات فارسی با Python و API رایگان سازگار با OpenAI

در این آموزش یک چت‌بات خط فرمان فارسی می‌سازیم که به Providerهای سازگار با OpenAI API متصل می‌شود. کلید API در کد ذخیره نمی‌شود، تاریخچه مکالمه کنترل می‌شود و خطاهای Authentication، Rate Limit، شبکه و سرویس جداگانه مدیریت می‌شوند.

این ساختار به یک Provider خاص وابسته نیست. برای انتخاب سرویس، Base URL و Model ID از [کاتالوگ APIهای رایگان LLM برای ایران](https://llm.persiantoolbox.ir/) و صفحه اختصاصی Provider استفاده کنید.

## معماری ساده پروژه

جریان برنامه به این شکل است:

1. تنظیمات از متغیر محیطی خوانده می‌شوند.
2. پیام کاربر به تاریخچه اضافه می‌شود.
3. فقط بخش محدودی از تاریخچه به API ارسال می‌شود.
4. پاسخ مدل نمایش و در تاریخچه ذخیره می‌شود.
5. خطاهای متداول بدون افشای اطلاعات حساس مدیریت می‌شوند.

ساختار فایل‌ها:

```text
persian-chatbot/
├── app.py
├── .env
├── .env.example
├── .gitignore
└── requirements.txt
```

## پیش‌نیازها

- Python نسخه ۳.۱۰ یا جدیدتر
- API Key از یک Provider سازگار با OpenAI
- Base URL صحیح
- Model ID فعال در حساب
- بررسی نوع سهمیه و وضعیت دسترسی ایران

سازگاری با OpenAI به معنی یکسان‌بودن همه قابلیت‌ها نیست. بعضی Providerها در Streaming، Tool Calling، Structured Output یا فرمت خطا تفاوت دارند.

## مرحله اول: ساخت محیط پروژه

```bash
mkdir persian-chatbot
cd persian-chatbot
python -m venv .venv
```

فعال‌سازی محیط مجازی در Linux و macOS:

```bash
source .venv/bin/activate
```

در Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

وابستگی‌ها را نصب کنید:

```bash
python -m pip install --upgrade openai python-dotenv
```

فایل `requirements.txt`:

```text
openai
python-dotenv
```

برای پروژه تولیدی بهتر است نسخه‌های تست‌شده را Pin کنید.

## مرحله دوم: تنظیم متغیرهای محیطی

### مراحل ثبت‌نام و دریافت تنظیمات

ثبت‌نام، فعال‌سازی حساب و ساخت کلید در هر Provider متفاوت است. فقط از صفحهٔ رسمی همان Provider استفاده کنید و پیش از کپی‌کردن تنظیمات، Model ID و روش Authentication را از مستندات آن بخوانید. این راهنما وجود حساب یا امکان ثبت‌نام از ایران را فرض نمی‌کند.

فایل `.env`:

```dotenv
LLM_API_KEY=replace_me
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL=MODEL_ID
```

مقادیر `LLM_BASE_URL` و `LLM_MODEL` را از مستندات رسمی و صفحه Provider بردارید.

فایل `.env.example` را بدون کلید واقعی Commit کنید:

```dotenv
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
```

فایل `.gitignore`:

```gitignore
.env
.env.*
!.env.example
.venv/
__pycache__/
*.pyc
```

کلید API را هرگز داخل کد، Screenshot، Issue یا Log عمومی قرار ندهید.

## مرحله سوم: پیاده‌سازی چت‌بات

فایل `app.py`:

```python
import os
from typing import Final

from dotenv import load_dotenv
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

load_dotenv()

REQUIRED_ENV: Final = ("LLM_API_KEY", "LLM_BASE_URL", "LLM_MODEL")
missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
if missing:
    raise RuntimeError(
        "Missing environment variables: " + ", ".join(missing)
    )

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    timeout=30.0,
    max_retries=2,
)

messages = [
    {
        "role": "system",
        "content": (
            "تو یک دستیار فارسی دقیق هستی. پاسخ‌ها را روشن، کوتاه "
            "و بدون ادعای قطعیِ بدون منبع بنویس."
        ),
    }
]

print("چت‌بات آماده است. برای خروج exit را وارد کنید.")

while True:
    user_text = input("شما: ").strip()

    if not user_text:
        continue

    if user_text.lower() in {"exit", "quit"}:
        break

    messages.append({"role": "user", "content": user_text})

    try:
        response = client.chat.completions.create(
            model=os.environ["LLM_MODEL"],
            messages=messages[-12:],
            temperature=0.3,
        )

        answer = response.choices[0].message.content
        if not answer:
            answer = "پاسخی از مدل دریافت نشد."

        print("دستیار:", answer)
        messages.append({"role": "assistant", "content": answer})

    except AuthenticationError:
        print("خطا: کلید API یا مجوز حساب معتبر نیست.")

    except RateLimitError:
        print(
            "خطا: نرخ درخواست یا سهمیه حساب پر شده است. "
            "کمی بعد دوباره تلاش کنید."
        )

    except APIConnectionError:
        print("خطا: اتصال شبکه و LLM_BASE_URL را بررسی کنید.")

    except APIStatusError as exc:
        print("خطای سرویس با کد:", exc.status_code)
```

## مرحله چهارم: اجرای برنامه

```bash
python app.py
```

نمونه تعامل:

```text
چت‌بات آماده است. برای خروج exit را وارد کنید.
شما: تفاوت API و SDK را کوتاه توضیح بده.
دستیار: API قرارداد ارتباط میان نرم‌افزارهاست؛ SDK مجموعه ابزارها و کتابخانه‌هایی است که استفاده از آن قرارداد را ساده‌تر می‌کند.
```

کیفیت پاسخ نمونه به مدل و Provider انتخابی وابسته است.

## چرا تنظیمات را از محیط می‌خوانیم؟

این روش چند مزیت دارد:

- Secret داخل Repository قرار نمی‌گیرد.
- تعویض Provider بدون تغییر سورس انجام می‌شود.
- محیط توسعه و Production تنظیمات جدا دارند.
- Rotate کردن کلید ساده‌تر است.
- CI/CD می‌تواند Secret را امن تزریق کند.

برای Production از Secret Manager پلتفرم استقرار استفاده کنید؛ فایل `.env` راه‌حل مناسب برای توسعه محلی است.

## کنترل تاریخچه و مصرف توکن

در مثال، فقط ۱۲ پیام آخر ارسال می‌شوند:

```python
messages=messages[-12:]
```

این یک راه ساده برای جلوگیری از رشد بی‌نهایت Context است، اما راه‌حل کامل نیست. در برنامه واقعی می‌توانید:

- پیام‌های قدیمی را خلاصه کنید.
- تعداد تقریبی توکن را اندازه بگیرید.
- تاریخچه را بر اساس Session جدا کنید.
- پیام‌های غیرضروری را حذف کنید.
- سقف طول ورودی کاربر بگذارید.

حذف تاریخچه می‌تواند Context مهم را از بین ببرد؛ خلاصه‌سازی باید با آزمون کیفیت همراه باشد.

## چه زمانی این نمونه انتخاب مناسبی نیست؟

این نمونه برای یادگیری و یک Client خط فرمان کوچک است، نه برای ارسال مستقیم کلید به مرورگر، پردازش دادهٔ محرمانه بدون بررسی سیاست داده، یا سرویس Production بدون احراز هویت کاربر و محدودسازی درخواست. برای هر Provider باید سازگاری Endpoint و قابلیت‌های لازم را با نمونهٔ رسمی خودش تست کنید.

## مدیریت خطاهای متداول

### خطای 401 یا Authentication

دلایل رایج:

- کلید اشتباه است.
- کلید منقضی یا Revoke شده است.
- حساب به مدل دسترسی ندارد.
- Header احراز هویت با Provider سازگار نیست.

کلید را در خروجی خطا چاپ نکنید.

### خطای 404

معمولاً Base URL، مسیر API یا Model ID اشتباه است. تفاوت میان این دو را بررسی کنید:

```text
https://provider.example
https://provider.example/v1
```

همچنین بعضی Providerها Endpoint یا نام مدل متفاوتی دارند.

### خطای 429

این خطا می‌تواند به RPM، RPD، TPM، Concurrency یا پایان Credit مربوط باشد. Retry فوری و نامحدود انجام ندهید. راهنمای کامل: [رفع خطای 429 و Rate Limit](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/)

### خطاهای 5xx

اغلب موقت‌اند، اما Retry باید محدود و همراه Backoff باشد. اگر خطا پایدار است، Circuit Breaker یا Provider جایگزین لازم می‌شود.

## افزودن Streaming

در Providerهایی که Streaming سازگار دارند:

```python
stream = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=messages[-12:],
    stream=True,
)

for event in stream:
    text = event.choices[0].delta.content
    if text:
        print(text, end="", flush=True)

print()
```

قبل از استفاده، پشتیبانی Provider از Streaming و فرمت Eventها را بررسی کنید.

## تبدیل به API با FastAPI

برای استفاده در وب یا اپلیکیشن، منطق Client را در یک سرویس Backend قرار دهید. API Key نباید به مرورگر یا اپ موبایل ارسال شود.

طرح ساده:

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


@app.post("/chat")
def chat(payload: ChatRequest):
    response = client.chat.completions.create(
        model=os.environ["LLM_MODEL"],
        messages=[{"role": "user", "content": payload.message}],
    )
    return {"answer": response.choices[0].message.content}
```

برای Production این موارد را اضافه کنید:

- Authentication کاربر
- Rate Limit سمت سرور
- محدودیت اندازه درخواست
- Timeout و Retry کنترل‌شده
- پاک‌سازی Log
- CORS محدود
- Monitoring
- سیاست نگهداری تاریخچه

## امنیت Prompt و داده کاربر

قبل از ارسال داده به Provider:

- اطلاعات شخصی و Secretها را حذف کنید.
- داده محرمانه سازمانی را بدون مجوز ارسال نکنید.
- سیاست نگهداری داده Provider را بخوانید.
- Prompt Injection را در سیستم‌های RAG جدی بگیرید.
- خروجی مدل را قبل از اجرای کد یا عملیات حساس اعتبارسنجی کنید.

مدل زبانی منبع حقیقت قطعی نیست و می‌تواند پاسخ نادرست تولید کند.

## تعویض Provider بدون بازنویسی برنامه

با این طراحی فقط متغیرها تغییر می‌کنند:

```dotenv
LLM_API_KEY=new_key
LLM_BASE_URL=https://new-provider.example/v1
LLM_MODEL=new-model-id
```

با این حال قبل از تعویض، تفاوت Tool Calling، Streaming، پارامترها و Context را تست کنید.

## چک‌لیست آماده‌سازی Production

- Secret در Secret Manager ذخیره شده است.
- API Key در Frontend نیست.
- ورودی کاربر محدود و اعتبارسنجی می‌شود.
- Timeout تعریف شده است.
- Retry محدود است.
- Rate Limit داخلی دارید.
- Logها فاقد Prompt خصوصی و Secret هستند.
- Provider جایگزین تست شده است.
- مصرف و خطاها به‌صورت Aggregate پایش می‌شوند.

## راهنماهای مرتبط

- [راهنمای API رایگان هوش مصنوعی](https://llm.persiantoolbox.ir/guides/free-ai-api/) — نمای کلی APIهای رایگان هوش مصنوعی
- [استفاده از API رایگان LLM در Node.js](https://llm.persiantoolbox.ir/guides/use-free-llm-api-nodejs/) — راهنمای یکپارچه‌سازی Node.js
- [رفع خطاهای ۴۰۱/۴۰۳/model-not-found](https://llm.persiantoolbox.ir/guides/fix-llm-api-401-403-model-not-found/) — عیب‌یابی خطاهای API رایگان

## منابع رسمی بررسی‌شده

این منابع برای الگوی SDK، احراز هویت و مدیریت خطا استفاده شده‌اند. سازگاری OpenAI-compatible همیشه باید با مستندات و نمونهٔ رسمی همان Provider آزموده شود. تاریخ بررسی: ۲۲ ژوئیه ۲۰۲۶.

- [نمای کلی مرجع OpenAI API](https://developers.openai.com/api/reference/overview) — احراز هویت و ملاحظات نگهداری کلید API.
- [کدهای خطای OpenAI API](https://developers.openai.com/api/docs/guides/error-codes) — دسته‌بندی خطاهای Authentication، Rate Limit و خطاهای سرویس.
- [راهنمای Rate limits در OpenAI API](https://developers.openai.com/api/docs/guides/rate-limits) — مبنای مفهومی محدودسازی درخواست و مصرف.

## جمع‌بندی

با OpenAI SDK و یک Base URL سفارشی می‌توان یک Client قابل تعویض برای چند Provider ساخت. مهم‌ترین بخش فقط ارسال درخواست نیست؛ مدیریت Secret، محدودکردن Context، تشخیص خطا و جلوگیری از وابستگی شدید به یک سرویس است.

برای یافتن گزینه فعلی از [کاتالوگ Providerها](https://llm.persiantoolbox.ir/) استفاده کنید و تاریخ آخرین بررسی را ببینید.

اگر یک Provider را از ایران تست کردید، نتیجه را بدون اطلاعات حساس در [فرم گزارش دسترسی ایران](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml) ثبت کنید.
