# Discover OSS Acceleration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the production-safe Discover release path while replacing custom commodity behavior with a small, local OSS layer: structured icons backed by Simple Icons and touch-friendly ordering backed by SortableJS.

**Architecture:** Preserve the existing static site + Node 22 Discover sidecar + SQLite + Caddy architecture. Add an additive SQLite icon migration, a same-origin sidecar icon endpoint backed by trusted local package data, and a self-hosted SortableJS asset in the admin. Keep all third-party assets off the runtime network path and preserve manual ordering, strict CSP, persistent data, and zero-deploy catalog edits.

**Tech Stack:** Node.js 22.13+, ESM, built-in `node:http` and `node:sqlite`, SQLite, Caddy, Vanilla HTML/CSS/JS, SortableJS, Simple Icons, GitHub Actions.

## Global Constraints

- Scope is only `llm.persiantoolbox.ir` and repository `alirezasafaei-dev/awesome-free-llm-apis-ir`.
- No React, Vue, Next.js, Tailwind, Bootstrap, Prisma, Supabase, Firebase, Astro migration, Fuse.js, Alpine.js, Iconify runtime, or external icon API in this cycle.
- No CDN/runtime third-party dependency for page operation.
- Discover remains canonical/global-only in Phase 1; no dynamic Discover DB/service on the Iran mirror.
- SQLite remains outside the static release tree and survives service-code releases.
- Caddy remains the canonical TLS/proxy/Basic-Auth boundary.
- Admin mutations remain JSON + same-origin + `X-Discover-CSRF: 1` protected.
- Existing provider/evidence/freshness data must not be changed merely to obtain green tests.
- Existing privacy, CSP, evidence, deployment, rollback, and revision-verification gates must not be weakened.
- Routine Discover create/edit/publish/unpublish/delete/order/icon changes remain zero-deploy after one-time activation.

---

### Task 1: Lock the complete Discover regression gate

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/discover-smoke.yml`
- Test: existing `scripts/test-discover-*.mjs`

**Interfaces:**
- Produces: `npm run discover:test`, the single local/CI Discover contract aggregation command.

- [ ] Add a failing contract assertion that `package.json` exposes `discover:test` and that Discover smoke invokes it.
- [ ] Run the focused contract and confirm failure before implementation.
- [ ] Add `discover:test` aggregating database, API, public site, admin site, proxy, service/deploy, and workflow contracts.
- [ ] Change `.github/workflows/discover-smoke.yml` to run `npm run discover:test` under Node 22 rather than a database-only test.
- [ ] Run `npm run discover:test` and commit the green aggregation change.

### Task 2: Add explicit icon schema with additive legacy migration

**Files:**
- Modify: `services/discover/database.mjs`
- Modify: `services/discover/validation.mjs`
- Modify: `scripts/test-discover-database.mjs`
- Modify: `scripts/test-discover-api.mjs`

**Interfaces:**
- Input fields: `icon_provider`, `icon_key`.
- Allowed first-cycle providers: `simple-icons`, `generic`.
- Generic key: `sparkles`.
- Public/admin tool DTOs expose normalized `icon_provider` and `icon_key` and never expose a reserved `icon:*` badge token.

- [ ] Extend database tests first for additive columns, legacy `icon:<value>` migration, ordinary badge preservation, normalized reads, and default `generic:sparkles`.
- [ ] Run the focused database test and confirm it fails on the current badge-encoded implementation.
- [ ] Add idempotent migration columns and one-time legacy metadata normalization without rebuilding/discarding the DB.
- [ ] Extend input validation to bounded icon provider/key fields and reject arbitrary SVG/HTML/URLs/data URIs.
- [ ] Update create/update/read methods and API tests to use explicit icon fields.
- [ ] Run database + API tests and commit.

### Task 3: Add trusted same-origin Simple Icons resolver

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `services/discover/icons.mjs`
- Modify: `services/discover/server.mjs`
- Modify: `services/discover/http.mjs` if shared response helpers are needed
- Create: `site/discover/assets/sparkles.svg`
- Modify/Test: `scripts/test-discover-api.mjs`
- Modify/Test: `scripts/test-discover-site.mjs`

**Interfaces:**
- `resolveDiscoverIcon({ provider, key }) -> { kind, contentType, body } | null`.
- Route: `GET /discover/api/icons/simple-icons/:key.svg`.
- Generic fallback: `/discover/assets/sparkles.svg`.

- [ ] Add failing tests for known local icon resolution, unknown key, path traversal rejection, SVG content type, `nosniff`, cache policy, absence of script/event/foreignObject content, and no remote fallback.
- [ ] Add exact lockfile-resolved Simple Icons dependency after license/package metadata review.
- [ ] Implement local package lookup and minimal SVG construction only from trusted package path/title data.
- [ ] Implement bounded same-origin icon GET route without proxy/fetch behavior.
- [ ] Add repository-owned `sparkles.svg` fallback and public-card fallback behavior.
- [ ] Run icon/API/public-site contracts and commit.

### Task 4: Replace admin icon hack with structured controls

**Files:**
- Modify: `site/discover/admin/index.html`
- Modify: `site/discover/admin/admin.js`
- Modify: `site/discover/admin/admin.css`
- Modify: `scripts/test-discover-admin-site.mjs`

**Interfaces:**
- Admin submits `icon_provider` and `icon_key` directly.
- Normal badges never carry icon metadata.

- [ ] Extend the admin contract first to require icon provider/key controls and forbid `icon:` badge encoding.
- [ ] Run the admin test and confirm failure.
- [ ] Replace the legacy icon text/badge conversion logic with explicit controls, validation feedback, and generic fallback defaults.
- [ ] Render a same-origin icon preview without allowing raw HTML/SVG injection.
- [ ] Run admin + API tests and commit.

### Task 5: Add local SortableJS ordering with accessible fallback

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/vendor-discover-assets.mjs`
- Modify: `site/discover/admin/index.html`
- Modify: `site/discover/admin/admin.js`
- Modify: `site/discover/admin/admin.css`
- Create/Generated: `site/discover/admin/vendor/sortable.min.js`
- Modify: `scripts/test-discover-admin-site.mjs`
- Modify: `scripts/test-discover-site.mjs` or focused asset contract

**Interfaces:**
- Self-hosted asset path: `/discover/admin/vendor/sortable.min.js`.
- Manual numeric `sort_order` input remains functional and authoritative fallback.
- Drag end writes deterministic integer order through existing protected admin mutations.

- [ ] Add failing tests requiring a local Sortable asset, no CDN URL, drag handle/list semantics, and retention of manual `sort_order` control.
- [ ] Add exact lockfile-resolved SortableJS dependency after package/license review.
- [ ] Add deterministic vendor-copy script that copies only the required minified browser artifact into the source/build tree.
- [ ] Integrate Sortable with touch-friendly drag handle; after reorder, persist normalized order sequentially through the existing admin API and reload authoritative state.
- [ ] Preserve keyboard/manual ordering when Sortable or JavaScript drag support is unavailable.
- [ ] Run admin/public/build contracts and commit.

### Task 6: Finish the manual global-only controlled deployment workflow

**Files:**
- Create: `.github/workflows/deploy-discover.yml`
- Modify: `scripts/test-discover-workflow-contract.mjs`
- Modify: `deploy/discover/install-discover-service.sh` only if deterministic dependency packaging requires it
- Modify: `docs/DISCOVER_ADMIN_OPERATIONS.fa.md`

**Interfaces:**
- Trigger: `workflow_dispatch` only.
- Environment: `production-global` only.
- Existing installer: `deploy/discover/install-discover-service.sh <staged-root> <release-id>`.
- Canonical health: `https://llm.persiantoolbox.ir/discover/api/health`.

- [ ] Keep the existing workflow contract RED until the file exists and satisfies manual-only/global-only/pinned-action/bounded-package/strict-SSH/health/auth requirements.
- [ ] Implement a bounded release artifact containing only Discover service/runtime dependencies, Discover deploy assets, and canonical Caddy config required by the installer.
- [ ] Use pinned checkout/setup/upload/download actions and the existing `production-global` environment; never reference `production-iran`.
- [ ] Stage over strict host-key-checked SSH, install the sidecar, apply canonical Caddy config, verify loopback/public health and unauthenticated admin challenge, and clean ephemeral SSH material.
- [ ] Document required private secrets and rollback/verification sequence without publishing values.
- [ ] Run workflow/pin/privacy/deploy contracts and commit.

### Task 7: Production-grade integration and release readiness

**Files:**
- Modify: `docs/DISCOVER_ADMIN_OPERATIONS.fa.md`
- Modify: PR body/docs as necessary
- Test: all repository gates

**Interfaces:**
- `npm run discover:test` is the Discover feature gate.
- Production activation remains sidecar + Caddy first, merge/static release second.

- [ ] Run `npm ci`.
- [ ] Run `npm run discover:test`.
- [ ] Delete/rebuild only generated `.site-dist/` if local stale build artifacts interfere; preserve user-owned `.site-dist.bak/`.
- [ ] Run `npm test`, `npm run site:build`, and `npm run site:check` in a clean worktree/runner-equivalent state.
- [ ] Review diff for secrets, remote runtime dependencies, provider/evidence data changes, CSP weakening, and accidental Iran-side dynamic deployment.
- [ ] Push the implementation branch, open/update the Discover implementation PR, and monitor all relevant CI to green; diagnose root causes without weakening gates.
- [ ] After gates are green and private production prerequisites are available, execute the owner-authorized controlled sequence: canonical/global sidecar activation, Caddy/auth health, real temporary Create -> Edit -> Publish -> public visibility -> Unpublish -> Delete proof, merge, exact-revision deployment verification, and post-merge sidecar reinstall at the merged SHA if required for release provenance.
- [ ] Roll back on failed production verification and report only sanitized evidence.
