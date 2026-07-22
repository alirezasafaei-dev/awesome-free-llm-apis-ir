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
mustBlock('Provider returned {\\"blocked\\":true,\\"reason\\":\\"example\\"}', "raw_error_payload");

console.log("\n--- Negative fixtures ---");
mustPass("AS196864");
mustPass("Country: IR, route: direct");
mustPass("HTTP 200 with model agnes-2.0-flash");
mustPass("Authorization: Bearer YOUR_API_KEY");
mustPass("latency_ms: 7300");
mustPass("Model: accounts/fireworks/models/gpt-oss-120b");
mustPass("sanctioned_origin_country");
mustPass("customer_verification_required");
mustPass("Account activation blocked for the tested signup flow");

console.log("\n--- Provider evidence scan ---");
const providerIds = ["agnes-ai", "fireworks-ai", "freetheai", "nvidia-nim", "vercel-ai-gateway"];
for (const id of providerIds) {
  const path = `${root}/data/providers/${id}.json`;
  const providerText = readFileSync(path, "utf8");
  const violations = detectPrivacyViolations(providerText, { strictEvidence: true });
  assertFixture(violations.length === 0, `${id} contains no prohibited public evidence`);
}


const providerById = Object.fromEntries(providerIds.map((id) => [
  id,
  JSON.parse(readFileSync(`${root}/data/providers/${id}.json`, "utf8"))
]));
const backlog = JSON.parse(readFileSync(`${root}/data/verification-backlog.json`, "utf8"));
const agnes = providerById["agnes-ai"];
const fireworks = providerById["fireworks-ai"];
const freetheai = providerById.freetheai;
const nvidia = providerById["nvidia-nim"];
const vercel = providerById["vercel-ai-gateway"];

assertFixture(agnes.iran_access.status === "verified_working", "Agnes retains authenticated Iran inference status");
assertFixture(fireworks.iran_access.status === "account_activation_blocked", "Fireworks account barrier is distinct from signup failure");
assertFixture(vercel.iran_access.status === "account_activation_blocked", "Vercel account barrier is distinct from signup failure");
assertFixture(freetheai.iran_access.status === "signup_blocked", "FreeTheAI remains a bounded signup barrier");
assertFixture(nvidia.iran_access.status === "signup_blocked", "NVIDIA remains a bounded signup barrier");
assertFixture(vercel.free_tier.requires_payment_method === null, "Vercel account barrier is not generalized into universal payment policy");

const vercelLive = vercel.iran_access.evidence.find((entry) => entry.timestamp === "2026-07-21T17:28:00.000Z");
assertFixture(Boolean(vercelLive), "Vercel account-barrier evidence exists");
assertFixture(!("credential_validated_from" in vercelLive), "Public model listing is not credential validation");
assertFixture(vercelLive?.http_status === 403, "Vercel evidence records the inference barrier response");

for (const provider of [freetheai, nvidia]) {
  assertFixture(provider.iran_access.test_method === "signup_only", `${provider.id} uses signup-only method`);
  assertFixture(provider.iran_access.evidence.some((entry) => entry.type === "signup_test"), `${provider.id} uses structured signup evidence`);
}

const serialized = JSON.stringify(Object.values(providerById));
for (const [pattern, label] of [
  [/Hetzner/i, "hosting-provider infrastructure detail"],
  [/\{\s*"blocked"\s*:/i, "raw JSON error payload"],
  [/requires a valid credit card on file to service requests/i, "verbatim provider error message"],
  [/کاربر ایرانی به شماره خارجی دسترسی ندارد/, "unbounded statement about Iranian users"]
]) {
  assertFixture(!pattern.test(serialized), `${label} is absent from public evidence`);
}

const networkTrack = backlog.tracks.find((track) => track.id === "network_matrix");
assertFixture(networkTrack?.issue === 35, "network matrix remains linked to Issue #35");
assertFixture(networkTrack?.status === "partially_completed", "network matrix remains open until identical authenticated tests exist");
assertFixture(backlog.providers.length === 4, "four externally blocked provider tests remain explicit");

if (process.exitCode) {
  console.error("Evidence privacy tests FAILED.");
  process.exit(1);
}
console.log("All evidence privacy tests passed.");
