import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const ROOT = join(import.meta.dirname, "..");
const SCHEMA_PATH = join(ROOT, "schema", "repository-audit.schema.json");
const DATA_PATH = join(ROOT, "data", "repository-audits.json");
const PROVIDERS_DIR = join(ROOT, "data", "providers");
const TOOLS_DIR = join(ROOT, "data", "tools");
const UPSTREAMS_PATH = join(ROOT, "data", "upstreams.json");

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));
const errors = [];

const itemSchema = schema.properties.audits.items.properties;
const validDecisions = new Set(itemSchema.decision.enum);
const validClassifications = new Set(itemSchema.classification.enum);
const validScopes = new Set(itemSchema.scope.enum);
const validMaintenance = new Set(itemSchema.maintenance_status.enum);
const validCompatibility = new Set(itemSchema.openai_compatible.enum);
const validAuth = new Set(itemSchema.auth_surface.items.enum);
const validFreeEvidence = new Set(itemSchema.free_api_evidence.enum);
const validRisk = new Set(itemSchema.risk.enum);
const validEvidenceTypes = new Set(itemSchema.evidence.items.properties.type.enum);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function fail(subject, message) {
  errors.push(`${subject}: ${message}`);
}

function readJsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")));
}

const providers = readJsonFiles(PROVIDERS_DIR);
const tools = readJsonFiles(TOOLS_DIR);
const upstreams = JSON.parse(readFileSync(UPSTREAMS_PATH, "utf8"));

const providerSources = new Set(
  providers.flatMap((provider) => Array.isArray(provider.sources) ? provider.sources : [])
);
const toolRepositories = new Set(tools.map((tool) => tool.repository));
const upstreamRepositories = new Set(
  upstreams.sources.map((source) => `https://github.com/${source.repository}`)
);

if (data.schema_version !== "1.0.0") fail("registry", "schema_version must be 1.0.0");
if (!ISO_DATE.test(data.last_updated)) fail("registry", "last_updated must be YYYY-MM-DD");
if (!Array.isArray(data.audits) || data.audits.length === 0) fail("registry", "audits must be a non-empty array");

const seen = new Set();
for (const audit of data.audits ?? []) {
  const subject = audit.repository ?? "<missing repository>";
  if (!REPOSITORY.test(subject)) fail(subject, "repository must use owner/name form");
  if (seen.has(subject)) fail(subject, "duplicate repository audit");
  seen.add(subject);

  const expectedUrl = `https://github.com/${subject}`;
  if (audit.repository_url !== expectedUrl) fail(subject, `repository_url must equal ${expectedUrl}`);
  if (!validDecisions.has(audit.decision)) fail(subject, `invalid decision: ${audit.decision}`);
  if (!validClassifications.has(audit.classification)) fail(subject, `invalid classification: ${audit.classification}`);
  if (!validScopes.has(audit.scope)) fail(subject, `invalid scope: ${audit.scope}`);
  if (!validMaintenance.has(audit.maintenance_status)) fail(subject, `invalid maintenance_status: ${audit.maintenance_status}`);
  if (typeof audit.archived !== "boolean") fail(subject, "archived must be boolean");
  if (audit.archived && audit.maintenance_status !== "archived") fail(subject, "archived repositories must use maintenance_status=archived");
  if (!audit.archived && audit.maintenance_status === "archived") fail(subject, "maintenance_status=archived requires archived=true");
  if (audit.last_activity_at !== null && !ISO_DATE.test(audit.last_activity_at ?? "")) fail(subject, "last_activity_at must be null or YYYY-MM-DD");

  if (!validCompatibility.has(audit.openai_compatible)) fail(subject, `invalid openai_compatible: ${audit.openai_compatible}`);
  if (!Array.isArray(audit.auth_surface) || audit.auth_surface.length === 0) fail(subject, "auth_surface must be a non-empty array");
  for (const auth of audit.auth_surface ?? []) {
    if (!validAuth.has(auth)) fail(subject, `invalid auth_surface value: ${auth}`);
  }
  if ((audit.auth_surface ?? []).length !== new Set(audit.auth_surface ?? []).size) fail(subject, "auth_surface values must be unique");

  if (!validFreeEvidence.has(audit.free_api_evidence)) fail(subject, `invalid free_api_evidence: ${audit.free_api_evidence}`);
  if (!audit.license || typeof audit.license !== "string") fail(subject, "license is required; use unknown when not verified");
  if (!validRisk.has(audit.risk)) fail(subject, `invalid risk: ${audit.risk}`);
  if (!audit.reason_fa || typeof audit.reason_fa !== "string") fail(subject, "reason_fa is required");

  if (!Array.isArray(audit.evidence) || audit.evidence.length === 0) fail(subject, "at least one evidence item is required");
  for (const evidence of audit.evidence ?? []) {
    if (!validEvidenceTypes.has(evidence.type)) fail(subject, `invalid evidence type: ${evidence.type}`);
    if (!evidence.url?.startsWith("https://")) fail(subject, `evidence URL must use HTTPS: ${evidence.url}`);
    if (!ISO_DATE.test(evidence.checked_at ?? "")) fail(subject, "evidence.checked_at must be YYYY-MM-DD");
    if (!evidence.notes_fa || typeof evidence.notes_fa !== "string") fail(subject, "evidence.notes_fa is required");
  }

  if (audit.decision === "add_provider") {
    if (audit.scope !== "provider_catalog") fail(subject, "add_provider requires scope=provider_catalog");
    if (!providerSources.has(expectedUrl)) fail(subject, "add_provider repository must be referenced by a provider source");
    if (!upstreamRepositories.has(expectedUrl)) fail(subject, "add_provider repository must also be monitored as an upstream");
    if (!new Set(["verified", "claimed"]).has(audit.free_api_evidence)) fail(subject, "add_provider requires free API evidence");
  }

  if (audit.decision === "add_upstream" && !upstreamRepositories.has(expectedUrl)) {
    fail(subject, "add_upstream decision requires an entry in data/upstreams.json");
  }

  if (audit.decision === "watch") {
    if (!upstreamRepositories.has(expectedUrl)) fail(subject, "watch decision requires an upstream entry");
    if (audit.scope === "provider_catalog" && !providerSources.has(expectedUrl)) fail(subject, "provider watch must be referenced by provider sources");
  }

  if (audit.decision === "reject") {
    if (audit.scope !== "out_of_scope") fail(subject, "reject decisions must use scope=out_of_scope");
    if (providerSources.has(expectedUrl)) fail(subject, "rejected repository must not be referenced by provider sources");
    if (toolRepositories.has(expectedUrl)) fail(subject, "rejected repository must not exist in the tools catalog");
  }

  if (audit.classification === "session_bridge") {
    const hasSessionCredential = audit.auth_surface.some((auth) => ["cookie", "browser_session"].includes(auth));
    if (!hasSessionCredential) fail(subject, "session_bridge must declare cookie or browser_session auth surface");
  }

  if (audit.free_api_evidence === "verified") {
    const hasFirstPartyEvidence = audit.evidence.some((evidence) => ["official_docs", "readme"].includes(evidence.type));
    if (!hasFirstPartyEvidence) fail(subject, "verified free API evidence requires first-party docs or README evidence");
  }
}

for (const error of errors) console.error(error);
if (errors.length > 0) {
  console.error(`\n${errors.length} repository audit validation error(s).`);
  process.exit(1);
}

console.log(`Validated ${data.audits.length} repository audits with catalog-boundary checks.`);
