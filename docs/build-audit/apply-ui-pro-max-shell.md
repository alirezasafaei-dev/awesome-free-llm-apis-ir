# Build Transform Audit: `apply-ui-pro-max-shell.mjs`

**Decision:** `REPLACE_WITH_COMPONENT`

## Current behavior

1. **Externalizes Finder assets**: Moves inline `<style>` and `<script>` from Finder pages into external `finder-core.css` and `finder-core.js` files (CSP compliance).
2. **Externalizes page styles**: Moves all remaining inline `<style>` blocks into `page-inline.css` for every HTML page.
3. **Injects UI Pro Max stylesheets**: Adds `<link rel="stylesheet">` for `ui-pro-max.css` and `ui-pro-max-components.css` to every page.
4. **Injects analytics guard**: Adds `plausible-guard.js` before `plausible.js` on every page.
5. **Validates CSP**: Throws if any inline `<style>` or `style="..."` attributes remain.

## Why not source-owned now

The shell/layout structure (stylesheets, analytics guard, CSP-safe asset externalization) should be defined in the source generator, not patched in after build.

## Migration path

1. Generate pages with external assets from the start in `build-site.mjs`.
2. Include UI Pro Max stylesheets in the base page template.
3. Include `plausible-guard.js` in the base template before `plausible.js`.
4. Remove this script.

## Regex usage

Yes — multiple regexes for `<style>...</style>` extraction, stylesheet link insertion, and analytics guard injection.

## Idempotency

Partially idempotent: checks for `plausible-guard.js` to avoid double-injection. Externalization is one-shot (removes inline blocks).
