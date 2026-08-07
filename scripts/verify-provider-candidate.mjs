import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const reportsDir = path.join(root, "reports", "local");
const backlogPath = path.join(root, "data", "provider-expansion-backlog.json");

const providerId = process.argv[2];
const mode = process.argv[3] || "dry";

if (!providerId) {
  console.error("Usage: node scripts/verify-provider-candidate.mjs <provider-id> [dry|check]");
  console.error("  dry   — report what needs to be verified (default)");
  console.error("  check — validate that required evidence exists in provider JSON");
  process.exit(1);
}

if (!["dry", "check"].includes(mode)) {
  console.error(`Unknown mode: ${mode}. Use 'dry' or 'check'.`);
  process.exit(1);
}

const backlog = JSON.parse(await readFile(backlogPath, "utf8"));

const candidate = Object.values(backlog.waves)
  .flat()
  .find((c) => c.id === providerId);

if (!candidate) {
  console.error(`Provider '${providerId}' not found in expansion backlog.`);
  process.exit(1);
}

const stubPath = path.join(providersDir, `${providerId}.json`);
let providerData;
try {
  providerData = JSON.parse(await readFile(stubPath, "utf8"));
} catch {
  console.error(`Provider stub not found: ${stubPath}`);
  process.exit(1);
}

const stages = {
  documentary: {
    label: "بررسی مستندات رسمی",
    requires: ["website", "docs"],
    check: (p) => Boolean(p.website && p.docs),
    evidence: "URL مستندات رسمی و وب‌سایت باید موجود باشد"
  },
  signup: {
    label: "بررسی فرآیند ثبت‌نام",
    requires: ["signup"],
    check: (p) => p.signup !== null && p.signup !== undefined,
    evidence: "آدرس ثبت‌نام باید ثبت شده باشد"
  },
  credential_issuance: {
    label: "صدور Credential",
    requires: ["api.auth"],
    check: (p) => Boolean(p.api?.auth),
    evidence: "نوع احراز هویت API باید ثبت شده باشد"
  },
  model_listing: {
    label: "فهرست مدل‌ها",
    requires: ["models.source"],
    check: (p) => Boolean(p.models?.source),
    evidence: "منبع فهرست مدل‌ها باید ثبت شده باشد"
  },
  authenticated_inference: {
    label: "درخواست احراز هویت‌شده",
    requires: ["verification.level"],
    check: (p) => p.verification?.level === "verified" || p.verification?.level === "credential_validated",
    evidence: "حداقل یک درخواست واقعی احراز هویت‌شده باید انجام شده باشد"
  },
  metering: {
    label: "اندازه‌گیری مصرف",
    requires: ["verification.stages.metering"],
    check: (p) => p.verification?.stages?.metering === true,
    evidence: "اندازه‌گیری قبل و بعد مشاهده شده باشد"
  },
  iran_direct: {
    label: "تست مستقیم از ایران",
    requires: ["iran_access.status"],
    check: (p) => p.iran_access?.status === "verified_working",
    evidence: "تست مستقیم از ایران با تاریخ و ASN انجام شده باشد"
  },
  foreign_control: {
    label: "تست کنترل خارجی",
    requires: ["verification.stages.foreign_control"],
    check: (p) => p.verification?.stages?.foreign_control === true,
    evidence: "تست از شبکه خارج از ایران انجام شده باشد"
  }
};

function printStageStatus(stageKey, stage) {
  const completed = stage.check(providerData);
  const icon = completed ? "✅" : "⬜";
  console.log(`  ${icon} ${stage.label} (${stageKey})`);
  if (!completed) {
    console.log(`     → ${stage.evidence}`);
  }
}

console.log(`\n🔍 بررسی وضعیت اعتبارسنجی: ${providerData.name}`);
console.log(`   موج: ${candidate.wave}`);
console.log(`   نوع سرویس مورد انتظار: ${candidate.expected_service_type}`);
console.log(`   نوع دسترسی رایگان مورد انتظار: ${candidate.expected_free_tier_type || "نامشخص"}`);
console.log(`   وضعیت فعلی: ${providerData.verification.level}`);
console.log("");

const completedStages = [];
const pendingStages = [];

for (const [key, stage] of Object.entries(stages)) {
  if (stage.check(providerData)) {
    completedStages.push(key);
  } else {
    pendingStages.push(key);
  }
  printStageStatus(key, stage);
}

console.log(`\n📊 خلاصه: ${completedStages.length} تکمیل‌شده، ${pendingStages.length} باقی‌مانده`);

if (mode === "check") {
  if (pendingStages.length > 0) {
    console.log(`\n⚠️  مراحل باقی‌مانده: ${pendingStages.join(", ")}`);
    process.exit(1);
  }
  console.log("\n✅ تمام مراحل اعتبارسنجی تکمیل شده است.");
}

if (mode === "dry") {
  await mkdir(reportsDir, { recursive: true });
  const report = {
    provider_id: providerId,
    provider_name: providerData.name,
    wave: candidate.wave,
    checked_at: new Date().toISOString(),
    mode,
    completed_stages: completedStages,
    pending_stages: pendingStages,
    total_completed: completedStages.length,
    total_pending: pendingStages.length,
    recommendation: pendingStages.length === 0
      ? "آماده برای ارتقاء به verification.level='verified'"
      : `مراحل باقی‌مانده: ${pendingStages.join(", ")}`
  };

  const reportPath = path.join(reportsDir, `verify-${providerId}-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 گزارش ذخیره شد: ${reportPath}`);
}
