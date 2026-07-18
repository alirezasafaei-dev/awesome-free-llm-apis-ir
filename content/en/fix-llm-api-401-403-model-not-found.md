---
title: "Fixing 401, 403, 404, and Model Not Found Errors in LLM APIs"
slug: "en-fix-llm-api-401-403"
description: "Troubleshooting guide for invalid API key, regional permission, disabled model, wrong Base URL, and incompatible endpoint errors in language model APIs."
primary_keyword: "fix 401 error LLM API"
secondary_keywords:
  - "403 forbidden OpenAI compatible"
  - "model not found LLM API fix"
  - "Base URL error API"
canonical_target: "https://llm.persiantoolbox.ir/guides/en/en-fix-llm-api-401-403/"
updated_at: "2026-07-18"
status: "READY_FOR_SITE"
---

# Fixing 401, 403, 404, and Model Not Found Errors in LLM APIs

Authentication and model errors in LLM APIs often look similar, but their causes and solutions differ. `401` usually relates to the API key or authentication method, `403` typically indicates account, regional, or model permission issues, and `404` or `model_not_found` often comes from an incorrect Base URL, endpoint path, or Model ID.

For Base URL, Model ID, quota type, and Iran-access status, check the [Free LLM API Catalog](https://llm.persiantoolbox.ir/) and the provider's official documentation. Account data, quotas, and regional policies can change — a sample from an old blog post or video may no longer be valid.

## Step 1: Diagnose the error code

### 401 Unauthorized

The server does not recognize your identity. Common causes:

- API key is missing, incorrect, or expired.
- Key was revoked.
- The authentication header format is incompatible with the provider.
- The account has been suspended or requires re-verification.

**Do not print the API key in logs, error messages, or issue reports.**

### 403 Forbidden

The server recognizes you but denies access. Common causes:

- The account or API key does not have permission for the requested model.
- The region is blocked by the provider's policy.
- The organization or project associated with the key lacks access.
- The free tier does not include the requested model.

For Iranian users, a 403 may indicate regional blocking even if the website loads.

### 404 Not Found or model_not_found

The endpoint or model does not exist at the specified path. Common causes:

- Base URL is missing the `/v1` path prefix (e.g., `https://provider.example` instead of `https://provider.example/v1`).
- The Model ID is wrong or no longer active.
- The provider moved or renamed the endpoint.
- The model is only available in a different region or account tier.

### 429 Too Many Requests

Rate limit or quota exceeded. See the dedicated guide: [Fixing 429 and Rate Limits](https://llm.persiantoolbox.ir/guides/llm-api-rate-limit-429/)

## Step 2: Verify authentication

Check these in order:

1. Is the API key set and non-empty in the environment?
2. Does the key have the correct format for the provider?
3. Is the key active in the provider dashboard?
4. Does the account have access to the model?
5. Is the authentication header compatible? (Some providers use `Authorization: Bearer`, others use custom headers.)

Test with `curl`:

```bash
curl -s -o /dev/null -w "%{http_code}" \\
  -H "Authorization: Bearer $LLM_API_KEY" \\
  "$LLM_BASE_URL/models"
```

A 200 response means authentication is working. Non-200 means check your key, URL, or account.

## Step 3: Verify the endpoint

Ensure the Base URL is correct:

```bash
curl -s "$LLM_BASE_URL/models" \\
  -H "Authorization: Bearer $LLM_API_KEY" | head -c 500
```

Compare against the provider's official documentation. Common issues:

- Missing or extra path segments (`/v1`, `/api`, etc.)
- HTTP vs HTTPS mismatch
- Trailing slash differences
- Deprecated endpoint URLs

## Step 4: Verify the model

List available models:

```bash
curl -s "$LLM_BASE_URL/models" \\
  -H "Authorization: Bearer $LLM_API_KEY" | python -m json.tool
```

Check:

- The exact Model ID spelling and case.
- Whether the model is available on the free tier.
- Whether the model requires special access or approval.
- Whether multiple models share the same basic name (e.g., different versions).

Some providers return only models your key can access. If `model_not_found` persists, try a known working model from the provider's free tier list.

## Step 5: Test with a minimal request

```bash
curl -s -w "\\nHTTP %{http_code}" \\
  -X POST "$LLM_BASE_URL/chat/completions" \\
  -H "Authorization: Bearer $LLM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "'"$LLM_MODEL"'",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

A successful response includes choices with content. Any error code above points to one of the issues described above.

## Step 6: Check for provider-specific quirks

- **GitHub Models**: Requires a token with the `models` scope and a specific endpoint pattern.
- **Cloudflare Workers AI**: Uses account ID in the URL and a different auth model.
- **Fireworks AI**: May require organization context in headers.
- **NVIDIA NIM**: Some endpoints are gated by region or account tier.

Always read the provider's official API documentation for headers, scopes, and path differences.

## Provider-specific considerations for Iranian users

- `signup_blocked`: Account creation may fail even if the API is technically accessible.
- `verified_blocked`: The provider is confirmed to block Iranian IPs or accounts.
- `verified_working_vpn`: Works with a VPN, but direct access is blocked.
- `unknown`: No recent evidence available — test carefully.

The Iran-access badge on each provider's page shows the most recent verified status.

## Prevention checklist

- Store the API key in an environment variable, never in code.
- Use a `.env` file for local development and a secret manager in production.
- Verify the Base URL and Model ID against official documentation.
- Pin the SDK version to avoid breaking changes.
- Check the provider's status page for ongoing incidents.
- Set reasonable timeout and retry limits.
- Test with a minimal payload before building complex flows.
- Rotate keys periodically and on suspected leaks.
- Have a fallback provider tested and ready.

## Summary

Most LLM API errors fall into a few categories: authentication, permission, endpoint, or model identification. Systematic diagnosis by error code, credential verification, endpoint inspection, and minimal request testing resolves the vast majority of issues.

For provider-specific details, quotas, and Iran-access evidence, refer to the [live catalog](https://llm.persiantoolbox.ir/). If you discover new access information, submit a sanitized report through the [Iran Access Report form](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir/issues/new?template=iran-access-report.yml).
