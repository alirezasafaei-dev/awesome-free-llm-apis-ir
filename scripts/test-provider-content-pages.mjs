import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root,
  encoding: "utf8"
});

if (build.status !== 0) {
  throw new Error(build.stderr || build.stdout || "Production site build failed");
}

const providerExpectations = new Map([
  ["groq", "محدودیت جغرافیایی تأیید شده"],
  ["cerebras", "محدودیت جغرافیایی تأیید شده"],
  ["openrouter", "محدودیت جغرافیایی تأیید شده"],
  ["mistral", "دسترسی مستقیم از ایران تأیید شده"],
  ["github-models", "دسترسی مستقیم از ایران تأیید شده"],
  ["google-gemini", "ایران رسماً پشتیبانی نمی‌شود"]
]);
const requiredSections = ["intent", "signup", "first-request", "errors", "when-not-to-use", "links"];
const startMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_START -->";
const endMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_END -->";

for (const [providerId, expectedAccessLabel] of providerExpectations) {
  const pagePath = path.join(root, ".site-dist", "providers", providerId, "index.html");
  const html = await readFile(pagePath, "utf8");

  if ((html.split(startMarker).length - 1) !== 1 || (html.split(endMarker).length - 1) !== 1) {
    throw new Error(`${providerId}: editorial content markers must occur exactly once`);
  }
  if (!html.includes(`data-provider-content-id="${providerId}"`)) {
    throw new Error(`${providerId}: content wrapper is missing`);
  }
  for (const section of requiredSections) {
    if (!html.includes(`data-content-section="${section}"`)) {
      throw new Error(`${providerId}: missing editorial section ${section}`);
    }
  }
  if (html.indexOf(startMarker) > html.indexOf('<section class="provider-sources">')) {
    throw new Error(`${providerId}: editorial content must appear before official sources`);
  }
  if (!html.includes("../../guides/openai-sdk-custom-base-url/")) {
    throw new Error(`${providerId}: internal related-guide link is missing`);
  }
  if (!html.includes(expectedAccessLabel)) {
    throw new Error(`${providerId}: factual Iran-access label changed or disappeared`);
  }
  if (/\bsk-[A-Za-z0-9_-]{12,}\b/.test(html) || /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(html)) {
    throw new Error(`${providerId}: generated HTML contains a secret-like value`);
  }
}

const geminiHtml = await readFile(
  path.join(root, ".site-dist", "providers", "google-gemini", "index.html"),
  "utf8"
);
if (!geminiHtml.includes("گزینه مستقیم برای کاربران داخل ایران معرفی نمی‌کند")) {
  throw new Error("google-gemini: regional restriction safeguard is missing from editorial copy");
}

const untouchedPath = path.join(root, ".site-dist", "providers", "aion-labs", "index.html");
const untouchedHtml = await readFile(untouchedPath, "utf8");
if (untouchedHtml.includes(startMarker) || untouchedHtml.includes("provider-editorial-content")) {
  throw new Error("Provider outside the completed batches must not receive editorial content");
}

console.log(
  `Provider content page integration passed for ${providerExpectations.size} enriched pages and one untouched control page.`
);
