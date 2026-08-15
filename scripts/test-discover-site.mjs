import assert from "node:assert/strict";
import { access, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pagePath = path.join(root, "site", "discover", "index.html");
const cssPath = path.join(root, "site", "discover", "discover.css");
const jsPath = path.join(root, "site", "discover", "discover.js");
const enhancementPath = path.join(root, "site", "discover", "discover-enhancements.js");
const destination = path.join(root, ".site-dist");

const accessibilityCssPath = path.join(root, "site", "discover", "discover-accessibility.css");
const [page, css, accessibilityCss, script, enhancements] = await Promise.all([
  readFile(pagePath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(accessibilityCssPath, "utf8"),
  readFile(jsPath, "utf8"),
  readFile(enhancementPath, "utf8")
]);

for (const signal of [
  'lang="fa"', 'dir="rtl"',
  '<link rel="canonical" href="https://llm.persiantoolbox.ir/discover/">',
  'id="discover-search"', 'id="discover-categories"', 'id="discover-list"',
  'id="discover-loading"', 'id="discover-empty"', 'id="discover-error"', 'id="discover-retry"',
  'id="discover-main-site"', 'https://persiantoolbox.ir/',
  'src="./discover.js"', 'src="./discover-enhancements.js"', 'src="../analytics.js"', 'src="../plausible.js"'
]) {
  assert.ok(page.includes(signal), `Discover page is missing ${signal}`);
}
assert.equal((page.match(/<h1(?:\s|>)/g) || []).length, 1, "Discover page must have exactly one H1");
assert.ok(css.includes(".discover-grid") && css.includes(".discover-main-site") && css.includes("@media"), "Discover CSS must include grid, conversion CTA and responsive behavior");
assert.ok(accessibilityCss.includes(".discover-retry") && accessibilityCss.includes(":focus-visible"), "Discover accessibility CSS must style retry and keyboard focus");

for (const signal of [
  '/discover/api/tools', '/discover/api/icons/simple-icons/', '/discover/assets/sparkles.svg',
  'icon_provider', 'icon_key', 'discover_view', 'discover_tool_click', 'discover_search', 'discover_filter', 'discover_retry', 'aria-busy',
  'noopener noreferrer', 'textContent', 'result_bucket', 'tool_slug'
]) {
  assert.ok(script.includes(signal), `Discover script is missing ${signal}`);
}
assert.ok(!script.includes("iconPrefix") && !script.includes("icon:"), "Public Discover must not use legacy badge icon metadata");
for (const signal of ["discover_persiantoolbox_click", "discover-main-site"]) {
  assert.ok(enhancements.includes(signal), `Discover enhancement layer is missing ${signal}`);
}
assert.ok(!enhancements.includes("ICON_PREFIX") && !enhancements.includes("MutationObserver"), "Enhancement layer must not restore legacy icon behavior");
for (const source of [script, enhancements]) {
  for (const forbidden of ["localStorage.setItem", "sessionStorage.setItem", "search_text", "destination_url:"]) {
    assert.ok(!source.includes(forbidden), `Discover client must not persist/emit sensitive free text: ${forbidden}`);
  }
}
assert.ok(!/<img\b[^>]*src=["']https?:\/\//i.test(page), "Discover must not depend on remote images");

for (const file of [jsPath, enhancementPath]) {
  const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr || `Discover JS syntax failed: ${file}`);
}

const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "discover-site-contract" }
});
assert.equal(build.status, 0, build.stderr || build.stdout || "Production build failed");

try {
  const builtPage = await readFile(path.join(destination, "discover", "index.html"), "utf8");
  const builtScript = await readFile(path.join(destination, "discover", "discover.js"), "utf8");
  const builtEnhancements = await readFile(path.join(destination, "discover", "discover-enhancements.js"), "utf8");
  const builtAccessibilityCss = await readFile(path.join(destination, "discover", "discover-accessibility.css"), "utf8");
  const builtAdmin = await readFile(path.join(destination, "discover", "admin", "index.html"), "utf8");
  const builtVendor = path.join(destination, "discover", "admin", "vendor", "sortable.min.js");
  await access(builtVendor);
  const sortable = await readFile(builtVendor, "utf8");
  assert.ok(builtPage.includes("ابزارهایی که توی ریلز دیدی"));
  assert.ok(builtScript.includes("/discover/api/tools"));
  assert.ok(builtEnhancements.includes("discover_persiantoolbox_click"));
  assert.ok(builtAccessibilityCss.includes(".discover-retry") && builtAccessibilityCss.includes(":focus-visible"));
  assert.ok(builtAdmin.includes("./vendor/sortable.min.js"));
  assert.ok(sortable.includes("Sortable") && sortable.includes("MIT"));
  assert.ok(!sortable.includes("cdn.jsdelivr.net") && !sortable.includes("unpkg.com"));
} finally {
  await rm(destination, { recursive: true, force: true });
}

console.log("Discover public site/build/privacy/OSS asset contract passed.");
