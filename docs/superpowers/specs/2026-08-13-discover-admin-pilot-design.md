# Dynamic Discover/Admin Pilot

Date: 2026-08-13
Status: approved by repository owner for implementation

## Goal

Create `llm.persiantoolbox.ir/discover/` as a low-risk pilot for publishing tested AI/mobile tools referenced by Instagram Reels. Routine additions and edits happen through an admin panel and persistent storage, without rebuilding or redeploying the static site.

The existing LLM catalog and the main `persiantoolbox.ir` application stay isolated from this pilot.

## Selected architecture

- Public UI: `/discover/`
- Admin UI: `/discover/admin/`
- Public read API: `/discover/api/tools`
- Admin CRUD API under `/discover/api/admin/`
- Small loopback-only Node.js 22 sidecar for validation and persistence
- SQLite stored outside the atomic static release tree so normal deploys/rollbacks do not overwrite content
- Caddy remains the only public entry point and protects admin routes

This sidecar + SQLite approach is preferred over repository JSON because repository JSON would require a build/release for each content change. A hosted CMS is deferred until measured demand justifies another dependency.

## Tool data

Phase 1 records include stable slug, name, Persian short and long descriptions, destination URL, platform, category, capabilities, badges, optional access note, CTA label, featured flag, sort order, publish state, last-tested date, and timestamps.

The public API returns only published records. Ongoing catalog content is not hard-coded into the frontend.

No executable/APK files or third-party application binaries are hosted.

## Public experience

Persian RTL and mobile-first for Instagram traffic, with search, category filters, featured tools, compact cards, one primary CTA per card, and clear loading, empty, and error states.

The frontend uses category/capability visual treatment rather than third-party remote images so the existing privacy/CSP posture is preserved.

## Admin experience

The owner can list, create, edit, publish/unpublish, feature, reorder, and delete records. URL validation and a clear save status are required. The panel works on phone and desktop.

Phase 1 uses no public accounts or CMS framework. The admin surface is protected with Caddy Basic Auth configured from private server environment values, not committed credentials.

## Security and isolation

- The sidecar binds only to `127.0.0.1`.
- Caddy protects `/discover/admin*` and `/discover/api/admin*`.
- Mutation requests must be same-origin JSON requests and include a custom CSRF header.
- The sidecar emits no permissive CORS headers.
- Inputs are schema-validated and database statements are parameterized.
- Destination URLs must be HTTPS; unsafe schemes and credential-bearing URLs are rejected.
- Database, backups, admin credentials, host identifiers, and private infrastructure details stay outside the repository and public web root.

## Analytics

Reuse the existing privacy-safe analytics path for coarse events such as `discover_view`, `discover_tool_click`, `discover_search`, and `discover_filter`. Do not submit raw search text, destination URLs, visitor identifiers, or other free-text content as event properties.

## Deployment

The initial release is a one-time controlled change on the canonical/global LLM deployment. It publishes Discover/Admin static assets, installs the loopback sidecar as a system service, initializes persistent storage idempotently, and adds only required Caddy routes.

The Iran mirror must not expose a broken partial Discover experience; `/discover` is explicitly unavailable there during Phase 1.

After the initial release, routine tool/link/copy changes happen only through the admin panel and require no static build or site deploy. Existing homepage/catalog/analytics smoke checks continue to pass, and static rollback does not replace Discover data.

## Runtime and storage

- Runtime: Node.js 22.13+ for the Discover sidecar.
- HTTP bind: `127.0.0.1:8003` by default, configurable through the private service environment.
- Persistent database: `/var/lib/persiantoolbox-discover/discover.sqlite3` by default.
- Sidecar code: versioned independently under `/opt/persiantoolbox-discover/releases/<release-id>` with a `current` symlink.
- Service configuration/secrets: `/etc/persiantoolbox-discover/` with restrictive permissions.

The sidecar uses Node's built-in `node:sqlite` API, avoiding a native npm dependency in the production service package.

## Backup and recovery

Persistent data stays outside the public web root and Git repository. The install/operator tooling creates a bounded timestamped SQLite backup before future service/schema upgrades. Restore is an explicit operator action and never runs automatically over a healthy database.

## API contract

Public:

- `GET /discover/api/tools` returns `{ tools: [...] }` containing only published records, ordered by featured first, then sort order, then name.
- `GET /discover/api/health` returns minimal `{ ok: true }` without infrastructure details.

Admin:

- `GET /discover/api/admin/tools`
- `POST /discover/api/admin/tools`
- `PUT /discover/api/admin/tools/:id`
- `DELETE /discover/api/admin/tools/:id`

Admin mutations require `Content-Type: application/json`, a same-origin request context, and `X-Discover-CSRF: 1`.

## Testing

Automated tests cover record validation, CRUD on an isolated test database, publish visibility, ordering/featured semantics, unsafe URL rejection, admin mutation protection, public API contract, proxy route contract, static route publication, Iran-mirror isolation, analytics event/privacy contract, and existing production regressions.

Before merge, run repository-required `npm ci` and `npm test` plus feature-specific `npm run discover:test` on Node.js 22.13+.

## Migration path

Keep the API/data model domain-agnostic and slugs stable. If several months of analytics justify promotion, data can move to `persiantoolbox.ir` and pilot URLs can redirect without rewriting the catalog model.

## Non-goals for Phase 1

No public user accounts, public submissions, ratings/comments, payments, recommendation engine, full CMS framework, file uploads, APK/file hosting, remote image proxy, or changes to the main `persiantoolbox.ir` application.
