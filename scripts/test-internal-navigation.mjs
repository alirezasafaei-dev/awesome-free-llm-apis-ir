import { access, readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

async function ensureBuild() {
  try {
    await access(path.join(dist, "index.html"));
  } catch {
    console.log("Building site for internal navigation test...");
    const result = spawnSync("npm", ["run", "site:build"], {
      cwd: root,
      encoding: "utf8",
      stdio: "inherit",
      env: process.env
    });
    if (result.status !== 0) {
      console.error("Site build failed for internal navigation test.");
      process.exit(result.status ?? 1);
    }
  }
}

async function collectHtmlFiles() {
  const files = [];
  async function walk(dir, base) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      } else if (entry.name.endsWith(".html")) {
        files.push({ fullPath, relPath });
      }
    }
  }
  await walk(dist, "");
  return files;
}

const failures = [];

function fail(page, detail) {
  failures.push(`[${page}] ${detail}`);
}

await ensureBuild();
const htmlFiles = await collectHtmlFiles();
const htmlCache = new Map();

for (const file of htmlFiles) {
  htmlCache.set("/" + file.relPath.replace(/\\/g, "/"), await readFile(file.fullPath, "utf8"));
}

// ─── Layer 1: Fragment link integrity ───

function extractFragmentLinks(html) {
  const links = [];
  const regex = /href="([^"]*#[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (/^https?:\/\//.test(href)) continue;
    if (/^mailto:/.test(href)) continue;
    links.push(href);
  }
  return links;
}

function extractIds(html) {
  const ids = new Set();
  const regex = /\bid="([^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

function resolvePath(basePath, relativePath) {
  const baseDir = basePath.endsWith("/") ? basePath : basePath.replace(/\/[^/]*$/, "/");
  const clean = relativePath.split("?")[0].split("#")[0];
  if (clean.startsWith("/")) return path.posix.normalize(clean);
  return path.posix.normalize(path.posix.join(baseDir, clean));
}

function checkFragmentLinks() {
  for (const [pagePath, html] of htmlCache) {
    const links = extractFragmentLinks(html);
    for (const href of links) {
      const parts = href.split("#");
      const fragment = parts[1];
      if (!fragment) continue;

      const targetPath = parts[0];
      if (!targetPath) {
        const ids = extractIds(html);
        if (!ids.has(fragment)) {
          fail(pagePath, `Broken same-page fragment: href="${href}" — no id="${fragment}" found`);
        }
      } else {
        const resolvedTarget = resolvePath(pagePath, targetPath);
        const targetHtml = htmlCache.get(resolvedTarget);
        if (!targetHtml) continue;
        const ids = extractIds(targetHtml);
        if (!ids.has(fragment)) {
          fail(pagePath, `Broken cross-page fragment: href="${href}" → ${resolvedTarget} has no id="${fragment}"`);
        }
      }
    }
  }
}

checkFragmentLinks();

if (failures.length) {
  console.error(`Internal navigation integrity test failed (${failures.length} failures):`);
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`Internal navigation integrity test passed (${htmlFiles.length} pages scanned).`);
