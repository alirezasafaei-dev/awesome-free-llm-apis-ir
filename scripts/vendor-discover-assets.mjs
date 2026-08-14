import { access, copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checkOnly = process.argv.includes("--check");
const source = path.join(root, "node_modules", "sortablejs", "Sortable.min.js");
const targetDir = path.join(root, ".site-dist", "discover", "admin", "vendor");
const target = path.join(targetDir, "sortable.min.js");

await access(source);
const sourceText = await readFile(source, "utf8");
if (!sourceText.includes("Sortable") || !sourceText.includes("MIT")) {
  throw new Error("Unexpected SortableJS browser artifact");
}
if (/https?:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com)/i.test(sourceText)) {
  throw new Error("SortableJS artifact must not depend on a runtime CDN");
}

if (checkOnly) {
  console.log("Discover vendored-asset source contract passed.");
} else {
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);
  console.log(`Vendored Discover asset: ${path.relative(root, target)}`);
}
