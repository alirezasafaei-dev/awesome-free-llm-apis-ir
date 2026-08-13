# Open Source & Dependency Policy

This repository follows an **OSS-first, custom-when-differentiating** policy.

## Scope

The policy applies to `llm.persiantoolbox.ir` and the repository `alirezasafaei-dev/awesome-free-llm-apis-ir`.

## Decision rule

Before implementing a new capability, classify it:

1. **Commodity behavior** — generic UI/browser/build behavior that many projects solve the same way.
   - Prefer a mature, maintained open-source package when it is safer/smaller than custom code.
2. **Repository differentiator** — evidence semantics, Iran-access classification, freshness, provider data, ranking/advisor logic, SEO/data contracts, privacy or release invariants.
   - Keep repository-owned unless a library clearly preserves the exact contract.

A new dependency must have a named use case. "May be useful later" is not sufficient.

## Admission criteria

A dependency is approved only when all of the following are true:

- solves an immediate problem better than a small local implementation;
- actively maintained or demonstrably stable;
- has an acceptable license and no unresolved distribution/trademark concern;
- does not require a runtime third-party CDN/service when a same-origin option exists;
- does not weaken CSP, privacy, evidence or deployment contracts;
- is pinned in `package-lock.json`;
- has focused tests covering the integration boundary;
- does not pull a disproportionate dependency tree for a trivial feature;
- can be removed or replaced without rewriting repository-specific data/evidence logic.

## Default license posture

Generally acceptable with normal review: MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0 and CC0.

Copyleft or source-available licenses require explicit review before adoption. Do not assume that a library-level license clears the license/trademark status of bundled artwork or brand assets.

For brand icons, review the individual brand metadata/guidelines before publication.

## Runtime and supply-chain rules

- Prefer same-origin, self-hosted browser assets.
- No `@latest` CDN URLs in production HTML.
- No runtime dependency on jsDelivr, unpkg, Iconify API or similar asset CDNs for core UI.
- Prefer build-time extraction of the exact assets used rather than shipping an entire package dataset.
- Do not accept arbitrary executable HTML/SVG/JS from admin content.
- Avoid package lifecycle/install scripts where practical; investigate packages that require them.
- Keep Dependabot enabled and review lockfile changes as code changes.
- Security/privacy tests are never relaxed to accommodate a dependency.

## Approved stack

### Adopt now

- **SortableJS** — Discover admin drag/drop ordering. Must be self-hosted from the pinned npm package and paired with an accessible non-drag fallback.
- **Simple Icons** — build-time generation of an allowlisted subset of brand SVGs. Individual brand trademark/license metadata must be checked; arbitrary SVG input is forbidden.

### Approved only when triggered by need

- **Iconify (offline/build-time only)** — when a broad generic icon catalog or icon picker becomes necessary.
- **Fuse.js** — when analytics/feedback demonstrates typo/fuzzy-search misses that normalized substring search cannot handle.
- **Alpine.js** — when the admin develops enough reactive state that Vanilla JS becomes materially harder to maintain.

### Requires a separate architecture RFC/PR

- **Astro** — possible static-site component modernization after the Discover pilot.
- Any SPA/full-stack framework migration such as React/Next.js/Vue/Nuxt.
- CSS framework replacement such as Tailwind or Bootstrap.
- Database/ORM/platform migration away from the current Node + SQLite pilot architecture.

## Dependency budget review

Every PR adding a dependency must state:

- problem solved;
- why existing platform APIs/local code are insufficient;
- license;
- runtime vs build-time role;
- whether network access is required at runtime;
- expected browser/server payload impact;
- security/privacy impact;
- tests added;
- removal/rollback path.

## Current architectural preference

Keep the production model simple:

- Node-based deterministic build;
- static HTML/CSS/JS for public pages;
- small Node sidecars only where dynamic state is actually required;
- SQLite for the current single-node Discover pilot;
- Caddy for canonical TLS/proxy/auth boundaries;
- OSS primitives for generic interaction mechanics;
- repository-owned logic for evidence, trust, ranking and release semantics.
