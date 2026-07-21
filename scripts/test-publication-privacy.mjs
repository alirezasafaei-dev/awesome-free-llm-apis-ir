import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { detectPrivacyViolations, isStrictEvidencePath } from "./privacy-evidence-rules.mjs";

const root = process.cwd();
const tracked = spawnSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8"
});

if (tracked.status !== 0) {
  throw new Error(tracked.stderr || "Unable to list tracked files");
}

const binaryExtensions = new Set([
  ".avif", ".gif", ".ico", ".jpeg", ".jpg", ".pdf", ".png", ".webp",
  ".woff", ".woff2", ".zip"
]);

const excludedFiles = new Set([
  "scripts/test-evidence-privacy.mjs"
]);

/**
 * @param {string} file
 * @returns {boolean}
 */
function isPublishableText(file) {
  const extension = file.includes(".") ? file.slice(file.lastIndexOf(".")).toLowerCase() : "";
  return !binaryExtensions.has(extension) && !excludedFiles.has(file);
}

const publishable = tracked.stdout
  .split("\0")
  .filter(Boolean)
  .filter(isPublishableText);

const violationLabels = {
  ssh_target: "SSH-style user@IP target must not be published",
  ipv4: "full IPv4 address must not be published",
  ipv6: "full IPv6 address must not be published",
  credential_fragment: "credential/token fragment must not be published",
  account_identifier: "account/team/organization identifier must not be published"
};

const violations = [];
for (const file of publishable) {
  const content = readFileSync(file, "utf8");
  if (content.includes("\0")) continue;
  const strictEvidence = isStrictEvidencePath(file);
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const detected = detectPrivacyViolations(line, { strictEvidence });
    for (const kind of detected) {
      violations.push(`${file}:${index + 1}: ${violationLabels[kind]}`);
    }
  }
}

if (violations.length > 0) {
  for (const violation of [...new Set(violations)]) console.error(`ERROR ${violation}`);
  console.error("\nRemove infrastructure addresses, credential fragments, SSH targets, and account identifiers from public evidence.");
  console.error("Publish only country, ASN, route, rounded latency, HTTP status, exact public model ID, and sanitized error class.");
  process.exit(1);
}

console.log(`Publication privacy checks passed for ${publishable.length} tracked text files.`);
