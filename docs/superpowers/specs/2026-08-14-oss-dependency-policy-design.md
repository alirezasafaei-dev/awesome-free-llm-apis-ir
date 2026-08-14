# OSS Acceleration & Dependency Policy — llm.persiantoolbox.ir

**Date:** 2026-08-14  
**Repository:** `alirezasafaei-dev/awesome-free-llm-apis-ir`  
**Scope:** `llm.persiantoolbox.ir` and its `/discover` pilot only.  
**Status:** Owner-approved design.

## 1. Goal

Speed up development without sacrificing reliability, privacy, accessibility, security, deterministic builds, or the repository's evidence-first behavior.

The default rule is:

> **OSS first for commodity behavior; custom code only for repository-specific differentiation or when a dependency would create more risk than it removes.**

This policy is intentionally conservative. It does not authorize a framework migration or a rewrite of the existing static/Node architecture.

## 2. Existing architecture to preserve

Keep the current architecture unless measured product needs justify a later change:

- Node.js build scripts for the static site.
- Static HTML/CSS/JavaScript for public pages.
- Existing SEO, privacy, analytics, validation, and release checks.
- Caddy as the canonical reverse proxy and production auth boundary.
- `/discover` as a small Node.js sidecar using built-in `node:http` and `node:sqlite`.
- SQLite persistence outside the static release tree.
- Canonical/global-only dynamic Discover data plane in Phase 1.

Do not introduce React, Vue, Next.js, Tailwind, Bootstrap, Prisma, Supabase, Firebase, or a second application runtime for the current Discover work.

Astro is a future, independent modernization candidate for the static site and must not be coupled to Discover activation.

## 3. Approved OSS acceleration set

### 3.1 SortableJS — approved now

Use SortableJS for drag-and-drop ordering in the Discover admin instead of implementing pointer/touch reordering manually.

Requirements:

- same-origin/local asset only; no CDN;
- exact dependency resolved through the repository lockfile;
- keyboard-accessible non-drag fallback remains available through explicit ordering controls;
- drag operations must persist deterministic integer `sort_order` values through the existing admin API;
- UI must remain usable on touch devices and without drag support;
- dependency must not obtain network access or collect analytics.

### 3.2 Simple Icons — approved now for brand icons

Use the `simple-icons` package as the only new brand-icon source in the first implementation cycle.

Requirements:

- no browser request to Simple Icons or another external icon service;
- no arbitrary remote image URL stored or rendered as an icon;
- icon names are validated against the locally installed package;
- brand/trademark usage remains subject to the brand owner's rules;
- unknown or unavailable brand icons fall back to a generic local icon.

### 3.3 Generic icon source — approved for future local/offline use, not installed now

A generic open-source icon set may later be consumed through local/offline Iconify-compatible data if measured product needs require icons beyond brand marks.

For the first implementation cycle, do **not** add an Iconify runtime, Iconify public API, or a generic icon package. Use the repository-owned generic fallback SVG instead.

Any later generic icon package must remain same-origin/offline, bounded, and explicitly reviewed under the dependency admission gate below.

### 3.4 Fuse.js — conditional, not installed now

Do not add Fuse.js yet. Add it only after analytics or reproducible UX tests show that normalized substring search causes meaningful misses (for example spelling variants or common typos).

### 3.5 Alpine.js — conditional, not installed now

Do not migrate the current admin to Alpine.js yet. Re-evaluate only if admin state/interactions grow enough that the vanilla implementation becomes materially harder to test or maintain.

## 4. Discover icon data model

The current `icon:<value>` encoding inside `badges` is a transitional implementation and must not become the permanent data contract.

Introduce explicit icon fields through an additive SQLite migration:

- `icon_provider`: constrained to `simple-icons` or `generic` in the first implementation cycle.
- `icon_key`: validated provider-specific key. For `generic`, the only first-cycle value is the repository fallback key `sparkles`.

Rules:

- Existing records must remain readable during migration.
- If a legacy `icon:<value>` badge is present, migration converts it once where possible and removes only that metadata token; ordinary badges remain unchanged.
- Public API responses expose normalized `icon_provider` and `icon_key`, not the legacy badge token.
- Invalid/missing icons resolve to `generic:sparkles` for reads; invalid admin mutations are rejected before storage.
- Arbitrary SVG/HTML, JavaScript URLs, external image URLs, emoji-as-markup, and untrusted data URIs are not accepted as icon input.
- Selecting any icon already available in the installed `simple-icons` package requires zero static-site deploy.

## 5. Local icon delivery — locked design

The first implementation cycle uses a same-origin sidecar endpoint, not client-side icon packages and not a third-party API.

Flow:

1. `simple-icons` is an exact lockfile-resolved production dependency available to the Discover service release.
2. The sidecar validates `icon_provider` + `icon_key` against the locally installed icon source.
3. Brand icons are served through `GET /discover/api/icons/simple-icons/:key.svg`.
4. The endpoint returns a minimal sanitized SVG generated only from trusted package data, with `image/svg+xml`, `X-Content-Type-Options: nosniff`, a bounded cache policy, no scripts/events/foreign objects, and no user-supplied SVG fragments.
5. `generic:sparkles` resolves to a repository-owned same-origin fallback SVG; it does not require a package lookup.
6. Public cards render icons with normal same-origin `<img>` references. The browser never contacts third-party icon infrastructure.
7. Unknown icon GET requests return a deterministic 404 or generic fallback according to the API contract; they never proxy or fetch remotely.

Package/deploy rule:

- The Discover release process must package/install the lockfile-resolved production dependency in a deterministic, bounded way.
- No `npm install` occurs per request or as an uncontrolled production mutation.
- The deployment contract must fail before activation if the required icon package or fallback asset is absent.

This preserves strict CSP and zero-deploy catalog edits for any brand icon already present in the deployed package version.

## 6. Dependency admission gate

A new production dependency is allowed only when all of the following are true:

1. It solves a generic problem that is not a differentiating part of this repository.
2. It is actively maintained enough for production use at the time of adoption.
3. Its license and bundled asset licenses are reviewed and compatible with intended use.
4. It does not require a new third-party runtime service for normal page operation.
5. It does not weaken CSP, privacy, evidence, or validation rules.
6. It materially reduces implementation or maintenance risk compared with custom code.
7. It has a bounded bundle/runtime cost appropriate to the feature.
8. It can be pinned by the lockfile and monitored by Dependabot or equivalent repository automation.
9. Tests cover the behavior that the dependency is responsible for.
10. Removal/replacement remains technically feasible without rewriting repository-specific data semantics.

If any gate fails, keep the existing implementation or evaluate another package.

## 7. Package and supply-chain rules

- No CDN dependencies in production pages.
- No unpinned GitHub script URLs.
- No runtime `npm install` on ordinary page requests.
- Lockfiles are mandatory for adopted packages.
- GitHub Actions remain pinned to full commit SHAs according to existing repository policy.
- Keep production dependency count intentionally small.
- Do not run package post-install behavior with elevated production privileges unless explicitly audited and required.
- Dependency updates must pass the same Discover, privacy, UI, build, and release gates as repository code.
- A dependency must never be used to bypass or weaken a failing repository test.

## 8. What remains custom

Keep repository-specific logic under repository control:

- provider/evidence schema and validation;
- Iran-access semantics and evidence classes;
- freshness rules;
- free-tier/account-requirement presentation;
- provider recommendation/scoring logic;
- SEO semantics and source-backed content generation;
- privacy-safe analytics event semantics;
- Discover catalog schema/business rules;
- deployment, revision verification, rollback, and canonical/mirror invariants.

These are product/data semantics, not generic UI commodities.

## 9. Discover implementation changes covered by this design

The first implementation cycle after this spec is approved is limited to:

1. finish the missing controlled Discover deployment workflow and full `discover:test` aggregation already required by the existing Discover plan;
2. replace the legacy badge-encoded icon contract with explicit additive icon fields;
3. add lockfile-resolved `simple-icons` service-side brand resolution plus the repository-owned generic fallback;
4. expose the bounded same-origin icon endpoint defined above;
5. add SortableJS-backed admin reordering with an accessible/manual fallback;
6. extend database/API/admin/public/proxy/build/privacy/deploy tests for these changes;
7. preserve zero-deploy routine catalog CRUD after the one-time service activation.

Do not include an Astro migration, general site redesign, fuzzy-search migration, Iconify runtime, generic icon package, or Alpine.js conversion in this implementation cycle.

## 10. Data and request flow

```text
Admin browser
  -> Caddy Basic Auth
  -> /discover/admin/
  -> JSON + CSRF-protected /discover/api/admin/*
  -> Node Discover sidecar
  -> SQLite

Public browser
  -> /discover/
  -> /discover/api/tools
  -> normalized catalog + icon identifiers
  -> /discover/api/icons/simple-icons/:key.svg OR local generic fallback

SortableJS (local asset)
  -> browser-only ordering interaction
  -> normalized integer ordering mutation
  -> existing protected admin API
```

No external runtime dependency is added to the public request path.

## 11. Failure and fallback behavior

- Icon package lookup failure: public card renders the generic local icon; it does not break the card or trigger a remote request.
- Unknown icon key in an admin mutation: validation error; existing valid records stay unaffected.
- Unknown icon GET: deterministic bounded response with no remote fallback/proxy behavior.
- JavaScript/Sortable unavailable: manual order field remains functional.
- Dependency asset missing from release: Discover tests/release contract fail before production activation.
- Database migration failure: service activation fails and follows the existing code rollback/DB backup boundary; never silently recreate or discard the persistent DB.
- Third-party package update regression: reject the update; do not weaken tests.

## 12. Testing requirements

`npm run discover:test` must become the single local/CI aggregation point for all Discover contracts and include, at minimum:

- SQLite additive schema migration and CRUD;
- legacy badge-icon migration behavior;
- API security and validation;
- icon endpoint content type, validation, sanitization contract, cache policy, and no remote fallback;
- admin UI CRUD/delete/order/icon controls;
- public UI search/filter/card/icon behavior;
- Sortable local-asset delivery and manual ordering fallback;
- Caddy/admin protection and mirror isolation;
- service installer/dependency packaging/persistent DB/backup/rollback contract;
- controlled global-only deployment workflow contract;
- static build inclusion and CSP/privacy invariants.

The existing repository gates remain required. This feature does not authorize changing provider evidence or freshness dates merely to obtain a green build.

## 13. Success criteria

This design is successfully implemented when:

- routine Discover content edits remain zero-deploy;
- admin ordering is faster and touch-friendly without sacrificing accessibility;
- icons are structured data rather than badge metadata;
- brand icons are served from trusted local package data via the same origin;
- no third-party runtime icon request exists;
- the production dependency surface remains small and documented;
- all Discover contracts and required repository gates pass without weakening privacy/evidence rules;
- the existing Node/SQLite/Caddy deployment model remains intact.

## 14. Deferred work

Explicitly deferred to later, evidence-driven work:

- Astro evaluation/migration for the broader static site;
- Fuse.js fuzzy search;
- Alpine.js admin migration;
- Iconify/generic icon package adoption;
- multi-user admin/auth roles;
- remote user-submitted images or arbitrary icon uploads;
- external SaaS database/auth/CDN dependencies.
