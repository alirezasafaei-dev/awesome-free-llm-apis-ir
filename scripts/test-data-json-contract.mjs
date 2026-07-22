import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const ROOT = join(import.meta.dirname, "..");
const PROVIDERS_DIR = join(ROOT, "data", "providers");
const DATA_PATH = join(ROOT, "data.json");

const providers = readdirSync(PROVIDERS_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(PROVIDERS_DIR, file), "utf8")));
const generated = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const iranLabels = {
  verified_working: "✅ مستقیم تست‌شده",
  verified_working_vpn: "🛡️ با VPN تست‌شده",
  direct_blocked_vpn_working: "🛡️ مستقیم مسدود / VPN موفق",
  verified_blocked: "⛔ مستقیم مسدود",
  officially_unsupported: "🚫 پشتیبانی‌نشده رسمی",
  intermittent: "⚠️ ناپایدار",
  signup_blocked: "🧾 ثبت‌نام مسدود",
  unknown: "❔ نامشخص"
};

assert.equal(generated.providerCount, providers.length, "providerCount must match source files");
assert.equal(new Set(generated.providers.map((provider) => provider.id)).size, providers.length, "generated provider ids must be unique");

for (const source of providers) {
  const projected = generated.providers.find((provider) => provider.id === source.id);
  assert.ok(projected, `missing generated provider: ${source.id}`);

  assert.equal(
    projected.freeTier.requiresPaymentMethod,
    source.free_tier.requires_payment_method,
    `${source.id}: requires_payment_method must preserve true, false, or null`
  );

  const iranStatus = source.iran_access?.status ?? "unknown";
  assert.equal(projected.iranAccess.status, iranStatus, `${source.id}: Iran access status must preserve the source value`);
  assert.equal(projected.iranAccess.label, iranLabels[iranStatus], `${source.id}: Iran access label must match the documented status`);

  const firstLimit = source.free_tier.limits?.[0] ?? {};
  if (firstLimit.rpm != null) {
    assert.equal(
      projected.freeTier.limitExample,
      `${firstLimit.rpm} RPM`,
      `${source.id}: first RPM limit must be projected without truthiness coercion`
    );
  }
}

console.log(`Validated data.json projection contract for ${providers.length} providers.`);
