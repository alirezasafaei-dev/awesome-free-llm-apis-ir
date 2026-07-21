import assert from "node:assert/strict";

const iranScorePenalties = ["officially_unsupported", "verified_blocked", "signup_blocked"];

function recommendationScore(provider, usecase, priority) {
  const capabilities = usecaseCapabilities(usecase);
  let score = 0;
  if (capabilities.some((capability) => provider.capabilities.includes(capability))) score += 35;
  if (provider.api.openai_compatible) score += priority === "openai-compatible" ? 28 : 10;
  if (provider.free_tier.type === "permanent_allowance") score += 18;
  if (provider.free_tier.type === "free_models") score += 14;
  if (provider.free_tier.requires_payment_method === false) score += priority === "low-friction" ? 20 : 8;
  if (!isStale(provider)) score += priority === "fresh" ? 20 : 8;
  if (priority === "iran-aware") {
    if (provider.iran_access.status === "verified_working") score += 30;
    else if (provider.iran_access.status === "verified_working_vpn") score += 12;
    else if (iranScorePenalties.includes(provider.iran_access.status)) score -= 30;
  } else {
    if (provider.iran_access.status !== "unknown") score += 5;
    if (iranScorePenalties.includes(provider.iran_access.status)) score -= 12;
  }
  if (provider.service_type === "community_gateway") score -= 20;
  if (provider.service_type === "session_bridge") score -= 30;
  return score;
}

function isStale(provider) {
  const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
  return (Date.now() - checked.getTime()) / 86_400_000 > provider.verification.stale_after_days;
}

function usecaseCapabilities(usecase) {
  const map = {
    chat: ["chat", "text_generation"],
    coding: ["tool_calling", "structured_output"],
    reasoning: ["reasoning"],
    embeddings: ["embeddings"]
  };
  return map[usecase] ?? map.chat;
}

function makeFixture(overrides) {
  return {
    id: "fixture",
    name: "Fixture",
    service_type: "official_provider",
    api: { openai_compatible: true },
    capabilities: ["chat", "text_generation"],
    free_tier: { type: "permanent_allowance", requires_payment_method: false },
    iran_access: { status: "unknown" },
    verification: { last_checked: new Date().toISOString().slice(0, 10), stale_after_days: 30 },
    ...overrides
  };
}

const fixtures = {
  verifiedWorking: makeFixture({ iran_access: { status: "verified_working" } }),
  verifiedWorkingVpn: makeFixture({ iran_access: { status: "verified_working_vpn" } }),
  directBlockedVpnWorking: makeFixture({ iran_access: { status: "direct_blocked_vpn_working" } }),
  officiallyUnsupported: makeFixture({ iran_access: { status: "officially_unsupported" } }),
  verifiedBlocked: makeFixture({ iran_access: { status: "verified_blocked" } }),
  signupBlocked: makeFixture({ iran_access: { status: "signup_blocked" } }),
  intermittent: makeFixture({ iran_access: { status: "intermittent" } }),
  unknown: makeFixture({ iran_access: { status: "unknown" } }),
  communityGateway: makeFixture({ service_type: "community_gateway" }),
  sessionBridge: makeFixture({ service_type: "session_bridge" }),
  notOpenai: makeFixture({ api: { openai_compatible: false } }),
  stale: makeFixture({ verification: { last_checked: "2020-01-01", stale_after_days: 1 } }),
  limitedFree: makeFixture({ free_tier: { type: "trial", requires_payment_method: true } })
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function score(p, usecase = "chat", priority = "iran-aware") {
  return recommendationScore(p, usecase, priority);
}

// ─── Iran-aware mode ────────────────────────────────────────

test("verified_working scores higher than unknown in Iran-aware mode", () => {
  assert.ok(score(fixtures.verifiedWorking) > score(fixtures.unknown));
});

test("unknown scores higher than officially_unsupported in Iran-aware mode", () => {
  assert.ok(score(fixtures.unknown) > score(fixtures.officiallyUnsupported));
});

test("unknown scores higher than verified_blocked in Iran-aware mode", () => {
  assert.ok(score(fixtures.unknown) > score(fixtures.verifiedBlocked));
});

test("unknown scores higher than signup_blocked in Iran-aware mode", () => {
  assert.ok(score(fixtures.unknown) > score(fixtures.signupBlocked));
});

test("verified_working_vpn scores lower than verified_working but higher than unknown in Iran-aware mode", () => {
  assert.ok(score(fixtures.verifiedWorking) > score(fixtures.verifiedWorkingVpn));
  assert.ok(score(fixtures.verifiedWorkingVpn) > score(fixtures.unknown));
});

test("intermittent has neutral score (no boost, no penalty) in Iran-aware mode", () => {
  assert.equal(score(fixtures.intermittent), score(fixtures.unknown));
});

// ─── Non-Iran-aware mode ────────────────────────────────────

test("verified_working scores higher than unknown in non-Iran-aware mode", () => {
  const s = (p) => score(p, "chat", "low-friction");
  assert.ok(s(fixtures.verifiedWorking) > s(fixtures.unknown));
});

test("officially_unsupported scores lower than unknown in non-Iran-aware mode", () => {
  const s = (p) => score(p, "chat", "low-friction");
  assert.ok(s(fixtures.unknown) > s(fixtures.officiallyUnsupported));
});

// ─── Service type penalties ─────────────────────────────────

test("community_gateway gets a penalty vs official_provider", () => {
  const base = score(fixtures.unknown);
  const gw = score(fixtures.communityGateway);
  assert.ok(gw < base);
  assert.equal(gw, base - 20);
});

test("session_bridge gets a larger penalty vs official_provider", () => {
  const base = score(fixtures.unknown);
  const sb = score(fixtures.sessionBridge);
  assert.ok(sb < base);
  assert.equal(sb, base - 30);
});

// ─── Priority-specific ──────────────────────────────────────

test("openai-compatible priority boosts compatible providers more", () => {
  const compatible = score(fixtures.verifiedWorking, "chat", "openai-compatible");
  const incompatible = score(fixtures.notOpenai, "chat", "openai-compatible");
  assert.ok(compatible > incompatible);
});

test("low-friction priority boosts no-payment providers", () => {
  const noPay = score(fixtures.verifiedWorking, "chat", "low-friction");
  const payReq = score(fixtures.limitedFree, "chat", "low-friction");
  assert.ok(noPay > payReq);
});

test("fresh priority boosts recently verified providers", () => {
  const fresh = score(fixtures.verifiedWorking, "chat", "fresh");
  const stale = score(fixtures.stale, "chat", "fresh");
  assert.ok(fresh > stale);
});

// ─── Use-case capability matching ───────────────────────────

test("coding use-case prefers tool_calling/structured_output providers", () => {
  const withTools = makeFixture({ capabilities: ["chat", "text_generation", "tool_calling"] });
  const withoutTools = makeFixture({ capabilities: ["chat"] });
  assert.ok(score(withTools, "coding") > score(withoutTools, "coding"));
});

test("reasoning use-case prefers reasoning providers", () => {
  const withReasoning = makeFixture({ capabilities: ["chat", "reasoning"] });
  const withoutReasoning = makeFixture({ capabilities: ["chat"] });
  assert.ok(score(withReasoning, "reasoning") > score(withoutReasoning, "reasoning"));
});

// ─── Summary ────────────────────────────────────────────────

console.log(`\nAdvisor scoring: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
if (failed > 0) {
  console.error("Some tests failed.");
  process.exit(1);
}
