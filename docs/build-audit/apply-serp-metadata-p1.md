# Build Transform Audit: `apply-serp-metadata-p1.mjs`

**Decision:** `REPLACE_WITH_COMPONENT`

## Current behavior

Overrides `<title>`, `<meta name="description">`, Open Graph, and Twitter Card metadata on 15 specific pages (guides and product pages). Uses a hardcoded map of page paths to metadata overrides.

## Why not source-owned now

Each page's default title/description comes from the build generator. The overrides correct missing or weak metadata. These are static values per-page and should be in the source templates or content frontmatter.

## Migration path

1. Add title/description frontmatter to each markdown content file (guides) or HTML page.
2. Update the generator (`build-site.mjs` / `enrich-seo-pages.mjs`) to use source-defined metadata.
3. Remove this script.

## Regex usage

Yes — `/<title>[\s\S]*?<\/title>/i` for title replacement, `<meta ... content="...">` for description. Properly escapes with `replaceAll`.

## Idempotency

Partially idempotent: script checks if file changes before writing. Re-running applies same overrides.
