import { access, readFile } from "node:fs/promises";
import process from "node:process";

const deployWorkflow = await readFile(new URL("../.github/workflows/deploy-vps.yml", import.meta.url), "utf8");
const verifyWorkflow = await readFile(new URL("../.github/workflows/verify-live-release.yml", import.meta.url), "utf8");

const failures = [];

for (const marker of [
  "name: Deploy VPS mirrors",
  "branches: [main]",
  "group: deploy-vps-production",
  "cancel-in-progress: false",
  "production-global",
  "production-iran",
  "verify-mirror-consistency",
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020"
]) {
  if (!deployWorkflow.includes(marker)) failures.push(`deploy-vps workflow is missing: ${marker}`);
}

const pushBlock = deployWorkflow.match(/on:\s*\n\s*push:\s*\n([\s\S]*?)\n\s*workflow_dispatch:/)?.[1] ?? "";
if (!pushBlock.includes("branches: [main]")) failures.push("deploy-vps push trigger must target main");
if (/^\s*paths(?:-ignore)?:/m.test(pushBlock)) {
  failures.push("deploy-vps must not path-filter main pushes; every main revision requires a release attempt");
}

for (const marker of [
  "Deploy VPS mirrors",
  "Deploy website",
  "timeout-minutes: 20",
  "--attempts=36",
  "npm run production:smoke",
  "npm run production:ux-smoke",
  "production-smoke.md",
  "ux-smoke.md",
  "Exact revision, production smoke and UX smoke passed",
  "Exact revision or full live smoke verification failed",
  "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a"
]) {
  if (!verifyWorkflow.includes(marker)) failures.push(`verify-live workflow is missing: ${marker}`);
}

if (/\bpull_request\s*:/.test(deployWorkflow) || /\bpull_request\s*:/.test(verifyWorkflow)) {
  failures.push("production deployment orchestration must not execute from pull_request events");
}

for (const obsoleteWorkflow of [
  "../.github/workflows/ensure-vps-deployment.yml",
  "../.github/workflows/patch-full-live-gate.yml"
]) {
  try {
    await access(new URL(obsoleteWorkflow, import.meta.url));
    failures.push(`obsolete compensating workflow was not removed: ${obsoleteWorkflow}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

if (failures.length) {
  console.error("Release orchestration contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release orchestration contract passed: every main revision directly reaches VPS deployment and full live smoke verification.");
