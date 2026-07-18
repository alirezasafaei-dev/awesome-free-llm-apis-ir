import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const auditScript = path.join(root, "scripts", "audit-github-discussion-privacy.mjs");
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

function runAudit(fixture) {
  const fixturePath = path.join(tmpdir(), `fixture-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(fixturePath, JSON.stringify(fixture));
  const result = spawnSync("node", [auditScript, "--fixture", fixturePath], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env }
  });
  unlinkSync(fixturePath);
  return result;
}

function assertPasses(fixture, description) {
  console.log(`\nTest: ${description}`);
  const result = runAudit(fixture);
  assert(result.status === 0, "exits with code 0");
  assert(result.stdout.includes("passed"), "reports passed");
}

function assertFails(fixture, description, expectedTypes) {
  console.log(`\nTest: ${description}`);
  const result = runAudit(fixture);
  assert(result.status === 1, "exits with code 1");
  assert(result.stderr.includes("ERROR"), "reports ERROR");
  for (const type of expectedTypes) {
    assert(result.stderr.includes(type), `reports violation type: ${type}`);
  }
}

assertPasses(
  { issues: [], pull_requests: [] },
  "empty repository passes"
);

assertPasses(
  { issues: [{ number: 1, body: "Hello world", comments: [] }], pull_requests: [] },
  "clean issue body passes"
);

assertPasses(
  { issues: [{ number: 1, body: "192.168.1.1 is my private address", comments: [] }], pull_requests: [] },
  "private RFC1918 address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "127.0.0.1 is localhost", comments: [] }], pull_requests: [] },
  "loopback address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "10.0.0.1 is internal", comments: [] }], pull_requests: [] },
  "Class A private address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "100.64.0.1 is CGNAT", comments: [] }], pull_requests: [] },
  "CGNAT address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "169.254.0.1 is link-local", comments: [] }], pull_requests: [] },
  "link-local address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "192.0.2.1 is documentation", comments: [] }], pull_requests: [] },
  "documentation address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "198.51.100.1 is documentation", comments: [] }], pull_requests: [] },
  "documentation address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "203.0.113.1 is documentation", comments: [] }], pull_requests: [] },
  "documentation address passes"
);

assertPasses(
  { issues: [{ number: 1, body: "[REDACTED] and [redacted] are safe", comments: [] }], pull_requests: [] },
  "redacted placeholders pass"
);

assertFails(
  { issues: [{ number: 1, body: "Connect to 8.8.8.8", comments: [] }], pull_requests: [] },
  "public IPv4 in issue body fails",
  ["public_ipv4"]
);

assertFails(
  { issues: [{ number: 123, body: "Test", comments: [{ id: 456, body: "ssh deployer@1.2.3.4" }] }], pull_requests: [] },
  "SSH target in comment fails",
  ["ssh_target"]
);

assertFails(
  { issues: [{ number: 10, body: "SSH username: root", comments: [] }], pull_requests: [] },
  "explicit SSH username fails",
  ["ssh_username"]
);

assertFails(
  { issues: [], pull_requests: [{ number: 50, body: "Review 1.2.3.4", comments: [], review_comments: [] }] },
  "public IP in PR body fails",
  ["public_ipv4"]
);

assertFails(
  { issues: [], pull_requests: [{ number: 50, body: "Test", comments: [], review_comments: [{ id: 999, body: "admin@45.67.89.123" }] }] },
  "SSH target in PR review comment fails",
  ["ssh_target"]
);

assertFails(
  { issues: [{ number: 1, body: "8.8.8.8 and 192.168.1.1", comments: [] }], pull_requests: [] },
  "multiple violations in one body",
  ["public_ipv4"]
);

assertFails(
  { issues: [{ number: 1, body: "Test", comments: [{ id: 10, body: "1.2.3.4" }, { id: 11, body: "user@5.6.7.8" }] }], pull_requests: [] },
  "violations across multiple comments",
  ["public_ipv4", "ssh_target"]
);

assertPasses(
  { issues: [{ number: 1, body: "999.999.999.999 is invalid", comments: [] }], pull_requests: [] },
  "invalid IP octets pass safely"
);

assertPasses(
  { issues: [{ number: 1, body: "not-an-ip-address", comments: [] }], pull_requests: [] },
  "non-IP text passes"
);

assertFails(
  { issues: [{ number: 1, body: "SSH username: root", comments: [] }], pull_requests: [] },
  "SSH username: root is a violation",
  ["ssh_username"]
);

assertPasses(
  { issues: [{ number: 1, body: "user@10.0.0.1", comments: [] }], pull_requests: [] },
  "SSH target with private IP passes"
);

console.log(`\n${"=".repeat(60)}`);
console.log(`GitHub Discussion Privacy Test Results: ${passed}/${total} passed`);

if (failed > 0) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}

console.log("All tests passed!");
process.exit(0);
