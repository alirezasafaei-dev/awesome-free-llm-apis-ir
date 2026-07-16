# سیاست یکسانی Revision در Production

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

Production فقط زمانی Current محسوب می‌شود که:

- `main` SHA مشخص باشد؛
- `build-meta.json` دامنه Canonical همان SHA را نشان دهد؛
- `build-meta.json` آینه ایران همان SHA را نشان دهد؛
- هر دو مقدار از یک Artifact Build تولید شده باشند؛
- Health check پس از انتشار موفق باشد.

اگر `main` از Revision هر دو سرور جلوتر باشد، وضعیت باید `deployment_drift` ثبت شود؛ حتی اگر HTTP 200، TLS و محتوای ظاهری سالم باشند.

هیچ گزارش نهایی نباید عبارت «end-to-end complete» را در شرایط زیر استفاده کند:

- Revision سرورها با `main` یکسان نیست؛
- Event Analytics Drop می‌شود؛
- Dashboard Analytics تأیید نشده است؛
- Lighthouse و Social assets جزو معیار پذیرش هستند اما اجرا نشده‌اند.
