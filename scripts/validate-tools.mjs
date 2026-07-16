import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const SCHEMA_PATH = join(import.meta.dirname, "..", "schema", "tool.schema.json");
const DATA_DIR = join(import.meta.dirname, "..", "data", "tools");

const errors = [];
const warnings = [];

function fail(file, msg) { errors.push(`${file}: ${msg}`); }
function warn(file, msg) { warnings.push(`WARN ${file}: ${msg}`); }

const schemaText = readFileSync(SCHEMA_PATH, "utf8");
const schema = JSON.parse(schemaText);

const validToolTypes = new Set(schema.properties.tool_type.enum);
const validDeployments = new Set(schema.properties.deployment.properties.type.enum);
const validAuthTypes = new Set(schema.properties.auth_surface.properties.type.enum);
const validCredentialStorage = new Set(schema.properties.auth_surface.properties.credential_storage.enum);
const validFeatures = new Set(schema.properties.capabilities.properties.features.items.enum);
const validIranStatuses = new Set(schema.properties.iran_compatibility.properties.status.enum);
const validRiskLevels = ["low", "medium", "high", "critical"];
const validStability = new Set(schema.properties.risk.properties.stability.enum);
const validCredentialSafety = new Set(schema.properties.risk.properties.credential_safety.enum);
const validVerificationLevels = new Set(schema.properties.verification.properties.level.enum);

function validateTool(t, file) {
  if (!t.schema_version || t.schema_version !== "1.0.0") fail(file, "schema_version must be 1.0.0");
  if (!validToolTypes.has(t.tool_type)) fail(file, `Invalid tool_type: ${t.tool_type}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.id)) fail(file, `Invalid id format: ${t.id}`);
  if (!t.name || t.name.trim().length === 0) fail(file, "name is required");
  if (!t.description || t.description.trim().length === 0) fail(file, "description is required");
  if (!t.description_fa || t.description_fa.trim().length === 0) fail(file, "description_fa is required");

  if (!t.repository || !t.repository.startsWith("https://github.com/")) fail(file, "repository must be an HTTPS GitHub URL");

  if (!validDeployments.has(t.deployment.type)) fail(file, `Invalid deployment type: ${t.deployment.type}`);

  if (!validAuthTypes.has(t.auth_surface.type)) fail(file, `Invalid auth_surface type: ${t.auth_surface.type}`);
  if (!validCredentialStorage.has(t.auth_surface.credential_storage)) fail(file, `Invalid credential_storage: ${t.auth_surface.credential_storage}`);

  if (typeof t.capabilities.openai_compatible !== "boolean") fail(file, "capabilities.openai_compatible must be boolean");
  if (typeof t.capabilities.anthropic_compatible !== "boolean") fail(file, "capabilities.anthropic_compatible must be boolean");
  if (!Array.isArray(t.capabilities.supported_upstreams) || t.capabilities.supported_upstreams.length === 0) fail(file, "capabilities.supported_upstreams must be a non-empty array");
  if (t.capabilities.supported_upstreams.length !== new Set(t.capabilities.supported_upstreams).size) fail(file, "capabilities.supported_upstreams must have unique entries");
  if (t.capabilities.features) {
    if (!Array.isArray(t.capabilities.features)) fail(file, "capabilities.features must be an array");
    for (const f of t.capabilities.features) {
      if (!validFeatures.has(f)) fail(file, `Invalid feature: ${f}`);
    }
    if (t.capabilities.features.length !== new Set(t.capabilities.features).size) fail(file, "capabilities.features must have unique entries");
  }

  if (!validIranStatuses.has(t.iran_compatibility.status)) fail(file, `Invalid iran_compatibility.status: ${t.iran_compatibility.status}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.iran_compatibility.last_checked)) fail(file, "iran_compatibility.last_checked must be ISO date YYYY-MM-DD");

  if (!validRiskLevels.includes(t.risk.terms)) fail(file, `Invalid risk.terms: ${t.risk.terms}`);
  if (!validStability.has(t.risk.stability)) fail(file, `Invalid risk.stability: ${t.risk.stability}`);
  if (!validCredentialSafety.has(t.risk.credential_safety)) fail(file, `Invalid risk.credential_safety: ${t.risk.credential_safety}`);

  if (!validVerificationLevels.has(t.verification.level)) fail(file, `Invalid verification.level: ${t.verification.level}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.verification.last_checked)) fail(file, "verification.last_checked must be ISO date YYYY-MM-DD");
  if (!Number.isInteger(t.verification.stale_after_days) || t.verification.stale_after_days < 1) fail(file, "verification.stale_after_days must be a positive integer");

  const now = new Date();
  const checked = new Date(t.verification.last_checked);
  const daysSince = Math.floor((now - checked) / (1000 * 60 * 60 * 24));
  if (daysSince > t.verification.stale_after_days) warn(file, `Data is ${daysSince} days old (stale after ${t.verification.stale_after_days})`);

  if (t.upstream_repositories) {
    if (!Array.isArray(t.upstream_repositories)) fail(file, "upstream_repositories must be an array");
    for (const repo of t.upstream_repositories) {
      if (!repo.startsWith("https://github.com/")) fail(file, `upstream_repositories entry must be HTTPS GitHub URL: ${repo}`);
    }
  }

  const filename = `${t.id}.json`;
  if (!file.endsWith(filename)) fail(file, `Filename must match id: expected ${filename}`);
}

const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  console.error("No tool files found in data/tools/");
  process.exit(1);
}

for (const file of files) {
  const data = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
  validateTool(data, file);
}

for (const w of warnings) console.error(w);
for (const e of errors) console.error(e);

if (errors.length > 0) {
  console.error(`\n${errors.length} validation error(s) in ${files.length} tool file(s).`);
  process.exit(1);
}
console.log(`Validated ${files.length} tool files with 0 warning(s).`);
