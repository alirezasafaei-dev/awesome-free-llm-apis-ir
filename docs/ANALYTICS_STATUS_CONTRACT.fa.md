# قرارداد وضعیت Analytics

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

وضعیت Analytics فقط با شواهد متناسب اعلام می‌شود:

| وضعیت | معنی |
|---|---|
| `not_configured` | Site هنوز در Dashboard ثبت نشده است |
| `network_reachable_event_dropped` | Endpoint پاسخ می‌دهد اما Event به‌صراحت Drop می‌شود |
| `event_network_reachable_dashboard_pending` | Event Drop نشده، اما Dashboard هنوز بررسی نشده است |
| `event_network_verified_dashboard_blocked` | شبکه و پاسخ Event معتبر است، ولی دسترسی مالک به Dashboard در دسترس نیست |
| `verified` | Pageview و حداقل یک Custom Event در Dashboard مشاهده شده است |

قواعد:

- HTTP 2xx به‌تنهایی موفقیت ثبت Event را ثابت نمی‌کند.
- `x-plausible-dropped: 1` یا هر علامت معادل به معنی ثبت‌نشدن Event است.
- وجود فایل Tracker فقط دریافت JavaScript را ثابت می‌کند.
- Home، Provider و Guide باید مسیر صحیح Root tracker را بارگذاری کنند.
- وضعیت آینه ایران از Canonical جداست؛ Analytics روی آینه عمداً ذخیره نمی‌شود.
