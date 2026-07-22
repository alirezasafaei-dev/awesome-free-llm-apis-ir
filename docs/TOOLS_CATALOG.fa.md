# کاتالوگ مستقل ابزارها، Proxyها و Session Bridgeها

این سند راهنمای کاتالوگ جداگانه‌ای است که برای ابزارهای غیر-Provider طراحی شده. این ابزارها به‌جای ارائهٔ مستقیم API، به عنوان واسط، مسیریاب یا پل Session عمل می‌کنند.

## چرا جداگانه؟

- **شفافیت**: Providerهای رسمی و Gatewayهای قابل اتکا با ابزارهای پرریسک و ناپایدار مخلوط نمی‌شوند.
- **امنیت**: ابزارهایی که نیاز به Cookie، HAR یا Session مرورگر دارند، هشدارهای امنیتی جداگانه دریافت می‌کنند.
- **پایداری**: ابزارها عموماً ناپایدارتر از APIهای رسمی هستند و نرخ بروزرسانی متفاوتی نیاز دارند.
- **Advisor**: این ابزارها در Advisor پیش‌فرض سایت حضور ندارند و کاربر باید آگاهانه آن‌ها را انتخاب کند.

## ساختار

کاتالوگ ابزارها با ساختار JSON مستقل در `catalog-tools.json` ذخیره می‌شود.

### فیلدهای کلیدی

| فیلد | توضیح |
|---|---|
| `tool_type` | `proxy`, `session_bridge`, `router`, `monitoring_companion`, `aggregator` |
| `deployment.type` | `local`, `self_hosted`, `hosted` |
| `auth_surface.type` | `api_key`, `oauth`, `cookie`, `har`, `browser_session`, `none` |
| `credential_storage` | `env_file`, `config_file`, `browser_local`, `memory_only`, `none` |
| `risk.terms` | ریسک نقض Terms of Service: `low`, `medium`, `high`, `critical` |
| `risk.stability` | `stable`, `volatile`, `experimental`, `archived` |
| `risk.credential_safety` | `safe`, `moderate`, `risky`, `dangerous` |

## هشدارها

### ابزارهای مبتنی بر Cookie/Session

ابزارهایی مانند `gpt4free` و `token-free-gateway` از Cookie مرورگر یا Session کاربری استفاده می‌کنند. این روش:

- **Terms Providerها را نقض می‌کند** — استفاده از Cookie بدون مجوز، خلاف شرایط استفاده است.
- **ناپایدار است** — Cookieها منقضی می‌شوند و پس از logout کاربر از کار می‌افتند.
- **می‌تواند منجر به مسدودیت حساب شود** — Providerها ممکن است دسترسی از طریق Cookie را شناسایی و مسدود کنند.

### ابزارهای دارای کلید اشتراکی

برخی ابزارها از Pool کلیدهای API اشتراکی استفاده می‌کنند. این کلیدها:
- ممکن است توسط Provider مسدود شوند
- محدودیت Rate limit دارند
- امنیت چندانی ندارند

## ابزارهای فاز اول

| ابزار | نوع | Risk Terms | Risk Stability | ایران |
|---|---|---|---|---|
| FreeLLMAPI | proxy | متوسط | نوسانی | نامشخص |
| gpt4free | session_bridge | بالا | نوسانی | نیازمند تنظیمات |
| Token Free Gateway | session_bridge | بالا | نوسانی | نامشخص |
| CLIProxyAPI | session_bridge | متوسط | آزمایشی | نامشخص |
| FreeLLMPool | aggregator | متوسط | نوسانی | نامشخص |
| Free-Way | router | متوسط | آزمایشی | نامشخص |
| g4f-working | monitoring_companion | پایین | نوسانی | سازگار |

## ارتباط با Upstream Watch

منبع اصلی کشف ابزارها، پایش هفتگی مخازن بالادستی (`data/upstreams.json`) است. تغییرات در این مخازن به‌صورت خودکار رصد می‌شود اما **هیچ ابزاری بدون بازبینی انسانی وارد کاتالوگ نمی‌شود**.

## اجرای محلی

```bash
# اعتبارسنجی
npm run validate:tools

# تولید کاتالوگ
npm run generate:tools

# تست‌های طبقه‌بندی
npm run tools:test
```

## Schema

```bash
schema/tool.schema.json
```

Schema با `additionalProperties: false` از ساختار دقیق اطمینان می‌دهد.
