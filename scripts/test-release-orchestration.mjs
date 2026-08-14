import { access, readFile } from "node:fs/promises";
import process from "node:process";

const deployWorkflow = await readFile(new URL("../.github/workflows/deploy-vps.yml", import.meta.url), "utf8");
const serviceWorkflow = await readFile(new URL("../.github/workflows/deploy-discover.yml", import.meta.url), "utf8");
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
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020",
  "Prepare verified Discover Node runtime",
  "deploy/discover/prepare-node-runtime.sh .discover-runtime",
  "discover-service-release.tar.gz",
  ".discover-runtime",
  "deploy/discover/install-discover-service.sh",
  "node_modules/simple-icons",
  "check-discover-live-crud.mjs",
  "127.0.0.1:8003/discover/api/health",
  "https://llm.persiantoolbox.ir/discover/api/health",
  "admin-owner-credentials"
]) {
  if (!deployWorkflow.includes(marker)) failures.push(`deploy-vps workflow is missing: ${marker}`);
}

for (const marker of ["name: Deploy Discover pilot", "workflow_dispatch:", "production-global", "install-discover-service.sh"]) {
  if (!serviceWorkflow.includes(marker)) failures.push(`deploy-discover workflow is missing: ${marker}`);
}

const pushBlock = deployWorkflow.match(/on:\s*\n\s*push:\s*\n([\s\S]*?)\n\s*workflow_dispatch:/)?.[1] ?? "";
if (!pushBlock.includes("branches: [main]")) failures.push("deploy-vps push trigger must target main");
if (/^\s*paths(?:-ignore)?:/m.test(pushBlock)) {
  failures.push("deploy-vps must not path-filter main pushes; every main revision requires a release attempt");
}

const globalStart = deployWorkflow.indexOf("  deploy-global:");
const iranStart = deployWorkflow.indexOf("  deploy-iran:");
if (globalStart < 0 || iranStart < 0 || iranStart <= globalStart) {
  failures.push("deploy-vps global/Iran job boundaries are missing or malformed");
} else {
  const globalJob = deployWorkflow.slice(globalStart, iranStart);
  const iranJob = deployWorkflow.slice(iranStart);
  const activateIndex = globalJob.indexOf("Activate Discover sidecar before static publication");
  const crudIndex = globalJob.indexOf("Prove Discover zero-deploy CRUD before static publication");
  const publishIndex = globalJob.indexOf("Publish atomic release");
  if (activateIndex < 0) failures.push("global deploy must activate Discover sidecar before static publication");
  if (crudIndex < 0) failures.push("global deploy must prove Discover CRUD before static publication");
  if (publishIndex < 0) failures.push("global deploy is missing static publication step");
  if (activateIndex >= 0 && publishIndex >= 0 && activateIndex > publishIndex) failures.push("Discover activation must happen before static publication");
  if (crudIndex >= 0 && publishIndex >= 0 && crudIndex > publishIndex) failures.push("Discover CRUD proof must happen before static publication");
  if (!globalJob.includes("Rollback Discover activation after failed publication")) failures.push("global deploy must roll back Discover activation when later publication fails");
  if (!globalJob.includes("pre-runtime-target")) failures.push("global rollback state must capture the previous Discover runtime symlink");
  if (!globalJob.includes("printf '%s' \"$admin_password\" | sudo caddy hash-password --algorithm bcrypt")) {
    failures.push("Caddy password hashing must use stdin rather than plaintext process arguments");
  }
  if (iranJob.includes("install-discover-service.sh") || iranJob.includes("127.0.0.1:8003/discover/api/health")) {
    failures.push("Iran deploy job must never install or health-check a dynamic Discover sidecar");
  }
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
  "../.github/workflows/patch-full-live-gate.yml",
  "../.github/workflows/discover-premerge-activation.yml"
]) {
  try {
    await access(new URL(obsoleteWorkflow, import.meta.url));
    failures.push(`obsolete/unsafe compensating workflow was not removed: ${obsoleteWorkflow}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

if (failures.length) {
  console.error("Release orchestration contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Release orchestration contract passed: CI packages a verified private Node runtime, protected-main global release activates and verifies Discover before static publication, the manual service workflow remains compatible via the installer's checksum-verified fallback, and Iran remains static-only.");
