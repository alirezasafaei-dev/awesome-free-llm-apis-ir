# Personalized Outreach Packet

Outreach یک انتشار عمومی واحد نیست و Launch ID ثابت ندارد. هر گیرنده Task، Draft، Approval و Evidence مستقل دارد.

## Rules

- یک گیرنده در هر Approval
- بدون Scraping ایمیل، خرید List، BCC یا Bulk send
- بدون Copy/Paste یکسان برای چند گیرنده
- بدون Follow-up خودکار
- بدون درخواست Backlink، Vote یا Promotion تضمینی
- دلیل ارتباط باید مشخص، واقعی و قابل‌بررسی باشد
- اگر روش تماس عمومی و مناسب وجود ندارد، پیام ارسال نشود

## Candidate research form

```text
RECIPIENT_NAME=
ORGANIZATION_OR_PROJECT=
PUBLIC_CONTACT_CHANNEL=
SOURCE_URL=
RELEVANT_SECTION_OR_AUDIENCE=
SPECIFIC_REASON_FOR_CONTACT=
REQUEST_TYPE=FEEDBACK|CONTRIBUTION_FIT|EDITORIAL_REVIEW|COMMUNITY_PERMISSION
CONFLICT_OF_INTEREST=
PRIVACY_CHECK=PASS|FAIL
DECISION=DRAFT|DEFER
```

## English template

Hi [Name],

I maintain an open, machine-readable catalog of free LLM APIs. It separates permanent free tiers, trials, credits and free models, and also tracks documented quotas, payment requirements, OpenAI compatibility and dated regional-access evidence.

I reviewed [specific project/article/newsletter] and thought the resource might be relevant to [specific section or audience] because [one concrete reason]. I am not asking for a guaranteed placement or coordinated promotion; I would appreciate your assessment of whether it meets your contribution or editorial criteria.

Website: https://llm.persiantoolbox.ir/
Repository: https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

Relevant difference: [specific, evidence-backed distinction]

Thanks for your time.

## Persian template

سلام [نام]،

یک فهرست متن‌باز و ماشین‌خوان از APIهای رایگان LLM نگهداری می‌کنیم که Free Tier دائمی، Trial، Credit، محدودیت‌ها، نیاز به پرداخت، سازگاری OpenAI و شواهد تاریخ‌دار دسترسی را جداگانه ثبت می‌کند.

[پروژه/مقاله/خبرنامه مشخص] را بررسی کردم و به‌نظر می‌رسد این منبع ممکن است برای [بخش یا مخاطب مشخص] مفید باشد، چون [یک دلیل واقعی و شخصی‌سازی‌شده]. هدف درخواست معرفی تضمینی یا تبلیغ هماهنگ نیست؛ فقط می‌خواهم بدانم آیا پروژه با معیارهای مشارکت یا بررسی شما تطابق دارد.

سایت: https://llm.persiantoolbox.ir/
GitHub: https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir

تفاوت مرتبط: [یک تفاوت مشخص و مستند]

ممنون از وقتی که می‌گذارید.

## Hermes workflow

1. Candidate را فقط از منبع عمومی مرتبط انتخاب کن.
2. Research form را کامل کن.
3. متن را با دلیل واقعی شخصی‌سازی کن.
4. Recipient، Channel، Subject و Body را Preview کن.
5. قبل از `Send` متوقف شو.
6. Approval دقیق `APPROVE OUTREACH TO <name> VIA <channel>` بگیر.
7. فقط همان یک پیام را ارسال کن.
8. Result را بدون Address خصوصی، Header یا PII ثبت کن.
9. Follow-up فقط با درخواست و Approval مستقل انجام شود.

## Stop conditions

- دلیل ارتباط عمومی و مبهم است.
- Contact از Scraping یا منبع غیرمجاز آمده است.
- پیام درخواست لینک، رأی یا انتشار تضمینی دارد.
- متن برای گیرنده دیگری تکرار شده است.
- گیرنده قبلاً عدم تمایل نشان داده است.

## Evidence

```text
RECIPIENT_DISPLAY_NAME=
ORGANIZATION_OR_PROJECT=
CONTACT_CHANNEL=
PUBLIC_SOURCE_URL=
SPECIFIC_REASON=
APPROVAL_RECEIVED=
SENT_AT_UTC=
PUBLIC_RESULT_URL=
RESPONSE_STATUS=NO_RESPONSE|REPLIED|DECLINED|INTERESTED
FOLLOW_UP_ALLOWED=YES|NO
NOTES=
```

اگر نتیجه Public URL ندارد، آن را در جدول انتشار عمومی Launch Log ثبت نکن. فقط Decision log یا گزارش محلی بدون PII استفاده شود.
