import { cp } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");
const dataPath = path.join(root, "data.json");

await import("./build-site.mjs");
await cp(dataPath, path.join(destination, "data.json"));
await import("./enrich-seo-pages.mjs");
await import("./register-static-routes.mjs");
await import("./register-provider-quick-start-links.mjs");
await import("./build-tools-pages.mjs");
await import("./register-compare-route.mjs");
await import("./enrich-provider-pages.mjs");

console.log("Published source-owned UI/CSP assets, data catalogs, product routes, Provider Quick Start handoff and SEO enrichments without tracker-path repair.");
