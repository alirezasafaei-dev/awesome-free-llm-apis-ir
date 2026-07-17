import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const logPath = path.join(root, "docs", "LAUNCH_LOG.md");
const content = await readFile(logPath, "utf8");

const allowedStatuses = new Set([
  "DRAFT_READY",
  "REVIEWED",
  "SCHEDULED",
  "PUBLISHED",
  "MONITORING",
  "COMPLETED",
  "BLOCKED"
]);

const statusesRequiringPublication = new Set(["PUBLISHED", "MONITORING", "COMPLETED"]);
const allowedCampaigns = new Set(["initial_launch", "international_launch"]);
const errors = [];
const ids = new Set();
let rowCount = 0;

function parseRow(line) {
  return line
    .trim()
    .split("|")
    .slice(1, -1)
    .map((value) => value.trim());
}

function isIpLiteral(hostname) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/u.test(hostname) || hostname.includes(":");
}

for (const [index, line] of content.split(/\r?\n/u).entries()) {
  if (!/^\|\s*L-\d{3}\s*\|/u.test(line)) continue;
  rowCount += 1;

  const columns = parseRow(line);
  if (columns.length !== 11) {
    errors.push(`docs/LAUNCH_LOG.md:${index + 1}: expected 11 columns, found ${columns.length}`);
    continue;
  }

  const [id, dateUtc, channel, language, contentType, status, publicUrl, utmSource, campaign, owner] = columns;

  if (!/^L-\d{3}$/u.test(id)) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: invalid launch ID '${id}'`);
  if (ids.has(id)) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: duplicate launch ID '${id}'`);
  ids.add(id);

  if (!channel) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: channel is required for ${id}`);
  if (!language) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: language is required for ${id}`);
  if (!contentType) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: content type is required for ${id}`);
  if (!owner) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: owner is required for ${id}`);

  if (!allowedStatuses.has(status)) {
    errors.push(`docs/LAUNCH_LOG.md:${index + 1}: unsupported status '${status}' for ${id}`);
  }

  if (!utmSource || !/^[a-z0-9][a-z0-9_-]*$/u.test(utmSource)) {
    errors.push(`docs/LAUNCH_LOG.md:${index + 1}: invalid or missing UTM source for ${id}`);
  }

  if (!allowedCampaigns.has(campaign)) {
    errors.push(`docs/LAUNCH_LOG.md:${index + 1}: unsupported campaign '${campaign}' for ${id}`);
  }

  if (statusesRequiringPublication.has(status)) {
    if (!dateUtc) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: ${status} row ${id} requires a UTC date`);
    if (!publicUrl) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: ${status} row ${id} requires a public URL`);
  }

  if (dateUtc && !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?Z)?$/u.test(dateUtc)) {
    errors.push(`docs/LAUNCH_LOG.md:${index + 1}: invalid UTC date '${dateUtc}' for ${id}`);
  }

  if (publicUrl) {
    let url;
    try {
      url = new URL(publicUrl);
    } catch {
      errors.push(`docs/LAUNCH_LOG.md:${index + 1}: invalid public URL '${publicUrl}' for ${id}`);
      continue;
    }

    if (url.protocol !== "https:") errors.push(`docs/LAUNCH_LOG.md:${index + 1}: public URL must use HTTPS for ${id}`);
    if (url.username || url.password) errors.push(`docs/LAUNCH_LOG.md:${index + 1}: public URL contains credentials for ${id}`);
    if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") || isIpLiteral(url.hostname)) {
      errors.push(`docs/LAUNCH_LOG.md:${index + 1}: public URL must not use localhost or an IP literal for ${id}`);
    }
    if (url.port && url.port !== "443") errors.push(`docs/LAUNCH_LOG.md:${index + 1}: public URL uses an unexpected port for ${id}`);
  }
}

if (rowCount < 10) errors.push(`docs/LAUNCH_LOG.md: expected at least 10 launch rows, found ${rowCount}`);

const secretPatterns = [
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/gu },
  { name: "GitHub classic token", pattern: /\bghp_[A-Za-z0-9]{30,}\b/gu },
  { name: "GitHub fine-grained token", pattern: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/gu },
  { name: "OpenAI-style secret", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/gu },
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gu },
  { name: "Bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/gu }
];

for (const { name, pattern } of secretPatterns) {
  if (pattern.test(content)) errors.push(`docs/LAUNCH_LOG.md: possible ${name} detected`);
}

const ipv4Pattern = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/gu;
for (const match of content.matchAll(ipv4Pattern)) {
  errors.push(`docs/LAUNCH_LOG.md: IP-like value must not be recorded (${match[0].replace(/\.\d+$/u, ".x")})`);
}

for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length > 0) process.exit(1);

console.log(`Launch-log contract passed for ${rowCount} publication rows.`);
