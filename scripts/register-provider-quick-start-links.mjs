import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const catalog = JSON.parse(await readFile(path.join(destination, "catalog.json"), "utf8"));
const providerIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const insertionPoint = '<div class="hero-actions">';
let updated = 0;

for (const provider of catalog.providers ?? []) {
  if (!providerIdPattern.test(provider.id)) {
    throw new Error(`Provider ID cannot enter a Quick Start route: ${provider.id}`);
  }

  const pagePath = path.join(destination, "providers", provider.id, "index.html");
  const before = await readFile(pagePath, "utf8");
  if (before.includes('class="button primary provider-quick-start-link"')) continue;
  if (!before.includes(insertionPoint)) {
    throw new Error(`${provider.id}: provider page is missing the hero-actions insertion point`);
  }

  const query = new URLSearchParams({ provider: provider.id, usecase: "chat", region: "any" });
  const link = `<a class="button primary provider-quick-start-link" href="../../quick-start/?${query.toString()}">ساخت اولین درخواست</a>`;
  const after = before.replace(insertionPoint, `${insertionPoint}${link}`);
  if ((after.match(/provider-quick-start-link/g) ?? []).length !== 1) {
    throw new Error(`${provider.id}: provider Quick Start handoff must be inserted exactly once`);
  }

  await writeFile(pagePath, after, "utf8");
  updated += 1;
}

console.log(`Registered Provider-to-Quick-Start handoff on ${updated} provider page(s).`);
