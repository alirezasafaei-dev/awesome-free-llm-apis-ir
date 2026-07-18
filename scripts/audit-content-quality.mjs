import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const catalogPath = path.join(root, "catalog.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

const reports = [];

// Provider pages content audit
for (const provider of catalog.providers) {
  const issues = [];

  if (!provider.notes_fa && !provider.free_tier.notes_fa) {
    issues.push("فاقد یادداشت فارسی");
  }

  const fieldCount = [
    provider.free_tier.notes_fa,
    provider.notes_fa,
    provider.iran_access.notes_fa,
    provider.description
  ].filter(Boolean).length;

  if (fieldCount < 2) {
    issues.push("محتوای توصیفی کمتر از حد انتظار");
  }

  if (!provider.verification.last_checked) {
    issues.push("تاریخ آخرین بررسی ثبت نشده");
  }

  if (issues.length > 0) {
    reports.push({
      type: "provider",
      id: provider.id,
      name: provider.name,
      issues
    });
  }
}

// Guide pages content audit
const guideDirFiles = [];
try {
  for (const entry of await readdir(contentDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      guideDirFiles.push(entry.name);
    }
  }
} catch {
  // content/fa might not exist
}

const guideRequirements = [
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

for (const filename of guideDirFiles) {
  const source = await readFile(path.join(contentDir, filename), "utf8");
  const wordCount = source.split(/\s+/).length;

  if (wordCount < 300) {
    reports.push({
      type: "guide",
      id: filename.replace(/\.md$/, ""),
      name: filename,
      issues: [`محتوای کوتاه (${wordCount} کلمه)`]
    });
  }
}

if (reports.length > 0) {
  console.log("Content quality audit report:");
  console.log(JSON.stringify(reports, null, 2));
  console.log(`\n${reports.length} content issue(s) found. These should be reviewed for improvement.`);
  process.exit(0);
} else {
  console.log("All content meets minimum quality thresholds.");
}
