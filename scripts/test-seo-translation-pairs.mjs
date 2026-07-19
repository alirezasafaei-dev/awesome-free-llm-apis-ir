import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { TRANSLATION_MAP, resolveUrl } from "./locales.mjs";

const root = process.cwd();
const keys = [
  "free-ai-api",
  "free-llm-api",
  "chatgpt-api-alternative",
  "openai-api-alternative",
  "ai-api-iran",
  "free-gpt-api-no-credit-card"
];

function parse(source, filename) {
  if (!source.startsWith("---\n")) throw new Error(`${filename}: missing frontmatter`);
  const end = source.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filename}: unterminated frontmatter`);
  const metadata = {};
  for (const line of source.slice(4, end).split("\n")) {
    const match = line.match(/^([a-z_]+):\s*["']?(.*?)["']?\s*$/);
    if (match) metadata[match[1]] = match[2];
  }
  return { metadata, body: source.slice(end + 5).trim() };
}

function words(value) {
  return value.split(/\s+/u).filter(Boolean).length;
}

for (const key of keys) {
  const faFile = path.join(root, "content", "fa", `${key}.md`);
  const enFile = path.join(root, "content", "en", `${key}.md`);
  const fa = parse(await readFile(faFile, "utf8"), faFile);
  const en = parse(await readFile(enFile, "utf8"), enFile);
  const pair = TRANSLATION_MAP[key];

  if (!pair) throw new Error(`${key}: missing TRANSLATION_MAP entry`);
  if (fa.metadata.translation_key !== key) throw new Error(`${key}: Persian translation_key mismatch`);
  if (en.metadata.translation_key !== key) throw new Error(`${key}: English translation_key mismatch`);
  if (fa.metadata.slug !== key) throw new Error(`${key}: Persian slug must equal translation key`);
  if (en.metadata.slug !== `en-${key}`) throw new Error(`${key}: English slug mismatch`);

  const expectedFaPath = `/guides/${key}/`;
  const expectedEnPath = `/guides/en/en-${key}/`;
  if (pair.fa !== expectedFaPath || pair.en !== expectedEnPath) {
    throw new Error(`${key}: translation map paths are inconsistent`);
  }
  if (fa.metadata.canonical_target !== resolveUrl(expectedFaPath)) {
    throw new Error(`${key}: Persian canonical mismatch`);
  }
  if (en.metadata.canonical_target !== resolveUrl(expectedEnPath)) {
    throw new Error(`${key}: English canonical mismatch`);
  }

  if (words(fa.body) < 700) throw new Error(`${key}: Persian counterpart is too short (${words(fa.body)} words)`);
  if (!fa.body.includes("```")) throw new Error(`${key}: Persian counterpart needs a practical code block`);

  for (const requiredLink of [
    "https://llm.persiantoolbox.ir/",
    "https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir"
  ]) {
    if (!fa.body.includes(requiredLink)) throw new Error(`${key}: Persian counterpart missing ${requiredLink}`);
  }

  const combined = `${fa.body}\n${en.body}`;
  if (/BEGIN (RSA|OPENSSH|EC) PRIVATE KEY/.test(combined)) throw new Error(`${key}: private key material detected`);
  if (/\b(sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/.test(combined)) throw new Error(`${key}: secret-like value detected`);
}

console.log(`SEO translation-pair checks passed for ${keys.length} landing pages.`);
