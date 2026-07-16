# نقشهٔ راه پروژه

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

این سند منبع اصلی وضعیت و اولویت‌های پروژه است. علامت «تکمیل» فقط زمانی استفاده می‌شود که معیار پذیرش همان فاز در دادهٔ ماشین‌خوان، مستندات و CI برآورده شده باشد.

## وضعیت پایه

- ۲۲ Provider در Catalog اصلی
- ۸ ابزار، Proxy، Router و Session Bridge در Catalog مستقل
- ۱۴ Repository در Upstream Monitor
- ۷ ممیزی Repository با تصمیم ماشین‌خوان Add / Watch / Reject
- ۹ Provider با درخواست مستقیم موفق از ایران
- ۵ Provider با مسدودیت جغرافیایی تأییدشده
- ۱ Provider با عدم پشتیبانی رسمی ایران
- ۷ Provider با وضعیت دسترسی ایران نامشخص

## P0 — یکپارچگی قرارداد داده

وضعیت: **در حال تثبیت**

کارهای لازم:

- هم‌راستا نگه‌داشتن `schema/provider.schema.json` و Validator اجرایی
- رد کردن فیلدهای ناشناخته به‌جای عبور خاموش از CI
- الزام هم‌زمان منبع و کد HTTP برای اعتبارسنجی Credential
- الزام `live_verified` و تاریخ به‌روز برای Provider دارای Evidence زنده
- جلوگیری از قدیمی‌شدن `catalog.json`، `data.json` و جدول Generated README
- حفظ حالت سه‌گانهٔ نیاز به پرداخت: `true / false / null`

معیار خروج:

- `npm test` سبز
- صفر اختلاف میان Schema عمومی و دادهٔ Canonical
- صفر Provider دارای Evidence زنده با Verification قدیمی

## P0 — راستی‌آزمایی ایران

وضعیت: **بخشی تکمیل شده**

انجام‌شده:

- تست مستقیم روی شبکه ثابت ایران
- تست مستقیم روی اینترنت موبایل MCI
- اعتبارسنجی چند Credential از خروجی آلمان برای تفکیک کلید نامعتبر از Geo-block
- تست ۳ سرویس ناشناس (kilo-gateway, ovhcloud-ai-endpoints, llm7-io) از ایران
- به‌روزرسانی مستندات با نتایج واقعی

باقی‌مانده:

- دریافت Credential مجاز برای ۱۰ Provider باقی‌مانده
- اجرای ماتریس VPN مستقل برای Providerهایی که ارزش عملی دارد
- ثبت جداگانهٔ `route=vpn` و `exit_country`
- عدم تعمیم نتیجهٔ یک ISP یا یک حساب به همه کاربران ایران

نکته: اعتبارسنجی Credential از VPN به معنی تکمیل تست VPN همه Providerها نیست.

## P1 — کیفیت Provider Catalog

وضعیت: **فعال**

- بازبینی دوره‌ای محدودیت‌ها، مدل‌ها، نیاز به کارت و شرایط ثبت‌نام
- اولویت با Providerهای دارای مستند رسمی و Endpoint عمومی
- بررسی ویژهٔ Providerهای جدید و ۱۰ وضعیت ایران نامشخص
- نگه‌داشتن Trial، Credit و Free Models به‌عنوان مفاهیم جدا
- حذف ادعاهای زمان‌دار یا منطقه‌ای بدون منبع رسمی تازه

## P1 — Repository Audit و Upstream Watch

وضعیت: **زیرساخت تکمیل، عملیات مستمر**

- پایش SHA فایل‌های حساس در Upstreamها
- ثبت تصمیم Add / Watch / Reject در `data/repository-audits.json`
- جلوگیری از ورود Catalog، Prompt Library، Client Tool و Session Bridge به Provider Catalog
- بازبینی انسانی قبل از هر تغییر Canonical

## P1 — Tools Catalog

وضعیت: **نسخه اول تکمیل، توسعه ادامه دارد**

- Schema و Validator مستقل
- هشدار Credential، Cookie، OAuth، HAR و Browser Session
- عدم نمایش Tools در Advisor پیش‌فرض Providerها
- مرحله بعد: نمایش مستقل در وب‌سایت و افزودن دادهٔ نگهداری/Release قابل بازتولید

## P2 — بنچمارک فارسی

وضعیت: **نسخه پایه آماده**

- گسترش Dataset نسخه‌دار
- افزایش پوشش نگارش، Reasoning، JSON و درک متن فارسی
- انتشار نتیجه فقط برای Run کامل و قابل بازتولید
- جلوگیری از مقایسه مدل‌ها با تنظیمات یا مسیرهای شبکه متفاوت

## P2 — وب‌سایت و جامعه

وضعیت: **فعال**

- نمایش واضح Source، تاریخ، نوع سرویس و وضعیت Evidence
- صفحه مستقل Tools و Repository Audits
- RSS/JSON برای تغییرات مهم Catalog
- قالب مشارکت برای گزارش محدودیت و دسترسی ایران
- مستند انگلیسی هم‌تراز با مستند فارسی

## ترتیب اجرای فعلی

1. تثبیت قرارداد Provider و Metadata تست زنده
2. رفع ادعاهای متناقض یا بدون منبع در Providerهای موجود
3. تکمیل Evidence Providerهای نامشخص از ایران
4. بازبینی Providerهای جدید با First-party evidence
5. توسعه رابط Tools/Audits و بنچمارک فارسی
