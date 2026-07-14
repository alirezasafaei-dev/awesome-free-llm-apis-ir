# Awesome Free LLM APIs IR

[![Validate data](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/validate.yml/badge.svg)](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Persian](https://img.shields.io/badge/lang-فارسی-239f40.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)

فهرست آزاد، فارسی و ماشین‌خوان از APIهای رایگان مدل‌های زبانی؛ با تمرکز ویژه بر **محدودیت مصرف، توکن، نیاز به پرداخت و وضعیت دسترسی با IP ایران**.

> [!IMPORTANT]
> «رایگان» بودن یک سرویس به معنی «قابل استفاده بودن از ایران» نیست. وضعیت ایران فقط با مدرک رسمی یا تست تاریخ‌دار ثبت می‌شود. `نامشخص` یعنی هنوز مدرک کافی نداریم، نه اینکه سرویس حتماً کار می‌کند.

## فهرست سریع

<!-- PROVIDERS_TABLE_START -->
<!-- This section is generated. Run: npm run generate -->
| سرویس | رایگان | محدودیت نمونه | OpenAI-compatible | دسترسی ایران | آخرین بررسی |
|---|---|---|:---:|---|---|
| [Cerebras Inference](https://cloud.cerebras.ai/) | آزمایشی | 5 RPM · 30,000 TPM | ✅ | ❔ نامشخص | 2026-07-14 |
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) | سهمیه دائمی | 10,000 neurons/day | ✅ | ❔ نامشخص | 2026-07-14 |
| [Cohere](https://cohere.com/) | آزمایشی | 20 RPM · 1,000 requests/month | — | ❔ نامشخص | 2026-07-14 |
| [GitHub Models](https://github.com/marketplace/models) | سهمیه دائمی | 15 RPM · 150 RPD | ✅ | ❔ نامشخص | 2026-07-14 |
| [Google Gemini API](https://ai.google.dev/) | سهمیه دائمی | وابسته به حساب/مدل | ✅ | 🚫 پشتیبانی‌نشده رسمی | 2026-07-14 |
| [Groq](https://groq.com/) | سهمیه دائمی | 30 RPM · 14400 RPD | ✅ | ❔ نامشخص | 2026-07-14 |
| [Hugging Face Inference Providers](https://huggingface.co/inference-providers) | اعتبار ماهانه | $0.1/month | ✅ | ❔ نامشخص | 2026-07-14 |
| [Mistral AI](https://mistral.ai/) | سهمیه دائمی | وابسته به حساب/مدل | ✅ | ❔ نامشخص | 2026-07-14 |
| [NVIDIA NIM API Catalog](https://build.nvidia.com/) | سهمیه دائمی | وابسته به حساب/مدل | ✅ | ❔ نامشخص | 2026-07-14 |
| [OpenRouter](https://openrouter.ai/) | مدل‌های رایگان | 20 RPM · 50 RPD | ✅ | ❔ نامشخص | 2026-07-14 |
| [SambaNova Cloud](https://cloud.sambanova.ai/) | سهمیه دائمی | 20 RPM · 20 RPD | ✅ | ❔ نامشخص | 2026-07-14 |
<!-- PROVIDERS_TABLE_END -->

## معنی وضعیت دسترسی ایران

| وضعیت | معنی |
|---|---|
| ✅ تست‌شده | درخواست واقعی اخیراً با IP ایران موفق بوده است |
| ⛔ تست‌شده/مسدود | درخواست واقعی با IP ایران ناموفق بوده و شواهد کافی وجود دارد |
| 🚫 پشتیبانی‌نشده رسمی | ایران در سیاست یا فهرست رسمی سرویس پشتیبانی نمی‌شود |
| ⚠️ ناپایدار | نتیجه بین ISPها، ASNها یا زمان‌های مختلف متفاوت بوده است |
| 🧾 ثبت‌نام مسدود | خود API ممکن است در دسترس باشد اما ساخت حساب با مانع روبه‌رو است |
| ❔ نامشخص | تست معتبر و تازه‌ای ثبت نشده است |

جزئیات روش ارزیابی در [روش‌شناسی](docs/METHODOLOGY.fa.md) و [سطوح اعتبارسنجی](docs/VERIFICATION.fa.md) آمده است.

## چه چیزهایی ثبت می‌شوند؟

- نوع رایگان بودن: دائمی، مدل رایگان، اعتبار ماهانه یا آزمایشی
- محدودیت‌های RPM، RPD، TPM، TPD، توکن ورودی/خروجی و درخواست هم‌زمان
- نیاز به کارت بانکی یا پرداخت اولیه
- سازگاری با OpenAI API
- وضعیت رسمی و نتیجهٔ تست با IP ایران، همراه تاریخ و مدرک
- تاریخ آخرین بررسی و زمان منقضی شدن اعتبار داده

## استفادهٔ ماشینی

هر سرویس یک فایل مستقل در [`data/providers`](data/providers) دارد و ساختار آن با [`schema/provider.schema.json`](schema/provider.schema.json) تعریف شده است. وب‌سایت‌ها می‌توانند فایل یکپارچهٔ [`catalog.json`](catalog.json) را مستقیماً مصرف کنند.

```bash
git clone https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir.git
cd awesome-free-llm-apis-ir
npm test
```

فایل `catalog.json` و جدول README هر دو از منبع اصلی تولید می‌شوند و CI از قدیمی‌شدن آن‌ها جلوگیری می‌کند. Workflow هفتگی نیز رکوردهای منقضی‌شده را پیدا و یک Issue نگهداری ایجاد یا به‌روزرسانی می‌کند.

## تست واقعی از ایران

ابزار داخلی پروژه با مصرف حداقلی، نتیجهٔ درخواست‌ها را بدون ذخیرهٔ IP، کلید یا متن پاسخ ثبت می‌کند:

```bash
cp .env.example .env
npm run verify:iran:dry
npm run verify:iran -- --providers=openrouter,groq
```

پیش از اجرا [راهنمای تست زندهٔ ایران](docs/IRAN_LIVE_VERIFICATION.fa.md) را بخوانید. برای اجرای کامل روی کامپیوتر دارای IP ایران، [پرامپت اجرایی ایجنت محلی](docs/LOCAL_AGENT_EXECUTION_PROMPT.fa.md) آماده شده است.

## مشارکت

- برای افزودن سرویس از فرم **Add a provider** استفاده کنید.
- برای گزارش تغییر سهمیه یا وضعیت ایران از فرم **Report a change** استفاده کنید.
- کلید API، شماره تلفن، ایمیل خصوصی یا اطلاعات هویتی را در Issue و Pull Request قرار ندهید.
- ادعای دسترسی از ایران بدون تاریخ، نوع شبکه و مدرک قابل بررسی پذیرفته نمی‌شود.

راهنمای کامل در [CONTRIBUTING.md](CONTRIBUTING.md) است.

## محدوده و سلب مسئولیت

این پروژه فقط منبع اطلاعاتی است، وابسته به هیچ ارائه‌دهنده‌ای نیست و دور زدن محدودیت‌های جغرافیایی یا شرایط استفادهٔ سرویس‌ها را توصیه نمی‌کند. محدودیت‌ها ممکن است بدون اطلاع تغییر کنند؛ پیش از استفادهٔ عملی، مستندات رسمی را بررسی کنید.

## مجوز

کد و محتوای این مخزن تحت [MIT License](LICENSE) منتشر شده‌اند.
