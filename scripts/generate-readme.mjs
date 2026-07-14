import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dir = path.join(root, "data", "providers");
const readmePath = path.join(root, "README.md");
const start = "<!-- PROVIDERS_TABLE_START -->";
const end = "<!-- PROVIDERS_TABLE_END -->";

const labels = {
  permanent_allowance: "سهمیه دائمی",
  free_models: "مدل‌های رایگان",
  monthly_credit: "اعتبار ماهانه",
  trial: "آزمایشی",
  unknown: "نامشخص"
};

const iranLabels = {
  verified_working: "✅ تست‌شده",
  verified_blocked: "⛔ مسدود",
  officially_unsupported: "🚫 پشتیبانی‌نشده رسمی",
  intermittent: "⚠️ ناپایدار",
  signup_blocked: "🧾 ثبت‌نام مسدود",
  unknown: "❔ نامشخص"
};

function compactLimit(provider) {
  const limits = provider.free_tier.limits;
  if (!limits.length) return "وابسته به حساب/مدل";
  const first = limits[0];
  const bits = [];
  if (first.rpm != null) bits.push(`${first.rpm} RPM`);
  if (first.rpd != null) bits.push(`${first.rpd} RPD`);
  if (first.tpm != null) bits.push(`${first.tpm.toLocaleString("en-US")} TPM`);
  if (first.daily_units != null) bits.push(`${first.daily_units.toLocaleString("en-US")} ${first.unit_name ?? "unit"}/day`);
  if (first.monthly_credit_usd != null) bits.push(`$${first.monthly_credit_usd}/month`);
  return bits.slice(0, 2).join(" · ") || "مدل‌محور";
}

const providers = [];
for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json")).sort()) {
  providers.push(JSON.parse(await readFile(path.join(dir, file), "utf8")));
}
providers.sort((a, b) => a.name.localeCompare(b.name, "en"));

const rows = [
  "| سرویس | رایگان | محدودیت نمونه | OpenAI-compatible | دسترسی ایران | آخرین بررسی |",
  "|---|---|---|:---:|---|---|",
  ...providers.map((p) => `| [${p.name}](${p.website}) | ${labels[p.free_tier.type]} | ${compactLimit(p)} | ${p.api.openai_compatible ? "✅" : "—"} | ${iranLabels[p.iran_access.status]} | ${p.verification.last_checked} |`)
];

const generated = `${start}\n<!-- This section is generated. Run: npm run generate -->\n${rows.join("\n")}\n${end}`;
const original = await readFile(readmePath, "utf8");
const begin = original.indexOf(start);
const finish = original.indexOf(end);
if (begin < 0 || finish < 0 || finish < begin) throw new Error("README provider markers are missing or invalid");
const next = original.slice(0, begin) + generated + original.slice(finish + end.length);

if (process.argv.includes("--check")) {
  if (next !== original) {
    console.error("README provider table is out of date. Run: npm run generate");
    process.exit(1);
  }
  console.log("README provider table is up to date.");
} else {
  await writeFile(readmePath, next);
  console.log(`Generated README table for ${providers.length} providers.`);
}

