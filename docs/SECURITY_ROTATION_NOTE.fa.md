# یادداشت امنیتی Bootstrap Analytics

آخرین بازبینی: ۲۰۲۶-۰۷-۱۶

یک Credential اولیهٔ Dashboard Analytics خارج از Repository در متن عملیاتی افشا شده است. مقدار افشاشده نباید برای ساخت یا نگهداری حساب استفاده شود و باید Compromised فرض شود.

اقدام الزامی مالک:

1. یک Password جدید و یکتا در Password Manager بسازد.
2. حساب مالک را فقط از مسیر امن HTTPS یا SSH tunnel ایجاد کند.
3. پس از ورود، Password را دوباره Rotate کند اگر Credential اولیه در هر مرحله استفاده شده باشد.
4. Registration عمومی را به `true` برای انسداد کامل یا `invite_only` برای دعوت کنترل‌شده محدود کند.
5. 2FA و Recovery code را فعال و خارج از Repository نگهداری کند.
6. Sessionهای فعال را Review و Session ناشناس را Revoke کند.

هیچ Credential، Email خصوصی، IP، URL مدیریتی خام یا Token در این سند ثبت نمی‌شود.
