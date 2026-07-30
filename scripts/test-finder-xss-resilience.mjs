import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const root = process.cwd();
const files = {
  finderFa: path.join(root, "site", "api-finder", "index.html"),
  finderEn: path.join(root, "site", "en", "api-finder", "index.html"),
  clarity: path.join(root, "site", "api-finder", "finder-clarity.js"),
  shortlist: path.join(root, "site", "api-finder", "shortlist.js"),
  compareFa: path.join(root, "site", "compare", "compare.js"),
  compareEn: path.join(root, "site", "en", "compare", "compare.js"),
  app: path.join(root, "site", "app.js")
};

const sources = Object.fromEntries(await Promise.all(
  Object.entries(files).map(async ([key, file]) => [key, await readFile(file, "utf8")])
));
const failures = [];

function fail(message) {
  failures.push(message);
}

function extractFunction(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Unable to find ${marker}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Unable to parse ${marker}`);
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
    this.className = "";
    this.id = "";
    this.hidden = false;
    this.type = "";
    this._textContent = "";
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

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
    if (name === "class") this.className = normalized;
    if (name === "id") this.id = normalized;
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

function createFakeDocument() {
  const byId = new Map();
  return {
    createElement: (tagName) => new FakeElement(tagName),
    createTextNode: (value) => new FakeText(value),
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new FakeElement("div"));
      return byId.get(id);
    }
  };
}

function walk(node) {
  return [node, ...(node.children ?? []).flatMap(walk)];
}

function assertNoHtmlSinks(source, label) {
  for (const pattern of [/\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML\s*\(/]) {
    if (pattern.test(source)) fail(`${label}: forbidden HTML parsing sink matched ${pattern}`);
  }
}

function assertBlankLinkProtection(source, label) {
  for (const match of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    const tag = match[0];
    const rel = tag.match(/\brel=["']([^"']*)["']/i)?.[1]?.split(/\s+/) ?? [];
    if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
      fail(`${label}: static target=_blank link is missing noopener+noreferrer`);
    }
  }

  const dynamicTargets = [
    ...source.matchAll(/\.target\s*=\s*["']_blank["']/g),
    ...source.matchAll(/\.setAttribute\(\s*["']target["']\s*,\s*["']_blank["']\s*\)/g)
  ];
  for (const match of dynamicTargets) {
    const window = source.slice(match.index, match.index + 320);
    if (!/noopener/.test(window) || !/noreferrer/.test(window)) {
      fail(`${label}: dynamic target=_blank assignment is not followed by noopener+noreferrer`);
    }
  }
}

function assertDocsUrlFlow(source, label) {
  if (!source.includes("function safeExternalUrl")) fail(`${label}: safeExternalUrl is missing`);
  if (!source.includes("safeExternalUrl(provider.docs)")) fail(`${label}: provider.docs does not pass through safeExternalUrl`);
  for (const pattern of [
    /\.href\s*=\s*provider\.docs/,
    /href=["']\$\{[^}]*provider\.docs/,
    /\.setAttribute\(\s*["']href["']\s*,\s*provider\.docs/
  ]) {
    if (pattern.test(source)) fail(`${label}: raw provider.docs reaches an href sink`);
  }
}

function evaluateSafeExternalUrl(source, label) {
  const sandbox = {
    URL,
    location: { origin: "https://catalog.example" }
  };
  vm.runInNewContext(
    `${extractFunction(source, "safeExternalUrl")}; globalThis.__safeExternalUrl = safeExternalUrl;`,
    sandbox,
    { filename: label }
  );
  const safeExternalUrl = sandbox.__safeExternalUrl;
  const valid = [
    "https://docs.example/path?query=1#section",
    "https://docs.example/%22%3E%3Csvg%20onload%3Dalert(1)%3E"
  ];
  const invalid = [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://docs.example/insecure",
    "ftp://docs.example/file",
    "mailto:security@example.com"
  ];
  for (const value of valid) {
    const result = safeExternalUrl(value);
    if (typeof result !== "string" || !result.startsWith("https://")) {
      fail(`${label}: valid HTTPS URL was rejected: ${value}`);
    }
  }
  for (const value of invalid) {
    if (safeExternalUrl(value) !== null) fail(`${label}: unsafe URL scheme was accepted: ${value}`);
  }
}

function finderRenderer(source, label) {
  const sandbox = {
    URL,
    URLSearchParams,
    location: { origin: "https://catalog.example" },
    document: createFakeDocument(),
    serviceLabels: {},
    accessLabels: {},
    limitText: () => "<limit onmouseover=alert(1)>",
    isStale: () => false
  };
  const script = [
    extractFunction(source, "safeExternalUrl"),
    extractFunction(source, "createBreakdownItem"),
    extractFunction(source, "createCardElement"),
    "globalThis.__createCardElement = createCardElement;"
  ].join("\n");
  vm.runInNewContext(script, sandbox, { filename: label });
  return { render: sandbox.__createCardElement, document: sandbox.document };
}

function compareRenderer(source, label) {
  const document = createFakeDocument();
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
    `${source}\n;globalThis.__providerCard = providerCard; globalThis.__safeIds = safeIds;`,
    sandbox,
    { filename: label }
  );
  return { render: sandbox.__providerCard, safeIds: sandbox.__safeIds };
}

const consumerKeys = ["finderFa", "finderEn", "clarity", "shortlist", "compareFa", "compareEn", "app"];
for (const key of consumerKeys) {
  assertNoHtmlSinks(sources[key], files[key]);
  assertBlankLinkProtection(sources[key], files[key]);
}
for (const key of ["finderFa", "finderEn", "compareFa", "compareEn"]) {
  assertDocsUrlFlow(sources[key], files[key]);
  evaluateSafeExternalUrl(sources[key], files[key]);
}
for (const key of ["compareFa", "compareEn"]) {
  if (!sources[key].includes("PROVIDER_ID_PATTERN")) fail(`${files[key]}: provider ID validation is missing`);
  if (!sources[key].includes("grid.replaceChildren(...providers.map(providerCard))")) {
    fail(`${files[key]}: compare rendering must use DOM nodes with replaceChildren`);
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
  const { render } = finderRenderer(sources[key], label);
  for (const payload of payloads) {
    const provider = {
      id: "safe-provider",
      name: payload,
      service_type: payload,
      docs: "javascript:alert(1)",
      iran_access: { status: payload, evidence: [{}] }
    };
    const card = render(provider, 99, { test: { label: payload, value: 1 } }, 0, "chat", "any");
    const nodes = walk(card);
    if (!card.textContent.includes(payload)) fail(`${label}: malicious text was not preserved as inert text`);
    if (nodes.some((node) => ["SCRIPT", "IMG", "SVG"].includes(node.tagName))) {
      fail(`${label}: malicious payload created an executable element`);
    }
    if (nodes.some((node) => /^(?:javascript|data|http):/i.test(node.href || ""))) {
      fail(`${label}: unsafe docs URL reached a rendered link`);
    }
  }
}

for (const [key, label] of [["compareFa", "Persian Compare"], ["compareEn", "English Compare"]]) {
  const { render, safeIds } = compareRenderer(sources[key], label);
  const sanitizedIds = safeIds(["safe-one", "../escape", "safe-two", "safe-one", "bad<script>"]);
  if (JSON.stringify(sanitizedIds) !== JSON.stringify(["safe-one", "safe-two"])) {
    fail(`${label}: provider ID validation accepted traversal, markup, or duplicates`);
  }
  for (const payload of payloads) {
    const provider = {
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
    };
    const card = render(provider);
    const nodes = walk(card);
    if (!card.textContent.includes(payload)) fail(`${label}: malicious text was not preserved as inert text`);
    if (nodes.some((node) => ["SCRIPT", "IMG", "SVG"].includes(node.tagName))) {
      fail(`${label}: malicious payload created an executable element`);
    }
    if (nodes.some((node) => /^(?:javascript|data|http):/i.test(node.href || ""))) {
      fail(`${label}: unsafe docs URL reached a rendered link`);
    }
  }
}

if (failures.length) {
  console.error("Finder/Compare XSS resilience test FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Finder/Compare XSS resilience passed: DOM-only rendering, HTTPS docs validation, protected blank links, safe IDs, and malicious fixtures are enforced.");
