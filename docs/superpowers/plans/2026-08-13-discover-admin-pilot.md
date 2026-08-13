# Discover/Admin Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dynamic `/discover/` catalog for Instagram Reel links with a protected admin CRUD panel and persistent SQLite storage, so routine content changes require no rebuild or redeploy.

**Architecture:** Static public/admin assets are copied by the existing site builder. A Node.js 22 loopback sidecar owns validation, CRUD, API responses, and SQLite persistence. Canonical Caddy proxies the API and protects admin routes; the Iran mirror explicitly leaves the pilot unavailable in Phase 1.

**Tech Stack:** Node.js 22.13+, ESM, built-in `node:http` and `node:sqlite`, SQLite, HTML/CSS/JS, Caddy, existing repository test/deploy conventions.

## Global Constraints

- Public route `/discover/`, admin route `/discover/admin/`.
- Public API `/discover/api/tools`, admin API `/discover/api/admin/*`.
- Database persists outside the static atomic release tree.
- Sidecar binds to loopback only.
- HTTPS destination URLs only; reject unsafe schemes and credential-bearing URLs.
- Admin mutations require JSON, same-origin semantics, and `X-Discover-CSRF: 1`.
- No APK/file hosting, public accounts/submissions, remote-image dependency, or committed secrets.
- Phase 1 is canonical/global only.

---

### Task 1: Validated SQLite catalog store

**Files:** create `services/discover/validation.mjs`, `services/discover/database.mjs`, `scripts/test-discover-database.mjs`; modify `package.json`.

**Interfaces:** `validateToolInput(value, options)` and `openDiscoverDatabase(path)` exposing list/create/update/delete methods.

- [ ] Write failing tests for create/update/delete, slug uniqueness, published visibility, ordering, JSON arrays, invalid URLs/dates/types/unknown fields.
- [ ] Run `node scripts/test-discover-database.mjs` and confirm failure.
- [ ] Implement validation plus an idempotent prepared-statement SQLite schema.
- [ ] Run tests and commit.

### Task 2: Loopback HTTP API

**Files:** create `services/discover/http.mjs`, `services/discover/server.mjs`, `scripts/test-discover-api.mjs`; modify `package.json`.

**Interfaces:** `createDiscoverServer({ databasePath, host, port })`; public health/tools routes; admin list/create/update/delete routes.

- [ ] Write failing integration tests using a temporary DB and ephemeral loopback port.
- [ ] Test JSON body bounds, validation errors, 404/405, draft exclusion, CSRF header, content-type and same-origin enforcement.
- [ ] Implement minimal server with deterministic JSON errors and no permissive CORS.
- [ ] Run tests and commit.

### Task 3: Public Instagram discovery UI

**Files:** create `site/discover/index.html`, `site/discover/discover.css`, `site/discover/discover.js`, `scripts/test-discover-site.mjs`.

- [ ] Write failing build/static contract tests for RTL, canonical metadata, search/filter/cards, loading/empty/error states, safe links, privacy-safe analytics and no persistent search storage.
- [ ] Implement mobile-first Persian UI fetching `/discover/api/tools`.
- [ ] Add featured-first cards, category filters, capabilities/badges, last-tested date and one CTA per card.
- [ ] Emit only coarse `discover_view`, `discover_tool_click`, `discover_search`, `discover_filter` events without raw query/destination values.
- [ ] Run tests and commit.

### Task 4: Admin CRUD UI

**Files:** create `site/discover/admin/index.html`, `admin.css`, `admin.js`, `scripts/test-discover-admin-site.mjs`.

- [ ] Write failing contract tests for create/edit/delete/publish/featured/order controls, HTTPS URL field, save/error state, mobile layout, delete confirmation, and absence of stored credentials.
- [ ] Implement list/editor UI mapping exactly to API fields and sending the required CSRF header.
- [ ] Keep authentication entirely outside page JavaScript.
- [ ] Run tests and commit.

### Task 5: Proxy and mirror isolation

**Files:** modify canonical Caddy and Iran Nginx configs; create `scripts/test-discover-proxy-contract.mjs`.

- [ ] Write failing config contract for loopback API proxy, protected admin matcher, public API availability, and explicit Iran pilot isolation.
- [ ] Implement minimal proxy/auth/cache changes without changing existing analytics/static behavior.
- [ ] Run existing Caddy/deploy syntax checks plus the new contract and commit.

### Task 6: Persistent service lifecycle and backup

**Files:** create focused deployment assets under `deploy/discover/` and `scripts/test-discover-deploy-contract.mjs`.

- [ ] Write failing contract checks for persistent data outside release tree, bounded backups, idempotent service installation, loopback health verification and rollback of a failed service-code update.
- [ ] Implement the service lifecycle using repository-safe deployment conventions, with credentials/config remaining private to the server.
- [ ] Add explicit backup and restore operator helpers; restore always takes a pre-restore backup.
- [ ] Run contract/syntax tests and commit.

### Task 7: Controlled pilot release workflow

**Files:** create a manual global-only Discover deployment workflow and `scripts/test-discover-workflow-contract.mjs`.

- [ ] Write failing workflow contract requiring manual dispatch, Node 22 feature tests, pinned actions, global-only environment, bounded package, validated service install, canonical proxy update and health smoke.
- [ ] Implement without changing the automatic static mirror release semantics.
- [ ] Run workflow privacy/pin/Discover tests and commit.

### Task 8: Regression integration and operations doc

**Files:** modify `package.json`; create `docs/DISCOVER_ADMIN_OPERATIONS.fa.md`.

- [ ] Aggregate feature tests under `npm run discover:test`.
- [ ] Document first install, admin content operations, publish/unpublish, backup/restore, health checks, and the invariant that routine catalog edits do not deploy the static site.
- [ ] Run `npm ci`, `npm run discover:test`, `npm test`, `npm run site:build`, `npm run site:check`.
- [ ] Commit.

### Task 9: PR and CI

- [ ] Review diff for secrets, provider-data changes, generated artifacts and unrelated maintenance work.
- [ ] Open a draft PR to `main`.
- [ ] Diagnose and repair any CI failures at root cause without weakening tests.
- [ ] Leave production unchanged until a separate controlled-release authorization.
