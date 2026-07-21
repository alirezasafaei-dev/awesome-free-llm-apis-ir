import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const routes = [
  "index.html",
  "en/index.html",
  "api-finder/index.html",
  "en/api-finder/index.html",
  "quick-start/index.html",
  "en/quick-start/index.html",
  "compare/index.html",
  "en/compare/index.html",
  "tools/index.html"
];

const failures = [];
for (const route of routes) {
  let html;
  try {
    html = await readFile(path.join(dist, route), "utf8");
  } catch (error) {
    failures.push(`${route}: missing (${error.code ?? error.message})`);
    continue;
  }

  const checks = [
    [/<title>[^<]+<\/title>/i, "title"],
    [/<meta\s+name="description"\s+content="[^"]+"/i, "meta description"],
    [/<link\s+rel="canonical"\s+href="[^"]+"/i, "canonical"],
    [/hreflang="[^"]+"/i, "hreflang"],
    [/application\/ld\+json/i, "JSON-LD"],
    [/<h1(?:\s|>)/i, "H1"]
  ];

  for (const [pattern, label] of checks) {
    if (!pattern.test(html)) failures.push(`${route}: missing ${label}`);
  }
}

if (failures.length) {
  console.error("Public-route SEO coverage failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Public-route SEO coverage passed (${routes.length} routes).`);
