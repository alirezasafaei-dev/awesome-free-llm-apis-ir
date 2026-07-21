import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const script = path.join(root, "scripts", "check-release-candidate.mjs");
const revision = "0123456789abcdef0123456789abcdef01234567";

const dryRun = spawnSync(process.execPath, [script, "--dry-run", `--revision=${revision}`], {
  cwd: root,
  encoding: "utf8"
});
if (dryRun.status !== 0) throw new Error(dryRun.stderr || dryRun.stdout || "Release candidate dry run failed");

const expectedSignals = [
  `Release candidate revision: ${revision}`,
  "Full repository test suite",
  "Built-site contract",
  "Production site build",
  "Build regression",
  "Strict SEO",
  "Deployment static checks",
  "Deployment release tests",
  "Production smoke checker contract",
  "Production UX smoke checker contract",
  ".site-dist/build-meta.json",
  "Dry run complete"
];

let lastIndex = -1;
for (const signal of expectedSignals) {
  const index = dryRun.stdout.indexOf(signal);
  if (index < 0) throw new Error(`Release candidate dry run is missing: ${signal}`);
  if (index < lastIndex) throw new Error(`Release candidate gate is out of order near: ${signal}`);
  lastIndex = index;
}

const invalid = spawnSync(process.execPath, [script, "--dry-run", "--revision=not-a-full-sha"], {
  cwd: root,
  encoding: "utf8"
});
if (invalid.status === 0) throw new Error("Release candidate gate accepted an invalid revision");
if (!(invalid.stderr + invalid.stdout).includes("full 40-character Git SHA")) {
  throw new Error("Invalid revision failure is not explicit");
}

const source = await readFile(script, "utf8");
for (const signal of ["SOURCE_REVISION", "build-meta.json", "metadata.source_revision", "assertRevision", "production:smoke:test", "production:ux-smoke:test"]) {
  if (!source.includes(signal)) throw new Error(`Release candidate implementation is missing: ${signal}`);
}

console.log("Release candidate command contract passed: destructive checks precede the exact-SHA build and live deployment remains separate.");
