# کانفیگ ابزارهای کدنویسی با APIهای رایگان

این راهنما روش اتصال Claude Code، Cursor، Codex CLI، OpenCode، Hermes و OpenClaw به APIهای سازگار با OpenAI را نشان می‌دهد.

> وضعیت سهمیه، مدل و دسترسی ایران را همیشه از Catalog و صفحهٔ اختصاصی Provider بررسی کنید. بازشدن Endpoint یا وجود نمونه‌کانفیگ، موفقیت ثبت‌نام یا استنتاج را تضمین نمی‌کند.

> کلید واقعی را فقط در Secret Manager یا فایل محلی خارج از Git نگه دارید. در مستندات، Issue، PR، Log و Screenshot هیچ بخش، Prefix یا Hash از کلید را منتشر نکنید.

---

## مقادیر موردنیاز

برای هر Provider این سه مقدار را از مستندات رسمی بردارید:

```bash
export LLM_BASE_URL="https://provider.example/v1"
export LLM_API_KEY="YOUR_API_KEY"
export LLM_MODEL="EXACT_MODEL_ID"
```

برای Endpointهای واقعاً بدون احراز هویت، اگر ابزار مقدار غیرخالی می‌خواهد از Placeholder خنثی زیر استفاده کنید:

```bash
export LLM_API_KEY="NO_API_KEY_REQUIRED"
```

این مقدار کلید نیست و نباید با Prefix هیچ Provider واقعی ساخته شود.

---

## Claude Code

Claude Code از `ANTHROPIC_BASE_URL` و متغیرهای Auth سفارشی پشتیبانی می‌کند.

```bash
export ANTHROPIC_BASE_URL="$LLM_BASE_URL"
export ANTHROPIC_AUTH_TOKEN="$LLM_API_KEY"
export ANTHROPIC_API_KEY=""
claude
```

برای Providerهای ناشناس که ابزار مقدار Auth می‌خواهد:

```bash
export ANTHROPIC_BASE_URL="$LLM_BASE_URL"
export ANTHROPIC_AUTH_TOKEN="NO_API_KEY_REQUIRED"
export ANTHROPIC_API_KEY=""
claude
```

---

## Cursor

مسیر زیر را باز کنید:

```text
Settings → Models → Add Model
```

| فیلد | مقدار |
|---|---|
| Model name | مقدار دقیق `LLM_MODEL` |
| Override OpenAI Base URL | مقدار `LLM_BASE_URL` |
| OpenAI API Key | مقدار واقعی `LLM_API_KEY` یا خالی برای Endpoint ناشناس |

کلید را داخل فایل پروژه، Screenshot یا پیام پشتیبانی قرار ندهید.

---

## Codex CLI

```bash
export OPENAI_BASE_URL="$LLM_BASE_URL"
export OPENAI_API_KEY="$LLM_API_KEY"
codex --model "$LLM_MODEL"
```

برای Endpoint ناشناس:

```bash
export OPENAI_BASE_URL="$LLM_BASE_URL"
export OPENAI_API_KEY="NO_API_KEY_REQUIRED"
codex --model "$LLM_MODEL"
```

---

## OpenCode

فایل `~/.config/opencode/opencode.json` را با مقادیر واقعی محلی تنظیم کنید:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "custom-free-provider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Custom OpenAI-Compatible Provider",
      "options": {
        "baseURL": "https://provider.example/v1",
        "apiKey": "YOUR_API_KEY"
      },
      "models": {
        "EXACT_MODEL_ID": {
          "name": "EXACT_MODEL_ID"
        }
      }
    }
  }
}
```

برای جلوگیری از ذخیره کلید در JSON، در صورت پشتیبانی نسخهٔ نصب‌شده از متغیر محیطی استفاده کنید.

---

## Hermes

فایل `~/.config/hermes/config.yaml`:

```yaml
model:
  default: EXACT_MODEL_ID
  provider: custom
  base_url: ${CUSTOM_BASE_URL}
  api_key: ${CUSTOM_API_KEY}
  model_aliases:
    EXACT_MODEL_ID:
      model: "EXACT_MODEL_ID"
      provider: "custom"
```

فایل محلی `~/.config/hermes/.env`:

```env
CUSTOM_API_KEY=YOUR_API_KEY
CUSTOM_BASE_URL=https://provider.example/v1
```

مجوز فایل را محدود کنید:

```bash
chmod 600 ~/.config/hermes/.env
```

---

## OpenClaw

فایل `~/.openclaw/openclaw.json`:

```json
{
  "models": {
    "providers": {
      "custom-free-provider": {
        "baseUrl": "https://provider.example/v1",
        "apiKey": "YOUR_API_KEY",
        "api": "openai-completions",
        "models": [
          {
            "id": "EXACT_MODEL_ID",
            "name": "EXACT_MODEL_ID"
          }
        ]
      }
    }
  }
}
```

اگر ابزار از Environment Variable پشتیبانی می‌کند، کلید را از JSON خارج کنید.

---

## تست حداقلی قبل از اتصال ابزار

ابتدا با `curl` وضعیت Credential، Base URL و Model ID را جداگانه بررسی کنید:

```bash
curl --fail-with-body --silent --show-error \
  "$LLM_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "EXACT_MODEL_ID",
    "messages": [{"role": "user", "content": "Reply with OK"}],
    "max_tokens": 8
  }'
```

هیچ Header، Response body دارای اطلاعات حساب یا دستور Shell حاوی کلید را در گزارش عمومی Paste نکنید.

---

## عیب‌یابی

| وضعیت | اقدام |
|---|---|
| `401` | وجود Header، کلید معتبر و Base URL را بررسی کنید |
| `403` | مانع حساب، سیاست منطقه، Billing و مجوز مدل را جداگانه بررسی کنید |
| `404` | مسیر Endpoint و شناسهٔ دقیق مدل را از مستندات رسمی بردارید |
| `429` | RPM/RPD/TPM و محدودیت مدل یا حساب را بررسی کنید |
| Timeout | DNS، TLS، Route و Firewall را جدا از وضعیت حساب آزمایش کنید |
| HTML به‌جای JSON | احتمالاً URL صفحهٔ وب را به‌جای API Endpoint وارد کرده‌اید |

برای نتیجه‌گیری منطقه‌ای، همان Credential، Model، Endpoint، Payload، Timeout و Output limit را از مسیر مستقیم ایران و کنترل مستقیم خارجی مقایسه کنید.

به‌روزرسانی: ۲۰۲۶-۰۷-۲۱
