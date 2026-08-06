import {
  accountRequirementPresentation,
  connectionPresentation,
  serviceTypeLabel
} from "../provider-presentation.js";

const capabilityLabels = {
  chat: "چت",
  text_generation: "تولید متن",
  reasoning: "Reasoning",
  embeddings: "Embedding",
  tool_calling: "Tool calling",
  structured_output: "Structured output"
};
const usecaseCapabilityMap = {
  chat: ["chat", "text_generation"],
  coding: ["tool_calling", "structured_output"],
  reasoning: ["reasoning"],
  embeddings: ["embeddings"]
};
const iranNetworkPenalties = ["officially_unsupported", "verified_blocked"];

let providers = [];
const elements = {
  form: document.getElementById("finder-form"),
  usecase: document.getElementById("finder-usecase"),
  budget: document.getElementById("finder-budget"),
  latency: document.getElementById("finder-latency"),
  region: document.getElementById("finder-region"),
  submit: document.getElementById("finder-submit"),
  reset: document.getElementById("finder-reset"),
  results: document.getElementById("finder-results"),
  status: document.getElementById("finder-status"),
  statusText: document.getElementById("finder-status-text"),
  loading: document.getElementById("finder-loading"),
  error: document.getElementById("finder-error"),
  retry: document.getElementById("finder-retry"),
  empty: document.getElementById("finder-empty"),
  disclosure: document.getElementById("finder-disclosure"),
  themeToggle: document.getElementById("theme-toggle")
};

function isStale(provider) {
  const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
  return (Date.now() - checked.getTime()) / 86_400_000 > provider.verification.stale_after_days;
}

function maxRpm(provider) {
  return Math.max(...provider.free_tier.limits.map((limit) => limit.rpm ?? 0), 0);
}

function accountFriction(provider) {
  const requirements = accountRequirementPresentation(provider, "fa").requirements;
  let penalty = 0;
  if (requirements.includes("international_payment_card")) penalty -= 20;
  if (requirements.includes("foreign_mobile_number")) penalty -= 15;
  if (requirements.includes("identity_verification")) penalty -= 12;
  if (requirements.includes("account_activation") || requirements.includes("signup")) penalty -= 8;
  return penalty;
}

function scoreProvider(provider, filters) {
  const capabilities = usecaseCapabilityMap[filters.usecase] ?? usecaseCapabilityMap.chat;
  let score = 0;
  const breakdown = {};

  const hasCapability = capabilities.some((capability) => provider.capabilities.includes(capability));
  const capabilityScore = hasCapability ? 35 : 0;
  score += capabilityScore;
  breakdown.capability = { label: "تطابق قابلیت", value: capabilityScore, max: 35 };

  let budgetScore = 0;
  if (filters.budget === "no-card") {
    if (provider.free_tier.requires_payment_method === false) budgetScore = 20;
    else if (provider.free_tier.requires_payment_method === null) budgetScore = 10;
  } else if (filters.budget === "free-only") {
    if (provider.free_tier.type === "free_models" || provider.free_tier.type === "permanent_allowance") budgetScore = 15;
    else budgetScore = 5;
  } else {
    budgetScore = 5;
  }
  score += budgetScore;
  breakdown.budget = { label: "بودجه", value: budgetScore, max: 20 };

  let latencyScore = 0;
  const rpm = maxRpm(provider);
  if (filters.latency === "critical") latencyScore = Math.min(15, Math.round(rpm / 40));
  else if (filters.latency === "important") latencyScore = Math.min(10, Math.round(rpm / 60));
  else latencyScore = rpm > 0 ? 3 : 0;
  score += latencyScore;
  breakdown.latency = { label: "ظرفیت درخواست", value: latencyScore, max: 15, rpm };

  let regionScore = 0;
  const status = provider.iran_access.status;
  if (filters.region === "iran") {
    if (status === "verified_working") regionScore = 30;
    else if (status === "verified_working_vpn" || status === "direct_blocked_vpn_working") regionScore = 10;
    else if (status === "intermittent") regionScore = 8;
    else if (iranNetworkPenalties.includes(status)) regionScore = -30;
  } else if (filters.region === "iran-vpn") {
    if (status === "verified_working" || status === "verified_working_vpn" || status === "direct_blocked_vpn_working") regionScore = 15;
    else if (status === "intermittent") regionScore = 10;
    else if (iranNetworkPenalties.includes(status)) regionScore = -15;
    else regionScore = 5;
  } else {
    if (status !== "unknown" && !iranNetworkPenalties.includes(status)) regionScore = 5;
    else if (iranNetworkPenalties.includes(status)) regionScore = -5;
  }
  score += regionScore;
  breakdown.region = { label: "روش اتصال", value: regionScore, max: 30 };

  const accountScore = filters.budget === "no-card" ? accountFriction(provider) : 0;
  score += accountScore;
  breakdown.account = { label: "پیش‌نیاز حساب", value: accountScore, max: 0 };

  let penaltyScore = 0;
  if (provider.service_type === "community_gateway") penaltyScore = -15;
  else if (provider.service_type === "session_bridge") penaltyScore = -25;
  if (status === "unknown") penaltyScore -= 5;
  score += penaltyScore;
  breakdown.penalty = { label: "ریسک سرویس", value: penaltyScore, max: 0 };

  return { score, breakdown };
}

function safeExternalUrl(href) {
  try {
    const url = new URL(href, location.origin);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function createBreakdownItem(itemData) {
  const item = document.createElement("div");
  item.className = "finder-breakdown-item";
  const label = document.createElement("span");
  label.className = "label";
  label.textContent = itemData.label;
  item.appendChild(label);
  const value = document.createElement("span");
  const className = itemData.value > 0 ? "positive" : itemData.value < 0 ? "negative" : "";
  value.className = className ? `value ${className}` : "value";
  value.textContent = `${itemData.value > 0 ? "+" : ""}${itemData.value}`;
  item.appendChild(value);
  return item;
}

function createCardElement(provider, score, breakdown, index) {
  const card = document.createElement("div");
  card.className = "finder-card";
  card.dataset.providerId = provider.id;

  const header = document.createElement("div");
  header.className = "finder-card-header";
  const rank = document.createElement("div");
  rank.className = "finder-rank";
  rank.textContent = String(index + 1);
  header.appendChild(rank);

  const title = document.createElement("div");
  title.className = "finder-card-title";
  const name = document.createElement("h3");
  name.textContent = provider.name;
  title.appendChild(name);
  const id = document.createElement("span");
  id.className = "finder-id";
  id.textContent = `${provider.id} · ${serviceTypeLabel(provider.service_type, "fa")}`;
  title.appendChild(id);
  header.appendChild(title);

  const totalScore = document.createElement("div");
  totalScore.className = "finder-total-score";
  const scoreValue = document.createElement("strong");
  scoreValue.textContent = String(score);
  totalScore.appendChild(scoreValue);
  const scoreLabel = document.createElement("small");
  scoreLabel.textContent = "از ۱۰۰";
  totalScore.appendChild(scoreLabel);
  header.appendChild(totalScore);
  card.appendChild(header);

  const breakdownDiv = document.createElement("div");
  breakdownDiv.className = "finder-breakdown";
  for (const itemData of Object.values(breakdown)) breakdownDiv.appendChild(createBreakdownItem(itemData));
  card.appendChild(breakdownDiv);

  const extra = document.createElement("div");
  extra.className = "finder-card-extra";
  const connection = connectionPresentation(provider, "fa");
  const accessBadge = document.createElement("span");
  accessBadge.className = "access-badge";
  accessBadge.dataset.status = connection.status;
  accessBadge.dataset.tone = connection.tone;
  accessBadge.textContent = connection.label;
  extra.appendChild(accessBadge);

  const account = document.createElement("span");
  const accountPresentation = accountRequirementPresentation(provider, "fa");
  account.className = "account-requirement-label";
  account.dataset.tone = accountPresentation.tone;
  account.textContent = accountPresentation.label;
  extra.appendChild(account);

  const limit = document.createElement("span");
  limit.className = "limit-label";
  limit.textContent = limitText(provider);
  extra.appendChild(limit);

  if (isStale(provider)) {
    const stale = document.createElement("span");
    stale.className = "freshness-badge stale finder-stale-badge";
    stale.textContent = "نیازمند بررسی";
    extra.appendChild(stale);
  }
  card.appendChild(extra);

  const actions = document.createElement("div");
  actions.className = "finder-card-actions";
  const detailLink = document.createElement("a");
  detailLink.className = "finder-detail-link";
  detailLink.href = `../providers/${provider.id}/`;
  detailLink.textContent = "جزئیات و شواهد";
  actions.appendChild(detailLink);

  const docsUrl = safeExternalUrl(provider.docs);
  if (docsUrl) {
    const docsLink = document.createElement("a");
    docsLink.className = "finder-docs-link";
    docsLink.href = docsUrl;
    docsLink.target = "_blank";
    docsLink.rel = "noopener noreferrer";
    docsLink.textContent = "مستندات";
    actions.appendChild(docsLink);
  }
  if (provider.iran_access.evidence?.length) {
    const evidenceLink = document.createElement("a");
    evidenceLink.className = "finder-evidence-link";
    evidenceLink.href = `../providers/${provider.id}/#evidence`;
    evidenceLink.textContent = `${provider.iran_access.evidence.length} شاهد`;
    actions.appendChild(evidenceLink);
  }
  card.appendChild(actions);
  return card;
}

function renderResults(results, filters) {
  if (results.length === 0) {
    elements.results.replaceChildren();
    elements.status.hidden = true;
    elements.empty.hidden = false;
    return;
  }
  elements.empty.hidden = true;
  elements.status.hidden = false;
  elements.statusText.textContent = `${results.length} مورد از ${providers.length} ارائه‌دهنده — ${filters.usecase === "chat" ? "چت" : filters.usecase === "coding" ? "کدنویسی" : filters.usecase === "reasoning" ? "استدلال" : "Embedding"} · ${filters.budget === "no-card" ? "بدون کارت" : filters.budget === "free-only" ? "فقط رایگان" : "هر نوع"} · ${filters.region === "iran" ? "اتصال مستقیم" : filters.region === "iran-vpn" ? "متصل با فیلترشکن" : "هر منطقه"}`;
  elements.results.replaceChildren(...results.map(({ provider, score, breakdown }, index) => createCardElement(provider, score, breakdown, index)));
}

function limitText(provider) {
  const first = provider.free_tier.limits[0];
  if (!first) return "وابسته به مدل/حساب";
  const values = [];
  if (first.rpm != null) values.push(`${first.rpm.toLocaleString("en-US")} RPM`);
  if (first.rph != null) values.push(`${first.rph.toLocaleString("en-US")} RPH`);
  if (first.rpd != null) values.push(`${first.rpd.toLocaleString("en-US")} RPD`);
  if (first.tpm != null) values.push(`${first.tpm.toLocaleString("en-US")} TPM`);
  if (first.daily_units != null) values.push(`${first.daily_units.toLocaleString("en-US")} ${first.unit_name ?? "unit"}/day`);
  if (first.monthly_credit_usd != null) values.push(`$${first.monthly_credit_usd}/month`);
  if (first.monthly_requests != null) values.push(`${first.monthly_requests.toLocaleString("en-US")} request/month`);
  return values.slice(0, 2).join(" · ") || "مدل‌محور";
}

function getFilters() {
  return {
    usecase: elements.usecase.value,
    budget: elements.budget.value,
    latency: elements.latency.value,
    region: elements.region.value
  };
}

function runFinder() {
  const filters = getFilters();
  const scored = providers.map((provider) => ({ provider, ...scoreProvider(provider, filters) }));
  scored.sort((a, b) => b.score - a.score || a.provider.name.localeCompare(b.provider.name, "en"));
  renderResults(scored.slice(0, 5), filters);
}

function setupTheme() {
  const stored = localStorage.getItem("theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const current = stored || preferred;
  document.documentElement.dataset.theme = current;
  const toggle = elements.themeToggle;
  const isDark = current === "dark";
  toggle.setAttribute("aria-pressed", String(isDark));
  toggle.setAttribute("aria-label", isDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک");
  toggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    const nextIsDark = next === "dark";
    toggle.setAttribute("aria-pressed", String(nextIsDark));
    toggle.setAttribute("aria-label", nextIsDark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک");
  });
}

function loadUrlFilters() {
  const params = new URLSearchParams(location.search);
  if (params.has("usecase")) elements.usecase.value = params.get("usecase");
  if (params.has("budget")) elements.budget.value = params.get("budget");
  if (params.has("latency")) elements.latency.value = params.get("latency");
  if (params.has("region")) elements.region.value = params.get("region");
}

function updateUrl(filters) {
  const params = new URLSearchParams();
  if (filters.usecase !== "chat") params.set("usecase", filters.usecase);
  if (filters.budget !== "no-card") params.set("budget", filters.budget);
  if (filters.latency !== "low") params.set("latency", filters.latency);
  if (filters.region !== "iran") params.set("region", filters.region);
  history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
}

function onFind(event) {
  event.preventDefault();
  const filters = getFilters();
  updateUrl(filters);
  runFinder();
  if (typeof window.plausible === "function") {
    window.plausible("api_finder_search", { props: filters });
  }
}

async function init() {
  setupTheme();
  loadUrlFilters();
  elements.retry.addEventListener("click", () => location.reload());
  elements.form.addEventListener("submit", onFind);
  elements.reset.addEventListener("click", () => {
    elements.usecase.value = "chat";
    elements.budget.value = "no-card";
    elements.latency.value = "low";
    elements.region.value = "iran";
    history.replaceState(null, "", location.pathname);
    elements.results.replaceChildren();
    elements.status.hidden = true;
    elements.empty.hidden = true;
  });

  try {
    elements.loading.hidden = false;
    elements.error.hidden = true;
    const response = await fetch("../catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    providers = catalog.providers;
    elements.loading.hidden = true;
    if (location.search.includes("usecase=") || location.search.includes("budget=") || location.search.includes("region=")) runFinder();
  } catch (error) {
    console.error(error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
  }
}

init();
