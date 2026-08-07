import {
  accountRequirementPresentation,
  connectionPresentation,
  serviceTypeLabel
} from "../../provider-presentation.js";

const usecaseCapabilityMap = {
  chat: ["chat", "text_generation"],
  coding: ["tool_calling", "structured_output"],
  reasoning: ["reasoning"],
  embeddings: ["embeddings"]
};
const iranNetworkPenalties = ["verified_blocked", "officially_unsupported"];

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
  empty: document.getElementById("finder-empty"),
  disclosure: document.getElementById("finder-disclosure")
};

function isStale(provider) {
  const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
  return (Date.now() - checked.getTime()) / 86_400_000 > provider.verification.stale_after_days;
}

function maxRpm(provider) {
  return Math.max(...provider.free_tier.limits.map((limit) => limit.rpm ?? 0), 0);
}

function accountFriction(provider) {
  const requirements = accountRequirementPresentation(provider, "en").requirements;
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

  const capabilityScore = capabilities.some((capability) => provider.capabilities.includes(capability)) ? 35 : 0;
  score += capabilityScore;
  breakdown.capability = { label: "Capability match", value: capabilityScore, max: 35 };

  let budgetScore = 0;
  if (filters.budget === "no-card") {
    if (provider.free_tier.requires_payment_method === false) budgetScore = 20;
    else if (provider.free_tier.requires_payment_method === null) budgetScore = 10;
  } else if (filters.budget === "free-only") {
    budgetScore = provider.free_tier.type === "free_models" || provider.free_tier.type === "permanent_allowance" ? 15 : 5;
  } else {
    budgetScore = 5;
  }
  score += budgetScore;
  breakdown.budget = { label: "Free tier", value: budgetScore, max: 20 };

  let capacityScore = 0;
  const rpm = maxRpm(provider);
  if (filters.latency === "critical") capacityScore = Math.min(15, Math.round(rpm / 40));
  else if (filters.latency === "important") capacityScore = Math.min(10, Math.round(rpm / 60));
  else capacityScore = rpm > 0 ? 3 : 0;
  score += capacityScore;
  breakdown.latency = { label: "Request capacity", value: capacityScore, max: 15, rpm };

  let regionScore = 0;
  const status = provider.iran_access.status;
  if (filters.region === "iran") {
    if (status === "verified_working") regionScore = 30;
    else if (status === "verified_working_vpn" || status === "direct_blocked_vpn_working") regionScore = 10;
    else if (status === "intermittent") regionScore = 8;
    else if (iranNetworkPenalties.includes(status)) regionScore = -30;
  } else if (filters.region === "iran-vpn") {
    if (["verified_working", "verified_working_vpn", "direct_blocked_vpn_working"].includes(status)) regionScore = 15;
    else if (status === "intermittent") regionScore = 10;
    else if (iranNetworkPenalties.includes(status)) regionScore = -15;
    else regionScore = 5;
  } else {
    if (status !== "unknown" && !iranNetworkPenalties.includes(status)) regionScore = 10;
    else if (iranNetworkPenalties.includes(status)) regionScore = -5;
  }
  score += regionScore;
  breakdown.region = { label: "Connection method", value: regionScore, max: 30 };

  const accountScore = filters.budget === "no-card" ? accountFriction(provider) : 0;
  score += accountScore;
  breakdown.account = { label: "Account requirements", value: accountScore, max: 0 };

  let penaltyScore = 0;
  if (provider.service_type === "community_gateway") penaltyScore = -15;
  else if (provider.service_type === "session_bridge") penaltyScore = -25;
  if (status === "unknown") penaltyScore -= 5;
  score += penaltyScore;
  breakdown.penalty = { label: "Service risk", value: penaltyScore, max: 0 };

  return { score, breakdown };
}

function safeExternalUrl(href) {
  try {
    const url = new URL(href, location.origin);
    return url.protocol === "https:" ? url.toString() : null;
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

function limitText(provider) {
  const first = provider.free_tier.limits[0];
  if (!first) return "Model/account dependent";
  const values = [];
  if (first.rpm != null) values.push(`${first.rpm.toLocaleString("en-US")} RPM`);
  if (first.rph != null) values.push(`${first.rph.toLocaleString("en-US")} RPH`);
  if (first.rpd != null) values.push(`${first.rpd.toLocaleString("en-US")} RPD`);
  if (first.tpm != null) values.push(`${first.tpm.toLocaleString("en-US")} TPM`);
  if (first.daily_units != null) values.push(`${first.daily_units.toLocaleString("en-US")} ${first.unit_name ?? "unit"}/day`);
  if (first.monthly_credit_usd != null) values.push(`$${first.monthly_credit_usd}/month`);
  if (first.monthly_requests != null) values.push(`${first.monthly_requests.toLocaleString("en-US")} req/month`);
  return values.slice(0, 2).join(" · ") || "Model-specific";
}

function createCardElement(provider, score, breakdown, index, usecase, region) {
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
  id.textContent = `${provider.id} · ${serviceTypeLabel(provider.service_type, "en")}`;
  title.appendChild(id);
  header.appendChild(title);

  const totalScore = document.createElement("div");
  totalScore.className = "finder-total-score";
  const scoreValue = document.createElement("strong");
  scoreValue.textContent = String(score);
  totalScore.appendChild(scoreValue);
  const scoreLabel = document.createElement("small");
  scoreLabel.textContent = "/ 100";
  totalScore.appendChild(scoreLabel);
  header.appendChild(totalScore);
  card.appendChild(header);

  const breakdownDiv = document.createElement("div");
  breakdownDiv.className = "finder-breakdown";
  for (const itemData of Object.values(breakdown)) breakdownDiv.appendChild(createBreakdownItem(itemData));
  card.appendChild(breakdownDiv);

  const extra = document.createElement("div");
  extra.className = "finder-card-extra";
  const connection = connectionPresentation(provider, "en");
  const accessBadge = document.createElement("span");
  accessBadge.className = "access-badge";
  accessBadge.dataset.status = connection.status;
  accessBadge.dataset.tone = connection.tone;
  accessBadge.textContent = connection.label;
  extra.appendChild(accessBadge);

  const account = accountRequirementPresentation(provider, "en");
  const accountBadge = document.createElement("span");
  accountBadge.className = "account-requirement-label";
  accountBadge.dataset.tone = account.tone;
  accountBadge.textContent = account.label;
  extra.appendChild(accountBadge);

  const limit = document.createElement("span");
  limit.className = "limit-label";
  limit.textContent = limitText(provider);
  extra.appendChild(limit);

  if (isStale(provider)) {
    const stale = document.createElement("span");
    stale.className = "freshness-badge stale";
    stale.textContent = "Needs review";
    extra.appendChild(stale);
  }
  card.appendChild(extra);

  const actions = document.createElement("div");
  actions.className = "finder-card-actions";
  const quickParams = new URLSearchParams({ provider: provider.id, usecase, region });
  const quickStart = document.createElement("a");
  quickStart.className = "finder-quick-start-link";
  quickStart.href = `../quick-start/?${quickParams.toString()}`;
  quickStart.textContent = "Select & build first request";
  actions.appendChild(quickStart);

  const docsUrl = safeExternalUrl(provider.docs);
  if (docsUrl) {
    const docs = document.createElement("a");
    docs.className = "finder-docs-link";
    docs.href = docsUrl;
    docs.target = "_blank";
    docs.rel = "noopener noreferrer";
    docs.textContent = "Official docs";
    actions.appendChild(docs);
  }
  if (provider.iran_access.evidence?.length) {
    const evidence = document.createElement("a");
    evidence.className = "finder-evidence-link";
    evidence.href = `../../providers/${provider.id}/#evidence`;
    evidence.textContent = `${provider.iran_access.evidence.length} evidence items`;
    actions.appendChild(evidence);
  }
  card.appendChild(actions);
  return card;
}

function renderResults(results, filters) {
  if (!results.length) {
    elements.results.replaceChildren();
    elements.status.hidden = true;
    elements.empty.hidden = false;
    return;
  }
  elements.empty.hidden = true;
  elements.status.hidden = false;
  const usecaseLabel = { chat: "Chat & text", coding: "Coding", reasoning: "Reasoning", embeddings: "Embeddings" };
  const budgetLabel = { "no-card": "No credit card", "free-only": "Free only", any: "Any" };
  const regionLabel = { iran: "Direct from Iran", "iran-vpn": "Works with a VPN", any: "Any region" };
  elements.statusText.textContent = `${results.length} of ${providers.length} providers — ${usecaseLabel[filters.usecase] ?? "Chat"} · ${budgetLabel[filters.budget] ?? "Any"} · ${regionLabel[filters.region] ?? "Any"}`;
  elements.results.replaceChildren(...results.map(({ provider, score, breakdown }, index) => createCardElement(provider, score, breakdown, index, filters.usecase, filters.region)));
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
  if (filters.region !== "any") params.set("region", filters.region);
  history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
}

function onFind(event) {
  event.preventDefault();
  const filters = getFilters();
  updateUrl(filters);
  runFinder();
  if (typeof window.plausible === "function") window.plausible("api_finder_search", { props: filters });
}

async function init() {
  loadUrlFilters();
  elements.form.addEventListener("submit", onFind);
  elements.reset.addEventListener("click", () => {
    elements.usecase.value = "chat";
    elements.budget.value = "no-card";
    elements.latency.value = "low";
    elements.region.value = "any";
    history.replaceState(null, "", location.pathname);
    elements.results.replaceChildren();
    elements.status.hidden = true;
    elements.empty.hidden = true;
  });

  try {
    elements.loading.hidden = false;
    const response = await fetch("../../catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    providers = catalog.providers;
    elements.loading.hidden = true;
    runFinder();
  } catch (error) {
    console.error(error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
  }
}

init();
