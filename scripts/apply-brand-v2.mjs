import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

async function replaceExactlyOnce(file, needle, replacement) {
  const filePath = path.join(root, file);
  const source = await readFile(filePath, "utf8");
  const count = source.split(needle).length - 1;
  if (count !== 1) throw new Error(`${file}: expected exactly one brand placeholder, found ${count}`);
  await writeFile(filePath, source.replace(needle, replacement));
}

const placeholder = '<span class="brand-mark" aria-hidden="true">AI</span>';
const brandMarkup = (src) => `<span class="brand-mark" aria-hidden="true"><img src="${src}" alt="" width="40" height="40"></span>`;

const replacements = [
  ["site/index.html", "./assets/logo-symbol.svg"],
  ["site/en/index.html", "../assets/logo-symbol.svg"],
  ["scripts/build-site.mjs", "../../assets/logo-symbol.svg"],
  ["scripts/build-guides.mjs", "../../assets/logo-symbol.svg"],
  ["scripts/build-persian-content.mjs", "../../assets/logo-symbol.svg"],
  ["scripts/build-english-content.mjs", "../../../assets/logo-symbol.svg"]
];

for (const [file, src] of replacements) {
  await replaceExactlyOnce(file, placeholder, brandMarkup(src));
}

for (const asset of ["logo-symbol.svg", "favicon.svg", "mask-icon.svg", "social-avatar.svg"]) {
  await copyFile(path.join(root, "assets", "brand", asset), path.join(root, "site", "assets", asset));
}

const stylesPath = path.join(root, "site", "styles.css");
let styles = await readFile(stylesPath, "utf8");
const brandRule = styles.match(/\.brand-mark \{[^\n]+\}/);
if (!brandRule) throw new Error("site/styles.css: .brand-mark rule not found");
styles = styles.replace(
  brandRule[0],
  ".brand-mark { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); overflow: hidden; }"
);
if (!styles.includes(".brand-mark img")) {
  styles = styles.replace(
    ".brand-mark { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); overflow: hidden; }",
    ".brand-mark { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 13px; background: var(--surface); box-shadow: var(--shadow); overflow: hidden; }\n.brand-mark img { display: block; width: 100%; height: 100%; object-fit: contain; }"
  );
}
await writeFile(stylesPath, styles);

for (const [file, href] of [["site/index.html", "./assets/mask-icon.svg"], ["site/en/index.html", "../assets/mask-icon.svg"]]) {
  const filePath = path.join(root, file);
  let html = await readFile(filePath, "utf8");
  if (!html.includes('rel="mask-icon"')) {
    const faviconNeedle = file === "site/index.html"
      ? '<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">'
      : '<link rel="icon" type="image/svg+xml" href="../assets/favicon.svg">';
    if (!html.includes(faviconNeedle)) throw new Error(`${file}: SVG favicon link not found`);
    html = html.replace(faviconNeedle, `${faviconNeedle}\n    <link rel="mask-icon" href="${href}" color="#2563EB">`);
  }
  await writeFile(filePath, html);
}

const manifestPath = path.join(root, "site", "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const requiredIcons = [
  { src: "./assets/favicon.svg", sizes: "any", type: "image/svg+xml" },
  { src: "./assets/social-avatar.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
];
const existing = new Map((manifest.icons ?? []).map((icon) => [icon.src, icon]));
for (const icon of requiredIcons) existing.set(icon.src, icon);
manifest.icons = [...requiredIcons, ...[...existing.values()].filter((icon) => !requiredIcons.some((required) => required.src === icon.src))];
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const packagePath = path.join(root, "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.scripts["brand:test"] = "node scripts/test-brand-assets.mjs";
if (!packageJson.scripts.test.includes("npm run brand:test")) {
  const anchor = "npm run site:data:test";
  if (!packageJson.scripts.test.includes(anchor)) throw new Error("package.json: site:data:test anchor not found");
  packageJson.scripts.test = packageJson.scripts.test.replace(anchor, `npm run brand:test && ${anchor}`);
}
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`Applied shared brand asset to ${replacements.length} source templates.`);
