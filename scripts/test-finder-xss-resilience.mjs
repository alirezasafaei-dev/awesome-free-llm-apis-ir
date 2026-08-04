import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const root = process.cwd();
const files = {
  finderFa: "site/api-finder/finder-core.js",
  finderEn: "site/en/api-finder/finder-core.js",
  clarity: "site/api-finder/finder-clarity.js",
  shortlist: "site/api-finder/shortlist.js",
  compareFa: "site/compare/compare.js",
  compareEn: "site/en/compare/compare.js",
  app: "site/app.js"
};
const sources = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([key, file]) => [key, await readFile(path.join(root, file), "utf8")])
));
const failures = [];
const fail = (message) => failures.push(message);

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) throw new Error(`Missing function ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unterminated function ${name}`);
}

class FakeText {
  constructor(value) {
    this.nodeType = 3;
    this.textContent = String(value ?? "");
    this.children = [];
  }
}

class FakeElement {
  constructor(tagName) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.className = "";
    this.id = "";
    this.hidden = false;
    this.type = "";
    this._textContent = "";
  }
  append(...nodes) { nodes.forEach((node) => this.appendChild(node)); }
  appendChild(node) {
    this.children.push(typeof node === "string" ? new FakeText(node) : node);
    return node;
  }
  replaceChildren(...nodes) {
    this.children = [];
    this._textContent = "";
    this.append(...nodes);
  }
  setAttribute(name, value) {
    const normalized = String(value);
    this.attributes[name] = normalized;
    if (name === "href") this.href = normalized;
    if (name === "target") this.target = normalized;
    if (name === "rel") this.rel = normalized;
  }
  addEventListener() {}
  closest() { return null; }
  before() {}
  set textContent(value) {
    this._textContent = String(value ?? "");
    this.children = [];
  }
  get textContent() {
    return this._textContent + this.children.map((child) => child.textContent ?? "").join("");
  }
  set href(value) { this.attributes.href = String(value); }
  get href() { return this.attributes.href ?? ""; }
  set target(value) { this.attributes.target = String(value); }
  get target() { return this.attributes.target ?? ""; }
  set rel(value) { this.attributes.rel = String(value); }
  get rel() { return this.attributes.rel ?? ""; }
}

function createDocument() {
  const nodes = new Map();
  return {
    createElement: (tagName) => new FakeElement(tagName),
    createTextNode: (value) => new FakeText(value),
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, new FakeElement("div"));
      return nodes.get(id);
    }
  };
}

const walk = (node) => [node, ...(node.children ?? []).flatMap(walk)];

function checkSource(source, label) {
  for (const pattern of [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML\s*\(/]) {
    if (pattern.test(source)) fail(`${label}: forbidden HTML sink ${pattern}`);
  }
  for (const match of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    const rel = match[0].match(/\brel=["']([^"']*)["']/i)?.[1]?.split(/\s+/) ?? [];
    if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
      fail(`${label}: static blank-target link lacks noopener+noreferrer`);
    }
  }
  const dynamicTargets = [
    ...source.matchAll(/\.target\s*=\s*["']_blank["']/g),
    ...source.matchAll(/\.setAttribute\(\s*["']target["']\s*,\s*["']_blank["']\s*\)/g)
  ];
  for (const match of dynamicTargets) {
    const nearby = source.slice(match.index, match.index + 320);
    if (!nearby.includes("noopener") || !nearby.includes("noreferrer")) {
      fail(`${label}: dynamic blank-target link lacks noopener+noreferrer`);
    }
  }
}

function checkDocsFlow(source, label) {
  if (!source.includes("function safeExternalUrl")) fail(`${label}: safeExternalUrl is missing`);
  if (!source.includes("safeExternalUrl(provider.docs)")) fail(`${label}: provider.docs bypasses safeExternalUrl`);
  if (/\.href\s*=\s*provider\.docs/.test(source) || /href=["']\$\{[^}]*provider\.docs/.test(source)) {
    fail(`${label}: raw provider.docs reaches href`);
  }
  const sandbox = { URL, location: { origin: "https://catalog.example" } };
  vm.runInNewContext(
    `${extractFunction(source, "safeExternalUrl")}; globalThis.result = safeExternalUrl;`,
    sandbox,
    { filename: label }
  );
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://docs.example/insecure",
    "ftp://docs.example/file",
    "mailto:test@example.com"
  ]) {
    if (sandbox.result(value) !== null) fail(`${label}: accepted unsafe URL ${value}`);
  }
  if (!String(sandbox.result("https://docs.example/path?q=1")).startsWith("https://")) {
    fail(`${label}: rejected valid HTTPS URL`);
  }
}

function renderFinder(source, label, provider, payload) {
  const sandbox = {
    URL,
    URLSearchParams,
    location: { origin: "https://catalog.example" },
    document: createDocument(),
    serviceLabels: {},
    accessLabels: {},
    accessEmoji: {},
    limitText: () => payload,
    isStale: () => false
  };
  vm.runInNewContext([
    extractFunction(source, "safeExternalUrl"),
    extractFunction(source, "createBreakdownItem"),
    extractFunction(source, "createCardElement"),
    "globalThis.render = createCardElement;"
  ].join("\n"), sandbox, { filename: label });
  return sandbox.render(provider, 99, { fixture: { label: payload, value: 1 } }, 0, "chat", "any");
}

function compareHarness(source, label) {
  const document = createDocument();
  const pending = new Promise(() => {});
  const sandbox = {
    URL,
    URLSearchParams,
    document,
    location: {
      href: "https://catalog.example/compare/?providers=safe-one,safe-two",
      pathname: "/compare/",
      origin: "https://catalog.example"
    },
    history: { replaceState() {} },
    localStorage: { getItem: () => "[]", setItem() {} },
    navigator: { clipboard: { writeText: async () => {} } },
    window: {},
    console,
    fetch: () => pending,
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(
    `${source}\n;globalThis.render = providerCard; globalThis.safe = safeIds;`,
    sandbox,
    { filename: label }
  );
  return sandbox;
}

for (const [key, source] of Object.entries(sources)) checkSource(source, files[key]);
for (const key of ["finderFa", "finderEn", "compareFa", "compareEn"]) {
  checkDocsFlow(sources[key], files[key]);
}
for (const key of ["compareFa", "compareEn"]) {
  if (!sources[key].includes("PROVIDER_ID_PATTERN")) fail(`${files[key]}: provider ID validation missing`);
  if (!sources[key].includes("grid.replaceChildren(...providers.map(providerCard))")) {
    fail(`${files[key]}: Compare must render DOM nodes via replaceChildren`);
  }
}

const payloads = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert("xss")>',
  '\"><svg onload=alert("xss")>',
  "' onmouseover='alert(1)",
  "&lt;script&gt;alert(1)&lt;/script&gt;",
  "text\u202E>tpircs/<"
];

for (const [key, label] of [["finderFa", "Persian Finder"], ["finderEn", "English Finder"]]) {
  for (const payload of payloads) {
    const card = renderFinder(sources[key], label, {
      id: "safe-provider",
      name: payload,
      service_type: payload,
      docs: "javascript:alert(1)",
      iran_access: { status: payload, evidence: [{}] }
    }, payload);
    const nodes = walk(card);
    if (!card.textContent.includes(payload)) fail(`${label}: payload was not preserved as inert text`);
    if (nodes.some((node) => ["SCRIPT", "IMG", "SVG"].includes(node.tagName))) {
      fail(`${label}: payload created an executable element`);
    }
    if (nodes.some((node) => /^(?:javascript|data|http):/i.test(node.href || ""))) {
      fail(`${label}: unsafe URL reached rendered output`);
    }
  }
}

for (const [key, label] of [["compareFa", "Persian Compare"], ["compareEn", "English Compare"]]) {
  const harness = compareHarness(sources[key], label);
  const safeIds = harness.safe(["safe-one", "../escape", "safe-two", "safe-one", "bad<script>"]);
  if (JSON.stringify(safeIds) !== JSON.stringify(["safe-one", "safe-two"])) {
    fail(`${label}: ID validator accepted traversal, markup, or duplicates`);
  }
  for (const payload of payloads) {
    const card = harness.render({
      id: "safe-provider",
      name: payload,
      service_type: payload,
      docs: "javascript:alert(1)",
      capabilities: [payload],
      models: { notable: [payload] },
      iran_access: { status: payload },
      free_tier: { type: payload, requires_payment_method: null, limits: [{ condition: payload }] },
      api: { base_url: payload, openai_compatible: false },
      verification: { last_checked: payload }
    });
    const nodes = walk(card);
    if (!card.textContent.includes(payload)) fail(`${label}: payload was not preserved as inert text`);
    if (nodes.some((node) => ["SCRIPT", "IMG", "SVG"].includes(node.tagName))) {
      fail(`${label}: payload created an executable element`);
    }
    if (nodes.some((node) => /^(?:javascript|data|http):/i.test(node.href || ""))) {
      fail(`${label}: unsafe URL reached rendered output`);
    }
  }
}

if (failures.length) {
  console.error("Finder/Compare XSS resilience test FAILED:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Finder/Compare XSS resilience passed: DOM-only rendering, HTTPS docs, protected blank links, safe IDs, and malicious fixtures are enforced.");
