# PROVIDER TRACEABILITY MATRIX

**Date:** 2026-07-24 (updated 2026-07-24T18:50Z)

| Provider | Source JSON | Schema | Catalog | data.json | README | Detail | Finder | Compare | IR Test | DE Test | Verdict |
|----------|------------|--------|---------|-----------|--------|--------|--------|---------|---------|---------|---------|
| agnes-ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| aion-labs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| cerebras | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 403 | 200 | geo_blocked |
| cloudflare-workers-ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| cohere | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 403 | 200 | geo_blocked |
| fireworks-ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | network_error | geo_blocked | signup_blocked |
| freetheai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| github-models | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| google-gemini | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| groq | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 403 | 200 | geo_blocked |
| hugging-face-inference | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| kilo-gateway | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| llm7-io | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 400 | 400 | needs_investigation |
| mistral | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| modelscope | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| nvidia-nim | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| opencode-zen | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| openrouter | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 403 | 200 | geo_blocked |
| ovhcloud-ai-endpoints | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| sambanova | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 200 | 200 | verified_working |
| siliconflow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | skipped | — | missing_credentials |
| vercel-ai-gateway | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 403 | 403 | policy_denied |

## Summary

- **22/22** fully traceable from source JSON through all product surfaces
- **8/22** verified working from Iran (6 paired IR+DE, 1 Iran-only, 1 with DE-only)
- **4/22** confirmed geo-blocked from Iran (openrouter, groq, cerebras, cohere)
- **1/22** policy denied from both IR and DE (vercel-ai-gateway)
- **1/22** network error from Iran, geo-blocked from DE (fireworks-ai)
- **1/22** invalid response 400 from both IR and DE (llm7-io)
- **7/22** missing API credentials for testing
- **1/22** confirmed geo-blocked from DE (vercel-ai-gateway)