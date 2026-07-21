import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");

async function edit(relativePath, transform) {
  const filePath = path.join(dist, relativePath);
  const before = await readFile(filePath, "utf8");
  const after = transform(before);
  if (after === before) throw new Error(`${relativePath}: Finder ranking transform made no change`);
  await writeFile(filePath, after, "utf8");
  console.log(`patched Finder ranking semantics: ${relativePath}`);
}

function removeRequired(text, pattern, label, relativePath) {
  if (!pattern.test(text)) throw new Error(`${relativePath}: missing ${label}`);
  return text.replace(pattern, "");
}

function removeExact(text, block, label, relativePath) {
  if (!text.includes(block)) throw new Error(`${relativePath}: missing ${label}`);
  return text.replace(block, "");
}

function replaceRequired(text, from, to, label, relativePath) {
  if (!text.includes(from)) throw new Error(`${relativePath}: missing ${label}`);
  return text.replaceAll(from, to);
}

function cleanFinderHtml(html, language) {
  const relativePath = language === "fa" ? "api-finder/index.html" : "en/api-finder/index.html";
  let next = html;

  next = removeRequired(
    next,
    /\s*<label>[^<]*(?:زبان\s*\/\s*Language|Language\s*\/\s*output)[\s\S]*?<select id="finder-language">[\s\S]*?<\/select>\s*<\/label>/i,
    "language field",
    relativePath
  );

  next = removeRequired(
    next,
    language === "fa"
      ? /\s*<div><strong>🌐\s*(?:دسترس‌پذیری و اطلاعات فارسی|پشتیبانی فارسی)[\s\S]*?<\/div>/i
      : /\s*<div><strong>Language support[\s\S]*?<\/div>/i,
    "language scoring disclosure",
    relativePath
  );

  next = removeRequired(next, /^\s*language:\s*document\.getElementById\("finder-language"\),\s*$/m, "language element reference", relativePath);

  next = removeRequired(
    next,
    language === "fa"
      ? /\s*const hasFaNotes =[\s\S]*?breakdown\.language = \{ label: "پشتیبانی زبان", value: langScore, max: 15 \};\s*/
      : /\s*let langScore = 0;[\s\S]*?breakdown\.language = \{ label: "Language support", value: langScore, max: 15 \};\s*/,
    "language score block",
    relativePath
  );

  for (const [pattern, label] of [
    [/^\s*language:\s*elements\.language\.value,\s*$/m, "language filter value"],
    [/^\s*if \(params\.has\("language"\)\) elements\.language\.value = params\.get\("language"\);\s*$/m, "language URL loader"],
    [/^\s*if \(filters\.language[^\n]*\n/m, "language URL writer"],
    [/^\s*language:\s*filters\.language,\s*$/m, "language analytics property"],
    [/^\s*elements\.language\.value = [^;]+;\s*$/m, "language reset"]
  ]) {
    next = removeRequired(next, pattern, label, relativePath);
  }

  if (language === "fa") {
    next = replaceRequired(next, "کاربرد، زبان، بودجه، ظرفیت درخواست و منطقه", "کاربرد، بودجه، ظرفیت درخواست و منطقه", "Persian Finder hero/meta copy", relativePath);
    next = replaceRequired(next, "از ۱۳۰", "از ۱۰۰", "Persian score denominator", relativePath);
  } else {
    next = replaceRequired(
      next,
      "Answer three quick questions — use case, free-access constraint, and language — to get ranked results.",
      "Choose a use case and free-access constraint to get ranked results.",
      "English Finder hero copy",
      relativePath
    );
    next = replaceRequired(next, "free-tier type, language, and region", "free-tier type, request capacity, and region", "English Finder meta copy", relativePath);
    next = replaceRequired(next, "/ 130", "/ 100", "English score denominator", relativePath);
  }

  return next;
}

function cleanClarityScript(script) {
  let next = script;
  const relativePath = "api-finder/finder-clarity.js";

  next = removeRequired(next, /^\s*language:\s*new Set\([^\n]+\),\s*$/m, "allowed language values", relativePath);
  next = replaceRequired(
    next,
    'const defaults = { usecase: "chat", language: "persian", budget: "no-card", latency: "low", region: "iran" };',
    'const defaults = { usecase: "chat", budget: "no-card", latency: "low", region: "iran" };',
    "Finder defaults",
    relativePath
  );
  next = removeRequired(next, /^\s*language:\s*document\.getElementById\("finder-language"\),\s*$/m, "clarity language field", relativePath);
  next = removeRequired(next, /^\s*language:\s*\[[^\n]+\],\s*$/m, "clarity language field copy", relativePath);
  next = removeExact(
    next,
    `    language: [
      ["persian", "پاسخ فارسی برایم مهم است"],
      ["english", "فقط انگلیسی کافی است"],
      ["multilingual", "پروژه چندزبانه است"]
    ],
`,
    "clarity language option copy",
    relativePath
  );
  next = replaceRequired(next, "filters.usecase, filters.language, filters.budget", "filters.usecase, filters.budget", "filter signature", relativePath);
  next = removeRequired(next, /^\s*const languageLabel = improveLabel\(fields\.language, "language"\);\s*$/m, "language label enhancer", relativePath);
  next = replaceRequired(
    next,
    "if (!usecaseLabel || !languageLabel || !budgetLabel) {",
    "if (!usecaseLabel || !budgetLabel) {",
    "core-field guard",
    relativePath
  );

  next = replaceRequired(next, '["سرعت پاسخ چقدر مهم است؟", "RPM شاخص کامل Latency نیست؛ فقط در رتبه‌بندی اولیه اثر می‌گذارد."]', '["ظرفیت درخواست چقدر مهم است؟", "RPM ظرفیت درخواست را نشان می‌دهد؛ نه Latency یا سرعت پاسخ مدل را."]', "request-capacity field copy", relativePath);
  next = replaceRequired(next, '["important", "سرعت مهم است"]', '["important", "ظرفیت درخواست مهم است"]', "request-capacity option", relativePath);
  next = replaceRequired(next, '["critical", "سرعت اولویت اصلی است"]', '["critical", "ظرفیت درخواست اولویت اصلی است"]', "critical request-capacity option", relativePath);
  next = replaceRequired(next, "تنظیمات پیشرفته: سرعت و مسیر دسترسی", "تنظیمات پیشرفته: ظرفیت درخواست و مسیر دسترسی", "advanced settings label", relativePath);
  next = replaceRequired(next, "سه سؤال اصلی را جواب بده.", "دو سؤال اصلی را جواب بده.", "hero question count", relativePath);
  next = replaceRequired(next, "زبان و نوع گزینه رایگان برایت چقدر مهم است؟", "نوع گزینه رایگان و نیاز به کارت بانکی را مشخص کن.", "Finder intro copy", relativePath);
  next = replaceRequired(next, "RPM ثبت‌شده معادل Latency واقعی روی شبکه شما نیست.", "RPM ثبت‌شده ظرفیت درخواست را نشان می‌دهد و معادل Latency واقعی نیست.", "Finder limitation copy", relativePath);

  return next;
}

await edit("api-finder/index.html", (html) => cleanFinderHtml(html, "fa"));
await edit("en/api-finder/index.html", (html) => cleanFinderHtml(html, "en"));
await edit("api-finder/finder-clarity.js", cleanClarityScript);

console.log("Finder ranking P3 complete: unsupported language scoring removed.");
