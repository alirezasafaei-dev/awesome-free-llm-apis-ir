import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

async function hashFiles(dir) {
  const hashes = {};
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await hashFiles(full);
      Object.assign(hashes, sub);
    } else if (entry.isFile()) {
      const relative = path.relative(dist, full);
      const content = await readFile(full);
      hashes[relative] = createHash("sha256").update(content).digest("hex");
    }
  }
  return hashes;
}

async function cleanBuild() {
  await rm(dist, { recursive: true, force: true });
  const result = spawnSync("npm", ["run", "site:build"], {
    cwd: root,
    encoding: "utf8",
    stdio: "inherit",
    env: { ...process.env, SOURCE_REVISION: "build-idempotency-test" }
  });
  if (result.status !== 0) {
    throw new Error(`First build failed: ${result.stderr || result.stdout}`);
  }
}

const failures = [];

console.log("Running first clean build...");
await cleanBuild();
const firstHashes = await hashFiles(dist);

console.log("Running second clean build...");
await cleanBuild();
const secondHashes = await hashFiles(dist);

const allKeys = new Set([...Object.keys(firstHashes), ...Object.keys(secondHashes)]);
for (const key of allKeys) {
  if (!firstHashes[key]) {
    failures.push(`File only in second build: ${key}`);
    continue;
  }
  if (!secondHashes[key]) {
    failures.push(`File only in first build: ${key}`);
    continue;
  }
  if (firstHashes[key] !== secondHashes[key]) {
    failures.push(`File differs between builds: ${key}`);
  }
}

console.log(`Files compared: ${allKeys.size}`);

if (failures.length) {
  console.error(`\nBuild idempotency FAILED: ${failures.length} difference(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Build idempotency passed: two clean builds produce identical output.");
