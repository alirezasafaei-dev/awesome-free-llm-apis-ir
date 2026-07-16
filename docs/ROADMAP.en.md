# Project roadmap

Last reviewed: 2026-07-16

This document is the canonical roadmap. A phase is marked complete only when its acceptance criteria are satisfied in the machine-readable data, documentation, and CI.

## Current baseline

- 22 providers in the main catalog
- 8 proxies, routers, session bridges, and related tools in the separate tools catalog
- 14 repositories in the upstream monitor
- 7 machine-readable repository audits with Add / Watch / Reject decisions
- 8 providers with a successful direct request from Iran
- 3 providers with credential-validated geographic blocking
- 1 provider with official lack of Iran support
- 10 providers whose Iran-access status remains unknown (need API keys)

## P0 — Data-contract integrity

Status: **being stabilized**

Required work:

- Keep `schema/provider.schema.json` and the executable validator aligned.
- Reject unknown fields instead of silently accepting schema drift.
- Require credential-validation source and HTTP status as a pair.
- Require `live_verified` and a current verification date when live evidence exists.
- Prevent drift in `catalog.json`, `data.json`, and generated README content.
- Preserve the three-state payment-method contract: `true / false / null`.

Exit criteria:

- `npm test` is green.
- No mismatch exists between the public schema and canonical data.
- No provider with live evidence has stale verification metadata.

## P0 — Iran verification

Status: **partially complete**

Completed:

- Direct testing on an Iranian fixed network.
- Direct testing on an MCI mobile network.
- Credential validation through a German exit for selected providers, separating invalid credentials from geographic blocking.
- Tested 3 anonymous providers from Iran (kilo-gateway, ovhcloud-ai-endpoints, llm7-io).
- Updated documentation with actual test results.

Remaining:

- Obtain authorized credentials for 10 remaining providers.
- Run a separate VPN matrix where it provides practical value.
- Record `route=vpn` and `exit_country` independently.
- Avoid generalizing one ISP, account, or route to all users in Iran.

Credential validation through a VPN does not mean that a complete VPN-access matrix has been executed.

## P1 — Provider-catalog quality

Status: **active**

- Periodically re-check limits, models, payment requirements, and signup constraints.
- Prioritize providers with first-party documentation and public endpoints.
- Review newly added providers and the 11 unknown Iran-access records.
- Keep Trial, Credit, and Free Models as separate concepts.
- Remove time-sensitive or regional claims that lack a current official source.

## P1 — Repository audits and upstream watch

Status: **infrastructure complete; ongoing operation**

- Monitor sensitive upstream-file SHAs.
- Record Add / Watch / Reject decisions in `data/repository-audits.json`.
- Keep catalogs, prompt libraries, client tools, and session bridges out of the provider catalog.
- Require human review before canonical changes.

## P1 — Tools catalog

Status: **version one complete; continued development**

- Independent schema and validator.
- Explicit warnings for API keys, cookies, OAuth, HAR files, and browser sessions.
- No tools in the default provider advisor.
- Next: independent website presentation and reproducible maintenance/release metadata.

## P2 — Persian benchmark

Status: **baseline available**

- Expand the versioned dataset.
- Increase coverage of Persian writing, reasoning, JSON, and comprehension.
- Publish only complete, reproducible runs.
- Avoid comparing models across inconsistent network routes or settings.

## P2 — Website and community

Status: **active**

- Clearly display source, date, service type, and evidence status.
- Add independent views for tools and repository audits.
- Publish RSS/JSON feeds for material catalog changes.
- Improve contribution templates for quota and Iran-access reports.
- Keep English documentation aligned with the Persian source.

## Current execution order

1. Stabilize the provider contract and live-test metadata.
2. Remove contradictory or unsupported claims from existing providers.
3. Complete evidence for providers whose Iran-access status is unknown.
4. Review new provider candidates using first-party evidence.
5. Expand the tools/audits interface and Persian benchmark.
