# Build Transform Audit: `apply-ui-pro-max-shell.mjs`

**Decision:** `REPLACE_WITH_COMPONENT`

## Current behavior

1. **Externalizes Finder assets**: Moves inline `<style>` and `<script>` from Finder pages into external `finder-core.css` and `finder-core.js` files for CSP compliance. The JavaScript is copied unchanged; Finder/Compare data safety is source-owned and tested with malicious fixtures.
2. **Externalizes page styles**: Moves all remaining inline `<style>` blocks into `page-inline.css` for every HTML page.
3. **Injects UI Pro Max stylesheets**: Adds `<link rel="stylesheet">` for `ui-pro-max.css` and `ui-pro-max-components.css` to every page.
4. **Injects analytics guard**: Adds `plausible-guard.js` before `plausible.js` on every page.
5. **Validates CSP**: Throws if any inline `<style>` or `style="..."` attributes remain.

## Retired mitigation

The temporary recursive `sanitizeCatalogForHtml` build injection added before the source-owned Finder refactor has been removed. Persian and English Finder and Compare now construct catalog-driven UI with DOM APIs, validate external HTTPS URLs, constrain provider IDs, and execute malicious payload fixtures in `scripts/test-finder-xss-resilience.mjs`. Reintroducing the build sanitizer is prohibited by `scripts/test-ui-pro-max-contract.mjs` because it would mask source regressions and double-encode legitimate catalog text.

## Why not source-owned now

The remaining shell/layout structure—stylesheet inclusion, analytics guard ordering, CSP-safe asset externalization, and page-style extraction—should be defined in source generators or shared templates rather than patched after build.

## Migration path

1. Generate Finder pages with external assets from the start.
2. Include UI Pro Max stylesheets in a shared base-page template.
3. Include `plausible-guard.js` in the base template before `plausible.js`.
4. Move page-specific CSS into source-owned external stylesheets.
5. Remove this script after source/generated parity tests cover the replacement.

## Regex usage

Yes—multiple regexes remain for `<style>...</style>` extraction, stylesheet link insertion, and analytics guard injection. No regex or recursive transform rewrites catalog values.

## Idempotency

Partially idempotent: analytics and stylesheet insertion check for existing assets. Externalization is intentionally one-shot because it removes inline blocks.
