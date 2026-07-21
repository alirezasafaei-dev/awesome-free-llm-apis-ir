import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const dryRun = process.argv.includes("--dry-run");

function argumentValue(name) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function currentGitRevision() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || "Unable to resolve the current Git revision");
  }
  return result.stdout.trim();
}

const revision = argumentValue("revision") || process.env.SOURCE_REVISION || currentGitRevision();
if (!/^[0-9a-f]{40}$/iu.test(revision)) {
  throw new Error(`Release candidate revision must be a full 40-character Git SHA; received: ${revision || "<empty>"}`);
}

const tasks = [
  { name: "Full repository test suite", args: ["test"] },
  {
    name: "Production site build",
    args: ["run", "site:build"],
    env: { SOURCE_REVISION: revision }
  },
  { name: "Built-site contract", args: ["run", "site:check"] },
  { name: "Build regression", args: ["run", "check:regression"] },
  { name: "Strict SEO", args: ["run", "check:seo", "--", "--strict"] },
  { name: "Deployment static checks", args: ["run", "deploy:check"] },
  { name: "Deployment release tests", args: ["run", "deploy:test"] },
  { name: "Production smoke checker contract", args: ["run", "production:smoke:test"] },
  { name: "Production UX smoke checker contract", args: ["run", "production:ux-smoke:test"] }
];

function printPlan() {
  console.log(`Release candidate revision: ${revision}`);
  for (const [index, task] of tasks.entries()) {
    console.log(`${index + 1}. ${task.name}: ${npmCommand} ${task.args.join(" ")}`);
  }
  console.log("Revision assertion: .site-dist/build-meta.json source_revision must match exactly.");
}

async function assertBuiltRevision() {
  const metadataPath = path.join(root, ".site-dist", "build-meta.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  if (metadata.source_revision !== revision) {
    throw new Error(`Built revision mismatch: ${metadata.source_revision} !== ${revision}`);
  }
  if (!Number.isInteger(metadata.provider_count) || metadata.provider_count < 1) {
    throw new Error("Built release has an invalid provider_count");
  }
  console.log(`Verified build-meta.json for ${revision} (${metadata.provider_count} providers).`);
}

printPlan();
if (dryRun) {
  console.log("Dry run complete; no commands were executed.");
  process.exit(0);
}

for (const task of tasks) {
  console.log(`\n==> ${task.name}`);
  const result = spawnSync(npmCommand, task.args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...(task.env ?? {}) }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${task.name} failed with exit code ${result.status}`);
  }
  if (task.name === "Built-site contract") await assertBuiltRevision();
}

console.log(`\nRelease candidate ${revision} passed all local deterministic gates.`);
console.log("Live deployment is not implied. Deploy this exact SHA, then run Post-launch operations with expected_revision set to the same SHA.");
