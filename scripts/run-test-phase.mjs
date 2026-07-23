import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const phases = Object.freeze({
  data: [
    "validate",
    "providers:normalize",
    "roadmap:test",
    "workflow-pins:test",
    "deployment:artifact:test",
    "release:candidate:test",
    "verification:backlog:test",
    "generate:check",
    "catalog:check",
    "data:test",
    "brand:test",
    "site:data:test",
    "validate:tools",
    "generate:tools:check",
    "tools:test",
    "tools:site:test",
    "validate:repo-audits"
  ],
  content: [
    "content:fa:test",
    "content:en:test",
    "seo:translations:test",
    "seo:policy:test",
    "seo:strict:test",
    "content:providers:validate",
    "content:providers:test",
    "content:providers:pages:test",
    "content:audit:test",
    "content:guides:test",
    "content:fa:live:verify:dry",
    "launch:links:test",
    "links:test",
    "launch:log:test"
  ],
  product: [
    "ux:seo:p0:test",
    "ux:navigation:test",
    "ux:ranking:test",
    "ux:pro-max:test",
    "ux:clarity:test",
    "ux:footer:test",
    "ux:quick-start:test",
    "ux:finder:test",
    "compare:test",
    "ux:research:test",
    "advisor:test",
    "pages:paths:test",
    "analytics:production:test"
  ],
  operations: [
    "verify:iran:dry",
    "upstreams:test",
    "benchmark:validate",
    "benchmark:dry",
    "benchmark:test",
    "api-health:test",
    "production:smoke:test",
    "production:release:verify:test",
    "production:release:orchestration:test",
    "production:ux-smoke:test",
    "post-launch:ops:test",
    "deploy:check",
    "deploy:test"
  ]
});

const externallyExecuted = new Set([
  "privacy:test",
  "privacy:evidence:test",
  "privacy:github:test",
  "site:check",
  "hermes:pilot:test"
]);

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`ERROR ${message}`);
  process.exit(1);
}

/**
 * @returns {string[]}
 */
function aggregateTestCommands() {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const aggregate = pkg.scripts?.test;
  if (typeof aggregate !== "string" || aggregate.length === 0) {
    fail("package.json scripts.test is missing");
  }
  return aggregate
    .split(/\s*&&\s*/u)
    .map((part) => part.trim())
    .map((part) => {
      const match = /^npm run ([a-z0-9:_-]+)$/u.exec(part);
      if (!match) fail(`unsupported aggregate test command: ${part}`);
      return match[1];
    });
}

function validateCoverage() {
  const aggregate = aggregateTestCommands();
  const declared = [...Object.values(phases).flat(), ...externallyExecuted];
  const duplicateDeclared = declared.filter((value, index) => declared.indexOf(value) !== index);
  if (duplicateDeclared.length > 0) {
    fail(`test phase declarations contain duplicates: ${[...new Set(duplicateDeclared)].join(", ")}`);
  }

  const aggregateSet = new Set(aggregate);
  const declaredSet = new Set(declared);
  const missing = aggregate.filter((command) => !declaredSet.has(command));
  const extra = declared.filter((command) => !aggregateSet.has(command));
  if (missing.length > 0 || extra.length > 0) {
    fail([
      missing.length ? `commands missing from CI phases: ${missing.join(", ")}` : "",
      extra.length ? `commands declared by CI but absent from npm test: ${extra.join(", ")}` : ""
    ].filter(Boolean).join("\n"));
  }

  console.log(`CI phase coverage is complete: ${aggregate.length} aggregate commands mapped exactly once.`);
}

/**
 * @param {string} command
 */
function runNpmScript(command) {
  console.log(`\n=== npm run ${command} ===`);
  const result = spawnSync("npm", ["run", command], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) fail(`unable to run npm script ${command}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

validateCoverage();

const requested = process.argv[2];
if (requested === "coverage") process.exit(0);
if (!requested || !(requested in phases)) {
  fail(`unknown test phase: ${requested || "<missing>"}. Available phases: ${Object.keys(phases).join(", ")}, coverage`);
}

for (const command of phases[requested]) runNpmScript(command);
console.log(`\nTest phase ${requested} passed with ${phases[requested].length} command(s).`);
