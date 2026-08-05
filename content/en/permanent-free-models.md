---
title: "Permanent Free Models in LLM APIs: What to Trust"
slug: "en-permanent-free-models"
translation_key: "permanent-free-models"
description: "Guide to identifying and comparing permanently free models in LLM APIs; covering provider policy stability, open source models, and long-term project selection."
primary_keyword: "en permanent free models"
canonical_target: "https://llm.persiantoolbox.ir/guides/en-permanent-free-models/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---


# Permanent Free Models in LLM APIs: What to Trust

**Quick answer:** Some providers keep base models permanently free (e.g., Llama, Mistral, Gemma). But "permanently free" doesn't mean "unchanging policy." Evaluate official policy, change history, quotas, and migration capability.

## What Does "Permanently Free" Mean?

### 1. Open Source Models
Models like Llama, Mistral, and Gemma are open source. Anyone can run them on their own servers. The provider's hosted API may be free, but running locally requires hardware.

### 2. Free Base Models in API
Some providers keep base models (smaller, simpler) free in their API:
- Usually Llama-3.1-8B, Mistral-7B, Gemma-2-9B
- Larger models are paid
- Free tier usually has RPM/RPD quota

### 3. Paid Models with Free Quota
Some providers offer advanced models with limited free quota:
- Usually monthly or daily limit
- Pay-per-use after quota expires

## Stability Evaluation Criteria

### Provider Policy History
- Has the provider changed free tier before?
- Were changes announced in advance?
- Are previously free models still free?

### Model Type
- **Open Source:** Most stable option
- **Proprietary free:** Depends on provider policy
- **Paid with free quota:** Least stable

### Migration Capability
- Can you quickly switch to another provider?
- Is the project architecture OpenAI-compatible?
- Is Base URL configurable?

## Comparison of Permanently Free Models

### Llama (Meta) - Open Source
- **API free:** Available on Groq, Together, and others
- **Stability:** High (open source model)

### Mistral - Open Source
- **API free:** Available on Mistral, Groq, and others
- **Stability:** High (open source model)

### Gemma (Google) - Open Source
- **API free:** Available on Google AI Studio
- **Stability:** High (open source model)

## Practical Tips

For long-term projects, prefer open source models. Even if all APIs change, the models remain runnable. Ollama and llama.cpp make local execution simple.

For quick starts, begin with a provider's free tier and maintain migration capability.

## Provider Free Tier Comparison

The following table compares permanent free tier quotas across major providers. Use the [live catalog](https://llm.persiantoolbox.ir/) for the most current data, as quotas change frequently.

| Provider | Free Models | RPM | RPD | Credit Card | OpenAI Compatible |
|---|---|---|---|---|---|
| Groq | Llama 3.1 8B, Mixtral 8x7B | 30 | 14400 | No | Yes |
| Mistral | Mistral 7B, Codestral | 1 | unknown | No | Yes |
| Google AI Studio | Gemma 2 9B, Gemini 1.5 Flash | 15 | 1500 | No | No |
| Together AI | Llama 3.1 8B, Mistral 7B | 20 | unknown | Yes ($1 credit) | Yes |
| Cerebras | Llama 3.1 8B, 70B | 30 | 14400 | No | Yes |

## Testing Model Availability

```bash
#!/bin/bash
# Test which free models are available on a provider
curl -s "$BASE_URL/models" \
  -H "Authorization: Bearer $API_KEY" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
models = data.get('data', [])
free_keywords = ['llama', 'mistral', 'gemma', 'mixtral']
for m in models:
    mid = m['id'].lower()
    if any(k in mid for k in free_keywords):
        print(f\"  {m['id']}\")
print(f'Total models listed: {len(models)}')
"
```

For a complete catalog of providers with verified access status, visit the [Free LLM API catalog](https://llm.persiantoolbox.ir/). For source files and issue reporting, see the [GitHub repository](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir).
