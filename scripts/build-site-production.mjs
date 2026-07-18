import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");

await import("./build-site.mjs");

async function normalizeNestedTrackerPaths(section) {
  const sectionRoot = path.join(destination, section);
  const directories = await readdir(sectionRoot, { withFileTypes: true });
  const depth = section.split("/").length + 1;
  const correctTracker = `src="${"../".repeat(depth)}plausible.js"`;
  let normalized = 0;

  for (const directory of directories) {
    if (!directory.isDirectory()) continue;
    if (section === "guides" && directory.name === "en") continue;
    const pagePath = path.join(sectionRoot, directory.name, "index.html");
    const html = await readFile(pagePath, "utf8");
    const wrongTracker = 'src="./plausible.js"';
    const occurrences = html.split(wrongTracker).length - 1;

    if (occurrences !== 1) {
      throw new Error(`${section}/${directory.name} must contain exactly one root-relative Plausible tracker before normalization; found ${occurrences}`);
    }

    await writeFile(pagePath, html.replace(wrongTracker, correctTracker));
    normalized += 1;
  }

  return normalized;
}

const providerPages = await normalizeNestedTrackerPaths("providers");
const guidePages = await normalizeNestedTrackerPaths("guides");

console.log(`Normalized Plausible tracker paths for ${providerPages} provider pages and ${guidePages} Persian guide pages.`);
