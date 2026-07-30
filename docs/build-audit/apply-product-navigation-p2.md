# Build Transform Audit: `apply-product-navigation-p2.mjs`

**Decision:** `REPLACE_WITH_COMPONENT`

## Current behavior

Replaces the topbar navigation `<nav>` content in 7 product pages with the correct set of links and active-page marker. Injects responsive navigation CSS into `ux-clarity.css`.

## Why not source-owned now

The navigation markup is a site-wide concern that varies per page (active link, language toggle). Each page should declare its context in a shared template rather than having navigation injected post-build.

## Migration path

1. Create a shared navigation template/component.
2. Use the site generator to include the correct navigation in each page at build time.
3. Include the responsive CSS in a shared stylesheet source.
4. Remove this script.

## Regex usage

Yes — regex `<header class="topbar">...<nav ...>...</nav>` to locate the nav container. Depends on exact class/attribute order.

## Idempotency

Partially idempotent: checks for existing changes before writing CSS marker.
