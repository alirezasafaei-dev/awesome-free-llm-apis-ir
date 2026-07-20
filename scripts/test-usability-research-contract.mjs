import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const templatePath = path.join(root, ".github", "ISSUE_TEMPLATE", "usability-feedback.yml");
const protocolPath = path.join(root, "docs", "USABILITY_TEST_PROTOCOL.fa.md");
const metricsPath = path.join(root, "docs", "UX_METRICS_BASELINE.fa.md");
const analyticsPath = path.join(root, "site", "analytics.js");

for (const file of [templatePath, protocolPath, metricsPath, analyticsPath]) await access(file);

const template = await readFile(templatePath, "utf8");
const protocol = await readFile(protocolPath, "utf8");
const metrics = await readFile(metricsPath, "utf8");
const analytics = await readFile(analyticsPath, "utf8");

for (const id of [
  "audience",
  "device",
  "journey",
  "five_second_comprehension",
  "task",
  "outcome",
  "duration",
  "confusion_point",
  "severity",
  "confidence",
  "privacy"
]) {
  if (!template.includes(`id: ${id}`)) throw new Error(`Usability issue template is missing field: ${id}`);
}

for (const privacyTerm of ["API Key", "ایمیل", "IP", "Cookie", "اطلاعات هویتی"]) {
  if (!template.includes(privacyTerm)) throw new Error(`Usability issue template is missing privacy warning: ${privacyTerm}`);
}

for (const audience of ["۵ کاربر عادی", "۲ برنامه‌نویس تازه‌کار", "۳ برنامه‌نویس باتجربه"]) {
  if (!protocol.includes(audience)) throw new Error(`Usability protocol is missing sample target: ${audience}`);
}

for (const scenario of ["OU-1", "OU-2", "OU-3", "DEV-1", "DEV-2", "DEV-3", "DEV-4"]) {
  if (!protocol.includes(scenario)) throw new Error(`Usability protocol is missing scenario: ${scenario}`);
}

for (const threshold of [
  "حداقل ۸۰٪ کاربران عادی",
  "Median زمان رسیدن از Homepage به نتایج Finder کمتر از ۲ دقیقه",
  "هیچ مشکل Critical حل‌نشده"
]) {
  if (!protocol.includes(threshold)) throw new Error(`Usability protocol is missing success threshold: ${threshold}`);
}

for (const metric of [
  "Guided Path Rate",
  "Finder Start Rate",
  "Finder Completion Rate",
  "Evidence Review Rate",
  "Official Docs CTR",
  "Quick Start Activation Rate"
]) {
  if (!metrics.includes(metric)) throw new Error(`UX metrics baseline is missing: ${metric}`);
}

if (!metrics.includes("UNAVAILABLE — ACCESS REQUIRED")) throw new Error("Metrics baseline must distinguish unavailable data from zero");
if (!metrics.includes("UNAVAILABLE — RESEARCH REQUIRED")) throw new Error("Metrics baseline must distinguish missing research from zero");

for (const eventName of [
  "ux_path_click",
  "catalog_advanced_open",
  "api_finder_started",
  "api_finder_completed",
  "api_finder_advanced_open",
  "quick_start_code_copy"
]) {
  if (!metrics.includes(`\`${eventName}\``)) throw new Error(`Metrics baseline is missing event: ${eventName}`);
}

for (const signal of [
  'const pageType = document.body.dataset.pageType ?? ""',
  'if (pageType === "quick-start")',
  'sendEvent("quick_start_code_copy", { example })',
  'path: href.includes("/quick-start/") ? "developer_quick_start" : "developer_finder"'
]) {
  if (!analytics.includes(signal)) throw new Error(`Analytics research contract is missing: ${signal}`);
}

if (/\bsk-[A-Za-z0-9_-]{16,}\b/.test(template + protocol + metrics + analytics)) {
  throw new Error("Possible API secret found in usability research assets");
}
if (/BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY/.test(template + protocol + metrics + analytics)) {
  throw new Error("Private key material found in usability research assets");
}

console.log("Usability research contract passed: structured intake, moderated protocol, measurable KPIs and privacy-safe activation events are complete.");
