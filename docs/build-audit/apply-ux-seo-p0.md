# Build Transform Audit: `apply-ux-seo-p0.mjs`

**Decision:** `MOVE_TO_SOURCE`

## Current behavior

Runs after `build-site-production.mjs` + `content:fa:build`. Performs:
1. **Catalog search refactor** (`.site-dist/index.html`): Restructures the filter HTML from a flat `<form>` to a shell with exposed search + collapsible advanced filters. Uses regex replacement on the built HTML.
2. **Locale alternate injection** (`*/*/index.html`): Appends `<link rel="alternate" hreflang="...">` tags for 6 product pages (Finder, Compare, Quick Start, Tools) and their English counterparts.
3. **Finder source semantics assertion** (`api-finder/index.html`): Validates that the built Finder pages use correct ranking labels and no stale language-scoring markers. Read-only assertion, no mutation.

## Why not source-owned now

- The catalog search refactor restructures generated HTML that the build script (`build-site.mjs`) produces. Moving the shell structure into the generator would be cleaner.
- Locale alternates are static per-page and should be in each page's source template, not injected after build.

## Migration path

1. Move catalog filter shell structure into `build-site.mjs` or the HTML generator so it produces the correct DOM from the start.
2. Add static `<link rel="alternate">` tags to each source HTML template.
3. Keep the Finder assertion as a standalone test (like `apply-finder-ranking-p3.mjs` is already validation-only).
4. Remove this script.

## Regex usage

Yes — the catalog refactor uses regex to find and restructure the filter form. This is fragile and depends on exact HTML structure remaining stable.

## Idempotency

Not idempotent: the script mutates files and checks for its own marker to skip re-application.
