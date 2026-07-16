# راهنمای تجزیه و تحلیل و معیارها — Awesome Free LLM APIs IR

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

## ابزار مورد استفاده

**Plausible Analytics** — کم‌حجم، بدون کوکی، حریم‌خصوصی‌محور

- دامنه: `plausible.alirezasafaei.dev`
- سایت: `llm.persiantoolbox.ir`
- روش: اسکریپت سمت کلاینت با ارسال رویداد به endpoint اختصاصی
- داده‌های جمع‌آوری‌شده: صفحات بازدیدشده، رویدادهای کلیک
- داده‌های جمع‌آوری‌نشده: IP کاربر، متن فرم‌ها، فینگرپرینت مرورگر، کوکی

## رویدادهای تعریف‌شده

| رویداد | دسته | توضیح |
|---|---|---|
| `page_view` | Navigation | بازدید صفحه (خودکار توسط Plausible) |
| `provider_page_view` | Navigation | کلیک روی لینک صفحه Provider |
| `guide_page_view` | Navigation | کلیک روی لینک صفحه Guide |
| `copy_base_url` | Interaction | کپی کردن Base URL از صفحه Provider |
| `provider_docs_click` | Outbound | کلیک روی لینک مستندات رسمی Provider |
| `provider_website_click` | Outbound | کلیک روی لینک وب‌سایت Provider |
| `github_click` | Outbound | کلیک روی لینک GitHub |

## پردازش داده‌ها

- داده‌ها فقط به صورت aggregate قابل مشاهده‌اند
- هیچ IP یا اطلاعات شناسایی ذخیره نمی‌شود
- رویدادها فقط شامل provider_id یا page_type هستند
- UTM parameters برای کمپین‌های خارجی استفاده می‌شوند

## داشبوردها

### داشبورد اصلی
- صفحات پربازدید
- Referrerهای برتر
- دستگاه‌ها و مرورگرها
- کشورها (به صورت aggregate)

### داشبورد محصول
- کلیک‌های مستندات Provider
- کپی Base URL
- کلیک GitHub
- بازدید صفحات Guide

## دسترسی

- فقط مالک پروژه به Plausible dashboard دسترسی دارد
- داده‌های خام قابل دانلود نیست
- API اختصاصی برای query داده وجود ندارد

## حفظ حریم خصوصی

- هیچ کوکی استفاده نمی‌شود
- Do Not Track رعایت می‌شود
- IP hashing انجام نمی‌شود (IP اصلاً ذخیره نمی‌شود)
- داده‌ها در سرور اختصاصی hosted می‌شوند
- گزارش هفتگی به صورت دستی تهیه می‌شود
