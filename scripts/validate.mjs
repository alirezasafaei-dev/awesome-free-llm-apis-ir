import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const allowed = {
  capabilities: new Set(["chat", "text_generation", "reasoning", "embeddings", "tool_calling", "structured_output", "image_generation", "json_mode"]),
  freeStatus: new Set(["active", "limited", "trial", "none", "unknown"]),
  freeType: new Set(["permanent_allowance", "free_models", "monthly_credit", "trial", "unknown"]),
  serviceType: new Set(["official_provider", "official_gateway", "community_gateway", "session_bridge", "self_hosted"]),
  auth: new Set(["api_key", "oauth", "token", "account_id_and_token", "none_or_api_key", "other"]),
  iranStatus: new Set(["verified_working", "verified_working_vpn", "direct_blocked_vpn_working", "verified_blocked", "officially_unsupported", "intermittent", "signup_blocked", "account_activation_blocked", "unknown"]),
  officialPolicy: new Set(["supported", "unsupported", "not_documented", "unknown"]),
  testMethod: new Set(["live_request", "connectivity_probe", "signup_only", "community_report", "official_docs", "not_tested"]),
  route: new Set(["direct", "vpn"]),
  evidenceType: new Set(["official_docs", "live_test", "connectivity_test", "community_report"]),
  connectivityResult: new Set(["http_response", "connection_refused", "timeout", "dns_failure", "tls_failure", "network_error"]),
  verification: new Set(["docs_verified", "live_verified", "community_report", "unverified"])
};
const hostedServiceTypes = new Set(["official_provider", "official_gateway", "community_gateway"]);
const numericLimitFields = new Set([
  "rpm", "rpd", "rph", "tpm", "tph", "tpd", "input_tokens", "output_tokens",
  "concurrent_requests", "daily_units", "monthly_credit_usd", "monthly_requests"
]);
const allowedKeys = {
  provider: new Set(["schema_version", "service_type", "id", "name", "website", "docs", "signup", "api", "capabilities", "free_tier", "iran_access", "models", "verification", "notes_fa", "sources"]),
  api: new Set(["base_url", "openai_compatible", "auth"]),
  freeTier: new Set(["status", "type", "requires_payment_method", "limits", "notes_fa"]),
  limit: new Set(["scope", "model", "condition", "rpm", "rpd", "rph", "tpm", "tph", "tpd", "input_tokens", "output_tokens", "concurrent_requests", "daily_units", "unit_name", "monthly_credit_usd", "monthly_requests", "notes_fa"]),
  iranAccess: new Set(["status", "official_policy", "tested_from_iran", "tested_at", "test_method", "network", "evidence", "notes_fa"]),
  network: new Set(["country", "isp", "asn", "city", "route", "exit_country", "vpn_provider"]),
  evidence: new Set(["type", "url", "checked_at", "timestamp", "http_status", "latency_ms", "model_tested", "endpoint", "source", "connectivity_result", "auth_method", "credential_validated_from", "credential_validated_status", "response_fingerprint", "response_body_fingerprint", "notes_fa"]),
  models: new Set(["dynamic", "source", "notable"]),
  verification: new Set(["level", "last_checked", "checked_by", "stale_after_days"])
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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(file, `${prefix || "value"} must be an object`);
    return;
  }
  for (const field of fields) {
    if (!(field in value)) fail(file, `missing ${prefix}${field}`);
  }
}

function rejectUnknownKeys(value, keys, file, prefix) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) fail(file, `${prefix}${key} is not allowed by the provider schema`);
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

function validHttpsTemplate(value) {
  return typeof value === "string" && validHttps(value.replace(/\{[^}]+\}/g, "placeholder"));
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) && /T/.test(value);
}

function validCountryCode(value) {
  return typeof value === "string" && /^[A-Z]{2}$/.test(value);
}

function datePart(value) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : null;
}

function isSuccessStatus(value) {
  return Number.isInteger(value) && value >= 200 && value < 300;
}

function validateLimit(limit, file, index) {
  const prefix = `free_tier.limits[${index}].`;
  requireFields(limit, ["scope"], file, prefix);
  rejectUnknownKeys(limit, allowedKeys.limit, file, prefix);
  if (typeof limit?.scope !== "string" || !limit.scope.trim()) fail(file, `${prefix}scope must be non-empty`);
  for (const [key, value] of Object.entries(limit ?? {})) {
    if (numericLimitFields.has(key) && value !== null && (typeof value !== "number" || value < 0)) {
      fail(file, `${prefix}${key} must be a non-negative number or null`);
    }
  }
}

function validateEvidence(evidence, file, index) {
  const prefix = `iran_access.evidence[${index}]`;
  requireFields(evidence, ["type"], file, `${prefix}.`);
  rejectUnknownKeys(evidence, allowedKeys.evidence, file, `${prefix}.`);
  if (!allowed.evidenceType.has(evidence?.type)) {
    fail(file, `${prefix}.type is invalid`);
    return;
  }

  if (evidence.type === "official_docs" || evidence.type === "community_report") {
    if (!validHttps(evidence.url)) fail(file, `${prefix}.url must be an HTTPS URL`);
    if (!validDate(evidence.checked_at ?? "")) fail(file, `${prefix}.checked_at must be a date`);
    if (typeof evidence.notes_fa !== "string" || !evidence.notes_fa.trim()) fail(file, `${prefix}.notes_fa must be non-empty`);
  }

  if (evidence.type === "live_test") {
    if (!validDateTime(evidence.timestamp)) fail(file, `${prefix}.timestamp must be an ISO date-time`);
    if (!Number.isInteger(evidence.http_status) || evidence.http_status < 100 || evidence.http_status > 599) {
      fail(file, `${prefix}.http_status must be an integer from 100 to 599`);
    }
    if (!Number.isInteger(evidence.latency_ms) || evidence.latency_ms < 0) fail(file, `${prefix}.latency_ms must be a non-negative integer`);
    if (typeof evidence.model_tested !== "string" || !evidence.model_tested.trim()) fail(file, `${prefix}.model_tested must be non-empty`);
    if (!validHttpsTemplate(evidence.endpoint)) fail(file, `${prefix}.endpoint must be an HTTPS URL`);
    if (typeof evidence.source !== "string" || !evidence.source.trim()) fail(file, `${prefix}.source must be non-empty`);
    if (evidence.auth_method != null && (typeof evidence.auth_method !== "string" || !evidence.auth_method.trim())) {
      fail(file, `${prefix}.auth_method must be a non-empty string or null`);
    }
  }

  if (evidence.type === "connectivity_test") {
    if (!validDate(evidence.checked_at ?? "")) fail(file, `${prefix}.checked_at must be a date`);
    if (!validHttpsTemplate(evidence.endpoint)) fail(file, `${prefix}.endpoint must be an HTTPS URL`);
    if (typeof evidence.source !== "string" || !evidence.source.trim()) fail(file, `${prefix}.source must be non-empty`);
    if (!allowed.connectivityResult.has(evidence.connectivity_result)) fail(file, `${prefix}.connectivity_result is invalid`);
    if (typeof evidence.notes_fa !== "string" || !evidence.notes_fa.trim()) fail(file, `${prefix}.notes_fa must be non-empty`);
    if (evidence.connectivity_result === "http_response") {
      if (!Number.isInteger(evidence.http_status) || evidence.http_status < 100 || evidence.http_status > 599) {
        fail(file, `${prefix}.http_status must be present for an HTTP response`);
      }
    } else if (evidence.http_status != null) {
      fail(file, `${prefix}.http_status must be omitted when no HTTP response was received`);
    }
    if (evidence.latency_ms != null && (!Number.isInteger(evidence.latency_ms) || evidence.latency_ms < 0)) {
      fail(file, `${prefix}.latency_ms must be a non-negative integer or null`);
    }
  }

  const hasCredentialSource = evidence.credential_validated_from != null;
  const hasCredentialStatus = evidence.credential_validated_status != null;
  if (hasCredentialSource !== hasCredentialStatus) {
    fail(file, `${prefix} credential validation source and status must be provided together`);
  }
  if (hasCredentialSource && evidence.type !== "live_test") {
    fail(file, `${prefix} credential validation metadata is only valid for live_test evidence`);
  }
  if (hasCredentialSource && (typeof evidence.credential_validated_from !== "string" || !evidence.credential_validated_from.trim())) {
    fail(file, `${prefix}.credential_validated_from must be a non-empty string`);
  }
  if (hasCredentialStatus && (!Number.isInteger(evidence.credential_validated_status) || evidence.credential_validated_status < 100 || evidence.credential_validated_status > 599)) {
    fail(file, `${prefix}.credential_validated_status must be an integer from 100 to 599`);
  }
}

function validateProvider(p, file) {
  requireFields(p, ["schema_version", "service_type", "id", "name", "website", "docs", "api", "capabilities", "free_tier", "iran_access", "verification", "sources"], file);
  rejectUnknownKeys(p, allowedKeys.provider, file, "");
  rejectUnknownKeys(p.api, allowedKeys.api, file, "api.");
  rejectUnknownKeys(p.free_tier, allowedKeys.freeTier, file, "free_tier.");
  rejectUnknownKeys(p.iran_access, allowedKeys.iranAccess, file, "iran_access.");
  rejectUnknownKeys(p.iran_access?.network, allowedKeys.network, file, "iran_access.network.");
  rejectUnknownKeys(p.models, allowedKeys.models, file, "models.");
  rejectUnknownKeys(p.verification, allowedKeys.verification, file, "verification.");

  if (p.schema_version !== "1.1.0") fail(file, "schema_version must be 1.1.0");
  if (!allowed.serviceType.has(p.service_type)) fail(file, "invalid service_type");
  if (!hostedServiceTypes.has(p.service_type)) fail(file, "session_bridge and self_hosted entries belong in the separate tools catalog");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id ?? "")) fail(file, "invalid id");
  if (ids.has(p.id)) fail(file, `duplicate id ${p.id}`);
  ids.add(p.id);
  if (`${p.id}.json` !== file) fail(file, "filename must match provider id");

  for (const [label, value] of [["website", p.website], ["docs", p.docs], ["api.base_url", p.api?.base_url]]) {
    if (!validHttpsTemplate(value)) fail(file, `${label} must be an HTTPS URL`);
  }
  if (p.signup !== undefined && p.signup !== null && !validHttps(p.signup)) fail(file, "signup must be an HTTPS URL or null");
  if (typeof p.api?.openai_compatible !== "boolean") fail(file, "api.openai_compatible must be boolean");
  if (!allowed.auth.has(p.api?.auth)) fail(file, "invalid api.auth");

  if (!Array.isArray(p.capabilities) || p.capabilities.length === 0) fail(file, "capabilities must be non-empty");
  if (new Set(p.capabilities ?? []).size !== (p.capabilities ?? []).length) fail(file, "capabilities must be unique");
  for (const capability of p.capabilities ?? []) {
    if (!allowed.capabilities.has(capability)) fail(file, `unknown capability ${capability}`);
  }

  if (!allowed.freeStatus.has(p.free_tier?.status)) fail(file, "invalid free_tier.status");
  if (!allowed.freeType.has(p.free_tier?.type)) fail(file, "invalid free_tier.type");
  if (![true, false, null].includes(p.free_tier?.requires_payment_method)) fail(file, "free_tier.requires_payment_method must be boolean or null");
  if (!Array.isArray(p.free_tier?.limits)) fail(file, "free_tier.limits must be an array");
  for (const [index, limit] of (p.free_tier?.limits ?? []).entries()) validateLimit(limit, file, index);

  if (!allowed.iranStatus.has(p.iran_access?.status)) fail(file, "invalid iran_access.status");
  if (!allowed.officialPolicy.has(p.iran_access?.official_policy)) fail(file, "invalid iran_access.official_policy");
  if (!allowed.testMethod.has(p.iran_access?.test_method)) fail(file, "invalid iran_access.test_method");
  if (typeof p.iran_access?.tested_from_iran !== "boolean") fail(file, "iran_access.tested_from_iran must be boolean");

  const claimsLiveResult = ["verified_working", "verified_working_vpn", "direct_blocked_vpn_working", "verified_blocked", "intermittent"].includes(p.iran_access?.status);
  const claimsVpnResult = ["verified_working_vpn", "direct_blocked_vpn_working"].includes(p.iran_access?.status);
  const evidence = p.iran_access?.evidence;
  if (!Array.isArray(evidence)) fail(file, "iran_access.evidence must be an array");
  for (const [index, item] of (evidence ?? []).entries()) validateEvidence(item, file, index);
  const liveEvidence = (evidence ?? []).filter((item) => item?.type === "live_test");
  const connectivityEvidence = (evidence ?? []).filter((item) => item?.type === "connectivity_test");

  if (claimsLiveResult && !p.iran_access?.tested_from_iran) fail(file, "verified Iran status requires tested_from_iran=true");
  if (p.iran_access?.tested_from_iran && !validDate(p.iran_access?.tested_at ?? "")) fail(file, "Iran test requires tested_at date");
  if (!p.iran_access?.tested_from_iran && p.iran_access?.tested_at !== null) fail(file, "untested Iran status requires tested_at=null");
  if (p.iran_access?.tested_from_iran) {
    if (!p.iran_access.network || typeof p.iran_access.network !== "object") fail(file, "Iran test requires network metadata");
    if (p.iran_access.network?.country !== "IR") fail(file, "Iran test requires network.country=IR");
    if (!allowed.route.has(p.iran_access.network?.route)) fail(file, "Iran test requires network.route direct or vpn");
  }
  if (p.iran_access?.network?.country != null && !validCountryCode(p.iran_access.network.country)) fail(file, "network.country must be an uppercase ISO-2 code");
  if (p.iran_access?.network?.exit_country != null && !validCountryCode(p.iran_access.network.exit_country)) fail(file, "network.exit_country must be an uppercase ISO-2 code");
  if (p.iran_access?.network?.route === "direct" && p.iran_access.network?.exit_country != null && p.iran_access.network.exit_country !== "IR") {
    fail(file, "direct Iran evidence cannot have a non-IR network.exit_country");
  }
  if (p.iran_access?.network?.route === "vpn" && p.iran_access.network?.exit_country === "IR") {
    fail(file, "VPN evidence requires a non-IR network.exit_country");
  }
  if (p.iran_access?.status === "officially_unsupported" && p.iran_access?.official_policy !== "unsupported") {
    fail(file, "officially_unsupported requires official_policy=unsupported");
  }
  if (p.iran_access?.status === "officially_unsupported" && !(evidence ?? []).some((item) => item.type === "official_docs")) {
    fail(file, "officially_unsupported requires official_docs evidence");
  }
  if (claimsLiveResult && !(evidence ?? []).some((item) => ["live_test", "community_report"].includes(item.type))) {
    fail(file, "verified Iran status requires live/community evidence");
  }
  if (p.iran_access?.test_method === "live_request" && p.iran_access?.tested_from_iran && liveEvidence.length === 0) {
    fail(file, "live_request requires live_test evidence");
  }
  if (p.iran_access?.test_method === "connectivity_probe" && p.iran_access?.tested_from_iran && connectivityEvidence.length === 0) {
    fail(file, "connectivity_probe requires connectivity_test evidence");
  }
  if (claimsVpnResult && p.iran_access?.network?.route !== "vpn") fail(file, "VPN status requires network.route=vpn");
  if (claimsVpnResult && !p.iran_access?.network?.exit_country) fail(file, "VPN status requires network.exit_country");

  if (p.iran_access?.status === "verified_working" && !liveEvidence.some((item) => isSuccessStatus(item.http_status))) {
    fail(file, "verified_working requires at least one successful live_test response");
  }
  if (p.iran_access?.status === "verified_blocked") {
    const hasValidatedBlock = liveEvidence.some((item) => !isSuccessStatus(item.http_status) && isSuccessStatus(item.credential_validated_status));
    if (!hasValidatedBlock) fail(file, "verified_blocked requires a failed Iran live_test plus successful credential validation from a supported route");
  }
  if (claimsLiveResult && typeof p.notes_fa === "string" && /(هنوز.{0,40}آزمایش نشده|نیاز به کلید معتبر|نیاز به.{0,40}اعتبارسنجی)/u.test(p.notes_fa)) {
    fail(file, "top-level notes contradict the verified Iran status; summarize the latest evidence instead");
  }

  if (!allowed.verification.has(p.verification?.level)) fail(file, "invalid verification.level");
  if (!validDate(p.verification?.last_checked ?? "")) fail(file, "invalid verification.last_checked");
  const checked = new Date(`${p.verification?.last_checked}T00:00:00Z`);
  if (checked > today) fail(file, "verification date cannot be in the future");
  const ageDays = Math.floor((today - checked) / 86_400_000);
  if (ageDays > (p.verification?.stale_after_days ?? 0)) warn(file, `data is stale (${ageDays} days old)`);

  if ((liveEvidence.length > 0 || connectivityEvidence.length > 0) && p.verification?.level !== "live_verified") {
    fail(file, "live or connectivity evidence requires verification.level=live_verified");
  }
  if (p.iran_access?.tested_at && p.verification?.last_checked < p.iran_access.tested_at) {
    fail(file, "verification.last_checked cannot predate iran_access.tested_at");
  }
  const evidenceDates = (evidence ?? [])
    .map((item) => item.checked_at ?? datePart(item.timestamp))
    .filter((value) => validDate(value ?? ""));
  const latestEvidenceDate = evidenceDates.sort().at(-1);
  if (latestEvidenceDate && p.verification?.last_checked < latestEvidenceDate) {
    fail(file, "verification.last_checked cannot predate the newest evidence item");
  }

  if (!Array.isArray(p.sources) || p.sources.length === 0) fail(file, "sources must be non-empty");
  if (new Set(p.sources ?? []).size !== (p.sources ?? []).length) fail(file, "sources must be unique");
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
