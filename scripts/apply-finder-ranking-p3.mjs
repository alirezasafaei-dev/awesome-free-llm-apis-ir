import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");

function read(relativePath) {
  return readFile(path.join(dist, relativePath), "utf8");
}

function validateFinder(name, source, language) {
  const forbidden = [
    'id="finder-language"',
    "filters.language",
    "elements.language",
    "langScore",
    "breakdown.language",
    "languageLabel"
  ];
  for (const marker of forbidden) {
    if (source.includes(marker)) throw new Error(`${name}: unsupported language ranking remains (${marker})`);
  }

  const required = language === "fa"
    ? [
        "ظرفیت درخواست / Rate limit",
        "از ۱۰۰",
        "روش اتصال",
        "پیش‌نیاز حساب",
        "متصل با فیلترشکن",
        'const iranNetworkPenalties = ["officially_unsupported", "verified_blocked"]'
      ]
    : [
        "Request-capacity priority",
        "not response latency or model speed",
        "/ 100",
        "Connection method",
        "Account requirements",
        "Works with a VPN",
        'const iranNetworkPenalties = ["verified_blocked", "officially_unsupported"]'
      ];
  for (const marker of required) {
    if (!source.includes(marker)) throw new Error(`${name}: required ranking semantic is missing (${marker})`);
  }

  const stale = language === "fa"
    ? ["سرعت / Latency", "پشتیبانی فارسی (+۱۵)", "از ۱۳۰", "مستقیم مسدود / VPN موفق"]
    : ["Latency sensitivity", "Language support (max +15)", "/ 130", "Direct blocked, VPN works"];
  for (const marker of stale) {
    if (source.includes(marker)) throw new Error(`${name}: stale ranking wording remains (${marker})`);
  }

  if (/iran(?:Score)?Penalties[^\n]*signup_blocked/.test(source)) {
    throw new Error(`${name}: signup/account prerequisites must not be network penalties`);
  }
}

function validateClarity(script) {
  for (const marker of ["fields.language", "filters.language", "language: new Set", 'language: "persian"', "languageLabel"]) {
    if (script.includes(marker)) throw new Error(`Finder clarity: stale language behavior remains (${marker})`);
  }
  for (const marker of ["دو سؤال اصلی", "ظرفیت درخواست چقدر مهم است؟", "RPM ظرفیت درخواست را نشان می‌دهد"]) {
    if (!script.includes(marker)) throw new Error(`Finder clarity: required source wording is missing (${marker})`);
  }
}

const [faHtml, faCore, enHtml, enCore, clarity] = await Promise.all([
  read("api-finder/index.html"),
  read("api-finder/finder-core.js"),
  read("en/api-finder/index.html"),
  read("en/api-finder/finder-core.js"),
  read("api-finder/finder-clarity.js")
]);

validateFinder("Persian Finder", `${faHtml}\n${faCore}`, "fa");
validateFinder("English Finder", `${enHtml}\n${enCore}`, "en");
validateClarity(clarity);

console.log("Finder ranking P3 validation passed: connection method and account requirements are source-owned and independently scored.");
