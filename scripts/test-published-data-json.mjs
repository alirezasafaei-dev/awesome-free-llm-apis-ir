import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8"
});

if (build.status !== 0) {
  throw new Error(build.stderr || build.stdout || "Production site build failed");
}

const sourceText = await readFile(path.join(root, "data.json"), "utf8");
const publishedText = await readFile(path.join(root, ".site-dist", "data.json"), "utf8");
const catalogText = await readFile(path.join(root, ".site-dist", "catalog.json"), "utf8");

assert.equal(publishedText, sourceText, "Published data.json must exactly match the generated root file");

const published = JSON.parse(publishedText);
const catalog = JSON.parse(catalogText);

assert.ok(Number.isInteger(published.providerCount) && published.providerCount > 0, "Published providerCount must be a positive integer");
assert.equal(published.providerCount, published.providers.length, "Published providerCount must match providers length");
assert.equal(published.providerCount, catalog.provider_count, "Published data.json and catalog.json provider counts must match");

const dataIds = published.providers.map((provider) => provider.id).sort();
const catalogIds = catalog.providers.map((provider) => provider.id).sort();

assert.equal(new Set(dataIds).size, dataIds.length, "Published data.json provider IDs must be unique");
assert.deepEqual(dataIds, catalogIds, "Published data.json provider IDs must match catalog.json");
assert.ok(!publishedText.trimStart().startsWith("<"), "Published data.json must not contain an HTML fallback");

console.log(`Published data.json contract passed for ${published.providerCount} providers.`);
