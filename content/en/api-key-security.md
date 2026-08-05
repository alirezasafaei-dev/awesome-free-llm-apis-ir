---
title: "API Key Security: Preventing Key Exposure in LLM Projects"
slug: "en-api-key-security"
translation_key: "api-key-security"
description: "Practical guide to preventing API key exposure in AI projects; covering environment variables, Git verification, server security, and best practices."
primary_keyword: "en api key security"
canonical_target: "https://llm.persiantoolbox.ir/guides/en-api-key-security/"
updated_at: "2026-08-05"
status: "READY_FOR_SITE"
---


# API Key Security: Preventing Key Exposure in LLM Projects

**Quick answer:** An API key is like your account password. If published on GitHub, log files, or source code, anyone can abuse your quota. Keys should only be stored in environment variables, never in code, and checked before every commit.

## Why Key Exposure is Dangerous

- **Quota abuse:** Others use your free quota
- **Cost:** Accounts with billing may incur high charges
- **Abuse:** Keys may be used for inappropriate purposes
- **Account suspension:** Provider may block the account for unusual patterns

## Common Exposure Vectors

### 1. Hardcoded in Source Code
```python
# Wrong
api_key = "YOUR_API_KEY_HERE"

# Correct
import os
api_key = os.environ["API_KEY"]
```

### 2. Pushed to GitHub
- `.env` files store API keys
- `.gitignore` must include `.env`
- Check `git diff` before committing

### 3. Server Logs
- Keys may be logged in HTTP headers
- Logs may be accessible to others
- Don't log Authorization headers

### 4. Docker Environment Variables
- `docker inspect` may reveal environment variables
- Use Docker Secrets or Volumes for sensitive files

## Best Practices

### Store in Environment Variables
```bash
# .env file (never commit)
API_KEY=YOUR_API_KEY_HERE
```

```python
import os
api_key = os.environ.get("API_KEY")
if not api_key:
    raise ValueError("API_KEY is not set")
```

### Verify .gitignore
Ensure these lines exist in `.gitignore`:
```
.env
.env.local
.env.*.local
```

### Check Before Commit
```bash
git status
grep -r "sk-" --include="*.py" --include="*.js" .
```

### Use Secret Manager
For team or production projects:
- AWS Secrets Manager
- Google Secret Manager
- HashiCorp Vault
- GitHub Actions Secrets

### Regular Key Rotation
- Generate new API keys every few months
- Delete old keys from provider
- Update applications with new keys

## Tips for LLM Projects

### OpenAI-compatible API
```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=os.environ.get("BASE_URL", "https://api.openai.com/v1")
)
```

### Multiple Providers
Store each key in a separate variable:
```
GROQ_API_KEY=...
TOGETHER_API_KEY=...
```

## Special Cases

### CI/CD Pipelines
Never hardcode keys in CI configuration files. Use CI-specific secret management:
- GitHub Actions: Use repository secrets
- GitLab CI: Use CI/CD variables
- Jenkins: Use credentials store

### Team Collaboration
When working in teams, each developer should have their own API key. This provides:
- Individual quota tracking
- Ability to revoke access without affecting others
- Clear audit trail of who made which requests

### Open Source Projects
If publishing open source code that uses LLM APIs:
- Never include real API keys in examples
- Use placeholder values in documentation
- Provide setup instructions for obtaining and configuring keys
- Consider using environment variable templates with `.env.example`

## Best Practices for Storing API Keys (Environment Variables vs .env)

When working with LLM APIs in production applications, proper key storage becomes critical infrastructure. The two primary approaches each have distinct trade-offs.

### Environment Variables (System-Level)

Environment variables are the most secure option for deployed applications. They never touch the filesystem in plaintext and are isolated per-process. On Linux systems, you can set them in your shell profile or systemd unit files. The advantage is that they are never committed to version control and cannot be accidentally exposed through file permissions. However, managing dozens of environment variables across multiple services becomes unwieldy quickly, and there is no built-in mechanism for documenting what each variable is for or tracking when it was last rotated.

### .env Files (Development)

The `.env` file approach is ideal for local development because it provides a structured way to define all required variables in one place. Always use `dotenv` libraries that validate required variables on startup rather than silently failing. The critical rule is that `.env` files must never be committed to version control. Configure your `.gitignore` aggressively and use pre-commit hooks as a safety net. For teams, consider `.env.example` files that document required variables without containing actual secrets. Some teams use `.env.local` for personal overrides that are also gitignored, creating a clean separation between shared defaults and individual credentials.

## Implementing Rate Limiting and Throttling

Rate limiting is essential when using LLM APIs because it protects both your budget and your provider relationship. Most providers enforce rate limits at the account level, and exceeding them results in HTTP 429 errors or temporary account suspension.

### Client-Side Rate Limiting

Implement client-side throttling using token bucket or sliding window algorithms. In Node.js with Express, use `express-rate-limit` middleware to control request frequency. Configure the `windowMs` and `max` options based on your provider's actual limits. For example, if Groq allows 30 requests per minute, set your client limit to 25 to leave headroom. Log rate limit events so you can adjust thresholds based on real usage patterns. Additionally, implement exponential backoff with jitter when receiving 429 responses to avoid thundering herd problems when multiple clients retry simultaneously.

### Server-Side Request Queuing

For applications serving multiple users, implement a request queue that distributes API calls across time. This prevents any single user from consuming the entire quota and provides a more predictable cost model. Use a message queue like Redis or RabbitMQ to buffer requests and process them at a controlled rate. This architecture also provides natural retry semantics if the API is temporarily unavailable.

## CORS Configuration and Allowed Origins

Cross-Origin Resource Sharing (CORS) configuration is often overlooked when exposing LLM API endpoints. If your API proxy or wrapper service accepts browser requests, improper CORS settings can expose your API keys to malicious websites.

### Restricting Origins

Configure CORS to only accept requests from known origins. Never use `Access-Control-Allow-Origin: *` in production when your endpoint requires authentication. Instead, maintain an explicit whitelist of allowed origins. For development, you might allow `localhost:3000` and `localhost:5173`. For production, restrict to your actual domain. Remember that CORS is enforced by browsers only, so server-to-server requests bypass these restrictions, which is why API key security remains important regardless of CORS configuration.

### Preflight Request Handling

Configure your server to properly handle OPTIONS preflight requests. LLM API wrappers often make complex requests with custom headers like `Authorization`, which triggers preflight requests. Ensure your CORS middleware handles these correctly and does not leak information about your API structure in error responses.

## Detecting and Rotating Leaked Keys

Even with the best preventive measures, API keys can be leaked through log files, error messages, or compromised development machines. Having a detection and response plan is essential.

### GitHub Secret Scanning

Enable GitHub Secret Scanning for your repositories. When enabled, GitHub automatically scans pushes for known secret formats, including API keys from major providers. When a match is detected, GitHub notifies both you and the key issuer, who may automatically revoke the compromised key. This feature is free for public repositories and available for private repositories with GitHub Advanced Security. Additionally, configure push protection to prevent commits containing secrets from being pushed at all.

### Automated Key Monitoring

Set up monitoring for unusual API usage patterns. Most providers offer dashboards showing request volumes, error rates, and geographic distribution. Create alerts for sudden spikes in usage that could indicate a leaked key being exploited. For example, if your application normally makes 100 requests per day and suddenly sees 10,000, investigate immediately. Some providers offer webhook notifications for security events that can trigger automated key rotation workflows.

### Rotation Playbook

Maintain a documented rotation process. The playbook should include: how to generate a new key, how to deploy it to all services, how to verify the new key works, and how to revoke the old key. Automate as much as possible using your secret manager's API. Test your rotation process quarterly to ensure it works when needed. After rotation, verify that no services are still using the old key by checking provider access logs.

## Monitoring for Exposure

Even with best practices, keys may be exposed. Monitor for:
- Unusual quota consumption patterns
- Unexpected geographic access patterns
- Provider alerts about suspicious activity
- Regular review of who has access to each key

## Summary

API key security is an ongoing responsibility. Check code before every commit. Use environment variables. Rotate keys regularly. Monitor for unusual activity. Treat your API key with the same care as a database password.

For a comprehensive catalog of providers with verified access status, quotas, and security details, visit the [Free LLM API catalog](https://llm.persiantoolbox.ir/). For source files, schema, and issue reporting, see the [GitHub repository](https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir).
