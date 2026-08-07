---
title: " مقایسه سرویس‌های دارای مدل رایگان دائمی در APIهای LLM"
slug: "permanent-free-models"
translation_key: "permanent-free-models"
description: "راهنمای شناسایی و مقایسه مدل‌های رایگان دائمی در APIهای LLM؛ همراه با معیار پایداری، سیاست Provider، محدودیت و نکات انتخاب برای پروژه‌های بلندمدت."
primary_keyword: "مدل رایگان دائمی LLM"
canonical_target: "https://llm.persiantoolbox.ir/guides/permanent-free-models/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---

# مقایسه سرویس‌های دارای مدل رایگان دائمی در APIهای LLM

**پاسخ سریع:** برخی Providerها مدل‌های پایه خود را به‌صورت دائمی رایگان نگه می‌دارند (مثلاً Llama، Mistral، Gemma). اما «رایگان دائمی» به معنای «بدون تغییر سیاست» نیست. برای انتخاب مدل رایگان دائمی باید سیاست رسمی Provider، سابقه تغییرات، سهمیه و قابلیت مهاجرت را بررسی کنید.

آخرین داده‌های تاریخ‌دار سرویس‌ها در [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) قرار دارد.

## «رایگان دائمی» یعنی چه؟

وقتی Providerی می‌گوید «مدل X رایگان است»، چند مفهوم متفاوت ممکن است مدنظر باشد:

### ۱. مدل Open Source در همه سرویس‌ها

مدل‌هایی مانند Llama، Mistral و Gemma متن‌باز هستند. هر کسی می‌تواند آن‌ها را روی سرور خود اجرا کند. در این حالت:

- مدل خود Provider رایگان است
- اجرای محلی نیاز به سخت‌افزار دارد
- API hosted ممکن است هزینه داشته باشد

### ۲. مدل پایه رایگان در API

بعضی Providerها مدل‌های پایه (کوچک‌تر و ساده‌تر) را در API رایگان نگه می‌دارند:

- معمولاً Llama-3.1-8B، Mistral-7B، Gemma-2-9B
- مدل‌های بزرگ‌تر پولی هستند
- Free Tier معمولاً سهمیه RPM/RPD دارد

### ۳. مدل پولی با سهمیه رایگان

بعضی Providerها مدل‌های پیشرفته‌تر را با سهمیه محدود رایگان ارائه می‌دهند:

- معمولاً سهمیه ماهانه یا روزانه محدود
- پس از اتمام سهمیه، قیمت پرداخت به ازای مصرف

## معیارهای ارزیابی پایداری

### ۱. سابقه سیاست Provider

- Provider قبلاً Free Tier را تغییر داده است؟
- تغییرات با اطلاع‌رسانی قبلی بوده؟
- آیا مدل‌های رایگان قبلی هنوز رایگان هستند؟

### ۲. نوع مدل

- **Open Source:** پایدارترین گزینه. حتی اگر Provider API را تغییر دهد، مدل قابل اجراست
- **اختصاصی رایگان:** وابسته به سیاست Provider
- **پولی با سهمیه رایگان:** کمترین پایداری

### ۳. سهمیه واقعی

- سهمیه با نیاز پروژه مقایسه شود
- RPM و RPD باید الگوی استفاده واقعی را پوشش دهند
- افزایش ناگهانی ترافیک ممکن است سهمیه را تمام کند

### ۴. قابلیت مهاجرت

- اگر Provider سیاست را تغییر دهد، آیا می‌توانید سریع Provider دیگری را انتخاب کنید؟
- معماری پروژه باید OpenAI-compatible باشد
- Base URL قابل تنظیم باشد

## مقایسه مدل‌های رایگان دائمی

### Llama (Meta)

- **نوع:** Open Source
- **اجرا:** در همه سرویس‌ها قابل اجرا
- **API رایگان:** در Groq، Together و سایر سرویس‌ها
- **پایداری:** بالا (مدل متن‌باز)

### Mistral

- **نوع:** Open Source
- **اجرا:** در همه سرویس‌ها قابل اجرا
- **API رایگان:** در Mistral، Groq و سایر سرویس‌ها
- **پایداری:** بالا (مدل متن‌باز)

### Gemma (Google)

- **نوع:** Open Source
- **اجرا:** در همه سرویس‌ها قابل اجرا
- **API رایگان:** در Google AI Studio
- **پایداری:** بالا (مدل متن‌باز)

### GPT-3.5 / GPT-4o-mini (OpenAI)

- **نوع:** اختصاصی
- **API رایگان:** ندارد
- **پایداری:** نیاز به پرداخت

## نکات عملی

### برای پروژه‌های بلندمدت

- مدل‌های Open Source (Llama، Mistral، Gemma) پایدارترین گزینه هستند
- حتی اگر همه APIها تغییر کنند، مدل‌ها قابل اجرا هستند
- Ollama و llama.cpp اجرای محلی را ساده می‌کنند

### برای شروع سریع

- ابتدا با Free Tier یک Provider شروع کنید
- قابلیت مهاجرت به Provider دیگر را حفظ کنید
- از OpenAI-compatible format استفاده کنید

## نتیجه‌گیری

«رایگان دائمی» واقعی‌ترین در مدل‌های Open Source است. برای پروژه‌های بلندمدت، مدل‌های متن‌باز را ترجیح دهید و معماری پروژه را طوری طراحی کنید که قابلیت تعویض Provider را داشته باشد.

## جدول مقایسه Providerها

| Provider | مدل‌های رایگان | RPM | RPD | کارت بانکی | OpenAI-compatible |
|---|---|---|---|---|---|
| Groq | Llama 3.1 8B, Mixtral 8x7B | 30 | 14400 | خیر | بله |
| Mistral | Mistral 7B, Codestral | 1 | نامشخص | خیر | بله |
| Google AI Studio | Gemma 2 9B, Gemini 1.5 Flash | 15 | 1500 | خیر | خیر |
| Together AI | Llama 3.1 8B, Mistral 7B | 20 | نامشخص | بله ($1 credit) | بله |
| Cerebras | Llama 3.1 8B, 70B | 30 | 14400 | خیر | بله |

## تست دسترسی مدل‌ها

```bash
#!/bin/bash
# تست مدل‌های رایگان موجود در یک Provider
curl -s "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
models = data.get('data', [])
free_keywords = ['llama', 'mistral', 'gemma', 'mixtral']
for m in models:
    mid = m['id'].lower()
    if any(k in mid for k in free_keywords):
        print(f\"  {m['id']}\")
print(f'تعداد کل مدل‌ها: {len(models)}')
"
```

## نحوه ثبت‌نام

برای استفاده از مدل‌های رایگان دائمی:

1. از [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) یک Provider با مدل رایگان پیدا کنید
2. وب‌سایت رسمی Provider را باز کنید
3. ثبت‌نام کنید (Groq و Mistral نیاز به کارت بانکی ندارند)
4. API Key را از داشبورد دریافت کنید
5. نام مدل رایگان را از مستندات پیدا کنید
6. آن را در فایل `.env` تنظیم کنید

## اولین درخواست API

```bash
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "سلام دنیا"}],
    "max_tokens": 10
  }'
```

## خطاهای رایج و رفع آنها

| خطا | علت | راه‌حل |
|---|---|---|
| `Model not found` | مدل انتخاب شده رایگان نیست | لیست مدل‌های رایگان را بررسی کنید |
| `Free tier exhausted` | سهمیه رایگان روزانه تمام شده | فردا دوباره تلاش کنید |
| `Card required` | Provider نیاز به کارت بانکی دارد | Provider بدون کارت انتخاب کنید |
| `429 Too Many Requests` | Rate Limit فعال شده | Exponential Backoff اضافه کنید |
| `Account suspended` | الگوی غیرعادی استفاده | با پشتیبانی Provider تماس بگیرید |

## چه زمانی از این ارائه‌دهنده استفاده نکنیم

- **مدل اختصاصی رایگان:** وابسته به سیاست Provider است و ممکن است تغییر کند
- **سهمیه بسیار کم:** اگر RPM یا RPD پایین است، پروژه شما با مشکل مواجه خواهد شد
- **نیاز به کارت بانکی:** اگر امکان ارائه کارت وجود ندارد، از Providerهای بدون کارت استفاده کنید
- **پروژه‌های حساس:** داده‌های حساس را به API ارسال نکنید
- **عدم پایداری:** Providerهایی که مکرراً سیاست خود را تغییر می‌دهند قابل اعتماد نیستند

## منابع رسمی بررسی‌شده

- [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) — مقایسه مدل‌های رایگان و سهمیه Providerها
- [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) — مستندات و راهنما
- [huggingface.co](https://huggingface.co/) — منبع مدل‌های Open Source
- [ollama.com](https://ollama.com/) — اجرای محلی مدل‌های رایگان

## وضعیت ایران و نکات ویژه برای کاربران

- مدل‌های Open Source پایدارترین گزینه هستند — حتی اگر API قطع شود، مدل قابل اجراست
- Groq، Mistral و Cerebras بدون نیاز به کارت بانکی مدل رایگان ارائه می‌دهند
- از Ollama برای اجرای محلی مدل‌ها استفاده کنید
- وضعیت دسترسی را در [کاتالوگ](https://llm.persiantoolbox.ir/) بررسی کنید

## جدول مقایسه Providerها

| Provider | مدل‌های رایگان | RPM | RPD | کارت بانکی | OpenAI-compatible |
|---|---|---|---|---|---|
| Groq | Llama 3.1 8B, Mixtral 8x7B | 30 | 14400 | خیر | بله |
| Mistral | Mistral 7B, Codestral | 1 | نامشخص | خیر | بله |
| Google AI Studio | Gemma 2 9B, Gemini 1.5 Flash | 15 | 1500 | خیر | خیر |
| Together AI | Llama 3.1 8B, Mistral 7B | 20 | نامشخص | بله ($1 credit) | بله |
| Cerebras | Llama 3.1 8B, 70B | 30 | 14400 | خیر | بله |

## تست دسترسی مدل‌ها

```bash
#!/bin/bash
# تست مدل‌های رایگان موجود در یک Provider
curl -s "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
models = data.get('data', [])
free_keywords = ['llama', 'mistral', 'gemma', 'mixtral']
for m in models:
    mid = m['id'].lower()
    if any(k in mid for k in free_keywords):
        print(f\"  {m['id']}\")
print(f'تعداد کل مدل‌ها: {len(models)}')
"
```

برای مقایسه مدل‌های رایگان، سهمیه و وضعیت دسترسی ایران، [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) را مشاهده کنید. فایل‌های منبع و گزارش مشکلات در [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) در دسترس هستند.

## راهنماهای مرتبط

- [Free Tier و اعتبار آزمایشی](free-tier-trial-credit.md) — تفاوت با مدل‌های دائمی
- [مدل‌های رایگان در OpenAI-compatible](free-llm-api.md) — سرویس‌های تأییدشده
- [راهنمای ساخت ربات چت فارسی](build-persian-chatbot-python.md) — نمونه پروژه
