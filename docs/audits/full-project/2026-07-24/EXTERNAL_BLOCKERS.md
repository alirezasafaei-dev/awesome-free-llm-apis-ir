# EXTERNAL BLOCKERS

**Date:** 2026-07-24

## Blocker 1: Iran live verification

- **Priority:** High
- **Action required:** Execute `npm run verify:iran` on a runner with direct Iran network access
- **Exact command:** `SOURCE_REVISION=$(git rev-parse HEAD) npm run verify:iran`
- **Credentials needed:** Configured in `.env` file on secure runner
- **Risk:** Credential exposure — must use sanitized output
- **Related providers:** 22 total, 12 configured with credentials, 3 anonymous, 7 missing credentials
- **Acceptance criteria:** All providers tested from direct Iran route, results sanitized and committed

## Blocker 2: Foreign direct control

- **Priority:** High
- **Action required:** Run paired Iran/non-Iran tests for providers with `signup_blocked` status
- **Exact command:** Use a non-Iran VPS to run the same verification tests
- **Credentials needed:** Same as Blocker 1
- **Risk:** Requires authorized non-Iran host access

## Blocker 3: Benchmark execution

- **Priority:** Medium
- **Action required:** Run `BENCHMARK_API_KEY_*` and `BENCHMARK_BASE_URL_*` variables set
- **Exact command:** `npm run benchmark:run persian-baseline-v1`
- **Credentials needed:** Per-provider API keys for benchmark runners
- **Completeness criteria:** All 15 prompts executed across all providers

## Blocker 4: Production deployment

- **Priority:** High
- **Action required:** Deploy this branch to production after merge
- **Exact command:** Follow controlled-release procedure in AGENTS.md
- **Permissions needed:** GitHub `main` push, VPS SSH access, GitHub Pages settings
- **Risk:** Requires repository owner authorization

## Blocker 5: Analytics / Search Console verification

- **Priority:** Low
- **Action required:** Check Plausible dashboard and Google Search Console
- **Credentials needed:** Plausible admin, Google Search Console access
- **Risk:** None (read-only)