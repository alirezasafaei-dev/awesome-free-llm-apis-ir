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

const providersTotal = report.summary?.providers_total;
const providerContentFiles = report.summary?.provider_content_files;
const reportsTotal = report.summary?.reports_total;

if (!Number.isInteger(providersTotal) || providersTotal < 1) {
  throw new Error("Content audit did not inspect providers");
}
if (!Number.isInteger(providerContentFiles) || providerContentFiles < 0 || providerContentFiles > providersTotal) {
  throw new Error(`Invalid provider content coverage: ${providerContentFiles}/${providersTotal}`);
}
if (!Array.isArray(report.reports)) {
  throw new Error("Content audit reports must be an array");
}
if (!Number.isInteger(reportsTotal) || reportsTotal < 0 || reportsTotal !== report.reports.length) {
  throw new Error(`Content audit reports_total mismatch: ${reportsTotal} vs ${report.reports.length}`);
}

const validSections = new Set(expectedSections);
const reportKeys = new Set();
for (const item of report.reports) {
  if (!item.type || !item.id || !Array.isArray(item.missing_sections) || !Array.isArray(item.issues)) {
    throw new Error(`Malformed audit item: ${JSON.stringify(item)}`);
  }
  const key = `${item.type}:${item.id}`;
  if (reportKeys.has(key)) throw new Error(`Duplicate content audit item: ${key}`);
  reportKeys.add(key);

  for (const section of item.missing_sections) {
    if (!validSections.has(section)) {
      throw new Error(`Unknown missing section "${section}" in ${key}`);
    }
  }
}

const providerReports = report.reports.filter((item) => item.type === "provider");
if (providerReports.length > providersTotal) {
  throw new Error(`Provider backlog exceeds provider count: ${providerReports.length}/${providersTotal}`);
}

const requiredGeneratedGuideCount = 4;
if (report.summary?.generated_guides_targeted !== requiredGeneratedGuideCount) {
  throw new Error(
    `Generated-guide audit coverage drifted: expected ${requiredGeneratedGuideCount}, ` +
    `received ${report.summary?.generated_guides_targeted}`
  );
}

const generatedReportCount = report.reports.filter((item) => item.type === "generated-guide").length;
if (generatedReportCount > requiredGeneratedGuideCount) {
  throw new Error(`Generated-guide backlog exceeds target count: ${generatedReportCount}/${requiredGeneratedGuideCount}`);
}

console.log(
  `Content audit contract passed: ${reportsTotal} backlog item(s), ` +
  `${providerContentFiles}/${providersTotal} provider content file(s), ` +
  `${providerReports.length} provider report(s), ${generatedReportCount} generated-guide report(s).`
);
