import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const PROVIDERS_DIR = join(import.meta.dirname, "..", "data", "providers");
const OUTPUT = join(import.meta.dirname, "..", "data.json");

const checkFlag = process.argv.includes("--check");

const files = readdirSync(PROVIDERS_DIR).filter((f) => f.endsWith(".json")).sort();
const providers = files.map((f) => JSON.parse(readFileSync(join(PROVIDERS_DIR, f), "utf8")));

const lastUpdated = providers
  .map((p) => p.verification.last_checked)
  .filter(Boolean)
  .sort()
  .reverse()[0];

const iranLabels = {
  verified_working: "✅ مستقیم تست‌شده",
  verified_working_vpn: "🛡️ با VPN تست‌شده",
  verified_blocked: "⛔ مستقیم مسدود",
  officially_unsupported: "🚫 پشتیبانی‌نشده رسمی",
  unknown: "❔ نامشخص"
};

const output = {
  lastUpdated,
  providerCount: providers.length,
  providers: providers.map((p) => {
    const ia = p.iran_access || {};
    const ft = p.free_tier || {};
    const limit = ft.limits?.[0] || {};
    return {
      id: p.id,
      name: p.name,
      serviceType: p.service_type,
      website: p.website,
      api: {
        baseUrl: p.api?.base_url,
        openaiCompatible: p.api?.openai_compatible ?? false,
        auth: p.api?.auth
      },
      freeTier: {
        status: ft.status,
        type: ft.type,
        requiresPaymentMethod: ft.requires_payment_method ?? true,
        limitExample: limit.rpm ? `${limit.rpm} RPM` : limit.notes_fa || null,
        notesFa: ft.notes_fa || null
      },
      capabilities: p.capabilities || [],
      iranAccess: {
        status: ia.status || "unknown",
        label: iranLabels[ia.status] || "❔ نامشخص",
        tested: ia.tested_from_iran ?? false,
        testedAt: ia.tested_at || null,
        network: ia.network || null,
        evidenceCount: (ia.evidence || []).length,
        notesFa: ia.notes_fa || null
      },
      models: p.models?.notable || [],
      verification: {
        level: p.verification?.level,
        lastChecked: p.verification?.last_checked,
        staleAfterDays: p.verification?.stale_after_days
      }
    };
  })
};

const json = `${JSON.stringify(output, null, 2)}\n`;

if (checkFlag) {
  const existing = readFileSync(OUTPUT, "utf8");
  if (existing !== json) {
    console.error("data.json is out of date. Run: npm run generate:data");
    process.exit(1);
  }
  console.log(`data.json is up to date (${providers.length} providers).`);
} else {
  writeFileSync(OUTPUT, json);
  console.log(`Generated data.json with ${providers.length} providers.`);
}
