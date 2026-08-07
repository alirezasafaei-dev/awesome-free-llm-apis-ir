import {
  accountRequirementPresentation,
  connectionPresentation,
  freeTierLabel,
  serviceTypeLabel
} from "../provider-presentation.js";

const SHORTLIST_STORAGE_KEY = "llm-provider-shortlist-v1";
const SHORTLIST_LIMIT = 3;
const PROVIDER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  if (!limit) return "وابسته به مدل یا حساب";
  const values = [];
  for (const [key, suffix] of [["rpm", "RPM"], ["rph", "RPH"], ["rpd", "RPD"], ["tpm", "TPM"], ["tpd", "TPD"]]) {
    if (limit[key] != null) values.push(`${Number(limit[key]).toLocaleString("en-US")} ${suffix}`);
  }
  if (limit.monthly_credit_usd != null) values.push(`$${limit.monthly_credit_usd}/month`);
  if (limit.monthly_requests != null) values.push(`${Number(limit.monthly_requests).toLocaleString("en-US")} request/month`);
  if (limit.daily_units != null) values.push(`${Number(limit.daily_units).toLocaleString("en-US")} ${limit.unit_name || "unit"}/day`);
  return values.slice(0, 3).join(" · ") || limit.condition || "مدل‌محور";
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
  const quickParams = new URLSearchParams({ provider: provider.id, usecase: "chat", region: "iran" });
  const connection = connectionPresentation(provider, "fa");
  const account = accountRequirementPresentation(provider, "fa");

  const article = document.createElement("article");
  article.className = "compare-card";
  article.dataset.providerId = provider.id;

  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = serviceTypeLabel(provider.service_type, "fa");
  article.appendChild(eyebrow);

  const title = document.createElement("h3");
  title.textContent = provider.name;
  article.appendChild(title);

  const id = document.createElement("p");
  id.className = "compare-card-id";
  id.textContent = provider.id;
  article.appendChild(id);

  const connectionBadge = document.createElement("span");
  connectionBadge.className = "compare-access access-badge";
  connectionBadge.dataset.status = connection.status;
  connectionBadge.dataset.tone = connection.tone;
  connectionBadge.textContent = connection.label;
  article.appendChild(connectionBadge);

  const facts = document.createElement("dl");
  facts.className = "compare-facts";
  facts.append(
    createFact("نوع Free Tier", freeTierLabel(provider.free_tier?.type, "fa")),
    createFact("روش اتصال از ایران", connection.label),
    createFact("پیش‌نیاز حساب", account.label),
    createFact("محدودیت نمونه", limitText(provider)),
    createFact("سازگار با OpenAI", provider.api?.openai_compatible ? "بله" : "خیر"),
    createFact("Base URL", provider.api?.base_url || "نامشخص", { code: true }),
    createFact("آخرین بررسی", provider.verification?.last_checked || "نامشخص")
  );
  article.appendChild(facts);

  article.appendChild(createLabeledParagraph(
    "compare-capabilities",
    "قابلیت‌ها:",
    capabilities.join("، ") || "ثبت نشده"
  ));
  article.appendChild(createLabeledParagraph(
    "compare-models",
    "مدل‌های شاخص:",
    models.slice(0, 6).join("، ") || "فهرست پویا؛ منبع رسمی را بررسی کنید"
  ));

  const actions = document.createElement("div");
  actions.className = "compare-card-actions";

  const quickStart = document.createElement("a");
  quickStart.className = "button primary";
  quickStart.href = `../quick-start/?${quickParams.toString()}`;
  quickStart.textContent = "ساخت اولین درخواست";
  actions.appendChild(quickStart);

  const docsUrl = safeExternalUrl(provider.docs);
  if (docsUrl) {
    const docs = document.createElement("a");
    docs.className = "button secondary compare-docs";
    docs.dataset.providerId = provider.id;
    docs.href = docsUrl;
    docs.target = "_blank";
    docs.rel = "nofollow noopener noreferrer";
    docs.textContent = "مستندات رسمی";
    actions.appendChild(docs);
  }

  const evidence = document.createElement("a");
  evidence.className = "button secondary";
  evidence.href = `../providers/${provider.id}/#evidence`;
  evidence.textContent = "شواهد و جزئیات";
  actions.appendChild(evidence);
  article.appendChild(actions);

  const remove = document.createElement("button");
  remove.className = "compare-remove";
  remove.type = "button";
  remove.dataset.providerId = provider.id;
  remove.textContent = "حذف از مقایسه";
  article.appendChild(remove);

  return article;
}

const loading = document.getElementById("compare-loading");
const error = document.getElementById("compare-error");
const empty = document.getElementById("compare-empty");
const results = document.getElementById("compare-results");
const grid = document.getElementById("compare-grid");
const clear = document.getElementById("compare-clear");
const share = document.getElementById("compare-share");
const shareStatus = document.getElementById("compare-share-status");

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

share?.addEventListener("click", async () => {
  if (selectedIds.length < 2) {
    shareStatus.textContent = "برای اشتراک حداقل دو Provider انتخاب کن";
    return;
  }
  try {
    await navigator.clipboard.writeText(canonicalShareUrl(selectedIds));
    shareStatus.textContent = "لینک امن مقایسه کپی شد";
    trackPlausible("compare_share", { result_count: String(selectedIds.length), source: "compare_header" });
  } catch {
    shareStatus.textContent = "کپی ناموفق بود؛ آدرس مرورگر را کپی کنید";
  }
});

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

fetch("../catalog.json", { cache: "no-cache" })
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
