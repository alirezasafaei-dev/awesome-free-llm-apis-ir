# Build Transform Audit: `apply-finder-ranking-p3.mjs`

**Decision:** `KEEP_WITH_JUSTIFICATION`

## Current behavior

Read-only validation. Reads the built Finder HTML and JavaScript and asserts:
- No stale language-scoring markers remain
- Required ranking semantics are present
- Clarity script has correct wording

No file mutations.

## Justification for keeping

This is a **validation-only post-build assertion** — it enforces that the build output matches source expectations. It does not transform or mutate files. Moving this into source would duplicate the assertion logic: source already has its own semantics, and this script verifies the build produces them correctly. Validation scripts that don't mutate are an appropriate use of post-build steps.

## Regex usage

No — uses `String.includes()` only.

## Idempotency

Fully idempotent: no mutations.
