import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const allowedRoles = new Set([
  "source_of_record",
  "curated_reference",
  "discovery_feed",
  "provider_candidate",
  "tooling_watch",
  "volatility_radar"
]);

const allowedClassifications = new Set([
  "catalog",
  "official_provider",
  "official_gateway",
  "community_gateway",
  "session_bridge",
  "self_hosted",
  "monitoring_companion",
  "router"
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateConfig(config) {
  invariant(config && typeof config === "object", "upstream config must be an object");
  invariant(config.schema_version === "1.0.0", "upstream config schema_version must be 1.0.0");
  invariant(Array.isArray(config.sources) && config.sources.length > 0, "upstream config must contain sources");

  const repositories = new Set();
  for (const source of config.sources) {
    invariant(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(source.repository ?? ""), `invalid repository: ${source.repository}`);
    invariant(!repositories.has(source.repository), `duplicate repository: ${source.repository}`);
    repositories.add(source.repository);
    invariant(allowedRoles.has(source.role), `invalid role for ${source.repository}`);
    invariant(allowedClassifications.has(source.classification), `invalid classification for ${source.repository}`);
    invariant(Number.isInteger(source.trust_tier) && source.trust_tier >= 1 && source.trust_tier <= 3, `invalid trust_tier for ${source.repository}`);
    invariant(Array.isArray(source.paths) && source.paths.length > 0, `paths must be non-empty for ${source.repository}`);
    invariant(new Set(source.paths).size === source.paths.length, `duplicate paths for ${source.repository}`);
    for (const monitoredPath of source.paths) {
      invariant(typeof monitoredPath === "string" && monitoredPath.length > 0, `invalid path for ${source.repository}`);
      invariant(!path.isAbsolute(monitoredPath) && !monitoredPath.split("/").includes(".."), `unsafe path for ${source.repository}: ${monitoredPath}`);
    }
  }
  return config;
}

async function githubGet(apiPath, token) {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "awesome-free-llm-apis-ir-upstream-watch/1.0",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    signal: AbortSignal.timeout(20_000)
  });

  if (response.status === 404) return { missing: true, data: null };
  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    throw new Error(`GitHub API ${response.status} for ${apiPath}${remaining ? ` (remaining=${remaining})` : ""}`);
  }
  return { missing: false, data: await response.json() };
}

function encodeContentPath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

export async function collectSnapshot(config, { token = process.env.GITHUB_TOKEN } = {}) {
  const collectedAt = new Date().toISOString();
  const sources = [];

  for (const source of config.sources) {
    const repo = await githubGet(`/repos/${source.repository}`, token);
    invariant(!repo.missing, `repository not found: ${source.repository}`);
    const ref = source.ref || repo.data.default_branch;
    const branch = await githubGet(`/repos/${source.repository}/branches/${encodeURIComponent(ref)}`, token);
    invariant(!branch.missing, `branch not found: ${source.repository}@${ref}`);

    const files = [];
    for (const monitoredPath of source.paths) {
      const result = await githubGet(
        `/repos/${source.repository}/contents/${encodeContentPath(monitoredPath)}?ref=${encodeURIComponent(ref)}`,
        token
      );
      files.push({
        path: monitoredPath,
        sha: result.missing ? null : result.data.sha,
        missing: result.missing
      });
    }

    sources.push({
      repository: source.repository,
      role: source.role,
      trust_tier: source.trust_tier,
      classification: source.classification,
      review_policy: source.review_policy,
      default_branch: repo.data.default_branch,
      monitored_ref: ref,
      head_sha: branch.data.commit.sha,
      archived: Boolean(repo.data.archived),
      disabled: Boolean(repo.data.disabled),
      pushed_at: repo.data.pushed_at,
      files
    });
  }

  return {
    schema_version: "1.0.0",
    collected_at: collectedAt,
    source_count: sources.length,
    sources
  };
}

function describeFileChange(repository, before, after) {
  if (!before) return { type: "file_added_to_watch", repository, path: after.path, meaningful: true };
  if (!after) return { type: "file_removed_from_watch", repository, path: before.path, meaningful: true };
  if (before.missing !== after.missing) {
    return {
      type: after.missing ? "monitored_file_missing" : "monitored_file_restored",
      repository,
      path: after.path,
      meaningful: true
    };
  }
  if (before.sha !== after.sha) return { type: "monitored_file_changed", repository, path: after.path, meaningful: true };
  return null;
}

export function compareSnapshots(previous, current) {
  if (!previous) {
    return { baseline: true, meaningful: false, changes: [], informational: [] };
  }

  const changes = [];
  const informational = [];
  const previousMap = new Map(previous.sources.map((source) => [source.repository, source]));
  const currentMap = new Map(current.sources.map((source) => [source.repository, source]));

  for (const [repository, source] of currentMap) {
    const before = previousMap.get(repository);
    if (!before) {
      changes.push({ type: "source_added", repository, meaningful: true });
      continue;
    }

    for (const key of ["default_branch", "monitored_ref", "archived", "disabled"]) {
      if (before[key] !== source[key]) {
        changes.push({ type: `${key}_changed`, repository, before: before[key], after: source[key], meaningful: true });
      }
    }

    const beforeFiles = new Map(before.files.map((file) => [file.path, file]));
    const afterFiles = new Map(source.files.map((file) => [file.path, file]));
    for (const monitoredPath of new Set([...beforeFiles.keys(), ...afterFiles.keys()])) {
      const change = describeFileChange(repository, beforeFiles.get(monitoredPath), afterFiles.get(monitoredPath));
      if (change) changes.push(change);
    }

    if (before.head_sha !== source.head_sha && !changes.some((change) => change.repository === repository)) {
      informational.push({ type: "head_changed_without_monitored_file_change", repository, before: before.head_sha, after: source.head_sha });
    }
  }

  for (const repository of previousMap.keys()) {
    if (!currentMap.has(repository)) changes.push({ type: "source_removed", repository, meaningful: true });
  }

  return {
    baseline: false,
    meaningful: changes.some((change) => change.meaningful),
    changes,
    informational
  };
}

function shortSha(value) {
  return value ? value.slice(0, 8) : "—";
}

function formatChange(change) {
  const pathSuffix = change.path ? ` — \`${change.path}\`` : "";
  const values = Object.hasOwn(change, "before") || Object.hasOwn(change, "after")
    ? ` (\`${String(change.before)}\` → \`${String(change.after)}\`)`
    : "";
  return `- **${change.repository}**: \`${change.type}\`${pathSuffix}${values}`;
}

export function renderReport(snapshot, comparison) {
  const lines = [
    "# گزارش پایش Upstreamها",
    "",
    `- زمان جمع‌آوری: \`${snapshot.collected_at}\``,
    `- تعداد منابع: **${snapshot.source_count}**`,
    `- اجرای baseline: **${comparison.baseline ? "بله" : "خیر"}**`,
    `- تغییر معنادار: **${comparison.meaningful ? "بله" : "خیر"}**`,
    "",
    "## وضعیت منابع",
    "",
    "| Repository | نقش | Tier | نوع | Head | فایل‌های مفقود |",
    "|---|---|---:|---|---|---:|"
  ];

  for (const source of snapshot.sources) {
    const missing = source.files.filter((file) => file.missing).length;
    lines.push(`| \`${source.repository}\` | \`${source.role}\` | ${source.trust_tier} | \`${source.classification}\` | \`${shortSha(source.head_sha)}\` | ${missing} |`);
  }

  lines.push("", "## تغییرات نیازمند بررسی", "");
  if (comparison.baseline) {
    lines.push("این اجرای اول فقط baseline را ثبت کرد و Issue تغییرات ایجاد نمی‌کند.");
  } else if (comparison.changes.length === 0) {
    lines.push("هیچ تغییر معناداری در فایل‌های حساس یا وضعیت Repositoryها مشاهده نشد.");
  } else {
    lines.push(...comparison.changes.map(formatChange));
  }

  if (comparison.informational.length) {
    lines.push("", "## تغییرات اطلاعاتی", "", "این commitها فایل‌های حساس تعریف‌شده را تغییر نداده‌اند:", "");
    lines.push(...comparison.informational.map(formatChange));
  }

  lines.push(
    "",
    "## سیاست ایمنی",
    "",
    "این پایش فقط تغییر را کشف می‌کند. هیچ Provider JSON، README یا Catalog به‌صورت خودکار ویرایش نمی‌شود. هر ادعا باید با مستندات رسمی یا تست معتبر مستقل راستی‌آزمایی شود.",
    ""
  );
  return lines.join("\n");
}

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  await writeFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, { flag: "a" });
}

async function main() {
  const configPath = getArg("config", "data/upstreams.json");
  const previousPath = getArg("previous", ".cache/upstreams/previous.json");
  const snapshotPath = getArg("snapshot", "artifacts/upstream-snapshot.json");
  const reportPath = getArg("report", "artifacts/upstream-report.md");

  const config = validateConfig(JSON.parse(await readFile(configPath, "utf8")));
  const previous = await readJsonIfExists(previousPath);
  const snapshot = await collectSnapshot(config);
  const comparison = compareSnapshots(previous, snapshot);
  const report = renderReport(snapshot, comparison);

  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await mkdir(path.dirname(previousPath), { recursive: true });
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  await writeFile(snapshotPath, serialized);
  await writeFile(previousPath, serialized);
  await writeFile(reportPath, `${report}\n`);

  await writeOutput("baseline", comparison.baseline ? "true" : "false");
  await writeOutput("meaningful", comparison.meaningful ? "true" : "false");
  await writeOutput("change_count", String(comparison.changes.length));
  console.log(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Upstream watch failed: ${error.message}`);
    process.exit(1);
  });
}
