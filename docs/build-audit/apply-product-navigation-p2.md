# Build Transform Audit: `apply-product-navigation-p2.mjs`

**Decision:** `REMOVED` — migrated to source-owned navigation

## Previous behavior

Replaced the topbar navigation `<nav>` content in 7 product pages with the correct set of links and active-page marker. Injected responsive navigation CSS into `ux-clarity.css`.

## Migration completed

### Previous mutation inventory

- 7 pages patched via regex topbar nav replacement
- Navigation CSS appended to `ux-clarity.css` with marker
- Partially idempotent (checked CSS marker before writing)

### New owner

Source HTML templates and shared CSS now own all product navigation:

- **Static HTML pages**: `site/api-finder/index.html`, `site/quick-start/index.html`, `site/compare/index.html` — standard 6-link Persian nav + EN language switch + theme toggle (api-finder only)
- **Static HTML pages**: `site/en/api-finder/index.html`, `site/en/quick-start/index.html`, `site/en/compare/index.html` — standard 5-link English nav + فارسی language switch
- **Generated tools page**: `scripts/build-tools-pages.mjs` — standard tools nav with active state
- **CSS**: `site/ux-clarity.css` — navigation styles (active page, language link, mobile overflow-x)
- **Shared module**: `scripts/lib/site-nav.mjs` — deterministic navigation renderer (used by tests, available for future generators)

### Deleted behavior

- Removed `scripts/apply-product-navigation-p2.mjs`
- Removed `node scripts/apply-product-navigation-p2.mjs &&` from `site:build` pipeline in `package.json`

### Retained validation

- `scripts/test-product-navigation.mjs` (`ux:navigation:test`) — still validates all 7 pages have correct nav labels, aria-current, and CSS
- No post-build nav replacement remains in the build pipeline

### Rollback method

Restore `scripts/apply-product-navigation-p2.mjs` from git history and re-add to `site:build` pipeline. Revert source nav changes.

## Evidence

- All 7 product pages now produce correct navigation from source
- Navigation test passes without post-build transform
- Provider and guide pages retain their own nav sections (not in scope of this transform)
