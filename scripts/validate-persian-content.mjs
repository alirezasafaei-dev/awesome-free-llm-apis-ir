import { access, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentDir = path.join(root, "content", "fa");
const destination = path.join(root, ".site-dist");
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
const articles = [];
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

  articles.push({ ...metadata, hasFaq: body.includes("## پرسش‌های متداول") });
}

for (const script of ["scripts/build-persian-content.mjs", "scripts/validate-persian-content.mjs"]) {
  const syntax = spawnSync(process.execPath, ["--check", path.join(root, script)], { encoding: "utf8" });
  if (syntax.status !== 0) throw new Error(syntax.stderr || `${script}: syntax check failed`);
}

try {
  const baseBuild = spawnSync(process.execPath, [path.join(root, "scripts/build-site.mjs")], {
    cwd: root,
    encoding: "utf8"
  });
  if (baseBuild.status !== 0) throw new Error(baseBuild.stderr || baseBuild.stdout || "Base site build failed");

  const contentBuild = spawnSync(process.execPath, [path.join(root, "scripts/build-persian-content.mjs")], {
    cwd: root,
    encoding: "utf8"
  });
  if (contentBuild.status !== 0) throw new Error(contentBuild.stderr || contentBuild.stdout || "Persian content build failed");

  const sitemap = await readFile(path.join(destination, "sitemap.xml"), "utf8");
  const homepage = await readFile(path.join(destination, "index.html"), "utf8");
  const buildMeta = JSON.parse(await readFile(path.join(destination, "build-meta.json"), "utf8"));

  if (!homepage.includes('id="persian-guides"')) {
    throw new Error("Homepage is missing the Persian guides section");
  }
  if (buildMeta.persian_article_count !== articles.length) {
    throw new Error("build-meta Persian article count mismatch");
  }

  for (const article of articles) {
    const articlePath = path.join(destination, "guides", article.slug, "index.html");
    await access(articlePath);
    const html = await readFile(articlePath, "utf8");
    for (const needle of [article.title, article.canonical_target, "application/ld+json", "../../analytics.js", "../../plausible.js", `data-guide-slug="${article.slug}"`]) {
      if (!html.includes(needle)) throw new Error(`${article.slug}: generated page is missing ${needle}`);
    }
    const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
    if (h1Count !== 1) throw new Error(`${article.slug}: expected exactly one H1, found ${h1Count}`);
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!jsonLdMatch) throw new Error(`${article.slug}: generated page is missing JSON-LD`);
    const graph = JSON.parse(jsonLdMatch[1])["@graph"];
    const faq = graph.find((item) => item["@type"] === "FAQPage");
    if (article.hasFaq && (!faq || !Array.isArray(faq.mainEntity) || faq.mainEntity.length === 0)) {
      throw new Error(`${article.slug}: FAQ source content must produce FAQPage JSON-LD`);
    }
    if (!article.hasFaq && faq) throw new Error(`${article.slug}: FAQPage JSON-LD requires source FAQ content`);
    if (!sitemap.includes(`<loc>${article.canonical_target}</loc>`)) {
      throw new Error(`${article.slug}: sitemap entry is missing`);
    }
  }
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log(`Persian content and production-page checks passed for ${entries.length} articles.`);
