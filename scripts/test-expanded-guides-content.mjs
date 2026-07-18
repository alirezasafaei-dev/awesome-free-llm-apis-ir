import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const auditPath = path.join(root, "scripts", "audit-content-quality.mjs");
const run = spawnSync(process.execPath, [auditPath, "--json"], {
  cwd: root,
  encoding: "utf8"
});

if (run.status !== 0) {
  throw new Error(run.stderr || run.stdout || "Content audit execution failed");
}

const report = JSON.parse(run.stdout);
const targetSlugs = [
  "free-coding-api",
  "free-embedding-api",
  "free-tier-vs-trial-vs-credit",
  "openai-sdk-custom-base-url"
];

const remaining = report.reports.filter(
  (item) => item.type === "generated-guide" && targetSlugs.includes(item.id)
);

if (remaining.length) {
  const details = remaining
    .map((item) => `${item.id}: ${item.missing_sections.join(", ") || item.issues.join(", ")}`)
    .join("; ");
  throw new Error(`Expanded guides still fail the nine-section contract: ${details}`);
}

if (report.summary?.generated_guides_targeted !== targetSlugs.length) {
  throw new Error(
    `Generated-guide target coverage drifted: expected ${targetSlugs.length}, ` +
    `received ${report.summary?.generated_guides_targeted}`
  );
}

console.log(`Expanded guide contract passed for ${targetSlugs.length} generated guides.`);
