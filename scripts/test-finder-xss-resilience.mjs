import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const finderFiles = [
  path.join(root, "site", "api-finder", "index.html"),
  path.join(root, "site", "en", "api-finder", "index.html"),
  path.join(root, "site", "api-finder", "finder-clarity.js"),
  path.join(root, "site", "api-finder", "shortlist.js")
];
const compareFiles = [
  path.join(root, "site", "compare", "compare.js"),
  path.join(root, "site", "en", "compare", "compare.js")
];
const appFiles = [
  path.join(root, "site", "app.js")
];

const failures = [];

async function checkNoInnerHTML(filePath, label) {
  const content = await readFile(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(".innerHTML");
    if (idx !== -1 && line.includes("=") && !line.trimStart().startsWith("//")) {
      const context = line.slice(Math.max(0, idx - 30), idx + 40).trim();
      failures.push(`${label}:${i + 1} forbidden .innerHTML usage: "${context}"`);
    }
  }
}

async function checkAllValuesEscaped(filePath, label) {
  const content = await readFile(filePath, "utf8");
  const providerDataAccessors = [
    "provider.name", "provider.id", "provider.service_type",
    "provider.iran_access.status", "provider.docs",
    "provider.free_tier.type", "provider.free_tier.requires_payment_method",
    "provider.api.base_url", "provider.verification.last_checked",
    "provider.iran_access.evidence"
  ];
  for (const accessor of providerDataAccessors) {
    const escapedPattern = `escapeHtml(${accessor}`;
    const unescapedPattern = `\${${accessor}`;
    if (content.includes(unescapedPattern) && !content.includes(escapedPattern)) {
      const lineNum = content.split("\n").findIndex((l) => l.includes(unescapedPattern)) + 1;
      if (lineNum > 0) {
        failures.push(`${label}:${lineNum} unescaped provider data: ${accessor}`);
      }
    }
  }
  const hasAllEscaped = providerDataAccessors.every(
    (acc) => !content.includes(`\${${acc}`) || content.includes(`escapeHtml(${acc}`)
  );
  if (hasAllEscaped && !content.includes("function escapeHtml")) {
    failures.push(`${label}: uses escapeHtml() without defining it`);
  }
}

async function checkUrlValidation(filePath, label) {
  const content = await readFile(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('.href =') && line.includes('provider.') && !line.includes('safeExternalUrl') && !line.includes('new URL(')) {
      if (!line.includes('../providers/') && !line.includes('../quick-start/')) {
        failures.push(`${label}:${i + 1} provider data URL assignment without validation: "${line.trim()}"`);
      }
    }
  }
}

async function checkRelNoopener(filePath, label) {
  const content = await readFile(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('target="_blank"')) {
      const relMatch = line.match(/rel="([^"]*)"/);
      if (!relMatch) {
        failures.push(`${label}:${i + 1} target="_blank" without rel attribute: "${line.trim()}"`);
        continue;
      }
      const relValues = relMatch[1].split(/\s+/);
      if (!relValues.includes("noopener")) {
        failures.push(`${label}:${i + 1} target="_blank" rel missing 'noopener': "${line.trim()}"`);
      }
      if (!relValues.includes("noreferrer")) {
        failures.push(`${label}:${i + 1} target="_blank" rel missing 'noreferrer': "${line.trim()}"`);
      }
    }
  }
}

async function checkProviderDataAsTextContent(filePath, label) {
  const content = await readFile(filePath, "utf8");
  if (content.includes('textContent = provider.') || content.includes('textContent = `$')) {
    return;
  }
  const hasCardCreation = content.includes('createCardElement') || content.includes('createElement("div"');
  if (!hasCardCreation) {
    failures.push(`${label}: no card creation or textContent assignment detected for provider data`);
  }
}

for (const file of finderFiles) {
  const label = path.relative(root, file);
  await checkNoInnerHTML(file, label);
  await checkUrlValidation(file, label);
  await checkRelNoopener(file, label);
}

for (const file of compareFiles) {
  const label = path.relative(root, file);
  const content = await readFile(file, "utf8");
  if (content.includes(".innerHTML")) {
    if (!content.includes("function escapeHtml")) {
      failures.push(`${label}: uses innerHTML without escapeHtml sanitizer`);
    }
    await checkAllValuesEscaped(file, label);
  }
  await checkRelNoopener(file, label);
  if (!content.includes("function safeIds") && !content.includes("PROVIDER_ID_PATTERN")) {
    failures.push(`${label}: missing provider ID validation`);
  }
}

for (const file of appFiles) {
  const label = path.relative(root, file);
  await checkNoInnerHTML(file, label);
  await checkRelNoopener(file, label);
}

if (failures.length) {
  console.error("XSS resilience contract FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("Finder XSS resilience static analysis passed: no innerHTML in finder files, compare uses escapeHtml, URLs validated, rel attributes correct.");
