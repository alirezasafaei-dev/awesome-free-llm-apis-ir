import { readFile } from "node:fs/promises";
import process from "node:process";

const root = process.cwd();
const workflow = await readFile(`${root}/.github/workflows/post-launch-operations.yml`, "utf8");
const smoke = await readFile(`${root}/scripts/check-production-smoke.mjs`, "utf8");
const docs = await readFile(`${root}/docs/POST_LAUNCH_OPERATIONS.fa.md`, "utf8");
const packageJson = JSON.parse(await readFile(`${root}/package.json`, "utf8"));

const workflowTokens = [
  "workflow_dispatch:",
  "schedule:",
  "permissions:",
  "issues: write",
  "cancel-in-progress: false",
  "npm run production:smoke:test",
  "npm run production:smoke",
  "npm run check:api-health",
  "npm run check:drift",
  "npm run check:seo -- --strict",
  "npm run check:regression",
  "<!-- automated-post-launch-operations -->",
  "state_reason: 'completed'",
  "Enforce gate result"
];
for (const token of workflowTokens) {
  if (!workflow.includes(token)) throw new Error(`Post-launch workflow is missing ${token}`);
}

const smokeTokens = [
  "https://llm.persiantoolbox.ir/",
  "https://ir.llm.persiantoolbox.ir/",
  "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/",
  "catalog.json",
  "data.json",
  "build-meta.json",
  "__smoke_missing_route__",
  "X-Robots-Tag: noindex",
  "HTML fallback",
  "providers/${id}/"
];
for (const token of smokeTokens) {
  if (!smoke.includes(token)) throw new Error(`Production smoke checker is missing ${token}`);
}

for (const script of ["production:smoke", "production:smoke:dry", "production:smoke:test", "ops:check"]) {
  if (!packageJson.scripts?.[script]) throw new Error(`package.json is missing ${script}`);
}

for (const token of ["قرارداد خط مبنای KPI", "Benchmark 2026", "شرایط بسته‌شدن Issue #114"]) {
  if (!docs.includes(token)) throw new Error(`Post-launch runbook is missing ${token}`);
}

if (/BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/.test(workflow + smoke + docs)) {
  throw new Error("Post-launch files contain private key material");
}
if (/\b(sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/.test(workflow + smoke + docs)) {
  throw new Error("Post-launch files contain secret-like material");
}

console.log("Post-launch operations contract checks passed.");
