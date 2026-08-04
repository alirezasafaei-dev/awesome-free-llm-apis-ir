# Build Transform Audit: `apply-ux-seo-p0.mjs`

**Decision:** `REMOVED` — migrated to source-owned UX/SEO P0

## Previous behavior

1. Restructured the catalog filter form in `index.html` to expose search and make advanced filters collapsible.
2. Added `<link rel="alternate" hreflang>` tags to 7 product pages.
3. Asserted Finder source semantics (read-only validation).
4. Appended catalog filter CSS to `ux-clarity.css`.

## Migration completed

### Previous mutation inventory

- 1 page patched via regex catalog form restructuring
- 7 pages patched via hreflang injection
- 2 Finder pages validated (read-only)
- CSS appended to `ux-clarity.css` with marker
- Not idempotent (used marker-based skip)

### New owner

Source HTML templates and CSS now own all UX/SEO P0 behavior:

- **Catalog search shell**: `site/index.html` — source already has `<form class="catalog-filter-shell">` with exposed search
- **Hreflang alternates**: `site/api-finder/index.html`, `site/quick-start/index.html` — added missing `en` alternate
- **CSS**: `site/ux-clarity.css` — catalog filter shell styles added to source
- **Finder assertion**: `scripts/test-ux-seo-p0.mjs` — still validates Finder semantics as read-only test
- **Finder assertion**: `scripts/test-finder-ranking-semantics.mjs` — additional validation

### Deleted behavior

- Removed `scripts/apply-ux-seo-p0.mjs`
- Removed `node scripts/apply-ux-seo-p0.mjs &&` from `site:build` pipeline in `package.json`

### Retained validation

- `scripts/test-ux-seo-p0.mjs` (`ux:seo:p0:test`) — still validates catalog search visibility, Finder semantics, and hreflang alternates
- No post-build form restructuring or hreflang injection remains

### Rollback method

Restore `scripts/apply-ux-seo-p0.mjs` from git history and re-add to `site:build` pipeline. Revert source changes.

## Evidence

- All UX/SEO P0 assertions pass without post-build transform
- Catalog search shell is source-owned in `site/index.html`
- Hreflang alternates are source-owned in all product pages
- CSS is source-owned in `site/ux-clarity.css`
