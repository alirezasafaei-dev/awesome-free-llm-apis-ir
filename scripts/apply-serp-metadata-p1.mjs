import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");

const overrides = {
  "en/index.html": {
    description: "Compare free LLM APIs by quotas, models, signup requirements, payment methods, regional access, and OpenAI compatibility. Evidence-based and regularly updated."
  },
  "en/api-finder/index.html": { title: "Free LLM API Finder — Compare Providers" },
  "en/quick-start/index.html": { title: "Free LLM API Quick Start: curl, Python & Node.js" },
  "providers/hugging-face-inference/index.html": { title: "Hugging Face Inference API رایگان | سهمیه و وضعیت ایران" },
  "guides/practical-free-llm-api-iran/index.html": { title: "راهنمای انتخاب API رایگان هوش مصنوعی در ایران" },
  "guides/en/en-free-gpt-api-no-credit-card/index.html": {
    description: "Compare free GPT API providers that require no credit card, including limits, model access, signup requirements, and official documentation."
  },
  "guides/en/en-free-ai-api/index.html": {
    description: "Compare free AI APIs for chat, coding, and text generation, including limits, OpenAI compatibility, signup requirements, and Iran access evidence."
  },
  "guides/en/en-build-persian-chatbot-python/index.html": { title: "Build a Persian Chatbot in Python with a Free LLM API" },
  "guides/en/en-practical-free-llm-api-iran/index.html": {
    description: "Choose a free LLM API from Iran, verify signup and connectivity, and send your first request with clear security, quota, and access checks."
  },
  "guides/en/en-chatgpt-api-alternative/index.html": {
    description: "Compare free OpenAI-compatible ChatGPT API alternatives by free tier, limits, signup requirements, payment method, and regional access."
  },
  "guides/en/en-free-llm-api/index.html": {
    description: "Compare free LLM APIs by rate limits, models, OpenAI compatibility, signup requirements, payment method, and Iran access evidence."
  },
  "guides/en/en-ai-api-iran/index.html": {
    description: "Compare free AI APIs tested for Iran access, with signup requirements, quotas, models, payment conditions, and dated provider evidence."
  },
  "guides/en/en-use-free-llm-api-nodejs/index.html": {
    description: "Connect Node.js to OpenAI-compatible free LLM APIs with environment variables, streaming, timeouts, retries, error handling, and a secure chat endpoint."
  },
  "guides/en/en-openai-api-alternative/index.html": {
    title: "Free OpenAI API Alternatives: Compatible LLM Providers",
    description: "Compare free OpenAI-compatible LLM APIs by models, rate limits, payment requirements, regional access, and migration effort."
  }
};

function replaceTag(html, pattern, replacement, label, relativePath) {
  if (!pattern.test(html)) throw new Error(`${relativePath}: missing ${label}`);
  return html.replace(pattern, replacement);
}

function applyMetadata(html, metadata, relativePath) {
  let next = html;
  if (metadata.title) {
    const escaped = metadata.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    next = replaceTag(next, /<title>[\s\S]*?<\/title>/i, `<title>${escaped}</title>`, "title", relativePath);
    next = next.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+property="og:title")/i, `<meta property="og:title" content="${escaped}">`);
    next = next.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="twitter:title")/i, `<meta name="twitter:title" content="${escaped}">`);
  }
  if (metadata.description) {
    const escaped = metadata.description.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    next = replaceTag(next, /<meta\s+name="description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="description")/i, `<meta name="description" content="${escaped}">`, "meta description", relativePath);
    next = next.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+property="og:description")/i, `<meta property="og:description" content="${escaped}">`);
    next = next.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>(?![\s\S]*<meta\s+name="twitter:description")/i, `<meta name="twitter:description" content="${escaped}">`);
  }
  return next;
}

for (const [relativePath, metadata] of Object.entries(overrides)) {
  const filePath = path.join(dist, relativePath);
  const before = await readFile(filePath, "utf8");
  const after = applyMetadata(before, metadata, relativePath);
  if (after !== before) {
    await writeFile(filePath, after, "utf8");
    console.log(`patched SERP metadata: ${relativePath}`);
  } else {
    console.log(`verified SERP metadata: ${relativePath}`);
  }
}

console.log(`SERP metadata P1 complete (${Object.keys(overrides).length} pages).`);
