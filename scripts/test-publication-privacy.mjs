import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

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

function isExcludedFile(file) {
  return excludedFiles.has(file);
}

function isPublishableText(file) {
  const extension = file.includes(".") ? file.slice(file.lastIndexOf(".")).toLowerCase() : "";
  return !binaryExtensions.has(extension);
}

const publishable = tracked.stdout
  .split("\0")
  .filter(Boolean)
  .filter(isPublishableText)
  .filter((f) => !isExcludedFile(f));

const ipv4Pattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
const ipv6FullPattern = /(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}/g;
const ipv6WithDoubleColon = /(?:[A-Fa-f0-9]{1,4}:){2,}(?::[A-Fa-f0-9]{1,4}){2,}|(?:[A-Fa-f0-9]{1,4}:){3,}(?::[A-Fa-f0-9]{1,4})?::[A-Fa-f0-9]{1,4}/g;
const sshTargetPattern = /\b[A-Za-z_][A-Za-z0-9._-]*@(?:\d{1,3}\.){3}\d{1,3}\b/g;
const credentialTokenPattern = /\b(?:sk-|fw_|vck_|hf_|gsk_|pplx-|xai-|ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_-]{12,}/g;
const violations = [];

function parseIpv4(value) {
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return null;
  }
  return octets;
}

function isNonPublicIpv4(value) {
  const octets = parseIpv4(value);
  if (!octets) return true;
  const [a, b, c] = octets;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isSnippetOrPlaceholder(line) {
  return /(?:prefix|example|sample|placeholder|your_|YOUR_|no-key|key-required)/.test(line);
}

for (const file of publishable) {
  const content = readFileSync(file, "utf8");
  if (content.includes("\0")) continue;
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    for (const target of line.matchAll(sshTargetPattern)) {
      violations.push(`${file}:${index + 1}: published SSH-style user@IP target`);
    }

    for (const match of line.matchAll(ipv4Pattern)) {
      const address = match[0];
      if (!parseIpv4(address) || isNonPublicIpv4(address)) continue;
      violations.push(`${file}:${index + 1}: public IPv4 address must not be published`);
    }

    for (const match of line.matchAll(ipv6FullPattern)) {
      violations.push(`${file}:${index + 1}: full IPv6 address must not be published`);
    }

    for (const match of line.matchAll(ipv6WithDoubleColon)) {
      violations.push(`${file}:${index + 1}: IPv6 address must not be published`);
    }

    for (const match of line.matchAll(credentialTokenPattern)) {
      if (isSnippetOrPlaceholder(line)) continue;
      violations.push(`${file}:${index + 1}: credential/token fragment must not be published`);
    }
  }
}

if (violations.length > 0) {
  for (const violation of [...new Set(violations)]) console.error(`ERROR ${violation}`);
  console.error("\nRemove infrastructure addresses, credential values, and account identifiers from tracked text files.");
  console.error("Record only country, ASN, route, and a generic host label.");
  process.exit(1);
}

console.log(`Publication privacy checks passed for ${publishable.length} tracked text files.`);
