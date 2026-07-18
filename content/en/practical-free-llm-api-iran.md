---
title: "Choosing a Free LLM API in Iran: From Signup to First Request"
slug: "en-practical-free-llm-api-iran"
description: "Practical guide for selecting, signing up, testing connectivity, and making your first free LLM API request from inside Iran. Covers security, quota types, and access evidence."
primary_keyword: "Free LLM API Iran"
secondary_keywords:
  - "free AI API without credit card"
  - "LLM API accessible from Iran"
  - "Iran VPN API access"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-practical-free-llm-api-iran/"
updated_at: "2026-07-18"
status: "READY_FOR_SITE"
---

# Choosing a Free LLM API in Iran: From Signup to First Request

**Quick answer:** Pick a provider whose free-tier type is clearly documented, does not require a credit card for account creation, has a timestamped Iran-access status, and ideally supports the OpenAI-compatible API standard. No single provider is best for every project.

The up-to-date list of providers, quotas, and Iran-access status is in the [Free LLM API Catalog](https://llm.persiantoolbox.ir/). Always check the last-review date and the provider's dedicated page before committing — service policies can change.

## Why the selection process is different for Iranian users

In a typical comparison, model quality, speed, and price matter most. For users inside Iran, several additional hurdles exist:

- The provider's website may load, but the signup form or SMS verification may not work.
- Account creation may succeed, but model inference may be rejected due to regional restrictions.
- Some services officially do not support Iran, even if network connectivity is temporarily available.
- "Free" could mean permanent quota, free models, monthly credit, or a short trial.
- Rate limits, token caps, and concurrency on free accounts are usually lower.

This project separates statuses into "verified working (direct)", "verified working (VPN)", "signup blocked", "verified blocked", and "unknown".

## Step 1: Define your use case precisely

Before comparing providers, clarify what you need the model for.

### Chat and Persian text generation

For chatbots, summarization, and content generation:

- Persian response quality and instruction following
- Context window length
- Time to first token
- Output length limits
- Data retention policy

### Coding and agents

For coding assistants or agents, verify these capabilities beyond code quality:

- Tool calling
- Structured output or JSON schema
- Endpoint stability
- Concurrent request limits
- OpenAI SDK compatibility

### RAG and semantic search

For RAG, confirm the provider actually offers a dedicated Embedding endpoint. Also check vector dimensions, token limits, Persian language support, batch size, and data policy.

### Student projects and prototypes

For prototypes, prioritize:

1. Simple signup
2. No credit card required
3. Predictable quota
4. Independent API key
5. Clear documentation
6. Easy provider switching

## Step 2: Understand what "free" really means

"Free API" does not mean the same thing everywhere.

### Permanent quota

A portion of usage is free under current policy, usually reset on a schedule. "Permanent" does not guarantee the current cap forever — providers can change terms.

### Free models

Only specific models may be free. Newer or more capable models may cost extra or consume different quotas.

### Free credit

The account receives a limited credit balance. Once exhausted, continued usage may require payment.

### Trial

Trials are suitable for short-term evaluation but are not a reliable foundation for a long-running project.

See the detailed guide: [Free Tier vs Trial vs Credit](https://llm.persiantoolbox.ir/guides/free-tier-vs-trial-vs-credit/)

## Step 3: Interpret Iran-access status correctly

A provider's homepage loading does not mean the API is usable from Iran. A valid test should cover:

1. Access to the signup page
2. Account creation or login
3. API key generation
4. Listing authorized models
5. Sending a real inference request
6. Receiving a valid response

A public endpoint ping, DNS resolution, or model list page alone is insufficient.

"Unknown" does not mean the service works — it means there is not enough recent evidence for a definitive conclusion.

## Step 4: Check OpenAI compatibility

OpenAI-compatible means the provider uses a request structure similar to OpenAI's API. You can usually use the same SDK with a changed `base_url` and `model`. It does not mean the provider uses OpenAI infrastructure or supports every feature identically.

Differences may exist in:

- Model names
- Tool calling
- Streaming
- Structured output
- Embedding
- Generation parameters
- Error formats

Related list: [OpenAI-Compatible APIs Without a Credit Card](https://llm.persiantoolbox.ir/guides/openai-compatible-api-without-card/)

## Step 5: Sign up securely

Create a separate API key for each project to simplify key revocation and usage monitoring.

Essential tips:

- Never hardcode keys in source code.
- Do not commit `.env` files.
- Do not post API keys, cookies, recovery codes, or account dashboard screenshots in public issues.
- Use CI secrets for public repositories.
- Rotate keys immediately if a leak is suspected.

Sample `.gitignore`:

```gitignore
.env
.env.*
!.env.example
.venv/
node_modules/
```

## Step 6: Make your first request

If the provider is OpenAI-compatible, read settings from environment variables to simplify switching.

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
    timeout=30.0,
    max_retries=2,
)

response = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=[
        {"role": "system", "content": "Answer briefly and precisely."},
        {
            "role": "user",
            "content": "Name three applications of language models in education.",
        },
    ],
)

print(response.choices[0].message.content)
```

Set environment variables:

```bash
export LLM_API_KEY="..."
export LLM_BASE_URL="https://provider.example/v1"
export LLM_MODEL="MODEL_ID"
python app.py
```

Get the Base URL and Model ID from the provider page and official docs; do not copy sample values without verification.

## Step 7: Evaluate the result

A successful test means more than HTTP 200. Record:

- Time and network type
- Signup success
- Key generation success
- Model ID used
- Real request result
- Approximate latency
- Sanitized error
- Test date

Do not publish sensitive account information or private prompt text.

## Final checklist

Before depending on a provider, answer these questions:

- Does the free tier align with your project's lifespan?
- Is the required model available on the free account?
- Are RPM, RPD, or TPM limits sufficient for your load?
- Is the Iran-access status recent and documented?
- Are signup and real requests tested?
- Are timeout and retry configured?
- Do you have a fallback provider?
- Are secrets stored outside the repository?

## When to switch providers

Consider switching when:

- Regional or signup policy has changed.
- Quota is insufficient for actual usage.
- 429 or 5xx errors are persistent.
- Required capabilities (e.g., tool calling) are unreliable.
- Persian response quality does not meet your needs.
- Data and privacy terms are incompatible with your project.

Using a common interface with `LLM_BASE_URL`, `LLM_API_KEY`, and `LLM_MODEL` environment variables reduces migration cost.

## Summary

For an Iranian user, the best API is not necessarily the most famous model. The right choice is a service with clear terms, a verifiable free tier, tested network access, and easy replaceability when policies change.

For the current provider comparison, use the [live catalog](https://llm.persiantoolbox.ir/).

If you have tested a service from Iran, submit the result in an [Iran Access Report issue](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml). Do not include any keys, cookies, or personal information in the report.

If this resource is useful, star the repository on [GitHub](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir) to help others find it.
