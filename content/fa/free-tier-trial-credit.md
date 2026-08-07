---
title: "تفاوت Free Tier، Trial و Credit در APIهای هوش مصنوعی"
slug: "free-tier-trial-credit"
translation_key: "free-tier-trial-credit"
description: "توضیح تفاوت Free Tier دائمی، Trial موقتی و Credit رایگان در APIهای LLM؛ همراه با معیارهای ارزیابی، خطرات و راهنمای انتخاب برای پروژه‌های بلندمدت."
primary_keyword: "تفاوت Free Tier و Trial"
canonical_target: "https://llm.persiantoolbox.ir/guides/free-tier-trial-credit/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---

# تفاوت Free Tier، Trial و Credit در APIهای هوش مصنوعی

**پاسخ سریع:** Free Tier یک سهمیه رایگان دائمی است که تا زمان تغییر سیاست Provider قابل استفاده می‌ماند. Trial یک دوره آزمایشی محدود با زمان یا اعتبار مشخص است. Credit رایگان مبلغی اعتبار است که پس از اتمام آن، سرویس قطع یا پولی می‌شود. تفاوت این سه مفهوم مستقیماً روی پایداری پروژه تأثیر می‌گذارد.

آخرین داده‌های تاریخ‌دار سرویس‌ها در [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) قرار دارد.

## Free Tier چیست؟

Free Tier سهمیه‌ای است که Provider به‌صورت دائمی (تا اعلام تغییر) در اختیار کاربران قرار می‌دهد. مثال‌ها:

- **سهمیه RPM/RPD ثابت:** مثلاً 20 درخواست در دقیقه و 1000 درخواست در روز
- **سهمیه توکن ثابت:** مثلاً 50K توکن ورودی در روز
- **مدل‌های رایگان:** مثلاً فقط مدل‌های پایه رایگان و مدل‌های پیشرفته پولی

**مزیت:** پایداری بلندمدت. می‌توانید پروژه را بر اساس Free Tier طراحی کنید.
**ریسک:** Provider می‌تواند سیاست را تغییر دهد. اما معمولاً با اطلاع‌رسانی قبلی.

## Trial چیست؟

Trial یک دوره آزمایشی محدود است:

- **Trial زمانی:** مثلاً 14 یا 30 روز رایگان
- **Trial اعتباری:** مثلاً $5 اعتبار رایگان
- **Trial ویژگی:** دسترسی کامل به همه مدل‌ها برای مدت محدود

**مزیت:** می‌توانید همه قابلیت‌ها را قبل از خرید تست کنید.
**ریسک:** پس از اتمام دوره، سرویس قطع می‌شود. نباید پروژه بلندمدت را فقط روی Trial بنا کرد.

## Credit رایگان چیست؟

بعضی سرویس‌ها مبلغی اعتبار رایگان ارائه می‌دهند:

- **Credit ثبت‌نام:** مثلاً $10 اعتبار رایگان هنگام ساخت حساب
- **Credit ماهانه:** مثلاً $5 اعتبار رایگان هر ماه
- **Credit معرفی:** اعتبار رایگان با معرفی دیگران

**مزیت:** معمولاً به همه مدل‌ها دسترسی دارید.
**ریسک:** مصرف Credit غیرقابل پیش‌بینی است. یک درخواست با Context طولانی ممکن است Credit زیادی مصرف کند.

## مقایسه سه نوع رایگان

| ویژگی | Free Tier | Trial | Credit |
|---|---|---|---|
| مدت | دائمی | محدود | تا اتمام اعتبار |
| مدل‌ها | معمولاً محدود | کامل | کامل |
| قابل پیش‌بینی | بله | خیر | خیر |
| مناسب پروژه بلندمدت | بله | خیر | بستگی دارد |
| نیاز به کارت بانکی | معمولاً خیر | بله | بله |

## معیارهای ارزیابی

### ۱. آیا سهمیه واقعی است؟

- بعضی سرویس‌ها Free Tier اعلام می‌کنند اما سهمیه آنقدر کم است که عملاً غیرقابل استفاده است
- سهمیه را با نیاز واقعی پروژه مقایسه کنید
- RPM و RPD را با الگوی استفاده خود محاسبه کنید

### ۲. آیا نیاز به کارت بانکی دارد؟

- بسیاری از Trialها و Creditها نیاز به کارت بانکی دارند
- برای کاربران ایرانی، بدون کارت بانکی بودن یک مزیت مهم است
- کاتالوگ ما این اطلاعات را برای هر Provider ثبت می‌کند

### ۳. سیاست تغییر Free Tier

- Providerها معمولاً Free Tier را بدون اطلاع‌رسانی تغییر نمی‌دهند
- اما تغییرات ممکن است باعث نیاز به مهاجرت شوند
- معماری پروژه باید قابلیت تعویض Provider را داشته باشد

### ۴. پشتیبانی فارسی و دسترسی ایران

- حتی اگر Free Tier عالی باشد، دسترسی شبکه از ایران باید بررسی شود
- ثبت‌نام، دریافت کلید و Inference سه مرحله جداگانه هستند

## نتیجه‌گیری

برای پروژه‌های جدید، ابتدا Free Tier واقعی را با سهمیه کافی انتخاب کنید. Trial را فقط برای ارزیابی فنی استفاده کنید. Credit رایگان را به‌عنوان بونوس در نظر بگیرید، نه پایه اصلی پروژه.

## بررسی موجودی Credit

```python
import os
import requests

api_key = os.environ["YOUR_API_KEY"]
base_url = "https://api.groq.com/openai/v1"

# بررسی دسترسی به مدل‌ها برای تأیید عملکرد کلید
response = requests.get(
    f"{base_url}/models",
    headers={"Authorization": f"Bearer {api_key}"}
)
if response.status_code == 200:
    models = response.json().get("data", [])
    print(f"دسترسی تأیید شد: {len(models)} مدل موجود")
else:
    print(f"مشکل دسترسی: {response.status_code}")
```

## جدول مقایسه سیاست Providerها

| Provider | Free Tier | Trial/Credit | کارت بانکی | دسترسی ایران |
|---|---|---|---|---|
| Groq | 30 RPM, 14400 RPD | ندارد | خیر | بله |
| Together AI | ندارد | $1 اعتبار ثبت‌نام | بله | متغیر |
| Google AI Studio | 15 RPM | ندارد | خیر | متغیر |
| Mistral | 1 RPM رایگان | ندارد | خیر | متغیر |
| OpenRouter | متغیر بر اساس مدل | ندارد | خیر | متغیر |

## نحوه ثبت‌نام

برای استفاده از Free Tier، Trial یا Credit رایگان:

1. از [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) Provider مورد نظر را پیدا کنید
2. وب‌سایت رسمی Provider را باز کنید
3. بخش Pricing یا Plans را بررسی کنید تا سیاست رایگان مشخص شود
4. ثبت‌نام را تکمیل کنید
5. اگر کارت بانکی لازم است، آیا امکان ارائه آن وجود دارد؟
6. سهمیه را مستند کنید (RPM، RPD، توکن)
7. Provider را در [کاتالوگ](https://llm.persiantoolbox.ir/) ثبت کنید

## اولین درخواست API

```bash
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "تست سهمیه رایگان"}],
    "max_tokens": 10
  }'
```

اگر پاسخ معتبر دریافت کردید، سهمیه رایگان فعال است.

## خطاهای رایج و رفع آنها

| خطا | علت | راه‌حل |
|---|---|---|
| `Free tier limit reached` | سهمیه رایگان روزانه تمام شده | فردا دوباره تلاش کنید |
| `Card required` | نیاز به کارت بانکی برای فعال‌سازی | Provider بدون نیاز به کارت انتخاب کنید |
| `Trial expired` | دوره آزمایشی تمام شده | حساب را ارتقا دهید یا Provider دیگری انتخاب کنید |
| `Credit insufficient` | اعتبار رایگان کافی نیست | حساب را شارژ کنید یا Provider دیگری انتخاب کنید |
| `Account suspended` | الگوی غیرعادی استفاده تشخیص داده شده | با پشتیبانی Provider تماس بگیرید |

## چه زمانی از این ارائه‌دهنده استفاده نکنیم

- **Trial یا Credit به‌عنوان پایه پروژه:** اگر پروژه بلندمدت دارید، فقط روی Free Tier حساب کنید
- **سهمیه بسیار کم:** اگر RPM یا RPD خیلی پایین است، پروژه شما با مشکل مواجه خواهد شد
- **نیاز به کارت بانکی:** اگر امکان ارائه کارت وجود ندارد، از Providerهای بدون کارت استفاده کنید
- **تغییرات مکرر سیاست:** Providerهایی که مکرراً Free Tier خود را کاهش می‌دهند قابل اعتماد نیستند
- **عدم شفافیت:** اگر Provider سیاست قیمت‌گذاری را به‌وضوح اعلام نمی‌کند، محتاط باشید

## منابع رسمی بررسی‌شده

- [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) — مقایسه Free Tier، Trial و Credit Providerها
- [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) — مستندات و راهنما
- [groq.com/pricing](https://www.groq.com/pricing/) — نمونه سیاست Free Tier
- [together.ai/pricing](https://www.together.ai/pricing) — نمونه سیاست Credit

## وضعیت ایران و نکات ویژه برای کاربران

- اولویت اول: Providerهایی با Free Tier واقعی و بدون نیاز به کارت بانکی
- اولویت دوم: Providerهایی با Credit ثبت‌نام رایگان بدون نیاز به کارت
- اولویت سوم: Providerهایی با Trial موقت بدون نیاز به کارت
- Providerهایی که نیاز به کارت بانکی بین‌المللی دارند معمولاً برای کاربران ایرانی مناسب نیستند
- وضعیت دسترسی را در [کاتالوگ](https://llm.persiantoolbox.ir/) بررسی کنید

## بررسی موجودی Credit

```python
import os
import requests

api_key = os.environ["YOUR_API_KEY"]
base_url = "https://api.groq.com/openai/v1"

# بررسی دسترسی به مدل‌ها برای تأیید عملکرد کلید
response = requests.get(
    f"{base_url}/models",
    headers={"Authorization": f"Bearer {api_key}"}
)
if response.status_code == 200:
    models = response.json().get("data", [])
    print(f"دسترسی تأیید شد: {len(models)} مدل موجود")
else:
    print(f"مشکل دسترسی: {response.status_code}")
```

## جدول مقایسه سیاست Providerها

| Provider | Free Tier | Trial/Credit | کارت بانکی | دسترسی ایران |
|---|---|---|---|---|
| Groq | 30 RPM, 14400 RPD | ندارد | خیر | بله |
| Together AI | ندارد | $1 اعتبار ثبت‌نام | بله | متغیر |
| Google AI Studio | 15 RPM | ندارد | خیر | متغیر |
| Mistral | 1 RPM رایگان | ندارد | خیر | متغیر |
| OpenRouter | متغیر بر اساس مدل | ندارد | خیر | متغیر |

برای بررسی وضعیت Free Tier، Trial و دسترسی ایران هر Provider، [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) را مشاهده کنید. فایل‌های منبع و گزارش مشکلات در [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) در دسترس هستند.

## راهنماهای مرتبط

- [مدل‌های رایگان دائمی](permanent-free-models.md) — تفاوت Free Tier با مدل‌های دائمی
- [API رایگان بدون کارت بانکی](free-gpt-api-no-credit-card.md) — ثبت‌نام بدون کارت
- [راهنمای انتخاب Provider برای دانشجو](provider-for-student-mvp.md) — معیارهای انتخاب برای MVP
