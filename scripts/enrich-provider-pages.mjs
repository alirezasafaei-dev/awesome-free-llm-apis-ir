import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { renderProviderContent, validateProviderContent } from "./provider-content-contract.mjs";

const root = process.cwd();
const catalogPath = path.join(root, "catalog.json");
const contentDir = path.join(root, "content", "providers");
const providerPagesDir = path.join(root, ".site-dist", "providers");
const startMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_START -->";
const endMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_END -->";
const insertionAnchor = '<section class="provider-sources">';

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function listContentFiles() {
  try {
    return (await readdir(contentDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const providerById = new Map(catalog.providers.map((provider) => [provider.id, provider]));
const knownProviderIds = new Set(providerById.keys());
const files = await listContentFiles();
let enriched = 0;

for (const file of files) {
  const content = JSON.parse(await readFile(path.join(contentDir, file), "utf8"));
  const provider = providerById.get(content.provider_id);
  const errors = validateProviderContent(content, {
    verificationDate: provider?.verification?.last_checked,
    knownProviderIds
  });

  if (`${content.provider_id}.json` !== file) errors.push("filename must match provider_id");
  if (errors.length) {
    throw new Error(`${file}: ${errors.join("; ")}`);
  }

  const pagePath = path.join(providerPagesDir, content.provider_id, "index.html");
  const html = await readFile(pagePath, "utf8");
  const startCount = html.split(startMarker).length - 1;
  const endCount = html.split(endMarker).length - 1;

  if (startCount !== 0 || endCount !== 0) {
    continue;
  }
  if (!html.includes(insertionAnchor)) {
    throw new Error(`${content.provider_id}: provider sources anchor was not found`);
  }

  const rendered = renderProviderContent(content, escapeHtml);
  const block = `${startMarker}\n      <div class="provider-editorial-content" data-provider-content-id="${escapeHtml(content.provider_id)}">${rendered}\n      </div>\n      ${endMarker}\n      `;
  const nextHtml = html.replace(insertionAnchor, `${block}${insertionAnchor}`);

  if ((nextHtml.split(startMarker).length - 1) !== 1 || (nextHtml.split(endMarker).length - 1) !== 1) {
    throw new Error(`${content.provider_id}: editorial content must be inserted exactly once`);
  }

  await writeFile(pagePath, nextHtml);
  enriched += 1;
}

console.log(`Enriched ${enriched} provider page(s) from validated editorial content.`);
