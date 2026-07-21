import { access, readFile } from "node:fs/promises";
import process from "node:process";

const ensureWorkflow = await readFile(new URL("../.github/workflows/ensure-vps-deployment.yml", import.meta.url), "utf8");
const verifyWorkflow = await readFile(new URL("../.github/workflows/verify-live-release.yml", import.meta.url), "utf8");

const failures = [];

for (const marker of [
  "name: Ensure VPS deployment",
  "branches: [main]",
  "actions: write",
  "regular_filter=",
  "dispatch=false",
  "dispatch=true",
  "current === EXPECTED_SHA",
  "/actions/workflows/deploy-vps.yml/dispatches",
  'JSON.stringify({ ref: "main", inputs: { target: "both" } })',
  "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5"
]) {
  if (!ensureWorkflow.includes(marker)) failures.push(`ensure-vps workflow is missing: ${marker}`);
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

if (/\bpull_request\s*:/.test(ensureWorkflow) || /\bpull_request\s*:/.test(verifyWorkflow)) {
  failures.push("production deployment orchestration must not execute from pull_request events");
}

try {
  await access(new URL("../.github/workflows/patch-full-live-gate.yml", import.meta.url));
  failures.push("temporary patch workflow was not removed");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (failures.length) {
  console.error("Release orchestration contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release orchestration contract passed: every current Main revision reaches VPS deployment and full live smoke verification.");
