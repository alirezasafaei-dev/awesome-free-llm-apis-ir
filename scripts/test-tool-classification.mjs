import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`FAIL: ${name}\n  ${e.message}`);
  }
}

const DATA_DIR = join(import.meta.dirname, "..", "data", "tools");
const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
const tools = files.map((f) => JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")));

test("all tools have valid tool_type", () => {
  const valid = new Set(["proxy", "session_bridge", "router", "monitoring_companion", "aggregator"]);
  for (const t of tools) {
    assert.ok(valid.has(t.tool_type), `${t.id}: invalid tool_type ${t.tool_type}`);
  }
});

test("all tools have unique IDs", () => {
  const ids = tools.map((t) => t.id);
  assert.equal(ids.length, new Set(ids).size, "Duplicate tool IDs found");
});

test("all tool IDs match filenames", () => {
  for (const f of files) {
    const t = JSON.parse(readFileSync(join(DATA_DIR, f), "utf8"));
    assert.equal(`${t.id}.json`, f, `ID ${t.id} does not match filename ${f}`);
  }
});

test("all session_bridge type tools with cookie auth have high or critical terms risk", () => {
  const highRisk = new Set(["high", "critical"]);
  const cookieBridges = tools.filter((t) => t.tool_type === "session_bridge" && t.auth_surface.type === "cookie");
  for (const t of cookieBridges) {
    assert.ok(highRisk.has(t.risk.terms), `${t.id}: cookie-based session_bridge should have high/critical terms risk, got ${t.risk.terms}`);
  }
});

test("all cookie-based tools have risky or dangerous credential safety", () => {
  const risky = new Set(["risky", "dangerous"]);
  const cookieTools = tools.filter((t) => t.auth_surface.type === "cookie");
  for (const t of cookieTools) {
    assert.ok(risky.has(t.risk.credential_safety), `${t.id}: cookie auth should have risky/dangerous credential safety, got ${t.risk.credential_safety}`);
  }
});

test("all tools with no auth have safe credential safety", () => {
  const noAuth = tools.filter((t) => t.auth_surface.type === "none");
  for (const t of noAuth) {
    assert.equal(t.risk.credential_safety, "safe", `${t.id}: no-auth tool should have safe credential safety`);
  }
});

test("all tools have required upstream_repositories", () => {
  for (const t of tools) {
    assert.ok(t.upstream_repositories?.length > 0, `${t.id}: must have at least one upstream_repository`);
    for (const repo of t.upstream_repositories) {
      assert.ok(repo.startsWith("https://github.com/"), `${t.id}: invalid repo URL ${repo}`);
    }
  }
});

test("all tools have Persian descriptions", () => {
  for (const t of tools) {
    assert.ok(t.description_fa?.trim().length > 0, `${t.id}: description_fa is required`);
  }
});

test("volatile stability tools have stale_after_days <= 14", () => {
  for (const t of tools) {
    if (t.risk.stability === "volatile" || t.risk.stability === "experimental") {
      assert.ok(t.verification.stale_after_days <= 14, `${t.id}: volatile/experimental tools should have stale_after_days <= 14, got ${t.verification.stale_after_days}`);
    }
  }
});

test("Iran compatibility status is consistent with verification level", () => {
  for (const t of tools) {
    if (t.iran_compatibility.status === "compatible") {
      assert.notEqual(t.verification.level, "docs_verified", `${t.id}: Iran 'compatible' should be at least 'community_verified'`);
    }
  }
});

const SCHEMA_PATH = join(import.meta.dirname, "..", "schema", "tool.schema.json");
test("schema file exists and is valid JSON", () => {
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
  assert.equal(schema.$id, "https://llm.persiantoolbox.ir/schema/tool.schema.json");
  assert.ok(schema.properties.tool_type.enum.length >= 4);
});

console.log(`\nTool classification tests: ${passed} passed, ${failed} failed, ${passed + failed} total.`);
process.exit(failed > 0 ? 1 : 0);
