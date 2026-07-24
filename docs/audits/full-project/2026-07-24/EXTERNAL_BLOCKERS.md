# EXTERNAL BLOCKERS

**Date:** 2026-07-24 (updated 2026-07-24T18:50Z)

## Blocker 1: Iran live verification ✅ RESOLVED

- **Status:** Completed 2026-07-24
- **Runner:** IRAN_SERVER — direct Iran network
- **Results:** 10 providers tested, 6 working, 4 geo-blocked
- **Report:** `reports/local/iran-test-2026-07-24T18-30-14-427Z.json`
- **PRs:** #198 (audit), #199 (hermes verification)

## Blocker 2: Foreign direct control ✅ RESOLVED

- **Status:** Completed 2026-07-24
- **Runner:** AUTOMATION_SERVER — Hetzner DE AS24940
- **Results:** Paired IR+DE tests for 10 providers, credential validation confirmed
- **Provider verdicts:**
  - agnes-ai: IR=200, DE=200 → verified_working
  - kilo-gateway: IR=200, DE=200 → verified_working
  - ovhcloud-ai-endpoints: IR=200, DE=200 → verified_working
  - hugging-face-inference: IR=200, DE=200 → verified_working
  - mistral: IR=200, DE=200 → verified_working
  - sambanova: IR=200, DE=200 → verified_working
  - openrouter: IR=403, DE=200 → geo_blocked
  - groq: IR=403, DE=200 → geo_blocked
  - cerebras: IR=403, DE=200 → geo_blocked
  - cohere: IR=403, DE=200 → geo_blocked

## Blocker 3: Benchmark execution ⏸️ PENDING (human setup)

- **Priority:** Medium
- **Action required:** Run `BENCHMARK_PROVIDER_ID`, `BENCHMARK_API_BASE_URL`, `BENCHMARK_API_KEY`, `BENCHMARK_MODEL` set per provider
- **Exact command:** `npm run benchmark:run -- --version=v1`
- **Credentials needed:** Per-provider API keys in `.env` — hermes keys cover openrouter, groq, cerebras, mistral, sambanova, cohere, hugging-face
- **Completeness criteria:** All 15 prompts executed across configured providers
- **Note:** Benchmark runs one provider at a time; use `npm run verify:iran` for multi-provider testing

## Blocker 4: Production deployment ✅ RESOLVED

- **Status:** Completed 2026-07-24
- **PR #198:** Merged to main, SHA `5b503e6cd230`
- **PR #199:** Merged to main, SHA `31720a558f76`
- **Global canonical:** `llm.persiantoolbox.ir` — live at `31720a558f76`, 22 providers
- **Iran mirror:** `ir.llm.persiantoolbox.ir` — live at `31720a558f76`, 22 providers, noindex correct
- **Deploy workflow:** `deploy-vps.yml` ran successfully for both targets

## Blocker 5: Analytics / Search Console verification ⏸️ PENDING (human)

- **Priority:** Low
- **Action required:** Check Plausible dashboard and Google Search Console
- **Credentials needed:** Plausible admin, Google Search Console access
- **Risk:** None (read-only)