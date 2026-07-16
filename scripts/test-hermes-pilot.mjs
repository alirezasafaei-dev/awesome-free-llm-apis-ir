import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const selectedSection = process.argv[2] ?? "all";
const validSections = new Set([
  "all",
  "files",
  "context",
  "config",
  "bootstrap",
  "cron",
  "skill",
  "shell",
]);

if (!validSections.has(selectedSection)) {
  console.error(`Unknown Hermes pilot test section: ${selectedSection}`);
  process.exit(2);
}

const enabled = (section) => selectedSection === "all" || selectedSection === section;

const requiredFiles = [
  "AGENTS.md",
  ".hermes.md",
  "ops/hermes/config.example.yaml",
  "ops/hermes/bootstrap-automation-host.sh",
  "ops/hermes/enable-readonly-drift-cron.sh",
  "ops/hermes/skills/provider-evidence-ir/SKILL.md",
];

const failures = [];
const text = new Map();

for (const path of requiredFiles) {
  try {
    text.set(path, readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${path}: missing or unreadable (${error.message})`);
  }
}

function requireMatch(path, pattern, message) {
  const content = text.get(path) ?? "";
  if (!pattern.test(content)) failures.push(`${path}: ${message}`);
}

function forbidMatch(path, pattern, message) {
  const content = text.get(path) ?? "";
  if (pattern.test(content)) failures.push(`${path}: ${message}`);
}

if (enabled("files")) {
  for (const path of requiredFiles) {
    if (!text.has(path)) failures.push(`${path}: required pilot file is unavailable`);
  }
}

if (enabled("context")) {
  requireMatch("AGENTS.md", /draft PR/i, "must require draft pull requests");
  requireMatch("AGENTS.md", /VPN (?:observation|result)[^\n]*(?:not|never)[^\n]*direct/i, "must separate VPN and direct-Iran evidence");
  requireMatch("AGENTS.md", /npm ci[\s\S]*npm test/i, "must define the full repository gate");
  requireMatch("AGENTS.md", /must not:[\s\S]*deploy/i, "must prohibit autonomous deployment");
  requireMatch(".hermes.md", /Never use YOLO mode/i, "must explicitly prohibit YOLO mode");
  requireMatch(".hermes.md", /foreign automation host cannot establish direct access from Iran/i, "must constrain network-location claims");
}

if (enabled("config")) {
  requireMatch("ops/hermes/config.example.yaml", /cron_mode:\s*["']?deny/i, "cron commands must fail closed");
  requireMatch("ops/hermes/config.example.yaml", /backend:\s*["']?docker/i, "pilot terminal must use Docker isolation");
  requireMatch("ops/hermes/config.example.yaml", /docker_forward_env:\s*\[\]/i, "pilot must not forward secrets into Docker");
  requireMatch("ops/hermes/config.example.yaml", /git push --force/i, "force-push must be denied");
  forbidMatch("ops/hermes/config.example.yaml", /(api[_-]?key|token|secret):\s*["'][^"']+["']/i, "must not contain a credential value");
}

if (enabled("bootstrap")) {
  requireMatch("ops/hermes/bootstrap-automation-host.sh", /HERMES_COMMIT=.*[0-9a-f]{40}/i, "Hermes source must be pinned to a full commit SHA");
  requireMatch("ops/hermes/bootstrap-automation-host.sh", /EUID.*0[\s\S]*Do not run this pilot as root/i, "bootstrap must refuse root");
  forbidMatch("ops/hermes/bootstrap-automation-host.sh", /curl[^\n|]*\|\s*(ba)?sh/i, "must not pipe remote downloads directly to a shell");
  forbidMatch("ops/hermes/bootstrap-automation-host.sh", /--yolo|HERMES_YOLO_MODE/i, "bootstrap must not enable YOLO mode");
}

if (enabled("cron")) {
  requireMatch("ops/hermes/enable-readonly-drift-cron.sh", /read-only provider documentation drift audit/i, "cron prompt must remain read-only");
  requireMatch("ops/hermes/enable-readonly-drift-cron.sh", /Do not use credentials/i, "cron prompt must prohibit credentials");
  requireMatch("ops/hermes/enable-readonly-drift-cron.sh", /live_verification_required/i, "cron must escalate Iran-access changes to human verification");
}

if (enabled("skill")) {
  requireMatch("ops/hermes/skills/provider-evidence-ir/SKILL.md", /^---[\s\S]*name:\s*provider-evidence-ir/m, "skill front matter is invalid");
  requireMatch("ops/hermes/skills/provider-evidence-ir/SKILL.md", /Official provider facts[\s\S]*Direct Iran observation[\s\S]*VPN observation/i, "skill must preserve evidence separation");
  requireMatch("ops/hermes/skills/provider-evidence-ir/SKILL.md", /npm test/i, "skill must run the repository gate");
}

if (enabled("shell") && process.platform !== "win32") {
  for (const path of [
    "ops/hermes/bootstrap-automation-host.sh",
    "ops/hermes/enable-readonly-drift-cron.sh",
  ]) {
    const result = spawnSync("bash", ["-n", path], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`${path}: bash syntax check failed: ${(result.stderr || result.stdout).trim()}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Hermes pilot contract validation failed (${selectedSection}):\n`);
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Hermes pilot contract valid: ${selectedSection}`);
