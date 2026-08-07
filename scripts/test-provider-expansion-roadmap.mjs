import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import assert from "node:assert/strict";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");

const [backlogRaw, roadmapFa, roadmapEn] = await Promise.all([
  readFile(path.join(root, "data", "provider-expansion-backlog.json"), "utf8"),
  readFile(path.join(root, "docs", "PROVIDER_EXPANSION_ROADMAP.fa.md"), "utf8"),
  readFile(path.join(root, "docs", "PROVIDER_EXPANSION_ROADMAP.en.md"), "utf8")
]);

const backlog = JSON.parse(backlogRaw);
const providerFiles = await readdir(providersDir);
const providerIds = providerFiles.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

const allowedFreeTypes = new Set([
  "permanent_allowance", "free_models", "monthly_credit", "recurring_credit",
  "community_funded", "one_time_credit", "time_limited_credit",
  "conditional_program", "host_your_own_compute_credit", "trial", "unknown"
]);

const allowedServiceTypes = new Set([
  "official_provider", "official_gateway", "community_gateway",
  "managed_model_hosting", "integrated_inference", "session_bridge", "self_hosted"
]);

const requiredBacklogFields = ["schema_version", "target", "baseline", "screened_count", "waves", "rejected"];
const requiredWaveKeys = ["a_immediate", "b_persistent_credit", "c_enhanced_review", "d_trial_conditional"];
const requiredCandidateFields = ["id", "name", "wave", "status", "expected_service_type"];
const requiredRejectedFields = ["id", "name", "reason", "research_date"];

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

// ─── Backlog structure ───────────────────────────────────────

test("backlog has required top-level fields", () => {
  for (const field of requiredBacklogFields) {
    assert.ok(field in backlog, `missing field: ${field}`);
  }
});

test("backlog target is 50", () => {
  assert.equal(backlog.target, 50);
});

test("backlog baseline is 22", () => {
  assert.equal(backlog.baseline, 22);
});

test("backlog screened_count is 33", () => {
  assert.equal(backlog.screened_count, 33);
});

test("backlog has all four wave categories", () => {
  for (const key of requiredWaveKeys) {
    assert.ok(key in backlog.waves, `missing wave: ${key}`);
  }
});

test("wave a_immediate has exactly 5 candidates", () => {
  assert.equal(backlog.waves.a_immediate.length, 5);
});

test("all candidates have required fields", () => {
  for (const [waveKey, candidates] of Object.entries(backlog.waves)) {
    for (const c of candidates) {
      for (const field of requiredCandidateFields) {
        assert.ok(field in c, `${waveKey}/${c.id}: missing field ${field}`);
      }
    }
  }
});

test("all rejected have required fields", () => {
  for (const r of backlog.rejected) {
    for (const field of requiredRejectedFields) {
      assert.ok(field in r, `rejected/${r.id}: missing field ${field}`);
    }
  }
});

test("total candidate count matches screened_count", () => {
  const total = Object.values(backlog.waves).reduce((sum, arr) => sum + arr.length, 0);
  assert.equal(total, backlog.screened_count);
});

test("all candidate IDs are unique", () => {
  const ids = Object.values(backlog.waves).flat().map((c) => c.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, `duplicate IDs: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`);
});

test("all rejected IDs are unique", () => {
  const ids = backlog.rejected.map((r) => r.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, `duplicate rejected IDs: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`);
});

test("no candidate ID overlaps with rejected ID", () => {
  const candidateIds = new Set(Object.values(backlog.waves).flat().map((c) => c.id));
  const rejectedIds = backlog.rejected.map((r) => r.id);
  const overlap = rejectedIds.filter((id) => candidateIds.has(id));
  assert.equal(overlap.length, 0, `overlap: ${overlap.join(", ")}`);
});

test("no non-Wave-A candidate ID overlaps with existing provider IDs", () => {
  const existingIds = new Set(providerIds);
  const nonWaveACandidates = Object.entries(backlog.waves)
    .filter(([key]) => key !== "a_immediate")
    .flatMap(([, arr]) => arr);
  const candidateIds = nonWaveACandidates.map((c) => c.id);
  const overlap = candidateIds.filter((id) => existingIds.has(id));
  assert.equal(overlap.length, 0, `overlap with existing: ${overlap.join(", ")}`);
});

// ─── Wave A seed stubs ───────────────────────────────────────

test("Wave A candidates have corresponding provider stub files", () => {
  for (const c of backlog.waves.a_immediate) {
    const stubPath = path.join(providersDir, `${c.id}.json`);
    const exists = providerFiles.includes(`${c.id}.json`);
    assert.ok(exists, `missing stub for Wave A candidate: ${c.id}`);
  }
});

test("all Wave A stubs have schema_version 1.2.0", async () => {
  for (const c of backlog.waves.a_immediate) {
    const raw = await readFile(path.join(providersDir, `${c.id}.json`), "utf8");
    const stub = JSON.parse(raw);
    assert.equal(stub.schema_version, "1.2.0", `${c.id} schema_version is not 1.2.0`);
  }
});

test("all Wave A stubs have verification.level 'unverified'", async () => {
  for (const c of backlog.waves.a_immediate) {
    const raw = await readFile(path.join(providersDir, `${c.id}.json`), "utf8");
    const stub = JSON.parse(raw);
    assert.equal(stub.verification.level, "unverified", `${c.id} verification.level is not unverified`);
  }
});

test("all Wave A stubs have iran_access.status 'unknown'", async () => {
  for (const c of backlog.waves.a_immediate) {
    const raw = await readFile(path.join(providersDir, `${c.id}.json`), "utf8");
    const stub = JSON.parse(raw);
    assert.equal(stub.iran_access.status, "unknown", `${c.id} iran_access.status is not unknown`);
  }
});

test("all Wave A stubs have verification.stages with all keys false", async () => {
  const requiredStages = ["documentary", "signup", "credential_issuance", "model_listing", "authenticated_inference", "metering", "iran_direct", "foreign_control"];
  for (const c of backlog.waves.a_immediate) {
    const raw = await readFile(path.join(providersDir, `${c.id}.json`), "utf8");
    const stub = JSON.parse(raw);
    for (const stage of requiredStages) {
      assert.ok(stage in stub.verification.stages, `${c.id} missing stage: ${stage}`);
      assert.equal(stub.verification.stages[stage], false, `${c.id} stage ${stage} is not false`);
    }
  }
});

test("Wave A expected_service_type matches stub service_type", async () => {
  for (const c of backlog.waves.a_immediate) {
    const raw = await readFile(path.join(providersDir, `${c.id}.json`), "utf8");
    const stub = JSON.parse(raw);
    assert.equal(stub.service_type, c.expected_service_type, `${c.id} service_type mismatch`);
  }
});

// ─── Rejected candidates not in catalog ──────────────────────

test("rejected candidates do not have provider stub files", () => {
  for (const r of backlog.rejected) {
    const exists = providerFiles.includes(`${r.id}.json`);
    assert.ok(!exists, `rejected candidate ${r.id} has a stub file`);
  }
});

// ─── Roadmap doc contracts ───────────────────────────────────

test("expansion roadmap FA references parent Issue", () => {
  assert.ok(roadmapFa.includes("Issue") || roadmapFa.includes("issue"), "missing Issue reference in FA roadmap");
});

test("expansion roadmap EN references parent Issue", () => {
  assert.ok(roadmapEn.includes("Issue") || roadmapEn.includes("issue"), "missing Issue reference in EN roadmap");
});

test("expansion roadmap FA mentions target 50", () => {
  assert.ok(roadmapFa.includes("۵۰") || roadmapFa.includes("50"), "missing target 50 in FA roadmap");
});

test("expansion roadmap EN mentions target 50", () => {
  assert.ok(roadmapEn.includes("50"), "missing target 50 in EN roadmap");
});

test("expansion roadmap FA mentions baseline 22", () => {
  assert.ok(roadmapFa.includes("۲۲") || roadmapFa.includes("22"), "missing baseline 22 in FA roadmap");
});

test("expansion roadmap EN mentions baseline 22", () => {
  assert.ok(roadmapEn.includes("22"), "missing baseline 22 in EN roadmap");
});

test("expansion roadmap FA mentions IRAN_STATUS=unknown", () => {
  assert.ok(roadmapFa.includes("IRAN_STATUS=unknown"), "missing IRAN_STATUS=unknown in FA roadmap");
});

test("expansion roadmap EN mentions IRAN_STATUS=unknown", () => {
  assert.ok(roadmapEn.includes("IRAN_STATUS=unknown"), "missing IRAN_STATUS=unknown in EN roadmap");
});

test("expansion roadmap FA mentions evidence boundary rules", () => {
  assert.ok(roadmapFa.includes("Reachability") || roadmapFa.includes("reachability") || roadmapFa.includes("reach"), "missing evidence boundary rules in FA roadmap");
});

test("expansion roadmap EN mentions evidence boundary rules", () => {
  assert.ok(roadmapEn.includes("Reachability") || roadmapEn.includes("reachability") || roadmapEn.includes("reach"), "missing evidence boundary rules in EN roadmap");
});

// ─── Summary ────────────────────────────────────────────────

console.log(`\nProvider expansion contracts: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
if (failed > 0) {
  console.error("Some expansion contract tests failed.");
  process.exit(1);
}
