---
title: "Free Tier vs Trial vs Credit: Understanding AI API Pricing"
slug: "en-free-tier-trial-credit"
translation_key: "free-tier-trial-credit"
description: "Explain the difference between permanent free tiers, time-limited trials, and free credits in LLM APIs; including evaluation criteria, risks, and selection guidance."
primary_keyword: "en free tier trial credit"
canonical_target: "https://llm.persiantoolbox.ir/guides/en-free-tier-trial-credit/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---


# Free Tier vs Trial vs Credit: Understanding AI API Pricing

**Quick answer:** Free Tier is a permanent free quota available until the provider changes its policy. Trial is a limited testing period with fixed time or credit. Free credit is a monetary balance that stops working once exhausted. These differences directly affect project stability.

## What is Free Tier?

Free Tier is a quota providers offer permanently (until announced otherwise):
- Fixed RPM/RPD (e.g., 20 requests/minute, 1000/day)
- Fixed token quota (e.g., 50K input tokens/day)
- Base models only (advanced models are paid)

**Advantage:** Long-term stability.
**Risk:** Provider can change policy, usually with notice.

## What is Trial?

Trial is a limited testing period:
- Time-based (e.g., 14 or 30 days free)
- Credit-based (e.g., $5 free credit)
- Feature-based (full access for limited time)

**Advantage:** Test all features before purchasing.
**Risk:** Service stops after the period ends.

## What is Free Credit?

Some services offer monetary credit:
- Signup credit (e.g., $10 on registration)
- Monthly credit (e.g., $5 per month)
- Referral credit

**Advantage:** Access to all models.
**Risk:** Unpredictable consumption.

## Comparison Table

| Feature | Free Tier | Trial | Credit |
|---|---|---|---|
| Duration | Permanent | Limited | Until exhausted |
| Models | Usually limited | Full | Full |
| Predictable | Yes | No | No |
| Suitable for long-term | Yes | No | Depends |
| Requires credit card | Usually no | Yes | Yes |

## Evaluation Criteria

1. **Is the quota real?** Some free tiers are too small to be useful
2. **Requires credit card?** Important for Iranian users
3. **Policy change history?** How has the provider handled changes before?
4. **Iran access?** Network, signup, key, and inference checked separately

## Summary

For new projects, start with a real Free Tier with sufficient quota. Use Trial only for evaluation. Treat free credit as a bonus, not a foundation.

## Checking Your Credit Balance

```python
import os
import requests

# Check remaining credit on a provider
api_key = os.environ["YOUR_API_KEY"]
base_url = "https://api.groq.com/openai/v1"

# Most providers expose usage via a dashboard API
# This example checks available models to confirm access
response = requests.get(
    f"{base_url}/models",
    headers={"Authorization": f"Bearer {api_key}"}
)
if response.status_code == 200:
    models = response.json().get("data", [])
    print(f"Access confirmed: {len(models)} models available")
else:
    print(f"Access issue: {response.status_code}")
```

## Provider Policy Comparison

| Provider | Free Tier | Trial/Credit | Credit Card | Iran Access |
|---|---|---|---|---|
| Groq | 30 RPM, 14400 RPD | None | No | Yes |
| Together AI | None | $1 signup credit | Yes | Varies |
| Google AI Studio | 15 RPM | None | No | Varies |
| Mistral | 1 RPM free | None | No | Varies |
| OpenRouter | Varies by model | None | No | Varies |

## Evaluation Checklist

1. **Is the quota real?** Some free tiers are too small to be useful
2. **Requires credit card?** Important for Iranian users
3. **Policy change history?** How has the provider handled changes before?
4. **Iran access?** Network, signup, key, and inference checked separately

For a comprehensive catalog of providers with verified access status, quotas, and pricing details, visit the [Free LLM API catalog](https://llm.persiantoolbox.ir/). For source files and issue reporting, see the [GitHub repository](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir).
