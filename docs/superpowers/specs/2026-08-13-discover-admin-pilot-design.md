# Dynamic Discover/Admin Pilot

Date: 2026-08-13
Status: design approved in conversation; implementation pending spec review

## Goal

Create `llm.persiantoolbox.ir/discover/` as a low-risk pilot for publishing tested AI/mobile tools. Routine additions and edits happen through an admin panel and persistent storage, without rebuilding or redeploying the static site.

The existing LLM catalog and the main `persiantoolbox.ir` application stay isolated from this pilot.

## Selected architecture

- Public UI: `/discover/`
- Admin UI: `/discover/admin/`
- Public read API: `/discover/api/tools`
- Admin CRUD API under `/discover/api/admin/`
- Small loopback-only sidecar service for validation and persistence
- SQLite stored outside the atomic static release tree so normal deploys/rollbacks do not overwrite content
- Caddy remains the only public entry point and protects admin routes

This sidecar + SQLite approach is preferred over repository JSON because JSON would require a build/release for each content change. A hosted CMS is deferred until measured demand justifies another dependency.

## Tool data

Phase 1 records include stable slug, name, Persian descriptions, destination URL, platform, category, capabilities, badges, optional access note, CTA label, featured flag, sort order, publish state, last-tested date, and timestamps.

The public API returns only published records. Ongoing catalog content is not hard-coded into the frontend.

## Public experience

Persian RTL, mobile-first for Instagram traffic, with search, category filters, featured tools, compact cards, one primary CTA per card, and clear loading/empty/error states.

## Admin experience

The owner can list, create, edit, publish/unpublish, feature, reorder, and delete records. URL validation and a clear save status are required. The panel must work on phone and desktop.

## Security and isolation

The backend is loopback-only; admin and mutation routes are protected by the reverse proxy; mutations use same-origin and CSRF defenses; inputs are validated; database operations are parameterized; no credentials or private infrastructure details are committed. Phase 1 does not host APK/executable files.

## Analytics

Reuse the existing privacy-safe analytics path for coarse events such as `discover_view`, `discover_tool_click`, `discover_search`, and `discover_filter`, without identifying visitor data or unsafe free-text collection.

## Deployment

The initial release is a one-time controlled change on the global LLM deployment unless separately expanded. It publishes Discover/Admin assets, installs the sidecar, initializes persistent storage idempotently, and adds only required proxy routes.

After that, routine tool/link/copy changes happen only through the admin panel and require no static build or site deploy. Existing homepage/catalog/analytics smoke checks must continue to pass, and static rollback must not replace Discover data.

## Backup and recovery

Persistent data stays outside the public web root and Git repository. A bounded local backup/restore procedure is required, including backup before future schema migrations.

## Testing

Automated tests cover record validation, CRUD on an isolated test database, publish visibility, ordering/featured semantics, unsafe URL rejection, admin mutation protection, public API contract, proxy route contract, static route publication, analytics event/privacy contract, and existing production regressions.

Before merge, run repository-required `npm ci` and `npm test` plus feature-specific tests.

## Migration path

Keep the API/data model domain-agnostic and slugs stable. If several months of analytics justify promotion, data can move to `persiantoolbox.ir` and pilot URLs can redirect without rewriting the catalog model.

## Non-goals for Phase 1

No public user accounts, public submissions, ratings/comments, payments, recommendation engine, full CMS framework, APK/file hosting, or changes to the main `persiantoolbox.ir` application.
