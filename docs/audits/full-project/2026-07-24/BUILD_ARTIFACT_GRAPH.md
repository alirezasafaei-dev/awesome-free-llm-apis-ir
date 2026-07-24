# BUILD ARTIFACT GRAPH

**Date:** 2026-07-24

```
Source (data/providers/*.json, content/providers/*.json)
  │
  ├── validate.mjs → validation report
  ├── generate-catalog.mjs → catalog.json
  ├── generate-data-json.mjs → data.json
  ├── generate-readme.mjs → README.md (provider table)
  ├── build-site.mjs → .site-dist/ (HTML pages)
  │     ├── build-english-content.mjs → .site-dist/en/guides/
  │     └── content:fa:build → .site-dist/guides/
  │
  └── build-site-production.mjs (orchestrates enrichment)
        ├── enrich-seo-pages.mjs → JSON-LD, editorial sections
        ├── register-static-routes.mjs → sitemap, llms.txt, build-meta, nav links
        ├── build-tools-pages.mjs → tools pages
        ├── normalize-tools-home-links.mjs → canonical tool URLs
        ├── register-compare-route.mjs → compare route, shortlist assets
        ├── enrich-provider-pages.mjs → editorial content in provider pages
        │
        └── Phase 2 (apply-* scripts):
              ├── apply-ux-seo-p0.mjs → catalog search, hreflang, finder validation
              ├── apply-serp-metadata-p1.mjs → SERP title/description overrides
              ├── apply-product-navigation-p2.mjs → nav bar
              ├── apply-finder-ranking-p3.mjs → ranking validation (read-only)
              ├── apply-site-footer-p4.mjs → shared footer
              └── apply-ui-pro-max-shell.mjs → CSP hardening, CSS/JS externalization
```

## Generated artifacts

| Artifact | Generator | Test | Deployment target |
|----------|-----------|------|-------------------|
| catalog.json | generate-catalog.mjs | catalog:check | All three targets |
| data.json | generate-data-json.mjs | data:test | All three targets |
| .site-dist/ | build-site-production.mjs | site:check | All three targets |
| README.md (table) | generate-readme.mjs | generate:check | GitHub (committed) |
| catalog-tools.json | generate-tool-catalog.mjs | generate:tools:check | All three targets |
| build-meta.json | build-site.mjs | deployment:artifact:test | All three targets |
| sitemap.xml | build-site.mjs + register-* scripts | seo:public-routes:test | All three targets |

## Determinism

All generators are deterministic for the same input data. Dates in sitemap use current date (fixed in this audit from previously hardcoded values). `source_revision` in `build-meta.json` is set by CI env var (deterministic per build).