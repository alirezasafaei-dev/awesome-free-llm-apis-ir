import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const source = path.join(root, "site");
const destination = path.join(root, ".site-dist");
const catalogPath = path.join(root, "catalog.json");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
await cp(catalogPath, path.join(destination, "catalog.json"));

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
await writeFile(
  path.join(destination, "build-meta.json"),
  `${JSON.stringify({ schema_version: "1.0.0", catalog_last_updated: catalog.last_updated, provider_count: catalog.provider_count }, null, 2)}\n`
);

console.log(`Built static site with ${catalog.provider_count} providers in .site-dist/.`);

