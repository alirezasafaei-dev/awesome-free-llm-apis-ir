import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");

/**
 * @param {string} relativePath
 * @returns {Promise<string>}
 */
function read(relativePath) {
  return readFile(path.join(dist, relativePath), "utf8");
}

/**
 * @param {string} name
 * @param {string} html
 * @param {"fa"|"en"} language
 * @returns {void}
 */
function validateFinder(name, html, language) {
  const forbidden = [
    'id="finder-language"',
    "filters.language",
    "elements.language",
    "langScore",
    "breakdown.language",
    "languageLabel"
  ];
  for (const marker of forbidden) {
    if (html.includes(marker)) throw new Error(`${name}: unsupported language ranking remains (${marker})`);
  }

  const required = language === "fa"
    ? ["ظرفیت درخواست / Rate limit", "از ۱۰۰", "کاربرد، بودجه، ظرفیت درخواست و منطقه"]
    : ["Request-capacity priority", "not response latency or model speed", "/ 100"];
  for (const marker of required) {
    if (!html.includes(marker)) throw new Error(`${name}: required ranking semantic is missing (${marker})`);
  }

  const stale = language === "fa"
    ? ["سرعت / Latency", "پشتیبانی فارسی (+۱۵)", "از ۱۳۰"]
    : ["Latency sensitivity", "Language support (max +15)", "/ 130"];
  for (const marker of stale) {
    if (html.includes(marker)) throw new Error(`${name}: stale ranking wording remains (${marker})`);
  }
}

/**
 * @param {string} script
 * @returns {void}
 */
function validateClarity(script) {
  for (const marker of ["fields.language", "filters.language", "language: new Set", 'language: "persian"', "languageLabel"]) {
    if (script.includes(marker)) throw new Error(`Finder clarity: stale language behavior remains (${marker})`);
  }
  for (const marker of ["دو سؤال اصلی", "ظرفیت درخواست چقدر مهم است؟", "RPM ظرفیت درخواست را نشان می‌دهد"]) {
    if (!script.includes(marker)) throw new Error(`Finder clarity: required source wording is missing (${marker})`);
  }
}

const [fa, en, clarity] = await Promise.all([
  read("api-finder/index.html"),
  read("en/api-finder/index.html"),
  read("api-finder/finder-clarity.js")
]);

validateFinder("Persian Finder", fa, "fa");
validateFinder("English Finder", en, "en");
validateClarity(clarity);

console.log("Finder ranking P3 validation passed: final semantics are owned by source files and no build-time rewrite was required.");
