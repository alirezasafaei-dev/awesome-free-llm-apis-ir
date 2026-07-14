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
for (const token of ["production-global", "production-iran", "SSH_PRIVATE_KEY", "SSH_KNOWN_HOSTS", "rollback-release.sh"]) {
  if (!workflow.includes(token)) throw new Error(`VPS workflow is missing ${token}`);
}
if (workflow.includes("BEGIN OPENSSH PRIVATE KEY")) throw new Error("A private key was embedded in the workflow");
if (!release.includes("Artifact revision mismatch") || !release.includes("mv -Tf")) throw new Error("Atomic release safeguards are missing");

console.log("Dual-VPS deployment checks passed.");
