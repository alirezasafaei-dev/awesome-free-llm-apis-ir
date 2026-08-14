# OSS Acceleration Design for Discover and the LLM Site

**Status:** approved direction for implementation on PR #250

## Goal

Adopt a small, explicit open-source acceleration layer for `llm.persiantoolbox.ir` so commodity UI behavior is reused instead of reimplemented, while preserving the repository's existing evidence model, static build architecture, privacy posture, CSP, deployment controls, and low dependency surface.

This work applies only to `alirezasafaei-dev/awesome-free-llm-apis-ir` and the canonical `llm.persiantoolbox.ir` deployment. It does not involve `persiantoolbox.ir` or its repository/server.

## Design principles

1. **OSS first for commodity behavior.** Reuse mature libraries for generic browser/UI primitives when they are smaller and safer than custom implementations.
2. **Custom code for differentiators.** Keep provider evidence, Iran-access semantics, freshness, ranking/advisor logic, catalog schemas, SEO semantics, privacy rules, and deployment invariants repository-owned.
3. **No runtime CDN dependencies.** Browser assets must be served from the canonical site and remain compatible with the current self-only CSP.
4. **Dependency budget is intentional.** Every package needs a concrete use case, acceptable license, maintained upstream, lockfile pinning, and tests.
5. **No framework migration inside PR #250.** React, Vue, Next.js, Tailwind, Bootstrap, and a whole-site Astro migration are out of scope for the Discover pilot.
6. **Progressive adoption.** Add only dependencies that solve an immediate measured implementation problem. Deferred options stay deferred until the trigger exists.

## Approved dependency set

### Immediate: SortableJS

Use SortableJS for drag-and-drop ordering in `/discover/admin/`.

Reasons:
- framework-independent and compatible with the current Vanilla JS frontend;
- touch/mobile support and drag handles;
- maintained upstream;
- MIT licensed;
- eliminates custom drag/drop mechanics.

Integration rules:
- install through npm and pin through `package-lock.json`;
- self-host the browser artifact as part of the site build; no jsDelivr/unpkg runtime use;
- keep an accessible fallback: the numeric `sort_order` field remains usable and/or explicit move controls remain available;
- persist reorder changes through one atomic admin API operation, not a burst of full-record PUT requests.

### Immediate: Simple Icons for brand assets

Use the `simple-icons` npm package at build time to generate only allowlisted brand SVG files used by Discover records.

Rules:
- do not load icons from an external CDN;
- never accept arbitrary SVG markup from the admin or database;
- store only a validated icon key in content records;
- resolve the key against an allowlisted local registry during build/runtime rendering;
- check the per-brand license/trademark metadata before adding a new brand icon;
- provide a neutral local fallback when a brand icon is not approved or unavailable.

### Deferred: Iconify

Iconify remains approved as a future source/normalization layer if Discover requires a broad generic icon catalog or an icon picker. It must be used offline/build-time; the public Iconify API is not a production dependency.

Do not add it in this change unless Simple Icons plus the local fallback is insufficient for an immediate requirement.

### Deferred: Fuse.js

Add Fuse.js only when search quality data demonstrates typo/fuzzy-search misses. Current substring/normalized search is adequate for the current catalog size.

### Deferred: Alpine.js

Add Alpine.js only if admin state grows beyond a small maintainable Vanilla JS module (for example multi-select, bulk actions, complex dialogs, live previews, or multi-step forms).

### Separate future RFC: Astro

Astro is a candidate for a later static-frontend modernization because it can preserve static output while replacing large template-string page generators with components. It must be evaluated in a separate PR/RFC after the Discover pilot and must not block #250.

## Discover data-model change

Replace the temporary `icon:<value>` marker stored inside `badges` with a first-class `icon_key` field.

Proposed contract:

```json
{
  "icon_key": "brand:mistralai",
  "badges": ["رایگان", "اندروید"]
}
```

Rules:
- `icon_key` is optional and bounded;
- accepted values are namespaced keys such as `brand:<slug>` or a small set of repository-owned generic fallback keys;
- the API never accepts raw SVG/HTML in `icon_key`;
- old pre-production `icon:*` badge data is migrated/normalized without losing the visible icon where practical;
- public API output exposes the normalized `icon_key` and badges no longer carry icon metadata.

## Admin ordering design

The existing `sort_order` field remains the canonical persisted order value. SortableJS changes only the interaction layer.

Add an authenticated endpoint such as:

`PUT /discover/api/admin/reorder`

with a bounded payload of ordered record IDs. The server validates that IDs are unique and known, then updates all affected `sort_order` values in one SQLite transaction. Public list ordering remains deterministic and server-owned.

Admin behavior:
- drag handle on each tool row;
- touch support;
- optimistic visual movement is allowed, but success state is shown only after the server accepts the reorder;
- on failure, reload authoritative order from the API;
- keyboard/numeric fallback remains available.

## Static asset integration

The build pipeline remains Node-based and static. Add a small vendor/icon build step that:

1. copies the pinned SortableJS browser artifact into the built Discover asset tree;
2. generates only allowlisted Simple Icons SVGs referenced by the local registry;
3. does not copy entire package trees into `.site-dist`;
4. fails deterministically if an allowlisted icon slug no longer exists upstream;
5. keeps all runtime browser requests same-origin.

No bundler is introduced solely for these dependencies.

## Security and privacy constraints

- Existing Basic Auth, same-origin enforcement, JSON-only mutations, CSRF header requirement, HTTPS-only destinations, CSP, and loopback-only sidecar remain unchanged.
- Dependency adoption must not weaken any existing security/privacy contract test.
- No remote icon/image fetch is introduced by default.
- No user search text, destination URL, credential, or persistent browser identifier is added to analytics.
- Dependency install scripts should be avoided where feasible; dependencies remain covered by Dependabot and lockfile review.

## Test strategy

Implementation is TDD-first.

Required new/updated coverage:
- validation/database contract for first-class `icon_key` and legacy badge migration;
- API contract for atomic reorder success, unknown/duplicate IDs, payload bounds, and auth/mutation protections;
- public UI contract for safe local icon rendering and no remote image dependency;
- admin contract for SortableJS local asset, drag handles, and reorder request behavior;
- build contract proving vendor/icon assets are self-hosted and bounded;
- dependency-policy contract or review checklist preventing runtime CDN additions;
- `npm run discover:test` must aggregate every Discover contract;
- `npm test`, `npm run site:build`, and `npm run site:check` remain required before release.

## Out of scope

- whole-site framework migration;
- replacing Node `http`/`sqlite` with Express/Fastify/ORM/Supabase/PostgreSQL;
- replacing Caddy Basic Auth with a SaaS identity product;
- fuzzy search before evidence of need;
- external icon CDNs or arbitrary user-supplied SVG;
- changes to provider evidence/freshness data to make unrelated tests pass.

## Definition of done

- repository contains an explicit OSS/dependency policy;
- SortableJS and Simple Icons are pinned and used only for the approved purposes;
- Discover has first-class `icon_key` instead of badge metadata;
- admin ordering uses SortableJS plus an atomic server-side reorder operation;
- all browser assets are same-origin/self-hosted;
- full Discover suite runs in CI;
- repository-wide required gates pass without weakening evidence or privacy rules;
- production activation remains a separate controlled release step after PR verification.
