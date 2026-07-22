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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function providerCard(provider) {
  const models = provider.models?.notable ?? [];
  const capabilities = provider.capabilities ?? [];
  const quickParams = new URLSearchParams({ provider: provider.id, usecase: "chat", region: "any" });
  return `<article class="compare-card" data-provider-id="${escapeHtml(provider.id)}">
    <p class="eyebrow">${escapeHtml(labels.service[provider.service_type] || provider.service_type)}</p>
    <h3>${escapeHtml(provider.name)}</h3>
    <p class="compare-card-id">${escapeHtml(provider.id)}</p>
    <span class="compare-access">${escapeHtml(labels.iran[provider.iran_access?.status] || provider.iran_access?.status || "Unknown")}</span>
    <dl class="compare-facts">
      <div><dt>Free-tier type</dt><dd>${escapeHtml(labels.free[provider.free_tier?.type] || provider.free_tier?.type || "Unknown")}</dd></div>
      <div><dt>Payment method</dt><dd>${escapeHtml(paymentText(provider.free_tier?.requires_payment_method))}</dd></div>
      <div><dt>Sample limit</dt><dd>${escapeHtml(limitText(provider))}</dd></div>
      <div><dt>OpenAI compatible</dt><dd>${provider.api?.openai_compatible ? "Yes" : "No"}</dd></div>
      <div><dt>Base URL</dt><dd><code>${escapeHtml(provider.api?.base_url || "Unknown")}</code></dd></div>
      <div><dt>Last checked</dt><dd>${escapeHtml(provider.verification?.last_checked || "Unknown")}</dd></div>
    </dl>
    <p class="compare-capabilities"><strong>Capabilities:</strong> ${escapeHtml(capabilities.join(", ") || "Not recorded")}</p>
    <p class="compare-models"><strong>Notable models:</strong> ${escapeHtml(models.slice(0, 6).join(", ") || "Dynamic list; check official source")}</p>
    <div class="compare-card-actions">
      <a class="button primary" href="../../en/quick-start/?${quickParams.toString()}">Build first request</a>
      <a class="button secondary compare-docs" data-provider-id="${escapeHtml(provider.id)}" href="${escapeHtml(provider.docs)}" target="_blank" rel="nofollow noopener">Official docs</a>
      <a class="button secondary" href="../../providers/${escapeHtml(provider.id)}/#evidence">Evidence & details</a>
    </div>
    <button class="compare-remove" type="button" data-provider-id="${escapeHtml(provider.id)}">Remove from comparison</button>
  </article>`;
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
  grid.innerHTML = providers.map(providerCard).join("");
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
