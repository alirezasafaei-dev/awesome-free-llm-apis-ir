const SHORTLIST_STORAGE_KEY = "llm-provider-shortlist-v1";
const SHORTLIST_LIMIT = 3;
const PROVIDER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const labels = {
  service: {
    official_provider: "Official provider",
    official_gateway: "Official gateway",
    community_gateway: "Community gateway",
    session_bridge: "Session bridge",
    self_hosted: "Self-hosted"
  },
  free: {
    permanent_allowance: "Permanent allowance",
    free_models: "Free models",
    monthly_credit: "Monthly credit",
    trial: "Trial",
    unknown: "Unknown"
  },
  iran: {
    verified_working: "Direct — verified working",
    verified_working_vpn: "VPN — verified working",
    direct_blocked_vpn_working: "Direct blocked, VPN works",
    verified_blocked: "Verified blocked",
    officially_unsupported: "Officially unsupported",
    intermittent: "Intermittent",
    signup_blocked: "Signup blocked",
    unknown: "Unknown"
  }
};

function safeIds(values) {
  const ids = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value !== "string" || !PROVIDER_ID_PATTERN.test(value) || ids.includes(value)) continue;
    ids.push(value);
    if (ids.length === SHORTLIST_LIMIT) break;
  }
  return ids;
}

function readStoredIds() {
  try {
    return safeIds(JSON.parse(localStorage.getItem(SHORTLIST_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function saveIds(ids) {
  const safe = safeIds(ids);
  try { localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(safe)); } catch { /* URL remains the portable source. */ }
  return safe;
}

function idsFromLocation() {
  const value = new URL(location.href).searchParams.get("providers") || "";
  return safeIds(value.split(",").map((item) => item.trim()).filter(Boolean));
}

function canonicalShareUrl(ids) {
  const url = new URL(location.pathname, location.origin);
  const safe = safeIds(ids);
  if (safe.length) url.searchParams.set("providers", safe.join(","));
  return url.toString();
}

function syncLocation(ids) {
  const next = canonicalShareUrl(ids);
  if (next !== location.href) history.replaceState(null, "", next);
}

function trackPlausible(name, props = {}) {
  if (typeof window.plausible !== "function") return;
  const safeProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (!["provider_id", "result_count", "source"].includes(key)) continue;
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) continue;
    safeProps[key] = value;
  }
  window.plausible(name, { props: safeProps });
}

function safeExternalUrl(href) {
  try {
    const url = new URL(String(href ?? ""));
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function limitText(provider) {
  const limit = provider.free_tier?.limits?.[0];
  if (!limit) return "Model/account dependent";
  const values = [];
  for (const [key, suffix] of [["rpm", "RPM"], ["rph", "RPH"], ["rpd", "RPD"], ["tpm", "TPM"], ["tpd", "TPD"]]) {
    if (limit[key] != null) values.push(`${Number(limit[key]).toLocaleString("en-US")} ${suffix}`);
  }
  if (limit.monthly_credit_usd != null) values.push(`$${limit.monthly_credit_usd}/month`);
  if (limit.monthly_requests != null) values.push(`${Number(limit.monthly_requests).toLocaleString("en-US")} request/month`);
  if (limit.daily_units != null) values.push(`${Number(limit.daily_units).toLocaleString("en-US")} ${limit.unit_name || "unit"}/day`);
  return values.slice(0, 3).join(" · ") || limit.condition || "Model-specific";
}

function paymentText(value) {
  if (value === true) return "Required";
  if (value === false) return "Not required";
  return "Not specified in source";
}

function createFact(term, value, { code = false } = {}) {
  const row = document.createElement("div");
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  if (code) {
    const codeElement = document.createElement("code");
    codeElement.textContent = String(value ?? "");
    dd.appendChild(codeElement);
  } else {
    dd.textContent = String(value ?? "");
  }
  row.append(dt, dd);
  return row;
}

function createLabeledParagraph(className, label, value) {
  const paragraph = document.createElement("p");
  paragraph.className = className;
  const strong = document.createElement("strong");
  strong.textContent = label;
  paragraph.append(strong, document.createTextNode(` ${value}`));
  return paragraph;
}

function providerCard(provider) {
  const models = provider.models?.notable ?? [];
  const capabilities = provider.capabilities ?? [];
  const quickParams = new URLSearchParams({ provider: provider.id, usecase: "chat", region: "any" });

  const article = document.createElement("article");
  article.className = "compare-card";
  article.dataset.providerId = provider.id;

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = labels.service[provider.service_type] || provider.service_type;
  article.appendChild(eyebrow);

  const title = document.createElement("h3");
  title.textContent = provider.name;
  article.appendChild(title);

  const id = document.createElement("p");
  id.className = "compare-card-id";
  id.textContent = provider.id;
  article.appendChild(id);

  const access = document.createElement("span");
  access.className = "compare-access";
  access.textContent = labels.iran[provider.iran_access?.status] || provider.iran_access?.status || "Unknown";
  article.appendChild(access);

  const facts = document.createElement("dl");
  facts.className = "compare-facts";
  facts.append(
    createFact("Free-tier type", labels.free[provider.free_tier?.type] || provider.free_tier?.type || "Unknown"),
    createFact("Payment method", paymentText(provider.free_tier?.requires_payment_method)),
    createFact("Sample limit", limitText(provider)),
    createFact("OpenAI compatible", provider.api?.openai_compatible ? "Yes" : "No"),
    createFact("Base URL", provider.api?.base_url || "Unknown", { code: true }),
    createFact("Last checked", provider.verification?.last_checked || "Unknown")
  );
  article.appendChild(facts);

  article.appendChild(createLabeledParagraph(
    "compare-capabilities",
    "Capabilities:",
    capabilities.join(", ") || "Not recorded"
  ));
  article.appendChild(createLabeledParagraph(
    "compare-models",
    "Notable models:",
    models.slice(0, 6).join(", ") || "Dynamic list; check official source"
  ));

  const actions = document.createElement("div");
  actions.className = "compare-card-actions";

  const quickStart = document.createElement("a");
  quickStart.className = "button primary";
  quickStart.href = `../../en/quick-start/?${quickParams.toString()}`;
  quickStart.textContent = "Build first request";
  actions.appendChild(quickStart);

  const docsUrl = safeExternalUrl(provider.docs);
  if (docsUrl) {
    const docs = document.createElement("a");
    docs.className = "button secondary compare-docs";
    docs.dataset.providerId = provider.id;
    docs.href = docsUrl;
    docs.target = "_blank";
    docs.rel = "nofollow noopener noreferrer";
    docs.textContent = "Official docs";
    actions.appendChild(docs);
  }

  const evidence = document.createElement("a");
  evidence.className = "button secondary";
  evidence.href = `../../providers/${provider.id}/#evidence`;
  evidence.textContent = "Evidence & details";
  actions.appendChild(evidence);
  article.appendChild(actions);

  const remove = document.createElement("button");
  remove.className = "compare-remove";
  remove.type = "button";
  remove.dataset.providerId = provider.id;
  remove.textContent = "Remove from comparison";
  article.appendChild(remove);

  return article;
}

const loading = document.getElementById("compare-loading");
const error = document.getElementById("compare-error");
const empty = document.getElementById("compare-empty");
const results = document.getElementById("compare-results");
const grid = document.getElementById("compare-grid");
const clear = document.getElementById("compare-clear");

let selectedIds = idsFromLocation();
if (!selectedIds.length) selectedIds = readStoredIds();
selectedIds = saveIds(selectedIds);
syncLocation(selectedIds);

function render(catalog) {
  const providerMap = new Map((catalog.providers || []).map((provider) => [provider.id, provider]));
  selectedIds = selectedIds.filter((id) => providerMap.has(id));
  selectedIds = saveIds(selectedIds);
  syncLocation(selectedIds);
  const providers = selectedIds.map((id) => providerMap.get(id)).filter(Boolean);

  loading.hidden = true;
  const ready = providers.length >= 2;
  empty.hidden = ready;
  results.hidden = !ready;
  if (!ready) {
    grid.replaceChildren();
    return;
  }
  grid.replaceChildren(...providers.map(providerCard));
  trackPlausible("compare_loaded", { result_count: String(providers.length), source: idsFromLocation().length ? "shared_url" : "local_shortlist" });
}

clear?.addEventListener("click", () => {
  selectedIds = saveIds([]);
  syncLocation(selectedIds);
  results.hidden = true;
  empty.hidden = false;
  grid.replaceChildren();
  trackPlausible("compare_clear", { result_count: "0", source: "compare_page" });
});

grid?.addEventListener("click", (event) => {
  const remove = event.target.closest(".compare-remove");
  if (remove) {
    const id = remove.dataset.providerId;
    selectedIds = saveIds(selectedIds.filter((value) => value !== id));
    location.href = canonicalShareUrl(selectedIds);
    return;
  }
  const docs = event.target.closest(".compare-docs");
  if (docs) trackPlausible("official_docs_click", { provider_id: docs.dataset.providerId || "unknown", source: "compare_card" });
});

fetch("../../catalog.json", { cache: "no-cache" })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(render)
  .catch((reason) => {
    console.error(reason);
    loading.hidden = true;
    error.hidden = false;
  });
