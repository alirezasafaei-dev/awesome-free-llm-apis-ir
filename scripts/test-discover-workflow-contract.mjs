import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workflowPath = path.join(root, ".github", "workflows", "deploy-discover.yml");
const workflow = await readFile(workflowPath, "utf8");
const vpsWorkflowPath = path.join(root, ".github", "workflows", "deploy-vps.yml");
const vpsWorkflow = await readFile(vpsWorkflowPath, "utf8");

for (const signal of [
  "name: Deploy Discover pilot",
  "workflow_dispatch:",
  "environment: production-global",
  "node-version: 22",
  "npm run discover:test",
  "services/discover",
  "deploy/discover",
  "deploy/caddy/llm.persiantoolbox.ir.caddy",
  "deploy/caddy/apply-caddy-config.sh",
  "install-discover-service.sh",
  "127.0.0.1:8003/discover/api/health",
  "https://llm.persiantoolbox.ir/discover/api/health",
  "https://llm.persiantoolbox.ir/discover/admin/",
  "https://llm.persiantoolbox.ir/discover/api/admin/tools",
  "node scripts/check-discover-live-crud.mjs",
  "DISCOVER_ADMIN_USER",
  "DISCOVER_ADMIN_PASSWORD_HASH",
  "DISCOVER_ADMIN_PASSWORD"
]) {
  assert.ok(workflow.includes(signal), `Discover deployment workflow is missing ${signal}`);
}
await access(path.join(root, "scripts", "check-discover-live-crud.mjs"));
const liveCrud = await readFile(path.join(root, "scripts", "check-discover-live-crud.mjs"), "utf8");
for (const field of ["category", "icon_provider", "icon_key", "featured", "sort_order", "reorder"]) {
  assert.ok(liveCrud.includes(field), `Live production CRUD proof must exercise ${field}`);
}

assert.ok(!/^\s*push\s*:/m.test(workflow), "Discover deployment must not run automatically on push");
assert.ok(!/^\s*pull_request\s*:/m.test(workflow), "Discover deployment must not run automatically on pull requests");
assert.ok(!workflow.includes("production-iran"), "Discover deployment must remain global-only in Phase 1");
assert.ok(!workflow.includes("ir.llm.persiantoolbox.ir"), "Discover deployment must not target the Iran mirror");

const actionUses = [...workflow.matchAll(/^\s*-\s+uses:\s+([^\s#]+)/gm)].map(match => match[1]);
assert.ok(actionUses.length >= 2, "Discover workflow must use pinned checkout/setup actions");
for (const action of actionUses) {
  const at = action.lastIndexOf("@");
  assert.ok(at > 0, `Action reference is malformed: ${action}`);
  const ref = action.slice(at + 1);
  assert.match(ref, /^[0-9a-f]{40}$/i, `Action must be pinned to a full commit SHA: ${action}`);
}

assert.match(workflow, /tar\s+-[^\n]*discover-release\.tgz[^\n]*services\/discover[^\n]*deploy\/discover/s, "Discover package must be bounded to service/deploy assets");
assert.ok(workflow.includes("node_modules/simple-icons"), "Discover package must include the trusted runtime icon dependency");
assert.ok(workflow.includes("StrictHostKeyChecking=yes"), "SSH must use strict host-key checking");
assert.ok(workflow.includes("BatchMode=yes"), "SSH must run non-interactively");
assert.ok(workflow.includes("rm -f ~/.ssh/id_ed25519 ~/.ssh/known_hosts"), "Workflow must remove local SSH material");

// The automatic deploy-vps.yml release path is the primary Discover activation
// route (protected production-global environment). Validate its release order
// and its credential hashing so a regression cannot silently break activation.
for (const signal of [
  "name: Deploy VPS mirrors",
  "branches: [main]",
  "name: production-global",
  "node scripts/check-discover-live-crud.mjs",
  "install-discover-service.sh",
  "127.0.0.1:8003/discover/api/health",
  "Activate Discover sidecar before static publication",
  "Publish atomic release",
  "Prove Discover zero-deploy CRUD before static publication",
  "Verify canonical deployment"
]) {
  assert.ok(vpsWorkflow.includes(signal), `Discover VPS release workflow is missing ${signal}`);
}
for (const upgradeSignal of [
  "caddy_2.11.4_linux_amd64.tar.gz",
  "527fbf917c39189a1e3b31d34fa955601680b2d5c8055d2a87b8b9588dec7bb9",
  "deploy/caddy/upgrade-caddy.sh",
  "Upgrade Caddy with pinned verified binary"
]) {
  assert.ok(vpsWorkflow.includes(upgradeSignal), `Caddy upgrade path is missing ${upgradeSignal}`);
}
for (const diagnostic of [
  "Inspect production-global state (read-only)",
  "caddy version",
  "caddy list-modules",
  "systemctl is-active caddy",
  "systemctl is-active persiantoolbox-discover",
  "/etc/caddy/Caddyfile",
  "/etc/caddy/sites-enabled/llm.persiantoolbox.ir.caddy",
  "/var/lib/persiantoolbox-discover/discover.sqlite3",
  "/opt/persiantoolbox-discover/current"
]) {
  assert.ok(vpsWorkflow.includes(diagnostic), `Production preflight is missing ${diagnostic}`);
}
assert.ok(
  vpsWorkflow.includes("sport = :8003") && vpsWorkflow.includes("127.0.0.1:8003"),
  "Discover VPS release workflow must verify the service listens only on loopback"
);
assert.ok(
  vpsWorkflow.includes("ss -ltnH") || vpsWorkflow.includes("netstat"),
  "Discover VPS release workflow must inspect the live listener"
);
assert.ok(
  vpsWorkflow.includes("/var/lib/persiantoolbox-discover/discover.sqlite3") &&
  vpsWorkflow.includes('! sudo find /opt/persiantoolbox-discover/releases -type f -name \'*.sqlite3\''),
  "Discover VPS release workflow must prove SQLite persistence lives outside the release tree"
);
assert.ok(
  /caddy hash-password --algorithm bcrypt/.test(vpsWorkflow) &&
  /printf '%s\\n'/.test(vpsWorkflow),
  "Discover VPS release workflow must feed the password with a trailing newline so caddy hash-password does not fail with io.EOF"
);
assert.ok(
  vpsWorkflow.includes("deploy-iran:") &&
  vpsWorkflow.includes("Publish atomic release") &&
  !/deploy-iran[\s\S]*install-discover-service\.sh/.test(vpsWorkflow),
  "The Iran mirror must remain a static-only release with no Discover sidecar or database"
);
assert.ok(
  vpsWorkflow.includes("pre-current-target") && vpsWorkflow.includes("Rollback Discover activation after failed publication"),
  "Discover VPS release workflow must capture and restore prior sidecar/runtime state on failure"
);
assert.ok(
  vpsWorkflow.includes("sudo test -f /var/lib/persiantoolbox-discover/discover.sqlite3"),
  "Discover VPS release workflow must assert the persistent SQLite database exists"
);
assert.ok(
  vpsWorkflow.includes('! sudo find /opt/persiantoolbox-discover/releases') &&
  vpsWorkflow.includes("'*.sqlite3'"),
  "Discover VPS release workflow must assert no SQLite database lives inside the release tree"
);

console.log("Discover controlled deployment/workflow CRUD contract passed.");
