# Build Transform Audit: `apply-serp-metadata-p1.mjs`

**Decision:** `REMOVED` — migrated to source-owned metadata

## Previous behavior

Overrides `<title>`, `<meta name="description">`, Open Graph, and Twitter Card metadata on 15 specific pages (guides and product pages). Used a hardcoded map of page paths to metadata overrides.

## Migration completed

### Previous mutation inventory

- 14 pages patched via regex title/meta replacement
- Hardcoded metadata map in `scripts/apply-serp-metadata-p1.mjs`
- Partially idempotent (checked if file changed before writing)

### New owner

Source content frontmatter and HTML templates now own all SERP metadata:

- **Static HTML pages**: `site/en/index.html`, `site/en/api-finder/index.html`, `site/en/quick-start/index.html` — updated `<title>` and `<meta name="description">` directly in source
- **Persian content guides**: `content/fa/*.md` — frontmatter `title` field
- **English content guides**: `content/en/*.md` — frontmatter `title` and `description` fields
- **Generated provider pages**: `build-site.mjs` `providerPage()` — title already correct from template
- **Generated guide pages**: `build-guides.mjs` — title already correct from guide definition

### Deleted behavior

- Removed `scripts/apply-serp-metadata-p1.mjs`
- Removed `node scripts/apply-serp-metadata-p1.mjs &&` from `site:build` pipeline in `package.json`

### Retained validation

- `scripts/test-serp-metadata.mjs` (`seo:serp:test`) — still validates all indexable pages have title 20-65 chars and description 70-170 chars
- No regex title/meta replacement remains in the build pipeline

### Rollback method

Restore `scripts/apply-serp-metadata-p1.mjs` from git history and re-add to `site:build` pipeline. Revert source metadata changes.

## Evidence

- All 15 pages previously patched now produce correct metadata from source
- SERP metadata test passes without post-build transform
- Second build produces identical output (idempotency maintained)
