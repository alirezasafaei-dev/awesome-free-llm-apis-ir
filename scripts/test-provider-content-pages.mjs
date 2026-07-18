import { readFile, readdir } from "node:fs/promises";
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

const accessLabels = {
  verified_working: "دسترسی مستقیم از ایران تأیید شده",
  verified_working_vpn: "دسترسی با VPN تأیید شده",
  direct_blocked_vpn_working: "مستقیم مسدود و VPN موفق",
  verified_blocked: "محدودیت جغرافیایی تأیید شده",
  officially_unsupported: "ایران رسماً پشتیبانی نمی‌شود",
  intermittent: "دسترسی ناپایدار",
  signup_blocked: "مانع ثبت‌نام یا احراز حساب",
  unknown: "وضعیت دسترسی نامشخص"
};

const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
const providerById = new Map(catalog.providers.map((provider) => [provider.id, provider]));
const contentFiles = (await readdir(path.join(root, "content", "providers"), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();
const contentByProviderId = new Map();

for (const file of contentFiles) {
  const content = JSON.parse(await readFile(path.join(root, "content", "providers", file), "utf8"));
  if (!content.provider_id) continue;
  if (contentByProviderId.has(content.provider_id)) {
    throw new Error(`Provider-page integration test discovered duplicate provider content ID: ${content.provider_id}`);
  }
  contentByProviderId.set(content.provider_id, content);
}

const enrichedProviderIds = [...contentByProviderId.keys()];
if (enrichedProviderIds.length < 1) {
  throw new Error("Provider-page integration test did not discover any editorial content records");
}

const requiredSections = ["intent", "signup", "first-request", "errors", "when-not-to-use", "links"];
const startMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_START -->";
const endMarker = "<!-- PROVIDER_EDITORIAL_CONTENT_END -->";

for (const providerId of enrichedProviderIds) {
  const provider = providerById.get(providerId);
  const content = contentByProviderId.get(providerId);
  if (!provider) throw new Error(`${providerId}: content record has no Catalog provider`);

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

  for (const guideSlug of content.related_guides ?? []) {
    const expectedLink = `../../guides/${guideSlug}/`;
    if (!html.includes(expectedLink)) {
      throw new Error(`${providerId}: declared internal related-guide link is missing: ${guideSlug}`);
    }
  }

  const expectedAccessLabel = accessLabels[provider.iran_access.status];
  if (!expectedAccessLabel || !html.includes(expectedAccessLabel)) {
    throw new Error(`${providerId}: factual Iran-access label changed or disappeared`);
  }
  if (/\bsk-[A-Za-z0-9_-]{12,}\b/.test(html) || /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(html)) {
    throw new Error(`${providerId}: generated HTML contains a secret-like value`);
  }
}

const geminiContentPath = path.join(root, "content", "providers", "google-gemini.json");
if (contentFiles.includes("google-gemini.json")) {
  const geminiHtml = await readFile(
    path.join(root, ".site-dist", "providers", "google-gemini", "index.html"),
    "utf8"
  );
  if (!geminiHtml.includes("گزینه مستقیم برای کاربران داخل ایران معرفی نمی‌کند")) {
    throw new Error(`google-gemini: regional restriction safeguard from ${geminiContentPath} is missing`);
  }
}

const enrichedSet = new Set(enrichedProviderIds);
const untouchedProvider = catalog.providers.find((provider) => !enrichedSet.has(provider.id));
if (untouchedProvider) {
  const untouchedPath = path.join(root, ".site-dist", "providers", untouchedProvider.id, "index.html");
  const untouchedHtml = await readFile(untouchedPath, "utf8");
  if (untouchedHtml.includes(startMarker) || untouchedHtml.includes("provider-editorial-content")) {
    throw new Error(`${untouchedProvider.id}: Provider without a content record received editorial content`);
  }
}

console.log(
  `Provider content page integration passed for ${enrichedProviderIds.length} dynamically discovered enriched page(s)` +
  `${untouchedProvider ? " and one untouched control page" : ""}.`
);
