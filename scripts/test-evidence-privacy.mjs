import { readFileSync } from "node:fs";
import process from "node:process";
import { detectPrivacyViolations } from "./privacy-evidence-rules.mjs";

const root = process.cwd();

/**
 * @param {boolean} condition
 * @param {string} message
 * @returns {void}
 */
function assertFixture(condition, message) {
  if (condition) {
    console.log(`  OK: ${message}`);
    return;
  }
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

/**
 * @param {string} text
 * @param {string} kind
 * @returns {void}
 */
function mustBlock(text, kind) {
  assertFixture(
    detectPrivacyViolations(text, { strictEvidence: true }).includes(kind),
    `${kind} fixture is blocked`
  );
}

/**
 * @param {string} text
 * @returns {void}
 */
function mustPass(text) {
  assertFixture(
    detectPrivacyViolations(text, { strictEvidence: true }).length === 0,
    `safe fixture passes: ${text}`
  );
}

console.log("\n--- Positive fixtures ---");
mustBlock("Server IP: 198.51.100.77", "ipv4");
mustBlock("Private host: 192.168.10.5", "ipv4");
mustBlock("IPv6 host: 2001:db8:0:0:0:0:0:7", "ipv6");
mustBlock("IPv6 host: 2001:db8::7", "ipv6");
mustBlock("Credential fw_FAKE_TEST_KEY_VALUE", "credential_fragment");
mustBlock("Credential vck_FAKE_TEST_KEY_VALUE", "credential_fragment");
mustBlock("Credential sk-fake-test-key-value", "credential_fragment");
mustBlock("ssh operator@198.51.100.77", "ssh_target");
mustBlock("Account asdevelooper-de0ciua is suspended", "account_identifier");
mustBlock("team_id=team_987654", "account_identifier");
mustBlock("شناسه حساب: account_987654", "account_identifier");

console.log("\n--- Negative fixtures ---");
mustPass("AS196864");
mustPass("Country: IR, route: direct");
mustPass("HTTP 200 with model agnes-2.0-flash");
mustPass("Authorization: Bearer YOUR_API_KEY");
mustPass("latency_ms: 7300");
mustPass("Model: accounts/fireworks/models/gpt-oss-120b");
mustPass("sanctioned_origin_country");
mustPass("Account activation blocked for the tested signup flow");

console.log("\n--- Provider evidence scan ---");
const providerIds = ["agnes-ai", "fireworks-ai", "freetheai", "nvidia-nim", "vercel-ai-gateway"];
for (const id of providerIds) {
  const path = `${root}/data/providers/${id}.json`;
  const providerText = readFileSync(path, "utf8");
  const violations = detectPrivacyViolations(providerText, { strictEvidence: true });
  assertFixture(violations.length === 0, `${id} contains no prohibited public evidence`);
}

if (process.exitCode) {
  console.error("Evidence privacy tests FAILED.");
  process.exit(1);
}
console.log("All evidence privacy tests passed.");
