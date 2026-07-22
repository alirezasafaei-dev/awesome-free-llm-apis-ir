import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const dist = path.join(root, ".site-dist");

const build = spawnSync("npm", ["run", "site:build"], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
  env: process.env
});
if (build.status !== 0) {
  console.error("Finder ranking contract could not build the final site artifact.");
  process.exit(1);
}

const [fa, en, faCore, enCore, clarity] = await Promise.all([
  readFile(path.join(dist, "api-finder", "index.html"), "utf8"),
  readFile(path.join(dist, "en", "api-finder", "index.html"), "utf8"),
  readFile(path.join(dist, "api-finder", "finder-core.js"), "utf8"),
  readFile(path.join(dist, "en", "api-finder", "finder-core.js"), "utf8"),
  readFile(path.join(dist, "api-finder", "finder-clarity.js"), "utf8")
]);

const failures = [];
for (const [name, html, core] of [["Persian Finder", fa, faCore], ["English Finder", en, enCore]]) {
  for (const forbidden of [
    'id="finder-language"',
    "filters.language",
    "elements.language",
    "langScore",
    "breakdown.language"
  ]) {
    if (`${html}\n${core}`.includes(forbidden)) failures.push(`${name}: unsupported language scoring remains (${forbidden})`);
  }

  const inlineScripts = [...html.matchAll(/<script>\s*([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  for (const [index, code] of inlineScripts.entries()) {
    try {
      new Function(code);
    } catch (error) {
      failures.push(`${name}: executable inline script ${index + 1} syntax error: ${error.message}`);
    }
  }
}

if (!faCore.includes("از ۱۰۰")) failures.push("Persian Finder: score denominator is not 100");
if (!enCore.includes("/ 100")) failures.push("English Finder: score denominator is not 100");
if (!fa.includes("ظرفیت درخواست")) failures.push("Persian Finder: request-capacity wording missing");
if (!en.includes("Request capacity")) failures.push("English Finder: request-capacity wording missing");
if (fa.includes("پشتیبانی فارسی (+۱۵)")) failures.push("Persian Finder: unsupported Persian-quality score remains");
if (en.includes("Language support (max +15)")) failures.push("English Finder: unsupported language score remains");

for (const forbidden of ["fields.language", "filters.language", 'language: new Set', 'language: "persian"', "languageLabel"]) {
  if (clarity.includes(forbidden)) failures.push(`Finder clarity script: stale language behavior remains (${forbidden})`);
}
if (!clarity.includes("دو سؤال اصلی")) failures.push("Finder clarity script: question count was not corrected");
if (!clarity.includes("ظرفیت درخواست چقدر مهم است؟")) failures.push("Finder clarity script: RPM field still presented as response speed");
if (!clarity.includes("RPM ظرفیت درخواست را نشان می‌دهد")) failures.push("Finder clarity script: RPM limitation disclosure missing");

const syntax = spawnSync(process.execPath, ["--check", path.join(dist, "api-finder", "finder-clarity.js")], { encoding: "utf8" });
if (syntax.status !== 0) failures.push(`Finder clarity script syntax failed: ${syntax.stderr || syntax.stdout}`);
for (const relativePath of ["api-finder/finder-core.js", "en/api-finder/finder-core.js"]) {
  const coreSyntax = spawnSync(process.execPath, ["--check", path.join(dist, relativePath)], { encoding: "utf8" });
  if (coreSyntax.status !== 0) failures.push(`${relativePath} syntax failed: ${coreSyntax.stderr || coreSyntax.stdout}`);
}

if (failures.length) {
  console.error("Finder ranking semantics contract failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Finder ranking semantics contract passed: unsupported language scoring removed and RPM is labeled as request capacity.");
