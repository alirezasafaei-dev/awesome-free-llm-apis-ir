import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const requiredFields = [
  "title",
  "slug",
  "description",
  "primary_keyword",
  "canonical_target",
  "updated_at",
  "status"
];

function parseFrontmatter(source, filename) {
  if (!source.startsWith("---\n")) {
    throw new Error(`${filename}: missing YAML frontmatter`);
  }

  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filename}: unterminated frontmatter`);

  const frontmatter = source.slice(4, end);
  const body = source.slice(end + 5).trim();
  const metadata = {};

  for (const line of frontmatter.split("\n")) {
    const match = line.match(/^([a-z_]+):\s*["']?(.*?)["']?\s*$/);
    if (match) metadata[match[1]] = match[2];
  }

  return { metadata, body };
}

const entries = (await readdir(contentDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();

if (entries.length < 3) {
  throw new Error(`Expected at least 3 Persian articles; found ${entries.length}`);
}

const slugs = new Set();
for (const filename of entries) {
  const source = await readFile(path.join(contentDir, filename), "utf8");
  const { metadata, body } = parseFrontmatter(source, filename);

  for (const field of requiredFields) {
    if (!metadata[field]) throw new Error(`${filename}: missing ${field}`);
  }

  if (slugs.has(metadata.slug)) throw new Error(`${filename}: duplicate slug ${metadata.slug}`);
  slugs.add(metadata.slug);

  if (!metadata.canonical_target.startsWith("https://llm.persiantoolbox.ir/")) {
    throw new Error(`${filename}: canonical target must use the production domain`);
  }
  if (metadata.status !== "READY_FOR_SITE") {
    throw new Error(`${filename}: status must be READY_FOR_SITE`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.updated_at)) {
    throw new Error(`${filename}: updated_at must use YYYY-MM-DD`);
  }

  const words = body.split(/\s+/u).filter(Boolean).length;
  if (words < 700) throw new Error(`${filename}: article is too short (${words} words)`);

  for (const needle of [
    "https://llm.persiantoolbox.ir/",
    "https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir"
  ]) {
    if (!body.includes(needle)) throw new Error(`${filename}: missing required link ${needle}`);
  }

  if (/\bsk-[A-Za-z0-9_-]{16,}\b/.test(source)) {
    throw new Error(`${filename}: possible API secret detected`);
  }
  if (/BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/.test(source)) {
    throw new Error(`${filename}: private key material detected`);
  }
  if (!body.includes("```")) throw new Error(`${filename}: expected at least one practical code block`);
}

console.log(`Persian content checks passed for ${entries.length} articles.`);
