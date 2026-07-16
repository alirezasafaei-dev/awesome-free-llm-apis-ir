# یادداشت Sanitized رخداد Bootstrap Analytics

در جریان Bootstrap، یک Credential اولیه و یک URL مدیریتی خام در کانال عملیاتی غیرعمومی مشاهده شد. مقدار Credential در Repository ثبت نشده است، اما باید Compromised فرض شود.

اقدامات:

- Credential اولیه استفاده نشود یا فوراً Rotate شود.
- Dashboard از IP عمومی و HTTP خام ارائه نشود.
- Registration پس از ساخت حساب مالک بسته شود.
- 2FA فعال شود.
- Endpoint داخلی فقط روی Loopback یا Network خصوصی Bind شود.
- هیچ مقدار واقعی در Issue یا Commit message درج نشود.

این یادداشت عمداً فاقد Password، Email، IP، Port عمومی و URL مدیریتی واقعی است.
