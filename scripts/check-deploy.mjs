import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const bash = process.platform === "win32" ? path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git/bin/bash.exe") : "bash";
for (const file of ["deploy/remote-release.sh", "deploy/rollback-release.sh", "deploy/publish-release-over-ssh.sh", "deploy/nginx/bootstrap-actions.sh"]) {
  const result = spawnSync(bash, ["-n", file], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || `${file}: invalid shell`);
}
const helper = await readFile("deploy/nginx/actions-deploy.py", "utf8");
for (const marker of ["extract_bundle", "MAX_UPLOAD", "sha256", "runtime policy changed", "a newer publication must not be rolled back", "administrator boundary", "previous-unit", "state.json", "rollback(revision, log)", "extra_groups=[]"]) {
  assert.ok(helper.includes(marker), `Application deploy guard missing: ${marker}`);
}
assert.ok(!/shell\s*=\s*True/.test(helper), "Deployment must not evaluate shell input");
assert.ok(!/systemctl['\", ]+(?:restart|stop)['\", ]+(?:nginx|pm2)/.test(helper), "Publication must not stop shared applications");
const tests = spawnSync(process.platform === "win32" ? "python" : "python3", ["scripts/test-nginx-actions-deploy.py"], { encoding: "utf8" });
assert.equal(tests.status, 0, tests.stdout + tests.stderr);
console.log("Canonical Nginx deployment security, archive, protocol and rollback checks passed.");
