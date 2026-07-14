import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const outputPath = path.join(root, "catalog.json");
const providers = [];

for (const file of (await readdir(providersDir)).filter((name) => name.endsWith(".json")).sort()) {
  providers.push(JSON.parse(await readFile(path.join(providersDir, file), "utf8")));
}

providers.sort((a, b) => a.id.localeCompare(b.id, "en"));
const lastUpdated = providers.map((provider) => provider.verification.last_checked).sort().at(-1) ?? null;
const catalog = {
  schema_version: "1.0.0",
  last_updated: lastUpdated,
  provider_count: providers.length,
  providers
};
const next = `${JSON.stringify(catalog, null, 2)}\n`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = await readFile(outputPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (current !== next) {
    console.error("catalog.json is out of date. Run: npm run generate");
    process.exit(1);
  }
  console.log(`catalog.json is up to date (${providers.length} providers).`);
} else {
  await writeFile(outputPath, next);
  console.log(`Generated catalog.json with ${providers.length} providers.`);
}

