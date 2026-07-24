# EXECUTION LEDGER

**Date:** 2026-07-24
**Branch:** `audit/evidence-product-remediation-20260724`
**Base SHA:** `586c280a9d3abfc4e87364b60c786034dbf3eb12`

## Tasks

| ID | Priority | Domain | Finding | Root cause | Files | Action | Test | Status |
|----|----------|--------|---------|------------|-------|--------|------|--------|
| T001 | HIGH | Build architecture | `enrich-provider-pages.mjs` throws on re-run if markers already exist | Script treated existing markers as error instead of skip | `scripts/enrich-provider-pages.mjs` | Changed `throw` to `continue` to make idempotent | `npm test` | FIXED |
| T002 | HIGH | Build architecture | `apply-ui-pro-max-shell.mjs` throws on re-run if finder assets already externalized | Script treated missing inline assets as error instead of skip | `scripts/apply-ui-pro-max-shell.mjs` | Changed `throw` to `console.warn` + `return` to make idempotent | `npm test` | FIXED |
| T003 | MEDIUM | Build architecture | Hardcoded date `2026-07-22` in `register-static-routes.mjs` sitemap lastmod | Date hardcoded instead of dynamically derived | `scripts/register-static-routes.mjs` | Replaced with `new Date().toISOString().slice(0, 10)` | `npm test` | FIXED |
| T004 | MEDIUM | Build architecture | Hardcoded date `2026-07-20` in `register-compare-route.mjs` sitemap lastmod | Date hardcoded instead of dynamically derived | `scripts/register-compare-route.mjs` | Replaced with `new Date().toISOString().slice(0, 10)` | `npm test` | FIXED |
| T005 | LOW | CI/CD | Wrong version comment `# v8.0.1` on `download-artifact` SHA (actually v4.1.8) | Copy-paste error when adding the job | `.github/workflows/validate.yml` | Fixed comment to `# v4.1.8` | `npm run workflow-pins:test` | FIXED |
| T006 | MEDIUM | CI/CD | Rollback `|| true` silently masks rollback failures in `deploy-vps.yml` | Design choice to prevent deploy workflow failure on rollback | `.github/workflows/deploy-vps.yml` | Removed `|| true` from both global and Iran rollback steps | `npm run deploy:test` | FIXED |

## Remaining risk

- Build pipeline has 5+ regex-on-HTML scripts (apply-*); these could break if template structure changes. Mitigated by comprehensive contract tests.
- VPS path filters vs Pages no-filter may cause drift during rapid pushes. Mitigated by `ensure-vps-deployment.yml` and revision verification.
- `sync-generated-artifacts.yml` has `contents: write` permission, guarded by same-repo + agent-branch checks.