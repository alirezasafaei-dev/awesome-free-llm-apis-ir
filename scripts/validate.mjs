import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const allowed = {
  capabilities: new Set(["chat", "text_generation", "reasoning", "embeddings", "tool_calling", "structured_output"]),
  freeStatus: new Set(["active", "limited", "trial", "none", "unknown"]),
  freeType: new Set(["permanent_allowance", "free_models", "monthly_credit", "trial", "unknown"]),
  iranStatus: new Set(["verified_working", "verified_blocked", "officially_unsupported", "intermittent", "signup_blocked", "unknown"]),
  officialPolicy: new Set(["supported", "unsupported", "not_documented", "unknown"]),
  verification: new Set(["docs_verified", "live_verified", "community_report", "unverified"])
};

const errors = [];
const warnings = [];
const ids = new Set();
const today = new Date();

function fail(file, message) {
  errors.push(`${file}: ${message}`);
}

function warn(file, message) {
  warnings.push(`${file}: ${message}`);
}

function requireFields(value, fields, file, prefix = "") {
  for (const field of fields) {
    if (!(field in value)) fail(file, `missing ${prefix}${field}`);
  }
}

function validHttps(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validateProvider(p, file) {
  requireFields(p, ["schema_version", "id", "name", "website", "docs", "api", "capabilities", "free_tier", "iran_access", "verification", "sources"], file);
  if (p.schema_version !== "1.0.0") fail(file, "schema_version must be 1.0.0");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id ?? "")) fail(file, "invalid id");
  if (ids.has(p.id)) fail(file, `duplicate id ${p.id}`);
  ids.add(p.id);
  if (`${p.id}.json` !== file) fail(file, "filename must match provider id");

  for (const [label, value] of [["website", p.website], ["docs", p.docs], ["api.base_url", p.api?.base_url]]) {
    if (!validHttps(value)) fail(file, `${label} must be an HTTPS URL`);
  }

  if (!Array.isArray(p.capabilities) || p.capabilities.length === 0) fail(file, "capabilities must be non-empty");
  for (const capability of p.capabilities ?? []) {
    if (!allowed.capabilities.has(capability)) fail(file, `unknown capability ${capability}`);
  }

  if (!allowed.freeStatus.has(p.free_tier?.status)) fail(file, "invalid free_tier.status");
  if (!allowed.freeType.has(p.free_tier?.type)) fail(file, "invalid free_tier.type");
  if (!Array.isArray(p.free_tier?.limits)) fail(file, "free_tier.limits must be an array");

  if (!allowed.iranStatus.has(p.iran_access?.status)) fail(file, "invalid iran_access.status");
  if (!allowed.officialPolicy.has(p.iran_access?.official_policy)) fail(file, "invalid iran_access.official_policy");
  const claimsLiveResult = ["verified_working", "verified_blocked", "intermittent"].includes(p.iran_access?.status);
  if (claimsLiveResult && !p.iran_access?.tested_from_iran) fail(file, "verified Iran status requires tested_from_iran=true");
  if (p.iran_access?.tested_from_iran && !validDate(p.iran_access?.tested_at ?? "")) fail(file, "Iran test requires tested_at date");
  if (p.iran_access?.status === "officially_unsupported" && p.iran_access?.official_policy !== "unsupported") {
    fail(file, "officially_unsupported requires official_policy=unsupported");
  }
  if (claimsLiveResult && !(p.iran_access?.evidence ?? []).some((e) => ["live_test", "community_report"].includes(e.type))) {
    fail(file, "verified Iran status requires live/community evidence");
  }

  if (!allowed.verification.has(p.verification?.level)) fail(file, "invalid verification.level");
  if (!validDate(p.verification?.last_checked ?? "")) fail(file, "invalid verification.last_checked");
  const checked = new Date(`${p.verification?.last_checked}T00:00:00Z`);
  if (checked > today) fail(file, "verification date cannot be in the future");
  const ageDays = Math.floor((today - checked) / 86_400_000);
  if (ageDays > (p.verification?.stale_after_days ?? 0)) warn(file, `data is stale (${ageDays} days old)`);

  if (!Array.isArray(p.sources) || p.sources.length === 0) fail(file, "sources must be non-empty");
  for (const source of p.sources ?? []) {
    if (!validHttps(source)) fail(file, `source must be HTTPS: ${source}`);
  }
}

const files = (await readdir(providersDir)).filter((file) => file.endsWith(".json")).sort();
if (files.length === 0) errors.push("No provider files found");

for (const file of files) {
  try {
    const provider = JSON.parse(await readFile(path.join(providersDir, file), "utf8"));
    validateProvider(provider, file);
  } catch (error) {
    fail(file, `invalid JSON: ${error.message}`);
  }
}

for (const message of warnings) console.warn(`WARN ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);

if (errors.length) process.exit(1);
console.log(`Validated ${files.length} provider files with ${warnings.length} warning(s).`);

