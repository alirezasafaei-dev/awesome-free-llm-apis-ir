import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const root = process.cwd();

function loadProviderFile(id) {
  try {
    return JSON.parse(readFileSync(`${root}/data/providers/${id}.json`, "utf8"));
  } catch {
    return null;
  }
}

const ipv4Pattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
const credentialTokenPattern = /\b(?:sk-|fw_|vck_|hf_|gsk_|pplx-|xai-|ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_-]{12,}/g;
const sshTargetPattern = /\b[A-Za-z_][A-Za-z0-9._-]*@(?:\d{1,3}\.){3}\d{1,3}\b/g;

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
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) || (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) || a >= 224
  );
}

function detectViolations(text) {
  const violations = [];

  for (const match of text.matchAll(sshTargetPattern)) {
    violations.push("ssh_target");
  }

  for (const match of text.matchAll(ipv4Pattern)) {
    const address = match[0];
    if (!parseIpv4(address) || isNonPublicIpv4(address)) continue;
    violations.push("public_ipv4");
  }

  for (const match of text.matchAll(credentialTokenPattern)) {
    if (/(?:prefix|example|sample|placeholder|your_|YOUR_|no-key|key-required)/.test(text)) continue;
    violations.push("credential_fragment");
  }

  return [...new Set(violations)];
}

function asset(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  OK: ${message}`);
  }
}

// Evidence equivalent to unsafe PR #146 — MUST be detected
console.log("\n--- Positive Fixtures (MUST be detected) ---");

const fixturePublicIpv4 = "Server IP: 203.0.114.55";
asset(
  detectViolations(fixturePublicIpv4).includes("public_ipv4"),
  `public IPv4 in evidence: "${fixturePublicIpv4}" should be blocked`
);

const fixtureSecondIpv4 = "Foreign control: 203.0.114.56";
asset(
  detectViolations(fixtureSecondIpv4).includes("public_ipv4"),
  `public IPv4 in evidence: "${fixtureSecondIpv4}" should be blocked`
);

const fixtureCredentialFw = "Credential fw_FAKE_TEST_KEY_NO_REAL_VALUE_ABCDEF was used";
asset(
  detectViolations(fixtureCredentialFw).includes("credential_fragment"),
  `Fireworks credential fragment should be blocked`
);

const fixtureCredentialVck = "Key: vck_FAKE_TEST_KEY_NO_REAL_VALUE_ABCDEF";
asset(
  detectViolations(fixtureCredentialVck).includes("credential_fragment"),
  `Vercel credential fragment should be blocked`
);

const fixtureSkPrefix = "Using sk-fake-test-key-no-real-value-abcdef";
asset(
  detectViolations(fixtureSkPrefix).includes("credential_fragment"),
  `OpenAI-style credential fragment should be blocked`
);

const fixtureSshTarget = "ssh user@203.0.114.57";
asset(
  detectViolations(fixtureSshTarget).includes("ssh_target"),
  `SSH target with public IP should be blocked`
);

const fixtureAccountId = "Account asdevelooper-de0ciua is suspended";
// account IDs aren't detected by current patterns — expected to pass through
// The current checker catches credential fragments, not account names
console.log(`  NOTE: account identifiers like "asdevelooper-de0ciua" are not detected by current patterns`);

// Negative fixtures — MUST pass
console.log("\n--- Negative Fixtures (MUST pass) ---");

const fixtureAsnOnly = "AS196864";
asset(
  detectViolations(fixtureAsnOnly).length === 0,
  `ASN only should pass: "${fixtureAsnOnly}"`
);

const fixtureCountryOnly = "Country: IR, route: direct";
asset(
  detectViolations(fixtureCountryOnly).length === 0,
  `Country/route metadata should pass: "${fixtureCountryOnly}"`
);

const fixtureHttpStatus = "HTTP 200 with model agnes-2.0-flash";
asset(
  detectViolations(fixtureHttpStatus).length === 0,
  `HTTP status and model should pass: "${fixtureHttpStatus}"`
);

const fixturePrivateIp = "Local IP 192.168.1.1";
asset(
  detectViolations(fixturePrivateIp).length === 0,
  `Private IPv4 should pass: "${fixturePrivateIp}"`
);

const fixturePlaceholderSnippet = "Authorization: Bearer sk-no-key-required";
asset(
  detectViolations(fixturePlaceholderSnippet).length === 0,
  `Placeholder credential snippet should pass: "${fixturePlaceholderSnippet}"`
);

const fixtureRoundedLatency = "latency_ms: 7291";
asset(
  detectViolations(fixtureRoundedLatency).length === 0,
  `Rounded latency should pass: "${fixtureRoundedLatency}"`
);

const fixturePublicModel = "Model: accounts/fireworks/models/gpt-oss-120b";
asset(
  detectViolations(fixturePublicModel).length === 0,
  `Public model ID should pass: "${fixturePublicModel}"`
);

const fixtureSanitizedError = "sanctioned_origin_country";
asset(
  detectViolations(fixtureSanitizedError).length === 0,
  `Sanitized error class should pass: "${fixtureSanitizedError}"`
);

// Provider-specific evidence checks
console.log("\n--- Provider Evidence File Scan ---");

const providerIds = ["agnes-ai", "fireworks-ai", "freetheai", "nvidia-nim", "vercel-ai-gateway"];
for (const id of providerIds) {
  const provider = loadProviderFile(id);
  if (!provider) {
    console.log(`  SKIP ${id}: file not found (expected on clean branch without evidence)`);
    continue;
  }

  const evidenceText = JSON.stringify(provider.iran_access?.evidence || []);
  const violations = detectViolations(evidenceText);

  const notesText = [provider.notes_fa || "", provider.iran_access?.notes_fa || ""].join(" ");
  const notesViolations = detectViolations(notesText);

  const all = [...violations, ...notesViolations];
  if (all.length > 0) {
    console.error(`FAIL: ${id} evidence/notes contains prohibited patterns: ${[...new Set(all)].join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(`  OK: ${id} evidence is clean`);
  }
}

// Summary
console.log("\n--- Summary ---");
if (process.exitCode) {
  console.error("Evidence privacy tests FAILED.");
  process.exit(1);
}
console.log("All evidence privacy tests passed.");
