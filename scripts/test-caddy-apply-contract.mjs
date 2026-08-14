import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptUrl = new URL("../deploy/caddy/apply-caddy-config.sh", import.meta.url);
const bash = process.platform === "win32"
  ? path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Git", "bin", "bash.exe")
  : "bash";
const source = await readFile(scriptUrl, "utf8");
const failures = [];

/**
 * @param {string} marker
 * @param {string} description
 */
function requireMarker(marker, description) {
  if (!source.includes(marker)) failures.push(`missing ${description}: ${marker}`);
}

for (const [marker, description] of [
  ["set -Eeuo pipefail", "strict shell mode"],
  ["trap rollback ERR INT TERM", "automatic rollback trap"],
  ["/var/backups/caddy/", "persistent protected backup"],
  ["CANDIDATE_CADDYFILE", "candidate Caddyfile"],
  ["CANDIDATE_SITES", "candidate sites directory"],
  ["sudo cp -a \"$SITES_DIR/.\" \"$CANDIDATE_SITES/\"", "candidate copy of live sites"],
  ["sudo chown -R \"$(id -u):$(id -g)\" \"$CANDIDATE_ROOT\"", "candidate re-ownership after sudo cp -a"],
  ["escaped_import=\"${IMPORT_LINE//\\*/\\\\*}\"", "glob metacharacters escaped in sed pattern"],
  ["sudo caddy validate --config \"$CANDIDATE_CADDYFILE\"", "pre-install candidate validation as root (log writer access)"],
  ["sudo mv -f \"$STAGED_SITE\" \"$CONFIG_DST\"", "atomic site replacement"],
  ["sudo caddy validate --config \"$CADDYFILE\"", "post-install validation"],
  ["sudo systemctl reload caddy", "controlled reload"],
  ["sudo systemctl is-active --quiet caddy", "service health check"],
  ["restored configuration validated but Caddy reload failed", "rollback reload failure reporting"],
  ["Caddy is not active after rollback reload", "rollback service health reporting"],
  ["https://llm.persiantoolbox.ir/", "canonical HTTP verification"],
  ["INSTALL_COMPLETE=true", "rollback disarm marker"]
]) {
  requireMarker(marker, description);
}

for (const forbidden of [
  "-X POST",
  "/api/event",
  "127.0.0.1:8002",
  "skipping pre-flight validation",
  "systemctl reload caddy || true"
]) {
  if (source.includes(forbidden)) failures.push(`forbidden unsafe behavior remains: ${forbidden}`);
}

try {
  execFileSync(bash, ["-n", fileURLToPath(scriptUrl)], { stdio: "pipe" });
} catch (error) {
  failures.push(`bash syntax validation failed: ${error.stderr?.toString().trim() || error.message}`);
}

if (failures.length) {
  console.error("Caddy apply contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Caddy apply contract passed: candidate validation, atomic install, rollback and non-invasive verification are enforced.");
