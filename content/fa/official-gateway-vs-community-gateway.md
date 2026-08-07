---
title: "مقایسه Gateway رسمی و Community Gateway در APIهای LLM"
slug: "official-gateway-vs-community-gateway"
translation_key: "official-gateway-vs-community-gateway"
description: "راهنمای مقایسه Gateway رسمی و Community Gateway برای دسترسی به APIهای LLM؛ همراه با ریسک، امنیت، پایداری و نکات فنی برای کاربران ایرانی."
primary_keyword: "Gateway رسمی vs Community Gateway"
canonical_target: "https://llm.persiantoolbox.ir/guides/official-gateway-vs-community-gateway/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---

# مقایسه Gateway رسمی و Community Gateway در APIهای LLM

**پاسخ سریع:** Gateway رسمی نقطه اتصال مستقیم به Provider اصلی است و امنیت، پایداری و سند رسمی دارد. Community Gateway واسطه‌ای غیررسمی است که توسط افراد یا گروه‌های مستقل اداره می‌شود. انتخاب بین این دو باید بر اساس ریسک، نیاز امنیتی و وضعیت دسترسی انجام شود.

آخرین داده‌های تاریخ‌دار سرویس‌ها در [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) قرار دارد.

## Gateway رسمی چیست؟

Gateway رسمی نقطه اتصال API است که مستقیماً توسط Provider اداره می‌شود:

- **آدرس:** معمولاً `api.provider.com` یا مشابه
- **احراز هویت:** API Key صادرشده توسط Provider
- **اسناد:** مستندات رسمی، API Reference و SDK
- **پشتیبانی:** تیم پشتیبانی Provider
- **سیاست:** شرایط استفاده و حریم‌خصوصی Provider

### مزایای Gateway رسمی

- **امنیت:** کلید API مستقیماً به حساب شما متصل است
- **پایداری:** تغییرات با اطلاع‌رسانی قبلی اعمال می‌شود
- **عملکرد:** بهینه‌ترین مسیر اتصال به سرورهای Provider
- **سند رسمی:** API Reference دقیق و به‌روز

### محدودیت‌های Gateway رسمی

- **دسترسی جغرافیایی:** بعضی Providerها مناطق خاصی را مسدود کرده‌اند
- **نیاز به کارت بانکی:** بعضی سرویس‌ها بدون کارت بانکی فعال نمی‌شوند
- **محدودیت IP:** بعضی سرویس‌ها IPهای خاصی را می‌پذیرند

## Community Gateway چیست؟

Community Gateway واسطه‌ای است که توسط افراد، تیم‌ها یا جامعه اداره می‌شود:

- **آدرس:** معمولاً دامنه‌ای متفاوت از Provider اصلی
- **احراز هویت:** ممکن است API Key متفاوت یا اشتراکی باشد
- **عملکرد:** ممکن است درخواست‌ها را به Gateway رسمی ا转发 کند
- **مدیریت:** توسط یک فرد یا تیم مستقل

### مزایای Community Gateway

- **دسترسی:** ممکن است محدودیت‌های جغرافیایی را دور بزند
- **سادگی:** ثبت‌نام و شروع کار ممکن است ساده‌تر باشد
- **انعطاف:** شرایط استفاده ممکن است انعطاف‌پذیرتر باشد

### ریسک‌های Community Gateway

- **امنیت:** داده‌های شما از مسیر واسطه‌ای عبور می‌کنند
- **پایداری:** واسطه ممکن است بدون اطلاع‌رسانی سرویس را تغییر دهد
- **حریم‌خصوصی:** احتمال ذخیره یا تحلیل درخواست‌ها
- **پشتیبانی:** معمولاً پشتیبانی رسمی وجود ندارد

## مقایسه عملی

| معیار | Gateway رسمی | Community Gateway |
|---|---|---|
| امنیت | بالا | متوسط تا پایین |
| پایداری | بالا | متغیر |
| حریم‌خصوصی | سیاست رسمی | نامشخص |
| پشتیبانی | رسمی | غیررسمی |
| دسترسی | ممکن است محدود باشد | معمولاً در دسترس |
| هزینه | رایگان یا پولی | معمولاً رایگان |

## نکات فنی

### وقتی Gateway رسمی انتخاب می‌کنید

- API Key را در متغیرهای محیطی ذخیره کنید، نه در کد
- Rate Limit Provider را بشناسید و Retry با Backoff پیاده کنید
- از SDK رسمی Provider استفاده کنید

### وقتی Community Gateway استفاده می‌کنید

- داده‌های حساس را ارسال نکنید
- API Key اشتراکی را با احتیاط مدیریت کنید
- از پایداری سرویس مطمئن شوید قبل از وابستگی پروژه
- قابلیت مهاجرت سریع به Gateway رسمی را حفظ کنید

## توصیه برای کاربران ایرانی

1. **اولویت اول:** Gateway رسمی اگر در دسترس باشد
2. **اولویت دوم:** Community Gateway معتبر با سابقه مشخص و سیاست شفاف
3. **اولویت سوم:** Gateway محلی با Ollama یا llama.cpp برای حداکثر حریم‌خصوصی

هیچ‌وقت داده‌های حساس (API Key، رمز عبور، اطلاعات شخصی) را از Community Gateway ارسال نکنید.

## نتیجه‌گیری

Gateway رسمی همیشه انتخاب امن‌تری است. اگر به دلیل محدودیت جغرافیایی ناچار به استفاده از Community Gateway هستید، داده‌های حساس را ارسال نکنید و قابلیت مهاجرت سریع را حفظ کنید.

## کد تست Gateway

```python
import os
import requests
import time

def test_gateway(base_url, api_key, label):
    """تست دسترسی و پاسخ‌دهی یک Gateway"""
    print(f"تست {label}: {base_url}")
    start = time.time()
    try:
        resp = requests.get(
            f"{base_url}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15
        )
        elapsed = time.time() - start
        if resp.status_code == 200:
            models = resp.json().get("data", [])
            print(f"  موفق: {len(models)} مدل، {elapsed:.1f}s")
            return True
        else:
            print(f"  ناموفق: HTTP {resp.status_code}، {elapsed:.1f}s")
            return False
    except Exception as e:
        print(f"  خطا: {e}")
        return False

# مقایسه Gateway رسمی و Community
official_key = os.environ.get("OFFICIAL_API_KEY", "YOUR_API_KEY")
community_key = os.environ.get("COMMUNITY_API_KEY", "YOUR_API_KEY")

test_gateway("https://api.groq.com/openai/v1", official_key, "رسمی")
test_gateway("https://community-proxy.example.com/v1", community_key, "Community")
```

## جدول ملاحظات امنیتی

| جنبه | Gateway رسمی | Community Gateway |
|---|---|---|
| رمزگذاری داده | End-to-end با Provider | ممکن است شنود شود |
| سیاست لاگینگ | مستند، قابل ممیزی | نامشخص |
| ذخیره کلید | مدیریت‌شده توسط Provider | مدیریت‌شده توسط شخص ثالث |
| پاسخ به حادثه | تیم پشتیبانی Provider | اپراتور فردی |

## نحوه ثبت‌نام

### Gateway رسمی

1. از [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) Provider مورد نظر را پیدا کنید
2. وب‌سایت رسمی Provider را باز کنید
3. ثبت‌نام کنید و حساب بسازید
4. API Key را از داشبورد دریافت کنید
5. آن را در فایل `.env` ذخیره کنید

### Community Gateway

1. از [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) Community Gateway معتبر را پیدا کنید
2. شرایط استفاده و سیاست حریم‌خصوصی را بخوانید
3. ثبت‌نام کنید و API Key دریافت کنید
4. فقط داده‌های غیرحساس ارسال کنید

## اولین درخواست API

```bash
# تست Gateway رسمی
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $API_KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\"data\",[]))} مدل موجود')"

# تست Community Gateway
curl -s https://community-proxy.example.com/v1/models \
  -H "Authorization: Bearer $COMMUNITY_KEY"
```

## خطاهای رایج و رفع آنها

| خطا | علت | راه‌حل |
|---|---|---|
| `Connection timeout` | آدرس Gateway فیلتر شده | آدرس جایگزین امتحان کنید |
| `403 Forbidden` | IP شما مسدود شده | از Gateway دیگری استفاده کنید |
| `Invalid API Key` | کلید نامعتبر یا منقضی | کلید را مجدداً بسازید |
| `Rate limit exceeded` | محدودیت نرخ درخواست | با تأخیر بیشتری درخواست دهید |
| `Gateway offline` | سرویس Community قطع است | به Gateway رسمی مهاجرت کنید |

## چه زمانی از این ارائه‌دهنده استفاده نکنیم

- **داده‌های حساس:** هرگز اطلاعات محرمانه را از Community Gateway ارسال نکنید
- **پروژه‌های Production:** فقط از Gateway رسمی استفاده کنید
- **پایداری پایین:** اگر Gateway مدام قطع می‌شود، مهاجرت کنید
- **بدون مستندات:** اگر مستندات دقیق وجود ندارد، احتیاط کنید
- **بدون پشتیبانی:** اگر مشکلی پیش آمد، راهی برای رفع آن نیست

## منابع رسمی بررسی‌شده

- [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) — مقایسه Gateway رسمی و Community
- [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) — گزارش‌های دسترسی
- [groq.com](https://www.groq.com/) — نمونه Gateway رسمی
- [together.ai](https://www.together.ai/) — نمونه Gateway رسمی

## وضعیت ایران و نکات ویژه برای کاربران

- Gateway رسمی ممکن است از ایران قابل دسترسی نباشد
- Community Gateway ممکن است دسترسی را تسهیل کند اما ریسک‌های امنیتی دارد
- همیشه قابلیت مهاجرت سریع به Gateway رسمی را حفظ کنید
- از Ollama محلی برای حداکثر حریم‌خصوصی استفاده کنید

## کد تست Gateway

```python
import os
import requests
import time

def test_gateway(base_url, api_key, label):
    """تست دسترسی و پاسخ‌دهی یک Gateway"""
    print(f"تست {label}: {base_url}")
    start = time.time()
    try:
        resp = requests.get(
            f"{base_url}/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=15
        )
        elapsed = time.time() - start
        if resp.status_code == 200:
            models = resp.json().get("data", [])
            print(f"  موفق: {len(models)} مدل، {elapsed:.1f}s")
            return True
        else:
            print(f"  ناموفق: HTTP {resp.status_code}، {elapsed:.1f}s")
            return False
    except Exception as e:
        print(f"  خطا: {e}")
        return False

# مقایسه Gateway رسمی و Community
official_key = os.environ.get("OFFICIAL_API_KEY", "YOUR_API_KEY")
community_key = os.environ.get("COMMUNITY_API_KEY", "YOUR_API_KEY")

test_gateway("https://api.groq.com/openai/v1", official_key, "رسمی")
test_gateway("https://community-proxy.example.com/v1", community_key, "Community")
```

## جدول ملاحظات امنیتی

| جنبه | Gateway رسمی | Community Gateway |
|---|---|---|
| رمزگذاری داده | End-to-end با Provider | ممکن است شنود شود |
| سیاست لاگینگ | مستند، قابل ممیزی | نامشخص |
| ذخیره کلید | مدیریت‌شده توسط Provider | مدیریت‌شده توسط شخص ثالث |
| پاسخ به حادثه | تیم پشتیبانی Provider | اپراتور فردی |

برای بررسی وضعیت دسترسی و نوع Gateway هر Provider، [کاتالوگ رایگان LLM](https://llm.persiantoolbox.ir/) را مشاهده کنید. فایل‌های منبع و گزارش مشکلات در [مخزن GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) در دسترس هستند.

## راهنماهای مرتبط

- [راهنمای LLM رایگان برای ایران](free-llm-api.md) — سرویس‌های تأییدشده
- [مدل‌های رایگان دائمی](permanent-free-models.md) — مقایسه‌ی بلندمدت
- [وضعیت دسترسی ایران با شواهد](ai-api-iran.md) — تفسیر درست شواهد دسترسی
