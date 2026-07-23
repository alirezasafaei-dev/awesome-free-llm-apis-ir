import assert from "node:assert/strict";
import { mkdtemp, mkdir, readlink, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const tempParent = await mkdtemp(path.join(os.tmpdir(), "awesome-free-llm-apis-ir-test-parent-"));
const deployRoot = path.join(os.tmpdir(), `awesome-free-llm-apis-ir-test-${path.basename(tempParent)}`);
const revisions = ["a".repeat(40), "b".repeat(40)];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  assert.equal(result.status, 0, `${command} failed\n${result.stdout}\n${result.stderr}`);
  return result;
}

async function makeArchive(revision, number) {
  const source = path.join(tempParent, `source-${number}`);
  const archive = path.join(tempParent, `release-${number}.tar.gz`);
  await mkdir(source);
  await writeFile(path.join(source, "index.html"), `<h1>release ${number}</h1>\n`);
  await writeFile(path.join(source, "catalog.json"), '{"provider_count":1}\n');
  await writeFile(path.join(source, "build-meta.json"), `${JSON.stringify({ source_revision: revision, provider_count: 1 })}\n`);
  run("tar", ["-C", source, "-czf", archive, "."]);
  return archive;
}

try {
  const firstArchive = await makeArchive(revisions[0], 1);
  run("bash", ["deploy/remote-release.sh", deployRoot, firstArchive, revisions[0]], { env: { ...process.env, DEPLOY_TEST_MODE: "1" } });
  const firstTarget = await readlink(path.join(deployRoot, "current"));
  assert.ok(firstTarget.includes(revisions[0]));

  await new Promise((resolve) => setTimeout(resolve, 1100));
  const secondArchive = await makeArchive(revisions[1], 2);
  run("bash", ["deploy/remote-release.sh", deployRoot, secondArchive, revisions[1]], { env: { ...process.env, DEPLOY_TEST_MODE: "1" } });
  const secondTarget = await readlink(path.join(deployRoot, "current"));
  const previousTarget = await readlink(path.join(deployRoot, "previous"));
  assert.ok(secondTarget.includes(revisions[1]));
  assert.ok(previousTarget.includes(revisions[0]));

  run("bash", ["deploy/rollback-release.sh", deployRoot], { env: { ...process.env, DEPLOY_TEST_MODE: "1" } });
  const rolledBackTarget = await readlink(path.join(deployRoot, "current"));
  assert.ok(rolledBackTarget.includes(revisions[0]));
  console.log("Atomic release and rollback integration test passed.");
} finally {
  await rm(tempParent, { recursive: true, force: true });
  await rm(deployRoot, { recursive: true, force: true });
}

await import("./test-caddy-apply-contract.mjs");
