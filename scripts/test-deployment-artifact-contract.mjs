import { readFile } from "node:fs/promises";
import process from "node:process";

const root = process.cwd();
const validateWorkflow = await readFile(`${root}/.github/workflows/validate.yml`, "utf8");
const pagesWorkflow = await readFile(`${root}/.github/workflows/pages.yml`, "utf8");
const vpsWorkflow = await readFile(`${root}/.github/workflows/deploy-vps.yml`, "utf8");
const packageJson = JSON.parse(await readFile(`${root}/package.json`, "utf8"));

const validateSignals = [
  "site-build:",
  "artifact-roundtrip:",
  "needs: [site-build, artifact-roundtrip]",
  "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
  "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
  "sha256sum site-release.tar.gz",
  "sha256sum -c site-release.tar.gz.sha256",
  "meta.source_revision",
  "${{ github.sha }}",
  "bash -n deploy/remote-release.sh",
  "bash -n deploy/rollback-release.sh",
  "branch protection requires the `build` check"
];
for (const signal of validateSignals) {
  if (!validateWorkflow.includes(signal)) throw new Error(`Validation artifact gate is missing: ${signal}`);
}

const exactActionPins = {
  upload: "actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
  download: "actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  uploadPages: "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
  deployPages: "actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128"
};

for (const [name, pin] of Object.entries(exactActionPins)) {
  const combined = validateWorkflow + pagesWorkflow + vpsWorkflow;
  if (!combined.includes(pin)) throw new Error(`Pinned ${name} Action is missing from deployment workflows`);
}

if (!pagesWorkflow.includes(exactActionPins.uploadPages) || !pagesWorkflow.includes(exactActionPins.deployPages)) {
  throw new Error("GitHub Pages workflow does not use the reviewed v5 artifact/deploy pair");
}
if (!vpsWorkflow.includes(exactActionPins.upload) || (vpsWorkflow.match(new RegExp(exactActionPins.download, "g")) || []).length < 2) {
  throw new Error("Dual-VPS workflow does not use the reviewed upload/download artifact pair");
}

for (const script of ["release:check", "release:candidate:test", "deployment:artifact:test"]) {
  if (!packageJson.scripts?.[script]) throw new Error(`package.json is missing ${script}`);
}

const allContent = validateWorkflow + pagesWorkflow + vpsWorkflow;
if (/BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY/u.test(allContent)) {
  throw new Error("Deployment artifact workflows contain private key material");
}
if (/\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/u.test(allContent)) {
  throw new Error("Deployment artifact workflows contain secret-like material");
}

console.log("Deployment artifact contract passed: exact pins, Pages packaging, VPS roundtrip, integrity and revision checks are enforced.");
