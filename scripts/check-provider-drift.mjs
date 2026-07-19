import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const upstreamsPath = path.join(root, "data", "upstreams.json");
const maybeSnapshotPath = path.join(root, "artifacts", "upstream-snapshot.json");
const strict = process.argv.includes("--strict");

const driftReports = [];

async function fetchUrl(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "awesome-free-llm-apis-ir-drift-checker/1.0" }
    });
    await response.body?.cancel();
    return { ok: response.ok, status: response.status, error: null };
  } catch (error) {
    return { ok: false, status: null, error: error.message };
  }
}

async function checkSources(provider) {
  const sourceUrls = [provider.website, provider.docs, ...(provider.sources || [])].filter(Boolean);
  const uniqueUrls = [...new Set(sourceUrls)];
  const brokenSources = [];

  for (const url of uniqueUrls) {
    const result = await fetchUrl(url);
    if (!result.ok) {
      brokenSources.push({ url, status: result.status, error: result.error });
    }
  }

  return brokenSources;
}

async function checkUpstreamRepos() {
  let snapshot;
  try {
    snapshot = JSON.parse(await readFile(maybeSnapshotPath, "utf8"));
  } catch {
    return [];
  }

  if (!snapshot.sources) return [];

  const repoChanges = [];

  for (const source of snapshot.sources) {
    try {
      const response = await fetch(`https://api.github.com/repos/${source.repository}/branches/${encodeURIComponent(source.monitored_ref || source.default_branch)}`, {
        headers: {
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
          "user-agent": "awesome-free-llm-apis-ir-drift-checker/1.0"
        },
        signal: AbortSignal.timeout(20_000)
      });

      if (!response.ok) continue;

      const branch = await response.json();
      const currentSha = branch.commit?.sha;
      if (currentSha && currentSha !== source.head_sha) {
        repoChanges.push({
          repository: source.repository,
          previousHead: source.head_sha,
          currentHead: currentSha,
          defaultBranch: source.default_branch
        });
      }
    } catch {
      // skip unreachable repos
    }
  }

  return repoChanges;
}

async function main() {
  const upstreams = JSON.parse(await readFile(upstreamsPath, "utf8"));
  const now = new Date();
  const providerFiles = (await readdir(providersDir))
    .filter((f) => f.endsWith(".json"))
    .sort();

  const upstreamRepoNames = new Set(upstreams.sources.map((s) => s.repository));

  for (const file of providerFiles) {
    const provider = JSON.parse(await readFile(path.join(providersDir, file), "utf8"));
    const id = provider.id;
    const name = provider.name;
    const providerDrift = { id, name, issues: [] };

    // Check stale data
    const lastChecked = provider.verification?.last_checked;
    const staleAfterDays = provider.verification?.stale_after_days || 30;
    if (lastChecked) {
      const checkedDate = new Date(`${lastChecked}T00:00:00Z`);
      const age = Math.floor((now - checkedDate) / 86_400_000);
      if (age > staleAfterDays) {
        providerDrift.issues.push({
          type: "stale_data",
          detail: `Last checked ${lastChecked} (${age} days ago, threshold: ${staleAfterDays})`
        });
      }
    } else {
      providerDrift.issues.push({
        type: "stale_data",
        detail: "No last_checked date set"
      });
    }

    // Check source URLs
    const brokenSources = await checkSources(provider);
    for (const broken of brokenSources) {
      providerDrift.issues.push({
        type: "broken_source_url",
        detail: `${broken.url} returned status ${broken.status || broken.error}`
      });
    }

    if (providerDrift.issues.length) {
      driftReports.push(providerDrift);
    }
  }

  // Check upstream repos for new commits
  const repoChanges = await checkUpstreamRepos();
  for (const change of repoChanges) {
    driftReports.push({
      id: `upstream:${change.repository}`,
      name: change.repository,
      issues: [{
        type: "upstream_new_commits",
        detail: `New commits detected: ${change.previousHead.slice(0, 8)}..${change.currentHead.slice(0, 8)} on ${change.defaultBranch}`
      }]
    });
  }

  // Output report
  const lines = [
    "# Provider Drift Report",
    "",
    `Generated: ${now.toISOString().slice(0, 10)}`,
    `Providers checked: ${providerFiles.length}`,
    `Upstream repos monitored: ${upstreamRepoNames.size}`,
    `Drift entries: ${driftReports.length}`,
    ""
  ];

  if (!driftReports.length) {
    lines.push("No drift detected.");
    console.log(lines.join("\n"));
    return;
  }

  lines.push("## Drift Details", "");
  for (const entry of driftReports) {
    lines.push(`### ${entry.name} (\`${entry.id}\`)`, "");
    for (const issue of entry.issues) {
      lines.push(`- **${issue.type}**: ${issue.detail}`);
    }
    lines.push("");
  }

  const report = lines.join("\n");
  console.log(report);

  if (strict) {
    process.exit(1);
  }
}

await main().catch((err) => {
  console.error(`Provider drift check failed: ${err.message}`);
  process.exit(1);
});
