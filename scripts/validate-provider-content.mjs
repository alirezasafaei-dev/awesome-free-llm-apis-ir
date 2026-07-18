import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { validateProviderContent } from "./provider-content-contract.mjs";

const root = process.cwd();
const catalogPath = path.join(root, "catalog.json");
const contentDir = path.join(root, "content", "providers");
const generatedGuidesPath = path.join(root, "scripts", "build-guides.mjs");
const persianGuidesDir = path.join(root, "content", "fa");

const errors = [];
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const providerById = new Map(catalog.providers.map((provider) => [provider.id, provider]));
const knownProviderIds = new Set(providerById.keys());

async function listJsonFiles(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function collectGuideSlugs() {
  const slugs = new Set();
  const generated = await readFile(generatedGuidesPath, "utf8");
  for (const match of generated.matchAll(/slug:\s*"([a-z0-9-]+)"/g)) slugs.add(match[1]);

  try {
    for (const entry of await readdir(persianGuidesDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const source = await readFile(path.join(persianGuidesDir, entry.name), "utf8");
      const match = source.match(/^slug:\s*["']?([a-z0-9-]+)["']?\s*$/m);
      if (match) slugs.add(match[1]);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return slugs;
}

const knownGuideSlugs = await collectGuideSlugs();
const files = await listJsonFiles(contentDir);
const seenIds = new Set();

for (const file of files) {
  const filePath = path.join(contentDir, file);
  let content;
  try {
    content = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    errors.push(`${file}: invalid JSON: ${error.message}`);
    continue;
  }

  const provider = providerById.get(content.provider_id);
  const validationErrors = validateProviderContent(content, {
    verificationDate: provider?.verification?.last_checked,
    knownProviderIds
  });

  if (`${content.provider_id}.json` !== file) {
    validationErrors.push("filename must match provider_id");
  }
  if (seenIds.has(content.provider_id)) validationErrors.push("provider_id must be unique");
  seenIds.add(content.provider_id);

  for (const slug of content.related_guides ?? []) {
    if (!knownGuideSlugs.has(slug)) validationErrors.push(`related guide does not exist: ${slug}`);
  }

  for (const message of validationErrors) errors.push(`${file}: ${message}`);
}

for (const message of errors) console.error(`ERROR ${message}`);
if (errors.length) process.exit(1);

console.log(`Validated ${files.length} provider editorial content file(s).`);
