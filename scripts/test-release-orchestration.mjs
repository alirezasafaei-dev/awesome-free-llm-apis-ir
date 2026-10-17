import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const deploy = await readFile(".github/workflows/deploy-vps.yml", "utf8");
const manual = await readFile(".github/workflows/deploy-discover.yml", "utf8");
const verify = await readFile(".github/workflows/verify-live-release.yml", "utf8");
for (const marker of ["name: Deploy VPS mirrors", "branches: [main]", "workflow_call:", "group: deploy-vps-production", "cancel-in-progress: false", "if: github.ref == 'refs/heads/main'", "production-global", "needs: [build, privacy-check]", "npm run release:check", "Prepare verified Discover Node runtime", "sha256sum --check --strict", "StrictHostKeyChecking=yes", "upload ${GITHUB_SHA}", "publish ${GITHUB_SHA}", "rollback ${GITHUB_SHA}", "failure() || cancelled()", "steps.release.outcome != 'skipped'", "for attempt in {1..12}", "--expected-revision=${GITHUB_SHA}", "check-production-smoke.mjs", "check-production-ux-smoke.mjs"]) {
  assert.ok(deploy.includes(marker), `Canonical release missing: ${marker}`);
}
for (const forbidden of ["upgrade-caddy.sh", "systemctl restart caddy", "deploy-iran:", "ir.llm.persiantoolbox.ir", "DISCOVER_ADMIN_PASSWORD"]) {
  assert.ok(!deploy.includes(forbidden), `Retired or unnecessary deployment surface: ${forbidden}`);
}
const push = deploy.match(/on:\s*\n\s*push:\s*\n([\s\S]*?)\n\s*workflow_dispatch:/)?.[1] ?? "";
assert.ok(!/^\s*paths(?:-ignore)?:/m.test(push), "Every main revision needs publication");
assert.ok(manual.includes("uses: ./.github/workflows/deploy-vps.yml"), "Manual Discover publication must share the canonical release boundary");
assert.ok(!manual.includes("caddy"), "Manual publication must not target retired Caddy infrastructure");
for (const marker of ["Deploy VPS mirrors", "Deploy website", "Deploy Discover pilot", "--attempts=36", "npm run production:smoke", "npm run production:ux-smoke", "production-smoke.md", "ux-smoke.md", "Exact revision, production smoke and UX smoke passed", "Exact revision or full live smoke verification failed"]) {
  assert.ok(verify.includes(marker), `Exact live verification missing: ${marker}`);
}
assert.ok(!/\bpull_request\s*:/.test(deploy + verify), "Production mutations must not run from PR events");
console.log("Protected-main canonical Nginx release, shared concurrency, rollback and exact revision orchestration passed.");
