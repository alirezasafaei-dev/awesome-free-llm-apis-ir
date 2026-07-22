import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import {
  footerContextFromRelativePath,
  joinAssetPath,
  normalizeAssetPrefix,
  renderSiteFooter,
  replaceFooter
} from "./lib/site-footer.mjs";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

/**
 * @param {string} condition
 * @param {string} message
 * @returns {void}
 */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// --- pure unit contracts ---
assert(normalizeAssetPrefix("") === "./", "empty prefix becomes ./");
assert(normalizeAssetPrefix("..") === "../", "parent prefix keeps slash");
assert(joinAssetPath("./", "catalog.json") === "./catalog.json", "root catalog path");
assert(joinAssetPath("../", "api-finder/") === "../api-finder/", "nested finder path");
assert(joinAssetPath("../", "#catalog") === "../#catalog", "hash path stays on parent home");

const faFooter = renderSiteFooter({ lang: "fa", assetPrefix: "../" });
assert(faFooter.includes('class="site-footer"'), "FA footer class");
assert(faFooter.includes('href="../api-finder/"'), "FA finder link depth");
assert(faFooter.includes('href="../quick-start/"'), "FA quick-start link");
assert(faFooter.includes("شروع سریع"), "FA quick-start label is purpose-clear");
assert(!faFooter.includes("شروع برنامه‌نویسی"), "legacy quick-start label banned");
assert(faFooter.includes("catalog.json"), "FA catalog link present");
assert(faFooter.includes('role="contentinfo"'), "FA contentinfo role");

const enFooter = renderSiteFooter({ lang: "en", assetPrefix: "../../" });
assert(enFooter.includes('href="../../en/api-finder/"'), "EN finder depth for en/compare");
assert(enFooter.includes("Quick Start"), "EN quick start label");
assert(enFooter.includes("Methodology"), "EN methodology link");

const replaced = replaceFooter("<html><body><footer>old</footer></body></html>", {
  lang: "fa",
  assetPrefix: "./"
});
assert(replaced.changed, "replaceFooter reports change");
assert(replaced.html.includes("site-footer"), "replaceFooter injects shared footer");
assert(!replaced.html.includes("<footer>old</footer>"), "legacy footer removed");

const ctx = footerContextFromRelativePath("en/compare/index.html");
assert(ctx.lang === "en", "en path language");
assert(ctx.assetPrefix === "../../", "en/compare depth");

// --- source contracts already shipped on homepage ---
const home = await readFile(path.join(root, "site", "index.html"), "utf8");
assert(home.includes("FAQPage"), "homepage source ships FAQPage schema");
assert(home.includes("site-footer"), "homepage source ships site-footer");
assert(home.includes("status-legend"), "homepage source ships status legend");
assert((home.match(/<h1\b/g) || []).length === 1, "homepage has exactly one H1");

const appJs = await readFile(path.join(root, "site", "app.js"), "utf8");
assert(appJs.includes("accessBadge.dataset.status = accessStatus"), "cards set data-status for CSS badges");
assert(appJs.includes("account_activation_blocked"), "activation-blocked status is labeled");

// --- build + dist contracts ---
const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, SOURCE_REVISION: "site-footer-contract" }
});
assert(build.status === 0, build.stderr || build.stdout || "site production build failed");

// Apply the same pipeline tail that package.json site:build uses for footer styles + footer upgrade.
for (const script of [
  "build-persian-content.mjs",
  "apply-ux-seo-p0.mjs",
  "apply-serp-metadata-p1.mjs",
  "apply-product-navigation-p2.mjs",
  "apply-finder-ranking-p3.mjs",
  "apply-site-footer-p4.mjs",
  "apply-ui-pro-max-shell.mjs"
]) {
  const run = spawnSync(process.execPath, [path.join(root, "scripts", script)], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, SOURCE_REVISION: "site-footer-contract" }
  });
  assert(run.status === 0, `${script} failed: ${run.stderr || run.stdout}`);
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function collectHtml(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectHtml(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const requiredProductPages = [
  "index.html",
  "compare/index.html",
  "api-finder/index.html",
  "quick-start/index.html",
  "methodology/index.html",
  "tools/index.html",
  "en/index.html",
  "en/compare/index.html",
  "en/api-finder/index.html",
  "en/quick-start/index.html"
];

for (const relative of requiredProductPages) {
  const filePath = path.join(dist, relative);
  await access(filePath);
  const html = await readFile(filePath, "utf8");
  assert(html.includes('class="site-footer"'), `${relative} missing site-footer`);
  assert(html.includes("footer-grid"), `${relative} missing footer-grid`);
  assert(html.includes("footer-nav"), `${relative} missing footer-nav`);
  assert(html.includes("catalog.json"), `${relative} footer missing catalog.json`);
  assert(!html.includes("شروع برنامه‌نویسی"), `${relative} still has legacy quick-start label`);
  if (relative === "index.html") {
    assert(html.includes("FAQPage"), "built homepage missing FAQPage");
    assert(html.includes("status-legend"), "built homepage missing status legend");
  }
}

// Provider pages also get the shared footer after P4.
const providerDir = path.join(dist, "providers");
const providerPages = (await collectHtml(providerDir)).slice(0, 5);
assert(providerPages.length >= 1, "expected provider pages in dist");
for (const filePath of providerPages) {
  const html = await readFile(filePath, "utf8");
  assert(html.includes('class="site-footer"'), `${path.relative(dist, filePath)} missing site-footer`);
}

console.log(
  `Site footer contract passed (unit + ${requiredProductPages.length} product pages + ${providerPages.length} provider samples).`
);
