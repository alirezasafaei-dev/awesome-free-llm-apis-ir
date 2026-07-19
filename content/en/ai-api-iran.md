---
title: "AI API Iran: 9 Free LLM APIs Verified Working From Iran in 2026"
slug: "en-ai-api-iran"
translation_key: "ai-api-iran"
description: "Complete guide to free AI APIs that work from Iran in 2026. 9 providers verified with direct Iran access. Cloudflare, Mistral, GitHub Models, and more. No credit card needed."
primary_keyword: "AI API Iran"
secondary_keywords:
  - "free AI API Iran"
  - "LLM API Iran"
  - "AI API accessible from Iran"
  - "free API Iran no VPN"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-ai-api-iran/"
updated_at: "2026-07-19"
status: "READY_FOR_SITE"
---

# AI API Iran: 9 Free LLM APIs Verified Working From Iran in 2026

**Quick answer:** 9 out of 22 free LLM API providers in this catalog are verified working from Iran with direct access (no VPN required): Cloudflare Workers AI, GitHub Models, Hugging Face, Kilo Gateway, LLM7.io, Mistral AI, OpenCode Zen, OVHcloud AI Endpoints, and SambaNova Cloud.

For the most current status, visit the [live catalog](https://llm.persiantoolbox.ir/).

## Direct Iran Access Providers

These providers have been tested and confirmed working from inside Iran:

| Provider | Service Type | Free Type | Rate Limit | OpenAI-Compatible |
|---|---|---|---|---|
| Cloudflare Workers AI | Official Gateway | Free quota | 10,000 neurons/day | ✅ |
| GitHub Models | Official Gateway | Free quota | 150 RPD | ✅ |
| Hugging Face | Official Gateway | $0.10/month credit | Model-dependent | ✅ |
| Kilo Gateway | Official Gateway | Free models | 200 RPH | ✅ |
| LLM7.io | Community Gateway | Free models | 30 RPM (anon) | ✅ |
| Mistral AI | Official Provider | Free quota | Model-dependent | ✅ |
| OpenCode Zen | Official Gateway | Free models | Model-dependent | ✅ |
| OVHcloud AI Endpoints | Official Gateway | Free models | 2 RPM | ✅ |
| SambaNova Cloud | Official Gateway | Free quota | 20 RPD | ✅ |

## Blocked or Restricted Providers

These providers are not accessible from Iran:

| Provider | Status | Details |
|---|---|---|
| Aion Labs | ⛔ Blocked | — |
| Cerebras | ⛔ Blocked | — |
| Cohere | ⛔ Blocked | — |
| Google Gemini | 🚫 Not supported officially | May work intermittently |
| Groq | ⛔ Blocked | — |
| OpenRouter | ⛔ Blocked | — |
| ModelScope | 🧾 Signup blocked | API endpoint reachable |
| SiliconFlow | 🧾 Signup blocked | China identity verification |

5 providers have **unknown** Iran access status and need further testing.

## Getting Started with AI APIs from Iran

### Step 1: Choose a Provider

For Persian users, we recommend starting with:
- **Cloudflare Workers AI**: Best overall for Iran, no credit card, 10K neurons/day
- **GitHub Models**: Access to GPT-4o-mini, 150 RPD, GitHub account only
- **Mistral AI**: Strong Persian language support, direct access

### Step 2: Sign Up and Get an API Key

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=os.environ["BASE_URL"],
)

response = client.chat.completions.create(
    model="MODEL_ID",
    messages=[{"role": "user", "content": "Hello from Iran!"}],
)
print(response.choices[0].message.content)
```

### Step 3: Test Connectivity

Before building your full application, test with a simple request. If you encounter errors, check:
- The provider's `iran_access` status in the catalog
- Whether your API key is active
- Whether you've exceeded rate limits

## Iran Access Status Guide

| Status | Meaning |
|---|---|
| ✅ Direct tested | Proven working with Iran IP, no VPN |
| 🛡️ VPN tested | Works through authorized VPN |
| ⛔ Blocked | Confirmed not accessible |
| 🧾 Signup blocked | API reachable but signup requires foreign ID |
| ❔ Unknown | Insufficient evidence |
| 🚫 Not supported officially | Provider policy excludes Iran |

## Best AI APIs for Persian Language Tasks

For Persian/Farsi text generation, these providers perform well:
- **Mistral AI**: Excellent multilingual capabilities
- **SambaNova Cloud**: Verified Iran access, 20 RPD
- **Cloudflare Workers AI**: Multiple models, generous quota

## Frequently Asked Questions

### How many free AI APIs work from Iran in 2026?

9 out of 22 providers are verified working from Iran with direct access. An additional 2 work through VPN. 5 have unknown status requiring further testing.

### Do I need a VPN to use AI APIs from Iran?

Not for the 9 direct-access providers listed above. These have been tested and confirmed working with Iran IP addresses. However, Groq, OpenRouter, and Aion Labs require VPN access.

### Which free AI API from Iran has the highest rate limits?

GitHub Models offers 150 requests per day with access to GPT-4o-mini. Cloudflare Workers AI provides 10,000 neurons/day across multiple models. Kilo Gateway allows 200 requests per hour.

### Are there any Iranian AI APIs available?

This catalog focuses on international providers accessible from Iran. If you know of an Iranian AI API provider with a public free API, please submit an issue.

### Can I use these APIs for Persian chatbots?

Yes. Mistral AI, GitHub Models, and SambaNova Cloud all support Persian language chat. Use the OpenAI-compatible SDK with any of these providers.

## Help Improve the Data

If you test a provider from Iran, [submit a sanitized Iran Access Report](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml). Include the test date, provider, and result — never include API keys, cookies, or personal information.

Browse the complete [catalog](https://llm.persiantoolbox.ir/) for the latest status of all 22 providers.
