import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const [readmeFa, readmeEn, roadmapFa, roadmapEn] = await Promise.all([
  readFile(path.join(root, "README.md"), "utf8"),
  readFile(path.join(root, "README.en.md"), "utf8"),
  readFile(path.join(root, "docs", "ROADMAP.fa.md"), "utf8"),
  readFile(path.join(root, "docs", "ROADMAP.en.md"), "utf8")
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
requireText("ROADMAP.fa.md", roadmapFa, "اعتبارسنجی Credential از VPN به معنی تکمیل تست VPN همه Providerها نیست");
requireText("ROADMAP.en.md", roadmapEn, "Credential validation through a VPN does not mean that a complete VPN-access matrix has been executed");
rejectText("README.md", readmeFa, "✅ تست مستقیم و VPN روی دو شبکهٔ مستقل");
rejectText("README.en.md", readmeEn, "| Providers |");
rejectText("README.en.md", readmeEn, "all green");

for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length > 0) process.exit(1);
console.log("Roadmap and status-document contracts passed.");
