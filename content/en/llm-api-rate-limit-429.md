---
title: "Fixing 429 Errors and Managing Rate Limits in Free LLM APIs"
slug: "en-llm-api-rate-limit-429"
description: "Expert guide to diagnosing quota types, implementing retry with backoff and jitter, request queuing, circuit breakers, and provider fallback for free language model APIs."
primary_keyword: "fix 429 error LLM API"
secondary_keywords:
  - "rate limit LLM API management"
  - "Too Many Requests OpenAI"
  - "free API quota management"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-llm-api-rate-limit-429/"
updated_at: "2026-07-18"
status: "READY_FOR_SITE"
---

# Fixing 429 Errors and Managing Rate Limits in Free LLM APIs

**Quick answer:** A `429 Too Many Requests` error does not always mean you are sending requests too quickly. It may indicate a per-minute request cap, daily quota, per-minute token limit, concurrency limit, or exhausted free credit. First identify the limit type, then implement bounded retry with exponential backoff and jitter, request queuing, context reduction, or a fallback provider.

Per-provider limits are recorded in the [Free LLM API Catalog](https://llm.persiantoolbox.ir/), but the official documentation and account dashboard are always the final reference.

## Step 1: Identify the type of limit

Check the error response body for details. Some providers include a `Retry-After` header or JSON fields like `"error": {"code": "rate_limit_exceeded"}`.

### Per-minute request limit (RPM)

The maximum number of requests allowed per minute. Exceeding this triggers a 429 until the window resets.

### Per-day request limit (RPD)

The total requests allowed per day. This resets on a daily cycle. It may be global or per-model.

### Per-minute token limit (TPM)

The total tokens (input + output) allowed per minute. Even with few requests, long prompts or responses can exhaust this.

### Concurrent request limit

The maximum simultaneous in-flight requests. Exceeding this does not always return a 429 — some providers queue, drop, or error differently.

### Credit exhaustion

Free credits may have been fully consumed. A 429 or payment-required error may follow.

## Step 2: Implement retry with exponential backoff and jitter

Never retry immediately and indefinitely. Use exponential backoff with random jitter to spread retries across time.

```python
import random
import time
from openai import RateLimitError

def call_with_retry(client, **kwargs):
    max_retries = 3
    base_delay = 1.0

    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(**kwargs)
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            time.sleep(delay)

    return None  # unreachable
```

```javascript
async function callWithRetry(client, params) {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await client.chat.completions.create(params);
    } catch (err) {
      if (err.status !== 429 || attempt === maxRetries - 1) throw err;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

## Step 3: Parse the Retry-After header

If the provider sends a `Retry-After` header, respect it. This is more reliable than client-side heuristics.

```python
import time
from openai import APIStatusError

try:
    response = client.chat.completions.create(...)
except APIStatusError as exc:
    retry_after = exc.response.headers.get("Retry-After")
    if retry_after and exc.status_code == 429:
        time.sleep(int(retry_after))
```

## Step 4: Implement a simple request queue

For predictable usage, maintain a queue that respects the provider's limits.

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_per_minute=60):
        self.max_per_minute = max_per_minute
        self.timestamps = deque()

    def wait(self):
        now = time.time()
        while self.timestamps and self.timestamps[0] < now - 60:
            self.timestamps.popleft()
        if len(self.timestamps) >= self.max_per_minute:
            sleep_time = self.timestamps[0] + 60 - now
            if sleep_time > 0:
                time.sleep(sleep_time)
        self.timestamps.append(time.time())
```

## Step 5: Reduce context length

Longer prompts consume more tokens per request, reducing your effective TPM budget. Strategies include:

- Sending only the most recent messages (as shown in the chatbot tutorial).
- Summarizing or compressing older conversation history.
- Truncating or omitting large documents when not needed.
- Using shorter system prompts.

## Step 6: Implement a circuit breaker

For persistent rate-limiting or service degradation, stop calling the failing provider and fall back.

```python
import time

class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = 0
        self.state = "closed"  # closed, open, half-open

    def call(self, fn, fallback_fn, *args, **kwargs):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half-open"
            else:
                return fallback_fn(*args, **kwargs)

        try:
            result = fn(*args, **kwargs)
            if self.state == "half-open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "open"
            return fallback_fn(*args, **kwargs)
```

## Step 7: Configure provider fallback

Use environment variables to define a primary and fallback provider:

```python
import os
from openai import OpenAI

primary = OpenAI(
    api_key=os.environ["LLM_API_KEY"],
    base_url=os.environ["LLM_BASE_URL"],
)

fallback = OpenAI(
    api_key=os.environ["FALLBACK_API_KEY"],
    base_url=os.environ["FALLBACK_BASE_URL"],
)

providers = [(primary, os.environ["LLM_MODEL"]), (fallback, os.environ["FALLBACK_MODEL"])]

def chat(messages):
    for client, model in providers:
        try:
            return client.chat.completions.create(model=model, messages=messages)
        except Exception:
            continue
    raise RuntimeError("All providers failed")
```

## Step 8: Monitor usage

Aggregate metrics help you choose the right provider and tier:

- Track RPM, TPM, and error rate per provider.
- Log rate-limit events separately from other errors.
- Set alerts when approaching quota limits.
- Review usage patterns weekly to adjust strategy.

Do not log API keys or private prompt content in monitoring systems.

## Summary

Rate limiting in free LLM APIs is normal and manageable. The key is systematic diagnosis: identify whether the limit is RPM, RPD, TPM, concurrency, or credit-based, then apply the appropriate strategy. Retry with backoff, request queuing, context management, circuit breakers, and provider fallback form a complete toolkit.

For current per-provider rate limits, check the [live catalog](https://llm.persiantoolbox.ir/) and always verify against official documentation.

If this guide is helpful, contribute corrections or new data via the [GitHub repository](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir).
