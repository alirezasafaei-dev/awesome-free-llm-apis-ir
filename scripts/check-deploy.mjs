import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const files = {
  release: "deploy/remote-release.sh",
  rollback: "deploy/rollback-release.sh",
  caddy: "deploy/caddy/llm.persiantoolbox.ir.caddy",
  nginx: "deploy/nginx/ir.llm.persiantoolbox.ir.conf",
  workflow: ".github/workflows/deploy-vps.yml",
  docs: "docs/VPS_DUAL_DEPLOYMENT.fa.md"
};

for (const file of Object.values(files)) await access(path.join(root, file));
for (const file of [files.release, files.rollback]) {
  const check = spawnSync("bash", ["-n", path.join(root, file)], { encoding: "utf8" });
  if (check.status !== 0) throw new Error(check.stderr || `${file} has invalid shell syntax`);
}

const caddy = await readFile(path.join(root, files.caddy), "utf8");
const nginx = await readFile(path.join(root, files.nginx), "utf8");
const workflow = await readFile(path.join(root, files.workflow), "utf8");
const release = await readFile(path.join(root, files.release), "utf8");

if (!caddy.includes("llm.persiantoolbox.ir") || !caddy.includes("/srv/awesome-free-llm-apis-ir/current")) throw new Error("Caddy production host/root mismatch");
if (!nginx.includes("ir.llm.persiantoolbox.ir") || !nginx.includes('X-Robots-Tag "noindex, nofollow"')) throw new Error("Nginx mirror policy mismatch");
if (!caddy.includes('Strict-Transport-Security "max-age=31536000"')) throw new Error("Caddy HSTS policy is missing");
if (!nginx.includes('Strict-Transport-Security "max-age=31536000"')) throw new Error("Nginx HSTS policy is missing");
for (const token of ["production-global", "production-iran", "SSH_PRIVATE_KEY", "SSH_KNOWN_HOSTS", "rollback-release.sh"]) {
  if (!workflow.includes(token)) throw new Error(`VPS workflow is missing ${token}`);
}
if (workflow.includes("BEGIN OPENSSH PRIVATE KEY")) throw new Error("A private key was embedded in the workflow");
if (!release.includes("Artifact revision mismatch") || !release.includes("mv -Tf")) throw new Error("Atomic release safeguards are missing");

// Static guards for deploy hardening
const concurrencyGroup = workflow.match(/concurrency:\n\s+group:\s*(\S+)/);
if (!concurrencyGroup || concurrencyGroup[1] !== "deploy-vps-production") throw new Error("Concurrency group must be fixed to deploy-vps-production");
if (!workflow.includes("cancel-in-progress: false")) throw new Error("cancel-in-progress must be false");

const rollbackCount = (workflow.match(/if:\s+failure\(\)\s*&&\s*steps\.release\.outcome\s*==\s*'success'/g) || []).length;
if (rollbackCount < 2) throw new Error(`Expected 2 conditional rollback guards, found ${rollbackCount}`);

const strictHostKeyCount = (workflow.match(/StrictHostKeyChecking=yes/g) || []).length;
if (strictHostKeyCount < 4) throw new Error(`Expected 4 StrictHostKeyChecking=yes occurrences (SSH+SCP x2), found ${strictHostKeyCount}`);

if (!workflow.includes("'Iran mirror is missing X-Robots-Tag noindex.'")) throw new Error("Iran mirror job must require X-Robots-Tag noindex");
if (!workflow.includes("'Canonical endpoint unexpectedly contains noindex.'")) throw new Error("Canonical deployment must reject X-Robots-Tag noindex");

for (const buildInput of ["'assets/**'", "'content/**'", "'data/**'", "'site/**'", "'scripts/build-guides.mjs'"]) {
  if (!workflow.includes(buildInput)) throw new Error(`VPS deploy trigger is missing build input ${buildInput}`);
}

const timeoutCount = (workflow.match(/timeout-minutes:\s*\d+/g) || []).length;
if (timeoutCount < 4) throw new Error(`Expected 4 timeout-minutes (build, deploy-global, deploy-iran, verify-mirror-consistency), found ${timeoutCount}`);

const pipefailCount = (workflow.match(/set\s+-Eeuo\s+pipefail/g) || []).length;
if (pipefailCount < 7) throw new Error(`Expected 7 set -Eeuo pipefail guards, found ${pipefailCount}`);

const verifyMirrorJob = workflow.match(/verify-mirror-consistency:/);
if (!verifyMirrorJob) throw new Error("verify-mirror-consistency job is missing");

console.log("Dual-VPS deployment checks passed.");
