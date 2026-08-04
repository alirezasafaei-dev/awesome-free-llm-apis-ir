import { readFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import {
  footerContextFromRelativePath,
  joinAssetPath,
  normalizeAssetPrefix,
  renderSiteFooter
} from "./lib/site-footer.mjs";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeMarkup(value) {
  return value
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function parityDiagnostic(actual, expected) {
  const max = Math.max(actual.length, expected.length);
  let index = 0;
  while (index < max && actual[index] === expected[index]) index += 1;
  const start = Math.max(0, index - 80);
  const end = index + 160;
  return `first difference at ${index}\nexpected: ${expected.slice(start, end)}\nactual:   ${actual.slice(start, end)}`;
}

// --- pure unit contracts ---
assert(normalizeAssetPrefix("") === "./", "empty prefix becomes ./");
assert(normalizeAssetPrefix("..") === "../", "parent prefix keeps slash");
assert(joinAssetPath("./", "catalog.json") === "./catalog.json", "root catalog path");
assert(joinAssetPath("./", "#catalog") === "#catalog", "root fragment stays on current page");
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

const enGuideContext = footerContextFromRelativePath("guides/en/example/index.html");
assert(enGuideContext.lang === "en", "English guide path language");
assert(enGuideContext.assetPrefix === "../../../", "English guide asset depth");

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

for (const script of [
  "build-persian-content.mjs",
  "apply-finder-ranking-p3.mjs",
  "apply-ui-pro-max-shell.mjs"
]) {
  const run = spawnSync(process.execPath, [path.join(root, "scripts", script)], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, SOURCE_REVISION: "site-footer-contract" }
  });
  assert(run.status === 0, `${script} failed: ${run.stderr || run.stdout}`);
}

async function collectHtml(directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
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

for (const relative of requiredProductPages) await access(path.join(dist, relative));

const htmlFiles = await collectHtml(dist);
let parityPages = 0;
let providerPages = 0;
let guidePages = 0;

for (const filePath of htmlFiles) {
  const relativePath = path.relative(dist, filePath).replaceAll(path.sep, "/");
  const html = await readFile(filePath, "utf8");
  const isNoindex = /name="robots"\s+content="[^"]*noindex/i.test(html);
  const isRequiredProduct = requiredProductPages.includes(relativePath);
  const isProvider = relativePath.startsWith("providers/");
  const isGuide = relativePath.startsWith("guides/");

  if (isProvider) providerPages += 1;
  if (isGuide) guidePages += 1;

  const actualFooter = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? "";
  if ((isRequiredProduct || isProvider || isGuide) && !isNoindex) {
    assert(actualFooter.includes('class="site-footer"'), `${relativePath} missing shared site footer`);
  }
  if (!actualFooter.includes('class="site-footer"')) continue;

  const expectedFooter = renderSiteFooter(footerContextFromRelativePath(relativePath));
  const normalizedActual = normalizeMarkup(actualFooter);
  const normalizedExpected = normalizeMarkup(expectedFooter);
  assert(
    normalizedActual === normalizedExpected,
    `${relativePath}: source/generated footer diverges from shared renderer\n${parityDiagnostic(normalizedActual, normalizedExpected)}`
  );
  assert(actualFooter.includes("footer-grid"), `${relativePath} missing footer-grid`);
  assert(actualFooter.includes("footer-nav"), `${relativePath} missing footer-nav`);
  assert(actualFooter.includes("catalog.json"), `${relativePath} footer missing catalog.json`);
  assert(!actualFooter.includes("شروع برنامه‌نویسی"), `${relativePath} still has legacy quick-start label`);
  parityPages += 1;
}

assert(providerPages >= 1, "expected provider pages in dist");
assert(guidePages >= 1, "expected guide pages in dist");
assert(parityPages >= requiredProductPages.length + providerPages + guidePages, "not all required pages entered footer parity validation");

console.log(
  `Site footer contract passed (${parityPages} source/generated pages; ${providerPages} providers; ${guidePages} guides).`
);
