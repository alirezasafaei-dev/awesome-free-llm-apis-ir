# Project roadmap

Last reviewed: 2026-07-16

This document is the canonical roadmap. A phase is marked complete only when its acceptance criteria are satisfied in the machine-readable data, documentation, and CI.

## Current baseline

- 22 providers in the main catalog
- 8 proxies, routers, session bridges, and related tools in the separate tools catalog
- 14 repositories in the upstream monitor
- 7 machine-readable repository audits with Add / Watch / Reject decisions
- 9 providers with a successful direct request from Iran
- 5 providers with credential-validated geographic blocking
- 1 provider with official lack of Iran support
- 7 providers whose Iran-access status remains unknown
- Machine-readable execution backlog in `data/verification-backlog.json`

## P0 — Data-contract integrity

Status: **being stabilized**

Required work:

- Keep `schema/provider.schema.json` and the executable validator aligned.
- Reject unknown fields instead of silently accepting schema drift.
- Require credential-validation source and HTTP status as a pair.
- Require `live_verified` and a current verification date when live evidence exists.
- Prevent drift in `catalog.json`, `data.json`, and generated README content.
- Preserve the three-state payment-method contract: `true / false / null`.
- Keep the execution backlog aligned with the canonical `unknown` provider set.

Exit criteria:

- `npm test` is green.
- No mismatch exists between the public schema and canonical data.
- No provider with live evidence has stale verification metadata.
- `npm run verification:backlog:test` succeeds.

## P0 — Iran verification

Status: **partially complete**

Completed:

- Direct testing on recorded Iranian network routes.
- Direct testing on an MCI mobile network.
- Validation of the same authorized access through a non-Iranian route to distinguish invalid access from regional blocking.
- Direct tests for usable anonymous providers.
- Direct verification of `llm7-io` and `opencode-zen`.
- Credential-compared blocking verification for `groq` and `aion-labs`.
- Documentation updated with observed results.

Remaining:

- Issue #32: validation-host security and access review.
- Issue #33: complete tests for four account-dependent providers.
- Issue #34: document signup and identity barriers for three providers.
- Issue #35: cover an independent direct ASN and run a separate VPN matrix.
- Record `route=vpn` and `exit_country` independently.
- Avoid generalizing one ISP, account, or route to all users in Iran.

Credential validation through a non-Iranian route does not mean that a complete VPN-access matrix has been executed.

## P1 — Provider-catalog quality

Status: **active**

- Periodically re-check limits, models, payment requirements, and signup constraints.
- Prioritize providers with first-party documentation and public endpoints.
- Review newly added providers and the 7 unknown Iran-access records.
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

1. Complete the security review in Issue #32.
2. Complete testable providers in Issue #33.
3. Document signup barriers in Issue #34.
4. Run the ASN/VPN matrix in Issue #35.
5. Review new provider candidates using first-party evidence.
6. Expand the tools/audits interface and Persian benchmark.
