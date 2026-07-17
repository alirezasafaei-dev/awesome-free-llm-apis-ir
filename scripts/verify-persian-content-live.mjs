import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const dryRun = process.argv.includes("--dry-run");
const origin = (process.env.CONTENT_ORIGIN || "https://llm.persiantoolbox.ir").replace(/\/$/, "");

function parseFrontmatter(source, filename) {
  if (!source.startsWith("---\n")) throw new Error(`${filename}: missing frontmatter`);
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filename}: unterminated frontmatter`);

  const metadata = {};
  for (const line of source.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):\s*["']?(.*?)["']?\s*$/);
    if (match) metadata[match[1]] = match[2];
  }
  return metadata;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    headers: { "user-agent": "awesome-free-llm-apis-ir-content-verifier/1.0" }
  });

  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return { response, body: await response.text() };
}

const filenames = (await readdir(contentDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort();

const articles = [];
for (const filename of filenames) {
  const source = await readFile(path.join(contentDir, filename), "utf8");
  const metadata = parseFrontmatter(source, filename);
  if (metadata.status !== "READY_FOR_SITE") continue;

  for (const field of ["title", "slug", "canonical_target", "updated_at"]) {
    if (!metadata[field]) throw new Error(`${filename}: missing ${field}`);
  }

  const expectedCanonical = `${origin}/guides/${metadata.slug}/`;
  if (metadata.canonical_target !== expectedCanonical) {
    throw new Error(`${filename}: canonical ${metadata.canonical_target} does not match ${expectedCanonical}`);
  }

  articles.push({ filename, ...metadata });
}

if (!articles.length) throw new Error("No READY_FOR_SITE Persian articles found");

if (dryRun) {
  for (const article of articles) console.log(article.canonical_target);
  console.log(`Dry-run passed for ${articles.length} Persian article URLs.`);
  process.exit(0);
}

const sitemapUrl = `${origin}/sitemap.xml`;
const buildMetaUrl = `${origin}/build-meta.json`;
const [{ body: sitemap }, { body: buildMetaBody }] = await Promise.all([
  fetchText(sitemapUrl),
  fetchText(buildMetaUrl)
]);
const buildMeta = JSON.parse(buildMetaBody);

if (!Number.isInteger(buildMeta.persian_article_count)) {
  throw new Error("build-meta.json is missing persian_article_count");
}
if (buildMeta.persian_article_count !== articles.length) {
  throw new Error(`build-meta Persian article count ${buildMeta.persian_article_count} does not match source count ${articles.length}`);
}

for (const article of articles) {
  if (!sitemap.includes(`<loc>${article.canonical_target}</loc>`)) {
    throw new Error(`${article.slug}: missing from sitemap`);
  }

  const { response, body } = await fetchText(article.canonical_target);
  const robotsHeader = response.headers.get("x-robots-tag") ?? "";
  if (/noindex/i.test(robotsHeader)) throw new Error(`${article.slug}: X-Robots-Tag contains noindex`);

  const required = [
    `<link rel="canonical" href="${article.canonical_target}">`,
    `data-guide-slug="${article.slug}"`,
    article.title,
    "application/ld+json",
    "../../analytics.js",
    "../../plausible.js"
  ];
  for (const needle of required) {
    if (!body.includes(needle)) throw new Error(`${article.slug}: live page is missing ${needle}`);
  }

  const h1Count = (body.match(/<h1(?:\s|>)/g) || []).length;
  if (h1Count !== 1) throw new Error(`${article.slug}: expected one H1, found ${h1Count}`);
  if (/meta[^>]+name=["']robots["'][^>]+noindex/i.test(body)) {
    throw new Error(`${article.slug}: HTML robots metadata contains noindex`);
  }

  console.log(`PASS ${article.canonical_target}`);
}

console.log(`Live Persian content verification passed for ${articles.length} articles at ${origin}.`);
