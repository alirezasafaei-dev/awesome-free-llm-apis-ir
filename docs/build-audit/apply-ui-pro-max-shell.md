# Build Transform Audit: `apply-ui-pro-max-shell.mjs`

**Decision:** `VALIDATION_ONLY` — all UI shell and CSP assets are source-owned.

## Previous mutation inventory

The script previously externalized Finder CSS/JavaScript, extracted page `<style>` blocks, injected two shared UI stylesheets, injected `plausible-guard.js`, repaired nested tracker paths, and rejected remaining inline styles.

## Source owners after P1-5

- Persian and English Finder core CSS/JavaScript: `site/*/api-finder/finder-core.css` and `finder-core.js`.
- English Compare and Quick Start page CSS: source `page-inline.css` files.
- Static product pages: direct stylesheet, guard, tracker, and analytics tags in `site/**/*.html`.
- Provider, guide, content, and tools generators: `scripts/lib/ui-shell.mjs` via `renderUiStyles()` and `renderAnalyticsTags()`.
- Tracker depth: emitted correctly by each source/generator; `build-site-production.mjs` no longer repairs it.

## Retained validator

`apply-ui-pro-max-shell.mjs` performs fail-closed validation only. It scans every built HTML page and rejects:

- missing or duplicate shared UI styles;
- inline `<style>` blocks or `style` attributes;
- executable inline JavaScript;
- incorrect guard/tracker paths, counts, or ordering;
- missing Finder or page-specific external assets.

The validator imports no write API and performs no HTML or asset mutation.

## Security boundary

Finder and Compare catalog data are rendered through DOM APIs, HTTPS documentation links are validated, Provider IDs are constrained, and malicious fixtures run in `scripts/test-finder-xss-resilience.mjs`. The retired recursive catalog sanitizer remains forbidden.

## Idempotency and rollback

The shell stage is now idempotent because it is read-only. Rollback is a normal revert of the source assets, generator helper, validator, and tests; no hidden generated repair step exists.
