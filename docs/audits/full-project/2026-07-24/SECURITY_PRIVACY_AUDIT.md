# SECURITY PRIVACY AUDIT

**Date:** 2026-07-24

## Secret scan

- All provider JSON files scanned: no API keys, tokens, or credentials found
- All workflow files scanned: secrets use `${{ secrets.X }}` pattern, no hardcoded secrets
- Deploy scripts scanned: no credentials, only variable references
- Evidence test passes: 364 tracked text files clean

## Evidence privacy

- `test-evidence-privacy.mjs` passes all positive and negative fixtures
- Provider evidence scan: 5 providers with live evidence checked, no prohibited content
- Network failures properly separated from HTTP responses in evidence semantics

## GitHub discussion privacy

- `test-github-discussion-privacy.mjs`: 73/73 tests pass
- Public IP, SSH target, SSH username detection all working
- Private/loopback/CGNAT/documentation addresses allowed
- No raw infrastructure identifiers leaked in test output

## Artifact privacy

- Generated HTML scanned: no inline IPs, emails, or credentials
- `catalog.json` and `data.json`: no private data exposed
- `build-meta.json`: contains only source_revision, provider_count, schema_version, timestamps

## Credential incidents

- None detected in this audit
- Previous credential concerns (fireworks-ai) documented with `sanitized_origin_country` — no raw data exposed

## Verdict

**PASS** — No security or privacy issues found.