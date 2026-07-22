import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");
const repoPagesBase = "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/";
const productionBase = "https://llm.persiantoolbox.ir/";
const brandColor = "#155EEF";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npmCommand, ["run", "site:build"], { cwd: root, encoding: "utf8" });
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Brand production build failed");

const sourceAssets = ["logo-symbol.svg", "favicon.svg", "mask-icon.svg", "social-avatar.svg"];
for (const asset of sourceAssets) {
  const source = await readFile(path.join(root, "assets", "brand", asset), "utf8");
  const published = await readFile(path.join(dist, "assets", asset), "utf8");
  assert.equal(published, source, `${asset}: published asset must match the reviewed source`);
  assert.match(source, /^<svg\b/, `${asset}: must be SVG`);
  assert.ok(!/<script\b|<foreignObject\b|<image\b|(?:xlink:)?href=["']https?:|url\(https?:/i.test(source), `${asset}: must not load active or external content`);
}

async function collectIndexFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectIndexFiles(fullPath));
    else if (entry.isFile() && entry.name === "index.html") files.push(fullPath);
  }
  return files;
}

const htmlFiles = await collectIndexFiles(dist);
let brandedPages = 0;
const expectedDistAsset = path.join(dist, "assets", "logo-symbol.svg");
const inlineGatewaySignature = "M56 38V166C56 188.091";

for (const filePath of htmlFiles) {
  const html = await readFile(filePath, "utf8");
  if (!html.includes('class="brand"')) continue;
  brandedPages += 1;

  const brandMatch = html.match(/<span class="brand-mark" aria-hidden="true"><img src="([^"]+)" alt="" width="40" height="40"><\/span>/g) ?? [];
  assert.equal(brandMatch.length, 1, `${path.relative(dist, filePath)}: expected one shared brand image`);
  assert.ok(!html.includes('<span class="brand-mark" aria-hidden="true">AI</span>'), `${path.relative(dist, filePath)}: legacy AI badge remains`);
  assert.ok(!html.includes(inlineGatewaySignature), `${path.relative(dist, filePath)}: duplicated inline gateway SVG remains`);

  const src = brandMatch[0].match(/src="([^"]+)"/)[1];
  const resolvedFile = path.normalize(path.resolve(path.dirname(filePath), src));
  assert.equal(resolvedFile, path.normalize(expectedDistAsset), `${path.relative(dist, filePath)}: logo path must resolve to the shared asset`);

  const relativeHtml = path.relative(dist, filePath).split(path.sep).join("/");
  const publicPath = relativeHtml === "index.html" ? "" : relativeHtml.replace(/index\.html$/, "");
  const productionLogo = new URL(src, new URL(publicPath, productionBase));
  const pagesLogo = new URL(src, new URL(publicPath, repoPagesBase));
  assert.equal(productionLogo.pathname, "/assets/logo-symbol.svg", `${relativeHtml}: production logo URL drifted`);
  assert.equal(pagesLogo.pathname, "/awesome-free-llm-apis-ir/assets/logo-symbol.svg", `${relativeHtml}: GitHub Pages logo escaped the repository prefix`);
}

assert.ok(brandedPages >= 10, `Expected branding across generated page types, found only ${brandedPages} branded pages`);

const faHome = await readFile(path.join(dist, "index.html"), "utf8");
const enHome = await readFile(path.join(dist, "en", "index.html"), "utf8");
assert.ok(faHome.includes(`<link rel="mask-icon" href="./assets/mask-icon.svg" color="${brandColor}">`), "Persian home mask icon is missing or uses a stale brand color");
assert.ok(enHome.includes(`<link rel="mask-icon" href="../assets/mask-icon.svg" color="${brandColor}">`), "English home mask icon is missing or uses a stale brand color");

const manifestText = await readFile(path.join(dist, "manifest.webmanifest"), "utf8");
const manifest = JSON.parse(manifestText);
const manifestIcons = new Map((manifest.icons ?? []).map((icon) => [icon.src, icon]));
assert.deepEqual(manifestIcons.get("./assets/favicon.svg"), { src: "./assets/favicon.svg", sizes: "any", type: "image/svg+xml" });
assert.deepEqual(manifestIcons.get("./assets/social-avatar.svg"), { src: "./assets/social-avatar.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" });

for (const src of ["./assets/favicon.svg", "./assets/social-avatar.svg"]) {
  const pagesUrl = new URL(src, repoPagesBase);
  assert.ok(pagesUrl.pathname.startsWith("/awesome-free-llm-apis-ir/assets/"), `${src}: manifest icon is not repository-path portable`);
}

for (const asset of sourceAssets) {
  const info = await stat(path.join(dist, "assets", asset));
  assert.ok(info.isFile() && info.size > 100, `${asset}: built asset is missing or empty`);
}

console.log(`Brand asset contract passed across ${brandedPages} generated pages with ${brandColor} as the shared product color.`);
