# سیاست عدم انتشار جزئیات زیرساخت

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

موارد زیر نباید در Repository عمومی، Issue، Pull Request، Commit message، Release note یا گزارش عمومی قرار گیرند:

- IP کامل Production یا Management
- Username زیرساخت
- `user@host` یا `user@IP`
- SSH fingerprint و Known-host material
- Password، Token، API key یا Session
- مسیر فایل Credential
- URL مدیریتی خام که Authentication یا TLS مناسب ندارد
- Whitelist و Firewall allowlist واقعی

جایگزین‌های مجاز:

- `CANONICAL_HOST`
- `IRAN_MIRROR_HOST`
- `AUTOMATION_SOURCE`
- `LOCAL_ADMIN_SOURCE`
- SSH alias خصوصی
- GitHub Environment Secret یا Variable

جزئیات واقعی فقط در Secret Manager، SSH config محلی، Password Manager یا Inventory خصوصی نگهداری می‌شوند.
