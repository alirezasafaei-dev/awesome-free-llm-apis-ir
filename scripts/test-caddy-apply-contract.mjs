import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const scriptUrl = new URL("../deploy/caddy/apply-caddy-config.sh", import.meta.url);
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
  ["caddy validate --config \"$CANDIDATE_CADDYFILE\"", "pre-install candidate validation"],
  ["sudo mv -f \"$STAGED_SITE\" \"$CONFIG_DST\"", "atomic site replacement"],
  ["sudo caddy validate --config \"$CADDYFILE\"", "post-install validation"],
  ["sudo systemctl reload caddy", "controlled reload"],
  ["sudo systemctl is-active --quiet caddy", "service health check"],
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
  "|| true\n  echo \"Caddy config"
]) {
  if (source.includes(forbidden)) failures.push(`forbidden unsafe behavior remains: ${forbidden}`);
}

try {
  execFileSync("bash", ["-n", new URL(scriptUrl).pathname], { stdio: "pipe" });
} catch (error) {
  failures.push(`bash syntax validation failed: ${error.stderr?.toString().trim() || error.message}`);
}

if (failures.length) {
  console.error("Caddy apply contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Caddy apply contract passed: candidate validation, atomic install, rollback and non-invasive verification are enforced.");
