import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manual = await readFile(".github/workflows/deploy-discover.yml", "utf8");
const workflow = await readFile(".github/workflows/deploy-vps.yml", "utf8");
const helper = await readFile("deploy/nginx/actions-deploy.py", "utf8");
const installer = await readFile("deploy/discover/install-discover-service.sh", "utf8");
const crud = await readFile("scripts/check-discover-live-crud.mjs", "utf8");
assert.ok(manual.includes("workflow_dispatch:"));
assert.ok(manual.includes("uses: ./.github/workflows/deploy-vps.yml"));
assert.ok(!/^\s*(?:push|pull_request)\s*:/m.test(manual));
for (const marker of ["name: production-global", "if: github.ref == 'refs/heads/main'", "npm run release:check", "node_modules/simple-icons", "services/discover", "StrictHostKeyChecking=yes", "BatchMode=yes", "rm -f ~/.ssh/id_ed25519 ~/.ssh/known_hosts"])
  assert.ok(workflow.includes(marker), `Canonical Discover release missing: ${marker}`);
for (const marker of ["/var/lib/persiantoolbox-discover/discover.sqlite3", "loopback-only", "ss', '-ltnH'", "127.0.0.1:8003", "rglob('*.sqlite3')", "admin-owner-credentials", "administrator boundary is not protected", "check-discover-live-crud.mjs", "rollback(revision, log)", "state['service']", "state['node']", "previous-unit"])
  assert.ok(helper.includes(marker), `Persistent service protection missing: ${marker}`);
assert.ok(helper.indexOf("run(['bash', str(TRUSTED / 'discover/install-discover-service.sh')") < helper.indexOf("run([str(NODE), str(TRUSTED / 'check-discover-live-crud.mjs')"));
assert.ok(helper.indexOf("run([str(NODE), str(TRUSTED / 'check-discover-live-crud.mjs')") < helper.indexOf("run(['bash', str(TRUSTED / 'remote-release.sh')"), "Authenticated CRUD must pass before static publication");
assert.ok(installer.includes('DISCOVER_PREFLIGHT_ONLY=1'));
for (const field of ["category", "icon_provider", "icon_key", "featured", "sort_order", "reorder"])
  assert.ok(crud.includes(field), `Authenticated real-service CRUD must still cover ${field}`);
assert.ok(!workflow.includes('DISCOVER_ADMIN_PASSWORD'), 'Runner must not receive the administrator credential');
assert.ok(!workflow.includes('upgrade-caddy.sh'));
assert.ok(!workflow.includes('deploy-iran:'));
console.log('Discover canonical Nginx deployment preserves loopback, persistent data, protected admin, CRUD-before-static and service/runtime rollback.');
