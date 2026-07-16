import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const [readmeFa, readmeEn, roadmapFa, roadmapEn, backlogFa] = await Promise.all([
  readFile(path.join(root, "README.md"), "utf8"),
  readFile(path.join(root, "README.en.md"), "utf8"),
  readFile(path.join(root, "docs", "ROADMAP.fa.md"), "utf8"),
  readFile(path.join(root, "docs", "ROADMAP.en.md"), "utf8"),
  readFile(path.join(root, "docs", "VERIFICATION_BACKLOG.fa.md"), "utf8")
]);

const errors = [];
function requireText(subject, content, needle) {
  if (!content.includes(needle)) errors.push(`${subject} is missing: ${needle}`);
}
function rejectText(subject, content, needle) {
  if (content.includes(needle)) errors.push(`${subject} contains stale/unsupported text: ${needle}`);
}

requireText("README.md", readmeFa, "docs/ROADMAP.fa.md");
requireText("README.en.md", readmeEn, "docs/ROADMAP.en.md");
requireText("README.en.md", readmeEn, "data/verification-backlog.json");
requireText("ROADMAP.fa.md", roadmapFa, "اعتبارسنجی Credential از مسیر غیرایرانی به معنی تکمیل ماتریس VPN نیست");
requireText("ROADMAP.en.md", roadmapEn, "Credential validation through a non-Iranian route does not mean that a complete VPN-access matrix has been executed");
requireText("ROADMAP.fa.md", roadmapFa, "Issue #32");
requireText("ROADMAP.fa.md", roadmapFa, "Issue #35");
requireText("ROADMAP.en.md", roadmapEn, "Issue #32");
requireText("ROADMAP.en.md", roadmapEn, "Issue #35");
requireText("VERIFICATION_BACKLOG.fa.md", backlogFa, "npm run verification:backlog:test");
rejectText("README.md", readmeFa, "✅ تست مستقیم و VPN روی دو شبکهٔ مستقل");
rejectText("README.en.md", readmeEn, "| Providers |");
rejectText("README.en.md", readmeEn, "all green");
rejectText("ROADMAP.fa.md", roadmapFa, "Credential مجاز برای ۱۰ Provider");
rejectText("ROADMAP.en.md", roadmapEn, "10 remaining providers");
rejectText("ROADMAP.en.md", roadmapEn, "11 unknown Iran-access records");

for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length > 0) process.exit(1);
console.log("Roadmap and verification-backlog contracts passed.");
