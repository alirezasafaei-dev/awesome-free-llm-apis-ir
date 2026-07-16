import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const providersDir = path.join(root, "data", "providers");
const writeMode = process.argv.includes("--write");
const changed = [];

function maxDate(values) {
  return values
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;
}

function normalizeProvider(provider) {
  let dirty = false;
  const evidence = Array.isArray(provider.iran_access?.evidence)
    ? provider.iran_access.evidence
    : [];

  for (const item of evidence) {
    if (Object.prototype.hasOwnProperty.call(item, "network")) {
      delete item.network;
      dirty = true;
    }
  }

  const liveEvidence = evidence.filter((item) => item?.type === "live_test");
  if (liveEvidence.length > 0) {
    if (provider.verification?.level !== "live_verified") {
      provider.verification.level = "live_verified";
      dirty = true;
    }

    const latestLiveDate = maxDate([
      provider.iran_access?.tested_at,
      ...liveEvidence.map((item) => item.timestamp?.slice(0, 10))
    ]);

    if (latestLiveDate && provider.verification?.last_checked < latestLiveDate) {
      provider.verification.last_checked = latestLiveDate;
      dirty = true;
    }
  }

  return dirty;
}

const files = (await readdir(providersDir))
  .filter((file) => file.endsWith(".json"))
  .sort();

for (const file of files) {
  const filePath = path.join(providersDir, file);
  const provider = JSON.parse(await readFile(filePath, "utf8"));
  if (!normalizeProvider(provider)) continue;

  changed.push(file);
  if (writeMode) {
    await writeFile(filePath, `${JSON.stringify(provider, null, 2)}\n`);
  }
}

if (changed.length > 0 && !writeMode) {
  for (const file of changed) console.error(`OUT_OF_SYNC ${file}`);
  console.error(`\n${changed.length} provider file(s) need metadata normalization.`);
  console.error("Run: npm run providers:normalize:write");
  process.exit(1);
}

if (writeMode) {
  console.log(`Normalized ${changed.length} provider file(s).`);
} else {
  console.log(`Provider metadata is normalized across ${files.length} file(s).`);
}
