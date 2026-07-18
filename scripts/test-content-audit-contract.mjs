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

let report;
try {
  report = JSON.parse(run.stdout);
} catch (error) {
  throw new Error(`Content audit did not return valid JSON: ${error.message}`);
}

const expectedSections = [
  "intent",
  "signup",
  "first-request",
  "quota",
  "iran",
  "errors",
  "when-not-to-use",
  "references",
  "links"
];

if (report.schema_version !== "1.0.0") {
  throw new Error(`Unexpected audit schema version: ${report.schema_version}`);
}

const actualSections = report.requirements?.map((item) => item.id) ?? [];
if (JSON.stringify(actualSections) !== JSON.stringify(expectedSections)) {
  throw new Error(`Content requirements drifted: ${actualSections.join(", ")}`);
}

if (!Number.isInteger(report.summary?.providers_total) || report.summary.providers_total < 1) {
  throw new Error("Content audit did not inspect providers");
}

if (!Number.isInteger(report.summary?.reports_total) || report.summary.reports_total < 1) {
  throw new Error("Issue #86 requires a non-zero, machine-readable content backlog");
}

const validSections = new Set(expectedSections);
for (const item of report.reports ?? []) {
  if (!item.type || !item.id || !Array.isArray(item.missing_sections) || !Array.isArray(item.issues)) {
    throw new Error(`Malformed audit item: ${JSON.stringify(item)}`);
  }
  for (const section of item.missing_sections) {
    if (!validSections.has(section)) {
      throw new Error(`Unknown missing section "${section}" in ${item.type}:${item.id}`);
    }
  }
}

const providerReports = report.reports.filter((item) => item.type === "provider");
if (providerReports.length < 1) {
  throw new Error("Content audit must report the provider-page backlog");
}

const requiredGeneratedGuides = new Set([
  "free-coding-api",
  "free-embedding-api",
  "free-tier-vs-trial-vs-credit",
  "openai-sdk-custom-base-url"
]);

const generatedReports = new Map(
  report.reports
    .filter((item) => item.type === "generated-guide")
    .map((item) => [item.id, item])
);

for (const slug of requiredGeneratedGuides) {
  if (!generatedReports.has(slug)) {
    throw new Error(`Content audit is missing the targeted generated guide ${slug}`);
  }
  if (generatedReports.get(slug).missing_sections.length < 1) {
    throw new Error(`Targeted guide ${slug} unexpectedly has no backlog`);
  }
}

console.log(
  `Content audit contract passed: ${report.summary.reports_total} backlog item(s), ` +
  `${providerReports.length} provider report(s), ${generatedReports.size} generated-guide report(s).`
);
