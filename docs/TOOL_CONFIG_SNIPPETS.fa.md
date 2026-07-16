# کانفیگ ابزارهای کدنویسی با APIهای رایگان

راهنمای گام‌به‌گام برای اتصال Claude Code، Cursor، Codex CLI، OpenCode، Hermes و OpenClaw به APIهای رایگان فهرست‌شده در این مخزن.

> API Keyها را در `.env` یا Variable Manager ذخیره کنید، نه در متن کانفیگ.

---

## Providerهای قابل استفاده (بدون تحریم ایران)

| سرویس | Base URL | Auth | RPM | نکته |
|---|---|---|---|---|
| OVHcloud AI Endpoints | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` | ناشناس / API Key | ۲ | بدون ثبت‌نام |
| Kilo Gateway | `https://api.kilo.ai/v1` | ناشناس / API Key | ۲۰۰ RPH | بدون ثبت‌نام |
| LLM7.io | `https://api.llm7.io/v1` | ناشناس / API Key | ۳۰ | بدون ثبت‌نام |
| GitHub Models | `https://models.inference.ai.azure.com` | Token | ۱۵ RPM | نیاز به اکانت GitHub |
| Hugging Face | `https://router.huggingface.co/hf-inference/v1` | HF Token | $0.1/month | نیاز به ثبت‌نام |
| Mistral AI | `https://api.mistral.ai/v1` | API Key | متغیر | ثبت‌نام رایگان |
| SambaNova Cloud | `https://api.sambanova.ai/v1` | API Key | ۲۰ RPM | ثبت‌نام |
| Cloudflare Workers AI | `https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1` | API Token | ۱۰K neurons/day | ثبت‌نام |
| Groq | `https://api.groq.com/openai/v1` | API Key | ۳۰ RPM | ثبت‌نام |

---

## Claude Code

Claude Code از `ANTHROPIC_BASE_URL` برای تغییر Backend پشتیبانی می‌کند.

### OpenRouter (برای مدل‌های Claude واقعی)

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
export ANTHROPIC_API_KEY=""
claude
```

### هر Provider OpenAI-compatible

```bash
# OVHcloud AI Endpoints (ناشناس، نیازی به کلید ندارد)
export ANTHROPIC_BASE_URL="https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"
export ANTHROPIC_AUTH_TOKEN="sk-no-key-required"
export ANTHROPIC_API_KEY=""
claude
```

---

## Cursor

Settings → Models → Add Model را باز کنید.

| فیلد | مقدار |
|---|---|
| Model name | `gpt-oss-20b` (یا مدل دلخواه) |
| Override OpenAI Base URL | `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` |
| OpenAI API Key | خالی بگذارید (برای OVHcloud) |

برای Providerهای نیازمند کلید:

```bash
# مثلاً برای Mistral AI
# Model name: mistral-small-latest
# Base URL: https://api.mistral.ai/v1
# API Key: <کلید خود>
```

---

## Codex CLI

Codex CLI از `OPENAI_BASE_URL` و `OPENAI_API_KEY` می‌خواند.

```bash
# OVHcloud AI Endpoints — بدون کلید
export OPENAI_BASE_URL="https://oai.endpoints.kepler.ai.cloud.ovh.net/v1"
export OPENAI_API_KEY="sk-no-key-required"
codex --model "gpt-oss-20b"

# Kilo Gateway — بدون کلید
export OPENAI_BASE_URL="https://api.kilo.ai/v1"
export OPENAI_API_KEY="sk-no-key-required"
codex --model "kilo-auto/free"

# LLM7.io — بدون کلید
export OPENAI_BASE_URL="https://api.llm7.io/v1"
export OPENAI_API_KEY="sk-no-key-required"
codex --model "gpt-4o-mini"
```

---

## OpenCode

OpenCode از `@ai-sdk/openai-compatible` برای Providerهای سفارشی پشتیبانی می‌کند.

ویرایش `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ovhcloud-free": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OVHcloud AI Endpoints",
      "options": {
        "baseURL": "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
        "apiKey": ""
      },
      "models": {
        "gpt-oss-20b": { "name": "gpt-oss-20b" }
      }
    },
    "kilo-gateway": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Kilo Gateway",
      "options": {
        "baseURL": "https://api.kilo.ai/v1",
        "apiKey": ""
      },
      "models": {
        "kilo-auto/free": { "name": "kilo-auto/free" }
      }
    },
    "llm7": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LLM7.io",
      "options": {
        "baseURL": "https://api.llm7.io/v1",
        "apiKey": ""
      },
      "models": {
        "gpt-4o-mini": { "name": "gpt-4o-mini" },
        "deepseek-r1-0528": { "name": "deepseek-r1-0528" }
      }
    }
  }
}
```

---

## Hermes

ویرایش `~/.config/hermes/config.yaml`:

```yaml
model:
  default: gpt-oss-20b
  provider: custom
  base_url: ${CUSTOM_BASE_URL}
  api_key: ${CUSTOM_API_KEY}
  model_aliases:
    gpt-oss-20b:
      model: "gpt-oss-20b"
      provider: "custom"
```

و `~/.config/hermes/.env`:

```env
# OVHcloud AI Endpoints (ناشناس)
CUSTOM_API_KEY=
CUSTOM_BASE_URL=https://oai.endpoints.kepler.ai.cloud.ovh.net/v1

# یا Kilo Gateway
# CUSTOM_API_KEY=
# CUSTOM_BASE_URL=https://api.kilo.ai/v1
```

---

## OpenClaw

ویرایش `~/.openclaw/openclaw.json`:

```json
{
  "models": {
    "providers": {
      "ovhcloud-free": {
        "baseUrl": "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
        "apiKey": "",
        "api": "openai-completions",
        "models": [
          { "id": "gpt-oss-20b", "name": "gpt-oss-20b" }
        ]
      }
    }
  }
}
```

---

## عیب‌یابی

| مشکل | راه‌حل |
|---|---|
| Rate limit (429) | Provider دیگری امتحان کنید یا چند ثانیه صبر کنید |
| Authentication error (401) | کلید API را بررسی کنید؛ برای ناشناس `sk-no-key-required` بگذارید |
| Connection timeout | احتمال مسدود بودن Provider از ایران — از VPN استفاده کنید |
| Model not found | نام مدل دقیق را از مستندات Provider بررسی کنید |

به‌روزرسانی: ۲۰۲۶-۰۷-۱۶
