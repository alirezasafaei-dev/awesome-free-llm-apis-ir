# Build Transform Audit: `apply-site-footer-p4.mjs`

**Decision:** `REPLACE_WITH_COMPONENT`

## Current behavior

Scans all `.html` files in `.site-dist/`, upgrades the footer to a shared markup pattern using a library module (`lib/site-footer.mjs`). Skips `404.html` and `noindex` pages. Injects `ux-clarity.css` link if missing.

## Why not source-owned now

The footer is a site-wide component that should be part of each page's source template. Having the build inject it means the source preview doesn't match production.

## Migration path

1. Define the shared footer in a template/component.
2. Include it in each HTML source page directly.
3. Remove `lib/site-footer.mjs` and this script.

## Regex usage

No — uses the `replaceFooter` library function from `lib/site-footer.mjs`.

## Idempotency

Partially idempotent: upgrades the footer but may re-inject ux-clarity.css link if run multiple times.
