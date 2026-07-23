import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const providersDir = "data/providers";
const backlogPath = "data/verification-backlog.json";
const validTrackStatuses = new Set(["open", "partially_completed", "completed", "resolved"]);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(message) {
  console.error(`ERROR ${message}`);
  process.exitCode = 1;
}

const providerFiles = readdirSync(providersDir)
  .filter((name) => name.endsWith(".json"))
  .sort();
const providers = providerFiles.map((name) => readJson(join(providersDir, name)));
const backlog = readJson(backlogPath);

if (backlog.schema_version !== "1.0.0") fail("verification backlog schema_version must be 1.0.0");
if (!/^\d{4}-\d{2}-\d{2}$/.test(backlog.last_updated ?? "")) fail("verification backlog last_updated must be an ISO date");
if (!Number.isInteger(backlog.parent_issue) || backlog.parent_issue < 1) fail("verification backlog parent_issue must be a positive integer");
if (!Array.isArray(backlog.tracks) || backlog.tracks.length === 0) fail("verification backlog must define tracks");
if (!Array.isArray(backlog.providers)) fail("verification backlog providers must be an array");

const providerIds = new Set(providers.map((provider) => provider.id));
const unknownIds = providers
  .filter((provider) => provider.iran_access?.status === "unknown")
  .map((provider) => provider.id)
  .sort();
const backlogIds = backlog.providers.map((item) => item.provider_id).sort();

if (backlog.summary?.provider_count !== providers.length) {
  fail(`summary.provider_count=${backlog.summary?.provider_count} but catalog has ${providers.length}`);
}
if (backlog.summary?.unknown_count !== unknownIds.length) {
  fail(`summary.unknown_count=${backlog.summary?.unknown_count} but catalog has ${unknownIds.length} unknown providers`);
}
if (JSON.stringify(backlogIds) !== JSON.stringify(unknownIds)) {
  fail(`backlog provider set must exactly match unknown providers\n  backlog: ${backlogIds.join(", ")}\n  unknown: ${unknownIds.join(", ")}`);
}

const trackIds = new Set();
const trackIssues = new Set();
const issueToProviders = new Map();
for (const track of backlog.tracks) {
  if (!track || typeof track !== "object") {
    fail("each verification track must be an object");
    continue;
  }
  if (!/^[a-z0-9_]+$/.test(track.id ?? "")) fail(`invalid track id: ${track.id}`);
  if (trackIds.has(track.id)) fail(`duplicate track id: ${track.id}`);
  trackIds.add(track.id);
  if (!Number.isInteger(track.issue) || track.issue < 1) fail(`track ${track.id} has an invalid issue number`);
  if (trackIssues.has(track.issue)) fail(`duplicate track issue: ${track.issue}`);
  trackIssues.add(track.issue);
  if (!validTrackStatuses.has(track.status)) fail(`track ${track.id} has invalid status ${track.status}`);
  if (!Array.isArray(track.providers)) fail(`track ${track.id} providers must be an array`);

  const listed = new Set(track.providers ?? []);
  if (listed.size !== (track.providers ?? []).length) fail(`track ${track.id} contains duplicate providers`);
  for (const providerId of listed) {
    if (!providerIds.has(providerId)) fail(`track ${track.id} references unknown provider ${providerId}`);
  }

  const resolvedEntries = track.resolved_providers ?? [];
  if (!Array.isArray(resolvedEntries)) fail(`track ${track.id} resolved_providers must be an array when present`);
  const resolvedIds = [];
  for (const entry of Array.isArray(resolvedEntries) ? resolvedEntries : []) {
    const providerId = typeof entry === "string" ? entry : entry?.provider_id;
    if (typeof providerId !== "string" || !providerIds.has(providerId)) {
      fail(`track ${track.id} has an invalid resolved provider`);
      continue;
    }
    resolvedIds.push(providerId);
    if (listed.has(providerId)) fail(`track ${track.id} lists ${providerId} as both active and resolved`);
  }
  if (new Set(resolvedIds).size !== resolvedIds.length) fail(`track ${track.id} contains duplicate resolved providers`);

  if (["completed", "resolved"].includes(track.status) && listed.size > 0) {
    fail(`track ${track.id} cannot be ${track.status} while unresolved providers remain`);
  }
  if (track.status === "open" && listed.size === 0) {
    fail(`open track ${track.id} must list at least one unresolved provider`);
  }
  if (track.status === "partially_completed") {
    if (listed.size === 0) fail(`partially_completed track ${track.id} must list unresolved providers`);
    if (resolvedIds.length === 0) fail(`partially_completed track ${track.id} must list at least one resolved provider`);
  }

  issueToProviders.set(track.issue, listed);
}

const seenBacklogIds = new Set();
for (const item of backlog.providers) {
  if (!item || typeof item !== "object") {
    fail("each backlog provider entry must be an object");
    continue;
  }
  if (!providerIds.has(item.provider_id)) fail(`backlog references unknown provider ${item.provider_id}`);
  if (seenBacklogIds.has(item.provider_id)) fail(`duplicate backlog provider ${item.provider_id}`);
  seenBacklogIds.add(item.provider_id);
  if (!Number.isInteger(item.track_issue) || !issueToProviders.has(item.track_issue)) {
    fail(`${item.provider_id} references an undefined track issue ${item.track_issue}`);
  } else if (!issueToProviders.get(item.track_issue).has(item.provider_id)) {
    fail(`${item.provider_id} is not listed in track issue ${item.track_issue}`);
  }
  if (typeof item.blocker_type !== "string" || item.blocker_type.length < 3) fail(`${item.provider_id} has an invalid blocker_type`);
  if (typeof item.next_action !== "string" || item.next_action.length < 10) fail(`${item.provider_id} has an invalid next_action`);
  if (typeof item.requires_local_execution !== "boolean") fail(`${item.provider_id} requires_local_execution must be boolean`);
  if (typeof item.automatable !== "boolean") fail(`${item.provider_id} automatable must be boolean`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`Verification backlog is consistent: ${providers.length} providers, ${unknownIds.length} unknown, ${backlog.tracks.length} execution tracks.`);
