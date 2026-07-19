# Awesome Free LLM APIs IR

[![Validate data](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/validate.yml/badge.svg)](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/validate.yml)
[![Upstream watch](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/upstream-watch.yml/badge.svg)](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/actions/workflows/upstream-watch.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Persian](https://img.shields.io/badge/lang-فارسی-239f40.svg)](README.md)
[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.en.md)
[![Website](https://img.shields.io/badge/website-live-7c3aed.svg)](https://llm.persiantoolbox.ir/)

فهرست آزاد، فارسی و ماشین‌خوان از APIهای رایگان مدل‌های زبانی؛ با تمرکز ویژه بر **محدودیت مصرف، توکن، نیاز به پرداخت، دسترسی مستقیم از ایران و دسترسی با VPN**.

🌐 **[وب‌سایت اصلی](https://llm.persiantoolbox.ir/)** · **[آینهٔ ایران](https://ir.llm.persiantoolbox.ir/)** · **[نسخهٔ پشتیبان GitHub Pages](https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/)**

> [!IMPORTANT]
> «رایگان» بودن یک سرویس به معنی «قابل استفاده بودن از ایران» نیست. وضعیت ایران فقط با مدرک رسمی یا تست تاریخ‌دار ثبت می‌شود. `نامشخص` یعنی هنوز مدرک کافی نداریم، نه اینکه سرویس حتماً کار می‌کند.

## راهنماهای سریع

- [بهترین API رایگان LLM برای ایران](https://llm.persiantoolbox.ir/guides/best-free-llm-api-iran/) — مقایسه ۲۲ سرویس
- [API سازگار با OpenAI بدون نیاز به کارت](https://llm.persiantoolbox.ir/guides/openai-compatible-api-without-card/)
- [API رایگان برای برنامه‌نویسی](https://llm.persiantoolbox.ir/guides/free-coding-api/)
- [API رایگان Embedding](https://llm.persiantoolbox.ir/guides/free-embedding-api/)
- [تفاوت Free Tier با Trial و Credit](https://llm.persiantoolbox.ir/guides/free-tier-vs-trial-vs-credit/)
- [آموزش SDK OpenAI با Base URL سفارشی](https://llm.persiantoolbox.ir/guides/openai-sdk-custom-base-url/)

## اهداف پروژه

- گردآوری APIهای رایگان واقعی بدون نیاز به کارت بانکی، یا با برچسب روشن Trial/Credit
- ثبت جداگانهٔ دسترسی مستقیم، دسترسی با VPN و سیاست رسمی منطقه‌ای
- ارائهٔ توضیح فارسی و نمونه‌کد ساده و امن
- دسته‌بندی قابلیت‌ها برای چت، Reasoning، کدنویسی، Embedding و پردازش متن
- آماده‌سازی دادهٔ ماشین‌خوان برای وب‌سایت و ابزارهای جامعهٔ فارسی‌زبان
- افزودن سرویس‌های ایرانی فقط پس از اثبات API عمومی و سهمیهٔ رایگان
- جداسازی Provider رسمی، Gateway رسمی و Gateway اجتماعی از ابزارهای Session/Cookie

## فهرست سریع

<!-- PROVIDERS_TABLE_START -->
<!-- This section is generated. Run: npm run generate -->
| سرویس | نوع | رایگان | محدودیت نمونه | OpenAI-compatible | دسترسی ایران | آخرین بررسی |
|---|---|---|---|:---:|---|---|
| [Agnes AI](https://agnes-ai.com/) | Gateway رسمی | مدل‌های رایگان | 20 RPM | ✅ | ❔ نامشخص | 2026-07-16 |
| [Aion Labs](https://www.aionlabs.ai/) | Provider رسمی | سهمیه دائمی | 15 RPM · 20,000 TPM | ✅ | ⛔ مسدود | 2026-07-16 |
| [Cerebras Inference](https://cloud.cerebras.ai/) | Gateway رسمی | آزمایشی | 5 RPM · 30,000 TPM | ✅ | ⛔ مسدود | 2026-07-18 |
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) | Gateway رسمی | سهمیه دائمی | 10,000 neurons/day | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [Cohere](https://cohere.com/) | Provider رسمی | آزمایشی | 20 RPM · 1,000 requests/month | — | ⛔ مسدود | 2026-07-16 |
| [Fireworks AI](https://fireworks.ai/) | Gateway رسمی | اعتبار ماهانه | 10 RPM | ✅ | ❔ نامشخص | 2026-07-16 |
| [FreeTheAI](https://freetheai.xyz/) | Gateway اجتماعی | مدل‌های رایگان | 10 RPM · 250 RPD | ✅ | ❔ نامشخص | 2026-07-19 |
| [GitHub Models](https://github.com/marketplace/models) | Gateway رسمی | سهمیه دائمی | 15 RPM · 150 RPD | ✅ | ✅ مستقیم تست‌شده | 2026-07-15 |
| [Google Gemini API](https://ai.google.dev/) | Provider رسمی | سهمیه دائمی | وابسته به حساب/مدل | ✅ | 🚫 پشتیبانی‌نشده رسمی | 2026-07-16 |
| [Groq](https://groq.com/) | Gateway رسمی | سهمیه دائمی | 30 RPM · 1000 RPD | ✅ | ⛔ مسدود | 2026-07-18 |
| [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/index) | Gateway رسمی | اعتبار ماهانه | $0.1/month | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [Kilo Gateway](https://kilo.ai/) | Gateway رسمی | مدل‌های رایگان | 200 RPH | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [LLM7.io](https://llm7.io/) | Gateway اجتماعی | مدل‌های رایگان | 30 RPM | ✅ | ✅ مستقیم تست‌شده | 2026-07-19 |
| [Mistral AI](https://mistral.ai/) | Provider رسمی | سهمیه دائمی | وابسته به حساب/مدل | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [ModelScope (Alibaba)](https://modelscope.cn/) | Gateway رسمی | مدل‌های رایگان | 2000 RPD | ✅ | 🧾 ثبت‌نام مسدود | 2026-07-19 |
| [NVIDIA NIM API Catalog](https://build.nvidia.com/) | Gateway رسمی | سهمیه دائمی | وابسته به حساب/مدل | ✅ | ❔ نامشخص | 2026-07-16 |
| [OpenCode Zen](https://opencode.ai/zen) | Gateway رسمی | مدل‌های رایگان | مدل‌محور | ✅ | ✅ مستقیم تست‌شده | 2026-07-19 |
| [OpenRouter](https://openrouter.ai/) | Gateway رسمی | مدل‌های رایگان | 20 RPM · 50 RPD | ✅ | ⛔ مسدود | 2026-07-16 |
| [OVHcloud AI Endpoints](https://www.ovhcloud.com/en/public-cloud/ai-endpoints/) | Gateway رسمی | مدل‌های رایگان | 2 RPM | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [SambaNova Cloud](https://cloud.sambanova.ai/) | Gateway رسمی | سهمیه دائمی | 20 RPM · 20 RPD | ✅ | ✅ مستقیم تست‌شده | 2026-07-16 |
| [SiliconFlow](https://cloud.siliconflow.cn/) | Gateway رسمی | مدل‌های رایگان | 30 RPM · 60,000 TPM | ✅ | 🧾 ثبت‌نام مسدود | 2026-07-16 |
| [Vercel AI Gateway](https://vercel.com/ai) | Gateway رسمی | اعتبار ماهانه | $5/month | ✅ | ❔ نامشخص | 2026-07-16 |
<!-- PROVIDERS_TABLE_END -->

## مرجع سریع API

| سرویس | Base URL | Auth | نیاز به کارت بانکی |
|---|---|---|---|
| [Agnes AI](https://agnes-ai.com/) | `https://apihub.agnes-ai.com/v1` | API Key | ❔ نامشخص |
| [Aion Labs](https://www.aionlabs.ai/) | `https://api.aionlabs.ai/v1` | API Key | ❌ خیر |
| [Cerebras](https://cloud.cerebras.ai/) | `https://api.cerebras.ai/v1` | API Key | ✅ ثبت‌نام |
| [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) | `https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1` | API Token | ❌ سهمیه رایگان |
| [Cohere](https://cohere.com/) | `https://api.cohere.com/v2` | API Key | ✅ ثبت‌نام |
| [Fireworks AI](https://fireworks.ai/) | `https://api.fireworks.ai/inference/v1` | API Key | ✅ ثبت‌نام |
| [FreeTheAI](https://freetheai.xyz/) | `https://api.freetheai.xyz/v1` | API Key | ❌ ناشناس |
| [GitHub Models](https://github.com/marketplace/models) | `https://models.inference.ai.azure.com` | Token | ❌ با GitHub |
| [Google Gemini](https://ai.google.dev/) | `https://generativelanguage.googleapis.com/v1beta` | API Key | ❌ سهمیه رایگان |
| [Groq](https://groq.com/) | `https://api.groq.com/openai/v1` | API Key | ❌ ثبت‌نام رایگان |
| [Hugging Face](https://huggingface.co/inference-providers) | `https://router.huggingface.co/hf-inference/v1` | HF Token | ❌ سهمیه ماهانه |
| [Kilo Gateway](https://kilo.ai/) | `https://api.kilo.ai/v1` | API Key / ناشناس | ❌ ناشناس |
| [LLM7.io](https://llm7.io/) | `https://api.llm7.io/v1` | API Key / ناشناس | ❌ ناشناس |
| [Mistral AI](https://mistral.ai/) | `https://api.mistral.ai/v1` | API Key | ❌ ثبت‌نام |
| [ModelScope (Alibaba)](https://modelscope.cn/) | `https://api-inference.modelscope.cn/v1` | API Key | ❌ ثبت‌نام |
| [NVIDIA NIM](https://build.nvidia.com/) | `https://integrate.api.nvidia.com/v1` | API Key | ❌ ثبت‌نام |
| [OpenRouter](https://openrouter.ai/) | `https://openrouter.ai/api/v1` | API Key | ✅ ثبت‌نام |
| [OpenCode Zen](https://opencode.ai/zen) | `https://opencode.ai/zen/v1` | API Key | ❌ ثبت‌نام |
| [OVHcloud AI Endpoints](https://www.ovhcloud.com/en/public-cloud/ai-endpoints/) | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` | API Key / ناشناس | ❌ ناشناس |
| [SambaNova Cloud](https://cloud.sambanova.ai/) | `https://api.sambanova.ai/v1` | API Key | ❌ ثبت‌نام |
| [SiliconFlow](https://cloud.siliconflow.cn/) | `https://api.siliconflow.cn/v1` | API Key | ❌ ثبت‌نام |
| [Vercel AI Gateway](https://vercel.com/ai) | `https://ai-gateway.vercel.sh/v1` | API Key | ❌ با حساب Vercel |

## معنی وضعیت دسترسی ایران

| وضعیت | معنی |
|---|---|
| ✅ مستقیم تست‌شده | درخواست واقعی اخیراً با IP ایران و بدون VPN موفق بوده است |
| 🛡️ با VPN تست‌شده | درخواست از داخل ایران با خروجی VPN ثبت‌شده موفق بوده است |
| 🛡️ مستقیم مسدود / VPN موفق | شکست مستقیم و موفقیت VPN هر دو مدرک مستقل دارند |
| ⛔ تست‌شده/مسدود | درخواست واقعی با IP ایران ناموفق بوده و شواهد کافی وجود دارد |
| 🚫 پشتیبانی‌نشده رسمی | ایران در سیاست یا فهرست رسمی سرویس پشتیبانی نمی‌شود |
| ⚠️ ناپایدار | نتیجه بین ISPها، ASNها یا زمان‌های مختلف متفاوت بوده است |
| 🧾 ثبت‌نام مسدود | خود API ممکن است در دسترس باشد اما ساخت حساب با مانع روبه‌رو است |
| ❔ نامشخص | تست معتبر و تازه‌ای ثبت نشده است |

جزئیات روش ارزیابی در [روش‌شناسی](docs/METHODOLOGY.fa.md)، [نوع سرویس‌ها](docs/SERVICE_TYPES.fa.md) و [سطوح اعتبارسنجی](docs/VERIFICATION.fa.md) آمده است.

## چه چیزهایی ثبت می‌شوند؟

- نوع رایگان بودن: دائمی، مدل رایگان، اعتبار ماهانه یا آزمایشی
- محدودیت‌های RPM، RPD، TPM، TPD، توکن ورودی/خروجی و درخواست هم‌زمان
- نیاز به کارت بانکی یا پرداخت اولیه
- سازگاری با OpenAI API
- وضعیت رسمی و نتیجهٔ تست با IP ایران، همراه تاریخ و مدرک
- نتیجهٔ VPN همراه کشور خروجی، بدون ذخیرهٔ IP یا اطلاعات حساب
- تاریخ آخرین بررسی و زمان منقضی شدن اعتبار داده

## استفادهٔ ماشینی

هر سرویس یک فایل مستقل در [`data/providers`](data/providers) دارد و ساختار آن با [`schema/provider.schema.json`](schema/provider.schema.json) تعریف شده است. وب‌سایت‌ها می‌توانند فایل یکپارچهٔ [`catalog.json`](catalog.json) یا [`data.json`](data.json) را مستقیماً مصرف کنند.

```bash
git clone https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir.git
cd awesome-free-llm-apis-ir
npm test
```

فایل `catalog.json` و جدول README هر دو از منبع اصلی تولید می‌شوند و CI از قدیمی‌شدن آن‌ها جلوگیری می‌کند. Workflow هفتگی نیز رکوردهای منقضی‌شده را پیدا و یک Issue نگهداری ایجاد یا به‌روزرسانی می‌کند.

## پایش منابع بالادستی

Repositoryهای مرجع، Gatewayها و ابزارهای پرنوسان در [`data/upstreams.json`](data/upstreams.json) ثبت شده‌اند. Workflow هفتگی فقط SHA فایل‌های حساس را مقایسه می‌کند و در صورت تغییر، یک Issue یکتا برای راستی‌آزمایی انسانی می‌سازد؛ هیچ ادعایی خودکار وارد Catalog نمی‌شود.

```bash
npm run upstreams:test
GITHUB_TOKEN=... npm run upstreams:check
```

جزئیات معماری، Tierهای اعتماد، Artifact/Cache و روش پاسخ به هشدار در [راهنمای پایش Repositoryهای بالادستی](docs/UPSTREAM_REPOSITORY_WATCH.fa.md) آمده است.

## ممیزی Repositoryهای کاندید

تصمیم Add/Watch/Reject برای Repositoryهای کشف‌شده در [Registry ماشین‌خوان ممیزی](data/repository-audits.json) ثبت می‌شود و CI مرز آن‌ها را با Provider و Tools Catalog کنترل می‌کند.

```bash
npm run validate:repo-audits
```

روش، Evidence و نتیجهٔ ممیزی‌های جاری در [راهنمای ممیزی Repositoryهای GitHub](docs/GITHUB_REPOSITORY_AUDITS.fa.md) آمده است.

## تست واقعی از ایران

ابزار داخلی پروژه با مصرف حداقلی، نتیجهٔ درخواست‌ها را بدون ذخیرهٔ IP، کلید یا متن پاسخ ثبت می‌کند:

```bash
cp .env.example .env
npm run verify:iran:dry
npm run verify:iran -- --providers=openrouter,groq
```

پیش از اجرا [راهنمای تست زندهٔ ایران](docs/IRAN_LIVE_VERIFICATION.fa.md) را بخوانید. برای اجرای کامل روی کامپیوتر دارای IP ایران، [پرامپت اجرایی ایجنت محلی](docs/LOCAL_AGENT_EXECUTION_PROMPT.fa.md) آماده شده است.

## دسته‌بندی قابلیت‌ها

- چت و تولید متن
- Reasoning و حل مسئله
- تولید و تحلیل کد
- Embedding و جست‌وجوی معنایی
- Tool calling و خروجی ساخت‌یافته

نمونه‌های بدون وابستگی در [`examples`](examples) قرار دارند.

## ابزارهای CLI و Coding Agentها

ابزارهایی مثل OpenCode، MiMo Code و Hermes معمولاً **مصرف‌کنندهٔ Provider** هستند، نه الزاماً API رایگان مستقل. برای جلوگیری از قاطی‌شدن CLI با Provider، معیار ورود این موارد در [راهنمای ثبت ابزارهای کدنویسی CLI](docs/CODING_AGENT_INTAKE.fa.md) آمده است. اگر یک Gateway مثل OpenCode Zen یا MiMo API، endpoint عمومی، مدل رایگان و محدودیت قابل بررسی داشته باشد، می‌تواند به‌عنوان Provider جداگانه پیشنهاد شود؛ در غیر این صورت در بخش ابزارهای سازگار معرفی می‌شود.

برای کانفیگ سریع ابزارها با Providerهای این مخزن، [راهنمای کانفیگ ابزارهای کدنویسی](docs/TOOL_CONFIG_SNIPPETS.fa.md) را ببینید.

## بنچمارک فارسی

نسخهٔ اول بنچمارک پایهٔ فارسی شامل ۱۵ آزمون قطعی در ۵ دسته است: پیروی از دستور، درک متن، استدلال عددی، JSON و نگارش فارسی. امتیازدهی محلی و بدون مدل داور انجام می‌شود:

```bash
npm run benchmark:validate
npm run benchmark:dry
npm run benchmark:run
```

روش اجرا، الزامات انتشار نتیجه و محدودیت‌های این معیار در [راهنمای بنچمارک فارسی](benchmarks/persian/README.fa.md) آمده است. خروجی ناقص یا دارای خطای شبکه نباید وارد رتبه‌بندی شود.

## 📦 کاتالوگ ابزارها و Proxyها

دادهٔ ابزارهای غیر-رسمی (Proxy، Session Bridge، Router) در مخزن جداگانهٔ [`catalog-tools.json`](catalog-tools.json) نگهداری می‌شود. این ابزارها در Provider اصلی و Advisor وب‌سایت حضور ندارند.

| ابزار | نوع | Risk | کلید | ایران |
|---|---|---|---|---|
| FreeLLMAPI | proxy | متوسط | env | نامشخص |
| gpt4free | session_bridge | بالا | cookie | نیازمند تنظیمات |
| Token Free Gateway | session_bridge | بالا | cookie | نامشخص |
| CLIProxyAPI | session_bridge | متوسط | oauth | نامشخص |
| FreeLLMPool | aggregator | متوسط | env | نامشخص |
| Free-Way | router | متوسط | env | نامشخص |
| AnimaRouter | router | متوسط | env | نامشخص |
| g4f-working | monitoring_companion | پایین | بدون | سازگار |

راهنمای کامل: [`docs/TOOLS_CATALOG.fa.md`](docs/TOOLS_CATALOG.fa.md)

## نقشهٔ راه

وضعیت پروژه بر اساس معیار پذیرش و Evidence نگهداری می‌شود؛ تکمیل زیرساخت به معنی تکمیل همهٔ تست‌های عملی نیست.

- **P0 — قرارداد داده:** هم‌راستا کردن Schema و Validator، رد فیلد ناشناخته و نرمال‌سازی Metadata تست زنده
- **P0 — ایران:** تست مستقیم روی شبکه ثابت و موبایل انجام شده؛ Credential validation از VPN با ماتریس کامل VPN تفاوت دارد
- **P1 — Catalog:** تکمیل Evidence سرویس‌های نامشخص و بازبینی مستمر محدودیت‌ها و ثبت‌نام
- **P1 — Tools/Audits:** جداسازی کامل ابزارها و ثبت تصمیم Add / Watch / Reject
- **P2 — Benchmark/Website:** گسترش بنچمارک فارسی و نمایش مستقل Tools و Audits

جزئیات، وضعیت هر فاز و معیار خروج در [نقشهٔ راه اصلی](docs/ROADMAP.fa.md) آمده است.

## مشارکت

- برای افزودن سرویس از فرم **Add a provider** استفاده کنید.
- برای گزارش تغییر سهمیه یا وضعیت ایران از فرم **Report a change** استفاده کنید.
- کلید API، شماره تلفن، ایمیل خصوصی یا اطلاعات هویتی را در Issue و Pull Request قرار ندهید.
- ادعای دسترسی از ایران بدون تاریخ، نوع شبکه و مدرک قابل بررسی پذیرفته نمی‌شود.

راهنمای کامل در [CONTRIBUTING.md](CONTRIBUTING.md) است.

## محدوده و سلب مسئولیت

این پروژه فقط منبع اطلاعاتی است و وابسته به هیچ ارائه‌دهنده‌ای نیست. استفاده از VPN به‌عنوان یک مسیر اتصال قابل گزارش است، اما پروژه دور زدن احراز هویت، پرداخت، KYC یا شرایط استفاده را آموزش نمی‌دهد. محدودیت‌ها ممکن است بدون اطلاع تغییر کنند؛ پیش از استفادهٔ عملی، مستندات رسمی را بررسی کنید.

## مجوز

کد و محتوای این مخزن تحت [MIT License](LICENSE) منتشر شده‌اند.
