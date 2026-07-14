import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const required = [
  "site/index.html",
  "site/styles.css",
  "site/app.js",
  "site/manifest.webmanifest",
  "site/robots.txt",
  "site/sitemap.xml"
];

for (const file of required) await access(path.join(root, file));

const html = await readFile(path.join(root, "site/index.html"), "utf8");
const appSource = await readFile(path.join(root, "site/app.js"), "utf8");
for (const needle of ["lang=\"fa\"", "dir=\"rtl\"", "./app.js", "./styles.css"]) {
  if (!html.includes(needle)) throw new Error(`site/index.html is missing ${needle}`);
}
if (!appSource.includes('fetch("./catalog.json"')) throw new Error("site/app.js does not fetch the generated catalog");
if (/<script[^>]+src=["']https?:\/\//i.test(html)) throw new Error("Remote scripts are not allowed");

const syntax = spawnSync(process.execPath, ["--check", path.join(root, "site/app.js")], { encoding: "utf8" });
if (syntax.status !== 0) throw new Error(syntax.stderr || "site/app.js syntax check failed");

const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
if (catalog.provider_count !== catalog.providers.length || catalog.providers.length === 0) throw new Error("Catalog provider count is invalid");
if (new Set(catalog.providers.map((provider) => provider.id)).size !== catalog.providers.length) throw new Error("Catalog has duplicate provider IDs");

const build = spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], { cwd: root, encoding: "utf8" });
if (build.status !== 0) throw new Error(build.stderr || "Site build failed");
for (const file of ["index.html", "styles.css", "app.js", "catalog.json", "build-meta.json"]) await access(path.join(root, ".site-dist", file));
await rm(path.join(root, ".site-dist"), { recursive: true, force: true });

console.log(`Static site checks passed for ${catalog.providers.length} providers.`);
