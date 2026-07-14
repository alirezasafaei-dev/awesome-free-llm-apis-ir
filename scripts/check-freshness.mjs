import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dir = path.join(process.cwd(), "data", "providers");
const now = new Date();
const rows = [];

for (const file of (await readdir(dir)).filter((name) => name.endsWith(".json")).sort()) {
  const provider = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
  const age = Math.floor((now - checked) / 86_400_000);
  const allowed = provider.verification.stale_after_days;
  if (age > allowed) rows.push({ id: provider.id, age, allowed, last_checked: provider.verification.last_checked });
}

if (!rows.length) {
  console.log("All provider records are fresh.");
  process.exit(0);
}

console.log("STALE_PROVIDER_DATA");
console.log("| Provider | Last checked | Age (days) | Allowed (days) |");
console.log("|---|---:|---:|---:|");
for (const row of rows) console.log(`| ${row.id} | ${row.last_checked} | ${row.age} | ${row.allowed} |`);

if (process.argv.includes("--strict")) process.exit(1);

