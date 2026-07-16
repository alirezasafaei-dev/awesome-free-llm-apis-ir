# تحویل مرحله مالک Analytics

مالک پس از دریافت دسترسی امن Dashboard باید:

1. با Password جدید و یکتا حساب را ایجاد یا اصلاح کند.
2. دامنه Canonical را اضافه کند.
3. Registration را ببندد.
4. 2FA را فعال کند.
5. یک Pageview و یک Custom Event را در Dashboard تأیید کند.
6. نتیجه را بدون Credential، IP یا URL مدیریتی خام در Issue #42 ثبت کند.

تا قبل از تکمیل موارد بالا، وضعیت نهایی Analytics برابر `network_reachable_event_dropped` یا `dashboard_pending` است، نه `verified`.
