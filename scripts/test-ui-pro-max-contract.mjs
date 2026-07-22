import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const files = {
  master: path.join(root, "design-system", "awesome-free-llm-apis-ir", "MASTER.md"),
  html: path.join(root, "site", "index.html"),
  css: path.join(root, "site", "ui-pro-max.css"),
  components: path.join(root, "site", "ui-pro-max-components.css"),
  js: path.join(root, "site", "ui-pro-max.js"),
  transform: path.join(root, "scripts", "apply-ui-pro-max-shell.mjs")
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [master, html, css, components, js, transform] = await Promise.all([
  readFile(files.master, "utf8"),
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.components, "utf8"),
  readFile(files.js, "utf8"),
  readFile(files.transform, "utf8")
]);

const requiredMasterSignals = [
  "API Developer Portal",
  "Directory / Listing Site",
  "Search-first comparison workspace",
  "No fake logo treatment",
  "nextlevelbuilder/ui-ux-pro-max-skill"
];
for (const signal of requiredMasterSignals) {
  if (!master.includes(signal)) throw new Error(`Design-system master is missing: ${signal}`);
}

const heroPosition = html.indexOf('class="hero clarity-hero product-hero"');
const catalogPosition = html.indexOf('id="catalog"');
const audiencePosition = html.indexOf('class="audience-paths"');
const educationPosition = html.indexOf('id="how-it-works"');
if (heroPosition < 0 || catalogPosition < 0) throw new Error("Hero or catalog is missing");
if (!(heroPosition < catalogPosition && catalogPosition < audiencePosition && catalogPosition < educationPosition)) {
  throw new Error("The task-first hierarchy is broken: catalog must precede audience and educational sections");
}

const requiredHtmlSignals = [
  'href="./ui-pro-max.css"',
  'class="catalog-metrics"',
  'class="search-field catalog-search"',
  'id="clear-search"',
  'class="quick-filter-row"',
  'value="account_activation_blocked"',
  'src="./ui-pro-max.js"',
  'data-page-type="home"'
];
for (const signal of requiredHtmlSignals) {
  if (!html.includes(signal)) throw new Error(`Homepage UI Pro Max contract is missing: ${signal}`);
}

const catalogSearchPosition = html.indexOf('class="search-field catalog-search"');
const providerGridPosition = html.indexOf('id="provider-grid"');
if (catalogSearchPosition < catalogPosition || providerGridPosition < catalogSearchPosition) {
  throw new Error("Search and provider results are not in the expected catalog order");
}

const structuralEmoji = /[✅🛡️⛔🚫⚠️🧾❔]/u;
const templateStart = html.indexOf('<template id="provider-template">');
const templateEnd = html.indexOf("</template>", templateStart);
const providerTemplate = html.slice(templateStart, templateEnd);
if (structuralEmoji.test(providerTemplate)) throw new Error("Provider template uses emoji as a structural icon");

const requiredCssSignals = [
  "--uupm-primary: #155eef",
  ".product-hero::before",
  ".catalog-filter-shell",
  '.access-badge[data-status="account_activation_blocked"]',
  "min-height: 44px",
  "@media (max-width: 640px)",
  "@media (prefers-reduced-motion: reduce)"
];
for (const signal of requiredCssSignals) {
  if (!css.toLowerCase().includes(signal.toLowerCase())) throw new Error(`UI Pro Max CSS is missing: ${signal}`);
}

if (/transform:\s*translateY\(-/u.test(css)) {
  throw new Error("UI Pro Max layer must not use layout-shifting card hover transforms");
}

for (const signal of [".search-input-shell", ".clear-search", "min-height: 44px", "@media (max-width: 520px)"]) {
  if (!components.includes(signal)) throw new Error(`UI Pro Max component CSS is missing: ${signal}`);
}

const requiredJsSignals = [
  "MutationObserver",
  'aria-keyshortcuts", "/"',
  "account_activation_blocked",
  "structuralEmojiPattern",
  "dataset.providerId"
];
for (const signal of requiredJsSignals) {
  if (!js.includes(signal)) throw new Error(`UI Pro Max behavior is missing: ${signal}`);
}

for (const signal of ["ui-pro-max.css", "ui-pro-max-components.css", "htmlFiles", "injectStylesheets"]) {
  if (!transform.includes(signal)) throw new Error(`Built-page design-system transform is missing: ${signal}`);
}

console.log("UI UX Pro Max contract passed: task-first hierarchy, semantic tokens, responsive behavior and evidence-first cards are enforced.");
