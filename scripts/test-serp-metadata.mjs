import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");
const failures = [];
let scanned = 0;

async function collectHtml(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtml(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function text(value) {
  return String(value ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}

for (const filePath of await collectHtml(dist)) {
  const html = await readFile(filePath, "utf8");
  if (/name="robots"\s+content="[^"]*noindex/i.test(html)) continue;

  const relative = path.relative(dist, filePath).replaceAll(path.sep, "/");
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!titleMatch || !descriptionMatch) continue;

  scanned += 1;
  const title = text(titleMatch[1]);
  const description = text(descriptionMatch[1]);

  if (title.length > 65) failures.push(`${relative}: title is ${title.length} characters`);
  if (description.length > 170) failures.push(`${relative}: description is ${description.length} characters`);
  if (title.length < 20) failures.push(`${relative}: title is too short (${title.length})`);
  if (description.length < 70) failures.push(`${relative}: description is too short (${description.length})`);
}

if (failures.length) {
  console.error("SERP metadata contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`SERP metadata contract passed (${scanned} indexable pages).`);
