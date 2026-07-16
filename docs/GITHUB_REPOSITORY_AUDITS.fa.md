# ممیزی Repositoryهای کاندید GitHub

## هدف

این سند مشخص می‌کند Repositoryهای کشف‌شده در GitHub چگونه پیش از ورود به Provider Catalog، Tools Catalog یا Upstream Monitor طبقه‌بندی می‌شوند.

خروجی ماشین‌خوان ممیزی در [`data/repository-audits.json`](../data/repository-audits.json) و قرارداد آن در [`schema/repository-audit.schema.json`](../schema/repository-audit.schema.json) قرار دارد.

## اصل تصمیم‌گیری

وجود ستاره، Demo، عبارت «Free» یا سازگاری ظاهری با OpenAI برای ورود به Catalog کافی نیست. هر Repository باید از نظر ماهیت سرویس، احراز هویت، مدل اقتصادی، نگهداری، مجوز و سطح دسترسی به Backend بررسی شود.

تصمیم‌ها:

- `add_provider`: سرویس میزبانی‌شده با API و Free Tier قابل اثبات
- `add_upstream`: منبع مناسب برای کشف تغییر، نه Provider
- `watch`: مورد موجود یا امیدوارکننده که همچنان نیازمند پایش است
- `reject`: خارج از Scope، پولی، آرشیوی یا دارای ریسک نامتناسب

## نتیجه ممیزی ۲۰۲۶-۰۷-۱۶

| Repository | تصمیم | طبقه‌بندی | وضعیت | نتیجه |
|---|---|---|---|---|
| `AgnesAI-Labs/AgnesAI-Models` | Add provider | `official_gateway` | فعال | مخزن رسمی با OpenAI-compatible API و Free/default plan؛ وارد Provider و Upstream شد |
| `Free-The-Ai/free-ai` | Watch | `community_gateway` | فعال | Provider موجود حفظ می‌شود؛ شفافیت Backend و Check-in روزانه باید پایش شود |
| `dsdanielpark/Bard-API` | Reject | `session_bridge` | Archived | Unofficial، reverse-engineered و Cookie-based |
| `SamurAIGPT/muapi-cli` | Reject | `client_tool` | فعال | CLI رسمی سرویس Credit/Top-up؛ API رایگان مستقل نیست |
| `SamurAIGPT/Text-To-Video-AI` | Reject | `self_hosted` | فعال | اپ محلی وابسته به چند API key و Premium API |
| `openbestof/awesome-ai` | Reject | `catalog_tooling` | غیرفعال | Awesome List عمومی؛ محدودیت Free Tier و وضعیت ایران را مدل نمی‌کند |
| `flatkey-ai/awesome-images` | Reject | `prompt_library` | فعال | Prompt library و CLI تجاری برای Flatkey API |

## اصلاح داده Agnes AI

ممیزی مستقیم `MODEL_CATALOG.md` نشان داد عدد `30 RPM` به‌تنهایی بیان دقیقی از ظرفیت قابل اجرا نیست. سند رسمی میان دو مقدار تفاوت می‌گذارد:

- Public Request RPM
- Actual Executable RPM

برای طرح Free/default:

| سطح | Public Request RPM | Actual Executable RPM |
|---|---:|---:|
| متن | ۳۰ | ۲۰ |
| تصویر 1K | ۳۰ | ۲۰ |
| تصویر 2K | ۲۰ | ۱۰ |
| تصویر 3K | ۲ | ۱ |
| تصویر 4K | ۱ | ۱ |
| ویدئو | ۲ | ۱ |

Catalog عدد قابل اجرای واقعی را در فیلد `rpm` ثبت می‌کند و مقدار Public Request را در توضیح نگه می‌دارد. این انتخاب از نمایش ظرفیت اسمی به‌عنوان ظرفیت عملی جلوگیری می‌کند.

همچنین ادعاهای زیر تا زمان وجود Evidence رسمی حذف یا خنثی شدند:

- نتیجه‌گیری درباره نبود تحریم یا امکان دسترسی از ایران
- احتمال بالای دسترسی صرفاً بر اساس محل استقرار
- نیاز نداشتن به کارت بانکی، وقتی منبع رسمی بررسی‌شده آن را تصریح نکرده است
- Context window ثابت در توضیح خلاصه، زیرا اسناد رسمی Agnes در این عدد drift دارند

## Validator

```bash
npm run validate:repo-audits
```

Validator موارد زیر را کنترل می‌کند:

- یکتا بودن Repositoryها و صحت `owner/name`
- تطابق URL با نام Repository
- Enumهای تصمیم، Scope، Classification، Risk و Auth surface
- وجود Evidence تاریخ‌دار
- الزام ارجاع Provider و Upstream برای `add_provider`
- الزام ثبت در Upstream برای `watch`
- جلوگیری از حضور Repositoryهای `reject` در Provider و Tools Catalog
- الزام Cookie یا Browser Session برای `session_bridge`
- الزام First-party evidence برای ادعای Free API تأییدشده

## مرز ایمنی

این ممیزی روش استخراج Cookie، دور زدن CAPTCHA، KYC، پرداخت، محدودیت منطقه‌ای یا Terms of Service را آموزش نمی‌دهد. Repositoryهای Session Bridge فقط از منظر Classification و Risk بررسی می‌شوند.
