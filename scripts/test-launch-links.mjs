import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceFiles = [
  path.join(root, "docs", "LAUNCH_DISTRIBUTION_CHECKLIST.fa.md"),
  path.join(root, "docs", "LAUNCH_COPY_PACK.fa-en.md")
];

const expectedMedium = new Map([
  ["github", "community"],
  ["linkedin", "social"],
  ["instagram", "social"],
  ["telegram", "community"],
  ["x", "social"],
  ["virgool", "article"],
  ["persiantoolbox", "article"],
  ["youtube", "video"],
  ["aparat", "video"],
  ["producthunt", "launch"],
  ["hackernews", "community"],
  ["reddit", "community"],
  ["whatsapp", "community"],
  ["devto", "article"]
]);

const allowedCampaigns = new Set(["initial_launch", "international_launch"]);
const errors = [];
const seenSources = new Set();
let utmLinkCount = 0;

function normalizeCandidate(candidate) {
  return candidate.replace(/[),.;:!?]+$/u, "");
}

function isIpLiteral(hostname) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/u.test(hostname) || hostname.includes(":");
}

function isTemplateLine(line) {
  return ["<source>", "<medium>", "<campaign>"].some((placeholder) => line.includes(placeholder));
}

for (const file of sourceFiles) {
  const content = await readFile(file, "utf8");
  const relative = path.relative(root, file);

  for (const [lineIndex, line] of content.split(/\r?\n/u).entries()) {
    if (isTemplateLine(line)) continue;
    const candidates = line.match(/https:\/\/[^\s<>{}\[\]"'`]+/gu) ?? [];

    for (const candidate of candidates) {
      const raw = normalizeCandidate(candidate);
      if (!raw.includes("utm_")) continue;
      utmLinkCount += 1;

      let url;
      try {
        url = new URL(raw);
      } catch {
        errors.push(`${relative}:${lineIndex + 1}: invalid URL: ${raw}`);
        continue;
      }

      if (url.protocol !== "https:") errors.push(`${relative}:${lineIndex + 1}: UTM URL must use HTTPS: ${raw}`);
      if (url.hostname !== "llm.persiantoolbox.ir") {
        errors.push(`${relative}:${lineIndex + 1}: UTM URL must use the canonical host: ${raw}`);
      }
      if (isIpLiteral(url.hostname)) errors.push(`${relative}:${lineIndex + 1}: UTM URL must not use an IP literal: ${raw}`);
      if (url.username || url.password) errors.push(`${relative}:${lineIndex + 1}: UTM URL must not contain credentials: ${raw}`);
      if (url.port && url.port !== "443") errors.push(`${relative}:${lineIndex + 1}: unexpected port in UTM URL: ${raw}`);
      if (url.hash) errors.push(`${relative}:${lineIndex + 1}: UTM URL must not contain a fragment: ${raw}`);

      const source = url.searchParams.get("utm_source")?.trim() ?? "";
      const medium = url.searchParams.get("utm_medium")?.trim() ?? "";
      const campaign = url.searchParams.get("utm_campaign")?.trim() ?? "";

      if (!source) errors.push(`${relative}:${lineIndex + 1}: missing utm_source: ${raw}`);
      if (!medium) errors.push(`${relative}:${lineIndex + 1}: missing utm_medium: ${raw}`);
      if (!campaign) errors.push(`${relative}:${lineIndex + 1}: missing utm_campaign: ${raw}`);

      if (source && !expectedMedium.has(source)) {
        errors.push(`${relative}:${lineIndex + 1}: unsupported utm_source '${source}': ${raw}`);
      }

      const expected = expectedMedium.get(source);
      if (expected && medium !== expected) {
        errors.push(`${relative}:${lineIndex + 1}: utm_medium for '${source}' must be '${expected}', got '${medium}': ${raw}`);
      }

      if (campaign && !allowedCampaigns.has(campaign)) {
        errors.push(`${relative}:${lineIndex + 1}: unsupported utm_campaign '${campaign}': ${raw}`);
      }

      for (const requiredKey of ["utm_source", "utm_medium", "utm_campaign"]) {
        if (url.searchParams.getAll(requiredKey).length !== 1) {
          errors.push(`${relative}:${lineIndex + 1}: '${requiredKey}' must appear exactly once: ${raw}`);
        }
      }

      if (source) seenSources.add(source);
    }
  }
}

if (utmLinkCount === 0) errors.push("No UTM links were found in the launch documents.");

for (const source of expectedMedium.keys()) {
  if (!seenSources.has(source)) errors.push(`Launch documents are missing a UTM link for source '${source}'.`);
}

for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length > 0) process.exit(1);

console.log(`Launch-link contract passed for ${utmLinkCount} UTM links across ${seenSources.size} sources.`);
