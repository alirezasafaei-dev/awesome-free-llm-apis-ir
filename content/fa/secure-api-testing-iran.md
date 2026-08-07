---
title: "تست امن API از ایران؛ راهنمای عیب‌یابی و اتصال موفق"
slug: "secure-api-testing-iran"
translation_key: "secure-api-testing-iran"
description: "راهنمای عملی تست امن و موفق APIهای LLM از داخل ایران؛ همراه با بررسی شبکه، ثبت‌نام، احراز هویت، Inference و عیب‌یابی خطاهای رایج."
primary_keyword: "تست API از ایران"
canonical_target: "https://llm.persiantoolbox.ir/guides/secure-api-testing-iran/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---

# تست امن API از ایران؛ راهنمای عیب‌یابی و اتصال موفق

**پاسخ سریع:** قبل از وابستگی پروژه به یک Provider، باید چهار مرحله را جداگانه تست کنید: (۱) دسترسی شبکه به آدرس API، (۲) ثبت‌نام و فعال‌سازی حساب، (۳) دریافت و استفاده از API Key، (۴) ارسال درخواست Inference واقعی. هر مرحله ممکن است به دلیل متفاوتی ناموفق باشد.

آخرین داده‌های تاریخ‌دار سرویس‌ها در [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) قرار دارد.

## چرا تست مرحله‌ای مهم است؟

بعضی Providerها آدرس API را باز می‌گذارند اما ثبت‌نام را مسدود می‌کنند. بعضی ثبت‌نام را باز می‌گذارند اما Inference از IP ایران را بلاک می‌کنند. بدون تست مرحله‌ای، ممکن است ساعت‌ها زمان صرف کنید و در مرحله آخر متوجه شوید سرویس کار نمی‌کند.

## مرحله ۱: تست دسترسی شبکه

```bash
# تست اتصال به آدرس API
curl -v https://api.example.com/v1/models 2>&1 | head -20

# تست با timeout مشخص
curl --connect-timeout 10 -s -o /dev/null -w "%{http_code}" https://api.example.com
```

**نتایج ممکن:**
- **200:** آدرس در دسترس است
- **Timeout:** آدرس مسدود یا فیلتر شده
- **SSL Error:** مشکل گواهی یا فیلتر TLS

## مرحله ۲: تست ثبت‌نام

- آیا فرم ثبت‌نام بدون VPN قابل دسترسی است؟
- آیا تأیید ایمیل ارسال می‌شود؟
- آیا شماره تلفن ایرانی قبول می‌شود؟
- آیا نیاز به کارت بانکی دارد؟

**نکته:** بعضی سرویس‌ها ثبت‌نام را می‌پذیرند اما فعال‌سازی حساب نیاز به تأیید دستی دارد.

## مرحله ۳: تست API Key

```bash
# تست اعتبار کلید
curl -s https://api.example.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**خطاهای رایج:**
- **401 Unauthorized:** کلید نامعتبر یا منقضی شده
- **403 Forbidden:** کلید معتبر اما دسترسی ندارد
- **429 Too Many Requests:** Rate Limit فعال است

## مرحله ۴: تست Inference واقعی

```bash
# تست چت ساده
curl -s https://api.example.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50
  }'
```

**بررسی‌ها:**
- آیا پاسخ دریافت می‌شود؟
- مدل انتخاب‌شده در دسترس است؟
- ساختار پاسخ استاندارد است؟

## عیب‌یابی خطاهای رایج

### Error 401: Invalid API Key

- کلید را از پنل Provider کپی کنید، نه از ایمیل
- فاصله اضافی در ابتدای کلید را بررسی کنید
- مطمئن شوید کلید منقضی نشده

### Error 403: Model Not Available

- مدل ممکن است در Free Tier موجود نباشد
- مدل ممکن است از منطقه جغرافیایی شما پشتیبانی نکند
- حساب ممکن است نیاز به شارژ داشته باشد

### Error 429: Rate Limit

- درخواست‌ها را کاهش دهید
- Retry با Exponential Backoff اضافه کنید
- از مدل کم‌بارتر استفاده کنید

### Timeout یا Connection Refused

- آدرس Base URL را بررسی کنید
- فیلترینگ شبکه را بررسی کنید
- از DNS مناسب استفاده کنید

## نکات امنیتی

- **API Key را در کد قرار ندهید.** از متغیرهای محیطی استفاده کنید
- **API Key را در GitHub commits نگذارید.** از `.env` و `.gitignore` استفاده کنید
- **API Key را با دیگران به اشتراک نگذارید**
- **از HTTPS استفاده کنید.** هرگز API Key را روی HTTP ارسال نکنید

## جمع‌بندی

تست امن API یک فرآیند چهارمرحله‌ای است. هر مرحله را جداگانه بررسی کنید. قبل از وابستگی پروژه، از دسترسی پایدار مطمئن شوید.

## اسکریپت تست خودکار

```bash
#!/bin/bash
# تست خودکار چهارمرحله‌ای API
# Usage: export API_KEY="YOUR_API_KEY" && export BASE_URL="https://api.groq.com/openai/v1" && ./test-api.sh

echo "=== مرحله ۱: دسترسی شبکه ==="
HTTP_CODE=$(curl --connect-timeout 10 -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HTTP_CODE" = "000" ]; then
  echo "ناموفق: شبکه مسدود شده"
  exit 1
else
  echo "موفق: آدرس در دسترس (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== مرحله ۲: مدل‌ها ==="
MODELS=$(curl -s --connect-timeout 10 "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY")
if echo "$MODELS" | grep -q '"data"'; then
  echo "موفق: مدل‌ها لیست شدند"
else
  echo "ناموفق: لیست مدل‌ها در دسترس نیست"
fi
```

## نکات پیکربندی شبکه

- **DNS:** از سرورهای DNS عمومی (مانند Google DNS یا Cloudflare DNS) استفاده کنید
- **Timeout:** مقدار `--connect-timeout` را روی 15-20 ثانیه تنظیم کنید
- **TLS:** برخی ISPها با TLS handshaking مشکل دارند
- **Base URL:** برخی Providerها چندین endpoint دارند؛ دامنه‌های جایگزین را امتحان کنید
- **لاگینگ:** خطاهای شبکه را در فایل لاگ ذخیره کنید تا الگوهای قطعی شناسایی شوند

## نحوه ثبت‌نام

برای تست API از ایران:

1. از [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) Provider مورد نظر را پیدا کنید
2. وب‌سایت Provider را بدون VPN باز کنید — آیا قابل دسترسی است؟
3. فرم ثبت‌نام را تکمیل کنید
4. آیا ایمیل تأیید دریافت کردید؟
5. API Key را از داشبورد دریافت کنید
6. مراحل چهارگانه تست را اجرا کنید

## اولین درخواست API

```bash
# مرحله ۱: تست شبکه
curl --connect-timeout 10 -s -o /dev/null -w "%{http_code}" https://api.groq.com

# مرحله ۲: تست کلید
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $API_KEY" | head -c 200

# مرحله ۳: تست Inference
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.1-8b-instant","messages":[{"role":"user","content":"سلام از ایران"}],"max_tokens":20}'
```

هر مرحله را جداگانه اجرا کنید تا دقیقاً مشخص شود مشکل کجاست.

## خطاهای رایج و رفع آنها

| خطا | علت | راه‌حل |
|---|---|---|
| `Connection timeout` | دامنه API توسط ISP فیلتر شده | DNS جایگزین امتحان کنید |
| `SSL certificate error` | اختلال در TLS توسط شبکه | گواهی‌نامه‌ها را به‌روز کنید |
| `401 Unauthorized` | کلید نامعتبر | کلید را مجدداً بسازید |
| `403 Forbidden` | IP ایران مسدود شده | Provider دیگری انتخاب کنید |
| `429 Too Many Requests` | Rate Limit فعال | تأخیر بین درخواست‌ها اضافه کنید |

## چه زمانی از این ارائه‌دهنده استفاده نکنیم

- **Provider IP ایران را مسدود کرده:** درخواست‌ها همیشه با خطا مواجه می‌شوند
- **نیاز به کارت بانکی:** کاربران ایرانی نمی‌توانند کارت بین‌المللی ارائه دهند
- **نیاز به VPN برای همه درخواست‌ها:** عملی نیست
- **قطعی مکرر:** اتصال ناپایدار به معنای غیرقابل اعتماد بودن Provider است
- **عدم مستندات قابل دسترس:** اگر مستندات فیلتر باشد، عیب‌یابی غیرممکن است

## منابع رسمی بررسی‌شده

- [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) — Providerهای تأیید شده با وضعیت دسترسی ایران
- [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) — گزارش‌های دسترسی از کاربران ایرانی
- [groq.com](https://www.groq.com/) — Provider با دسترسی تأیید شده از ایران
- [curl.se/docs](https://curl.se/docs/manpage.html) — مستندات کامل Curl برای تست

## وضعیت ایران و نکات ویژه برای کاربران

- همیشه ابتدا بدون VPN تست کنید — VPN ممکن است امنیت Provider را فعال کند
- Providerهایی که شماره تلفن ایرانی می‌پذیرند محدود هستند
- لیستی از Providerهای کارآمد نگه دارید — وضعیت دسترسی مکرراً تغییر می‌کند
- از اسکریپت تست خودکار برای بررسی سریع چندین Provider استفاده کنید
- یافته‌های خود را از طریق [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) با جامعه به اشتراک بگذارید

## اسکریپت تست خودکار

```bash
#!/bin/bash
# تست خودکار چهارمرحله‌ای API
# Usage: export API_KEY="YOUR_API_KEY" && export BASE_URL="https://api.groq.com/openai/v1" && ./test-api.sh

echo "=== مرحله ۱: دسترسی شبکه ==="
HTTP_CODE=$(curl --connect-timeout 10 -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$HTTP_CODE" = "000" ]; then
  echo "ناموفق: شبکه مسدود شده"
  exit 1
else
  echo "موفق: آدرس در دسترس (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== مرحله ۲: مدل‌ها ==="
MODELS=$(curl -s --connect-timeout 10 "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY")
if echo "$MODELS" | grep -q '"data"'; then
  echo "موفق: مدل‌ها لیست شدند"
else
  echo "ناموفق: لیست مدل‌ها در دسترس نیست"
fi
```

## نکات پیکربندی شبکه

- **DNS:** از سرورهای DNS عمومی (مانند Google DNS یا Cloudflare DNS) استفاده کنید
- **Timeout:** مقدار `--connect-timeout` را روی 15-20 ثانیه تنظیم کنید
- **TLS:** برخی ISPها با TLS handshaking مشکل دارند
- **Base URL:** برخی Providerها چندین endpoint دارند؛ دامنه‌های جایگزین را امتحان کنید
- **لاگینگ:** خطاهای شبکه را در فایل لاگ ذخیره کنید تا الگوهای قطعی شناسایی شوند

برای بررسی وضعیت دسترسی هر Provider از ایران، [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) را مشاهده کنید. فایل‌های منبع و گزارش مشکلات در [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) در دسترس هستند.

## راهنماهای مرتبط

- [امنیت API Key](api-key-security.md) — جلوگیری از افشای کلید
- [رفع خطاهای 401 و 403 و Model Not Found](fix-llm-api-401-403-model-not-found.md) — عیب‌یابی درخواست
- [راهنمای عملی LLM رایگان در ایران](practical-free-llm-api-iran.md) — از انتخاب تا اولین درخواست
