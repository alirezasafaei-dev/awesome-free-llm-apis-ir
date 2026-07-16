import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const DATA_DIR = join(import.meta.dirname, "..", "data", "tools");
const OUTPUT = join(import.meta.dirname, "..", "catalog-tools.json");

const checkFlag = process.argv.includes("--check");

const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort();
const tools = files.map((f) => JSON.parse(readFileSync(join(DATA_DIR, f), "utf8")));

const lastUpdated = tools
  .map((t) => t.verification.last_checked)
  .sort()
  .reverse()[0];

const catalog = {
  schema_version: "1.0.0",
  last_updated: lastUpdated,
  tool_count: tools.length,
  tools: tools.map((t) => ({
    id: t.id,
    name: t.name,
    tool_type: t.tool_type,
    deployment: t.deployment.type,
    auth_type: t.auth_surface.type,
    credential_storage: t.auth_surface.credential_storage,
    openai_compatible: t.capabilities.openai_compatible,
    anthropic_compatible: t.capabilities.anthropic_compatible,
    iran_status: t.iran_compatibility.status,
    terms_risk: t.risk.terms,
    stability_risk: t.risk.stability,
    credential_safety: t.risk.credential_safety,
    last_checked: t.verification.last_checked
  }))
};

const output = `${JSON.stringify(catalog, null, 2)}\n`;

if (checkFlag) {
  const existing = readFileSync(OUTPUT, "utf8");
  if (existing !== output) {
    console.error("catalog-tools.json is out of date. Run: npm run generate:tools");
    process.exit(1);
  }
  console.log("catalog-tools.json is up to date.");
} else {
  writeFileSync(OUTPUT, output);
  console.log(`Generated catalog-tools.json with ${tools.length} tools.`);
}
