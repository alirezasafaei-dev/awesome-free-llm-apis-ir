import { spawnSync } from "node:child_process";
import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const siteDir = path.join(root, ".site-dist");
const catalogPath = path.join(root, "catalog.json");
const dataJsonPath = path.join(root, "data.json");
const expectedProviderCount = 22;

const regressions = [];

function invariant(condition, message) {
  if (!condition) regressions.push(message);
}

async function main() {
  // Build site if .site-dist does not exist
  try {
    await access(path.join(siteDir, "guides", "llm-api-rate-limit-429", "index.html"));
  } catch {
    console.log("Building site for regression check...");
    const result = spawnSync("npm", ["run", "site:build"], { cwd: root, encoding: "utf8", stdio: "inherit" });
    if (result.status !== 0) {
      console.error("Site build failed");
      process.exit(1);
    }
  }

  // 1. Provider count
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const actualCount = catalog.providers?.length || 0;
  invariant(
    actualCount === expectedProviderCount,
    `Provider count mismatch: expected ${expectedProviderCount}, got ${actualCount}`
  );
  console.log(`Provider count: ${actualCount} (expected ${expectedProviderCount})`);

  // 2. catalog.json structure
  invariant(catalog.schema_version, "catalog.json missing schema_version");
  invariant(typeof catalog.last_updated === "string", "catalog.json missing last_updated");
  invariant(Array.isArray(catalog.providers), "catalog.json missing providers array");
  invariant(
    catalog.provider_count === actualCount,
    `catalog.json provider_count (${catalog.provider_count}) does not match providers.length (${actualCount})`
  );

  // Check catalog provider IDs are unique
  const catalogIds = catalog.providers.map((p) => p.id);
  const uniqueIds = new Set(catalogIds);
  invariant(
    uniqueIds.size === catalogIds.length,
    `catalog.json has ${catalogIds.length - uniqueIds.size} duplicate provider ID(s)`
  );
  console.log(`catalog.json: ${catalogIds.length} unique provider IDs`);

  // 3. data.json structure
  const data = JSON.parse(await readFile(dataJsonPath, "utf8"));
  invariant(data.lastUpdated, "data.json missing lastUpdated");
  invariant(Number.isInteger(data.providerCount), "data.json missing providerCount");
  invariant(Array.isArray(data.providers), "data.json missing providers array");
  invariant(
    data.providerCount === actualCount,
    `data.json providerCount (${data.providerCount}) does not match catalog (${actualCount})`
  );
  console.log(`data.json: ${data.providers.length} providers`);

  // 4. All provider files have generated pages
  const providerDirs = await readdir(path.join(siteDir, "providers")).catch(() => []);
  const generatedIds = new Set(providerDirs);
  for (const id of catalogIds) {
    if (!generatedIds.has(id)) {
      regressions.push(`Provider page missing: ${id} has no directory in .site-dist/providers/`);
    }
  }
  for (const dir of providerDirs) {
    if (!catalogIds.includes(dir)) {
      regressions.push(`Unexpected provider page: ${dir} has no corresponding catalog entry`);
    }
  }
  invariant(
    providerDirs.length === catalogIds.length,
    `Provider page directory count (${providerDirs.length}) does not match catalog (${catalogIds.length})`
  );
  console.log(`Provider pages: ${providerDirs.length}`);

  // Check each provider page has index.html
  for (const id of catalogIds) {
    try {
      const html = await readFile(path.join(siteDir, "providers", id, "index.html"), "utf8");
      invariant(html.includes(id), `Provider page ${id}/index.html does not contain its own ID`);
      invariant(html.includes("application/ld+json"), `Provider page ${id}/index.html missing JSON-LD`);
      invariant(html.includes("canonical"), `Provider page ${id}/index.html missing canonical`);
    } catch (err) {
      regressions.push(`Cannot read provider page ${id}/index.html: ${err.message}`);
    }
  }

  // 5. Validate sitemap URLs
  try {
    const sitemap = await readFile(path.join(siteDir, "sitemap.xml"), "utf8");
    const locMatches = sitemap.match(/<loc>([^<]+)<\/loc>/g) || [];
    const sitemapUrls = locMatches.map((m) => m.replace(/<\/?loc>/g, ""));
    const expectedLocations = new Set([
      "https://llm.persiantoolbox.ir/",
      "https://llm.persiantoolbox.ir/en/"
    ]);
    for (const id of catalogIds) {
      expectedLocations.add(`https://llm.persiantoolbox.ir/providers/${id}/`);
    }
    for (const url of expectedLocations) {
      invariant(
        sitemapUrls.includes(url),
        `Sitemap missing expected URL: ${url}`
      );
    }
    console.log(`Sitemap: ${sitemapUrls.length} URLs, all expected locations present`);
  } catch (err) {
    regressions.push(`Cannot validate sitemap: ${err.message}`);
  }

  // Report
  if (regressions.length) {
    console.error("\n# Build Regression Report");
    console.error(`\n${regressions.length} regression(s) found:\n`);
    for (const r of regressions) {
      console.error(`- ${r}`);
    }
    process.exit(1);
  }

  console.log("\nNo regressions detected. Build is healthy.");
}

await main().catch((err) => {
  console.error(`Build regression check failed: ${err.message}`);
  process.exit(1);
});
