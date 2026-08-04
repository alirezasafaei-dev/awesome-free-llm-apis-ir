# Build Transform Audit: `apply-site-footer-p4.mjs`

**Decision:** `REMOVED` — migrated to source-owned footer

## Previous behavior

Scans all `.html` files in `.site-dist/`, upgrades the footer to a shared markup pattern using a library module (`lib/site-footer.mjs`). Skips `404.html` and `noindex` pages. Injects `ux-clarity.css` link if missing.

## Migration completed

### Previous mutation inventory

- 54+ pages patched via footer replacement
- Library module `lib/site-footer.mjs` used for rendering
- Skipped `404.html` and `noindex` pages
- Partially idempotent

### New owner

Source HTML templates and generator functions now own all footers:

- **Static HTML pages**: `site/index.html`, `site/api-finder/index.html`, `site/quick-start/index.html`, `site/compare/index.html`, `site/methodology/index.html`, `site/en/index.html`, `site/en/api-finder/index.html`, `site/en/quick-start/index.html`, `site/en/compare/index.html` — all have correct shared footer in source
- **Generated provider pages**: `scripts/build-site.mjs` — footer with `../../` prefix
- **Generated guide pages**: `scripts/build-guides.mjs` — footer with `../../` prefix
- **Generated Persian content**: `scripts/build-persian-content.mjs` — footer with `../../` prefix
- **Generated English content**: `scripts/build-english-content.mjs` — footer with `../../../` prefix
- **Generated tools page**: `scripts/build-tools-pages.mjs` — footer with `../` prefix
- **Library retained**: `scripts/lib/site-footer.mjs` — kept for unit tests and future use

### Deleted behavior

- Removed `scripts/apply-site-footer-p4.mjs`
- Removed `node scripts/apply-site-footer-p4.mjs &&` from `site:build` pipeline in `package.json`

### Retained validation

- `scripts/test-site-footer-contract.mjs` (`ux:footer:test`) — still validates all pages have correct footer structure, links, and labels
- No post-build footer replacement remains in the build pipeline

### Rollback method

Restore `scripts/apply-site-footer-p4.mjs` from git history and re-add to `site:build` pipeline. Revert source footer changes.

## Evidence

- All pages now produce correct shared footer from source
- Footer contract test passes without post-build transform
- `404.html` retains its minimal footer (excluded from contract)
