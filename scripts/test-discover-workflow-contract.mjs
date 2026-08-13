import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const workflowPath = path.join(root, ".github", "workflows", "deploy-discover.yml");
const workflow = await readFile(workflowPath, "utf8");

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
  "DISCOVER_ADMIN_USER",
  "DISCOVER_ADMIN_PASSWORD_HASH",
  "DISCOVER_ADMIN_PASSWORD"
]) {
  assert.ok(workflow.includes(signal), `Discover deployment workflow is missing ${signal}`);
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
assert.ok(workflow.includes("StrictHostKeyChecking=yes"), "SSH must use strict host-key checking");
assert.ok(workflow.includes("BatchMode=yes"), "SSH must run non-interactively");
assert.ok(workflow.includes("rm -f ~/.ssh/id_ed25519 ~/.ssh/known_hosts"), "Workflow must remove local SSH material");

console.log("Discover controlled deployment workflow contract passed.");
