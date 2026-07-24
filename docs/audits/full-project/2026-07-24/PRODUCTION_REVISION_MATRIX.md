# PRODUCTION REVISION MATRIX

**Date:** 2026-07-24
**Base SHA:** `586c280a9d3abfc4e87364b60c786034dbf3eb12`

| Target | HTTP | Expected revision | Provider count | Indexability | Smoke | UX smoke |
|--------|------|-------------------|---------------:|--------------|-------|----------|
| llm.persiantoolbox.ir (global) | 200 | Pending deploy | 22 (expected) | Indexable (no noindex) | Contract passes | Contract passes |
| ir.llm.persiantoolbox.ir (Iran mirror) | 200 | Pending deploy | 22 (expected) | noindex enforced | Contract passes | Contract passes |
| alirezasafaei-dev.github.io/awesome-free-llm-apis-ir | Pending | Pending deploy | 22 (expected) | Canonical to main domain | Contract passes | Contract passes |

*Note: Live production verification requires deploy permission from repository owner. Pre-deploy contract tests pass for all targets (revision verification, smoke, UX smoke).*

## Revision contract enforcement

All three layers are tested:
- `test-live-release-revision.mjs` — passes (6 assertions)
- `test-production-smoke.mjs` — passes
- `test-production-ux-smoke.mjs` — passes
- `test-release-orchestration.mjs` — passes