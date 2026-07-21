const accessLabels = {
  verified_working: "مستقیم تست‌شده",
  verified_working_vpn: "با VPN تست‌شده",
  direct_blocked_vpn_working: "مستقیم مسدود / VPN موفق",
  verified_blocked: "مستقیم مسدود",
  officially_unsupported: "پشتیبانی‌نشده رسمی",
  intermittent: "ناپایدار",
  signup_blocked: "ثبت‌نام مسدود",
  account_activation_blocked: "فعال‌سازی حساب مسدود",
  unknown: "نامشخص"
};

const accessEmoji = {
  verified_working: "✅",
  verified_working_vpn: "🛡️",
  direct_blocked_vpn_working: "🛡️",
  verified_blocked: "⛔",
  officially_unsupported: "🚫",
  intermittent: "⚠️",
  signup_blocked: "🧾",
  account_activation_blocked: "🔒",
  unknown: "❔"
};

const accessAriaLabel = {
  verified_working: "وضعیت دسترسی ایران: مستقیم تست‌شده",
  verified_working_vpn: "وضعیت دسترسی ایران: با VPN تست‌شده",
  direct_blocked_vpn_working: "وضعیت دسترسی ایران: مستقیم مسدود، VPN موفق",
  verified_blocked: "وضعیت دسترسی ایران: مستقیم مسدود",
  officially_unsupported: "وضعیت دسترسی ایران: پشتیبانی‌نشده رسمی",
  intermittent: "وضعیت دسترسی ایران: ناپایدار",
  signup_blocked: "وضعیت دسترسی ایران: ثبت‌نام مسدود",
  account_activation_blocked: "فعال‌سازی حساب مسدود",
  unknown: "وضعیت دسترسی ایران: نامشخص"
};

const freeLabels = {
  permanent_allowance: "سهمیه دائمی",
  free_models: "مدل‌های رایگان",
  monthly_credit: "اعتبار ماهانه",
  trial: "آزمایشی",
  unknown: "نامشخص"
};

const serviceLabels = {
  official_provider: "Provider رسمی",
  official_gateway: "Gateway رسمی",
  community_gateway: "Gateway اجتماعی",
  session_bridge: "Session bridge",
  self_hosted: "Self-hosted"
};

const capabilityLabels = {
  chat: "چت",
  text_generation: "تولید متن",
  reasoning: "Reasoning",
  embeddings: "Embedding",
  tool_calling: "Tool calling",
  structured_output: "Structured output"
};

const elements = Object.fromEntries([
  "provider-grid", "provider-template", "loading", "error", "empty", "result-count",
  "catalog-updated", "search", "free-type", "access-status", "capability", "openai-only",
  "sort", "filters", "reset-filters", "theme-toggle", "stat-total", "stat-free", "stat-openai", "stat-fresh",
  "advisor-usecase", "advisor-priority", "advisor-results"
].map((id) => [id, document.getElementById(id)]));

let providers = [];

function normalize(value) {
  return String(value ?? "").toLocaleLowerCase("fa").replaceAll("ي", "ی").replaceAll("ك", "ک").replace(/\s+/g, " ").trim();
}

function isStale(provider) {
  const checked = new Date(`${provider.verification.last_checked}T00:00:00Z`);
  return (Date.now() - checked.getTime()) / 86_400_000 > provider.verification.stale_after_days;
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

function searchText(provider) {
  return normalize([
    provider.name, provider.id, provider.service_type, serviceLabels[provider.service_type], provider.notes_fa, provider.free_tier.notes_fa,
    ...provider.capabilities, ...(provider.models?.notable ?? [])
  ].join(" "));
}

function sendAnalytics(name, props = {}) {
  if (typeof window.plausible === "function") {
    window.plausible(name, { props });
  }
}

function currentFilters() {
  return {
    query: normalize(elements.search.value),
    freeType: elements["free-type"].value,
    access: elements["access-status"].value,
    capability: elements.capability.value,
    openai: elements["openai-only"].checked,
    sort: elements.sort.value
  };
}

function updateUrl(filters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.freeType) params.set("free", filters.freeType);
  if (filters.access) params.set("access", filters.access);
  if (filters.capability) params.set("capability", filters.capability);
  if (filters.openai) params.set("openai", "1");
  if (filters.sort !== "name") params.set("sort", filters.sort);
  history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}${location.hash}`);
}

function filteredProviders() {
  const filters = currentFilters();
  updateUrl(filters);
  const result = providers.filter((provider) => {
    if (filters.query && !searchText(provider).includes(filters.query)) return false;
    if (filters.freeType && provider.free_tier.type !== filters.freeType) return false;
    if (filters.access && provider.iran_access.status !== filters.access) return false;
    if (filters.capability && !provider.capabilities.includes(filters.capability)) return false;
    if (filters.openai && !provider.api.openai_compatible) return false;
    return true;
  });

  const freeOrder = { permanent_allowance: 0, free_models: 1, monthly_credit: 2, trial: 3, unknown: 4 };
  result.sort((a, b) => {
    if (filters.sort === "freshness") return b.verification.last_checked.localeCompare(a.verification.last_checked) || a.name.localeCompare(b.name, "en");
    if (filters.sort === "free") return (freeOrder[a.free_tier.type] ?? 9) - (freeOrder[b.free_tier.type] ?? 9) || a.name.localeCompare(b.name, "en");
    return a.name.localeCompare(b.name, "en");
  });
  return result;
}

function setText(root, selector, value) {
  root.querySelector(selector).textContent = value;
}

function createCard(provider) {
  const card = elements["provider-template"].content.firstElementChild.cloneNode(true);
  const stale = isStale(provider);
  const accessBadge = card.querySelector(".access-badge");
  const accessStatus = provider.iran_access.status;
  accessBadge.textContent = `${accessEmoji[accessStatus] ?? ""} ${accessLabels[accessStatus] ?? accessStatus}`;
  accessBadge.setAttribute("aria-label", accessAriaLabel[accessStatus] ?? accessStatus);
  const freshness = card.querySelector(".freshness-badge");
  freshness.textContent = stale ? "نیازمند بررسی" : "دادهٔ تازه";
  freshness.classList.toggle("stale", stale);
  setText(card, ".provider-avatar", provider.name.slice(0, 2).toUpperCase());
  setText(card, "h3", provider.name);
  setText(card, ".provider-id", `${provider.id} · ${serviceLabels[provider.service_type] ?? provider.service_type}`);
  setText(card, ".provider-note", provider.notes_fa || provider.free_tier.notes_fa);
  setText(card, ".free-label", freeLabels[provider.free_tier.type] ?? provider.free_tier.type);
  setText(card, ".limit-label", limitText(provider));
  setText(card, ".openai-label", provider.api.openai_compatible ? "بله" : "خیر");
  setText(card, ".checked-label", provider.verification.last_checked);
  setText(card, ".free-note", provider.free_tier.notes_fa);
  setText(card, ".models-note", provider.models?.notable?.length ? `مدل‌های شاخص: ${provider.models.notable.join("، ")}` : "فهرست مدل‌ها پویا است؛ منبع رسمی را بررسی کنید.");
  setText(card, ".api-base", provider.api.base_url);

  const tags = card.querySelector(".tag-list");
  provider.capabilities.slice(0, 4).forEach((capability) => {
    const tag = document.createElement("span");
    tag.textContent = capabilityLabels[capability] ?? capability;
    tags.append(tag);
  });

  const detailLink = card.querySelector(".detail-link");
  detailLink.href = `./providers/${provider.id}/`;
  detailLink.addEventListener("click", () => {
    sendAnalytics("provider_detail_click", { provider_id: provider.id });
  });

  const docs = card.querySelector(".docs-link");
  docs.href = provider.docs;
  const website = card.querySelector(".website-link");
  if (website) website.href = provider.website;
  card.querySelector(".copy-button").addEventListener("click", async (event) => {
    try {
      await navigator.clipboard.writeText(provider.api.base_url);
      const statusEl = event.currentTarget.querySelector(".copy-status");
      const textEl = event.currentTarget.querySelector(".copy-text");
      if (statusEl) {
        statusEl.textContent = "کپی شد";
        statusEl.hidden = false;
      }
      if (textEl) textEl.textContent = "کپی شد";
      setTimeout(() => {
        if (statusEl) { statusEl.textContent = ""; statusEl.hidden = true; }
        if (textEl) textEl.textContent = "کپی";
      }, 1400);
    } catch {
      const textEl = event.currentTarget.querySelector(".copy-text");
      if (textEl) textEl.textContent = "ناموفق";
    }
  });
  return card;
}

function usecaseCapabilities(usecase) {
  const map = {
    chat: ["chat", "text_generation"],
    coding: ["tool_calling", "structured_output"],
    reasoning: ["reasoning"],
    embeddings: ["embeddings"]
  };
  return map[usecase] ?? map.chat;
}

const iranScorePenalties = ["officially_unsupported", "verified_blocked", "signup_blocked", "account_activation_blocked"];

function recommendationScore(provider, usecase, priority) {
  const capabilities = usecaseCapabilities(usecase);
  let score = 0;
  if (capabilities.some((capability) => provider.capabilities.includes(capability))) score += 35;
  if (provider.api.openai_compatible) score += priority === "openai-compatible" ? 28 : 10;
  if (provider.free_tier.type === "permanent_allowance") score += 18;
  if (provider.free_tier.type === "free_models") score += 14;
  if (provider.free_tier.requires_payment_method === false) score += priority === "low-friction" ? 20 : 8;
  if (!isStale(provider)) score += priority === "fresh" ? 20 : 8;
  if (priority === "iran-aware") {
    if (provider.iran_access.status === "verified_working") score += 30;
    else if (provider.iran_access.status === "verified_working_vpn") score += 12;
    else if (iranScorePenalties.includes(provider.iran_access.status)) score -= 30;
  } else {
    if (provider.iran_access.status !== "unknown") score += 5;
    if (iranScorePenalties.includes(provider.iran_access.status)) score -= 12;
  }
  if (provider.service_type === "community_gateway") score -= 20;
  if (provider.service_type === "session_bridge") score -= 30;
  return score;
}

function renderAdvisor() {
  const usecase = elements["advisor-usecase"].value;
  const priority = elements["advisor-priority"].value;
  const recommendations = providers
    .map((provider) => ({ provider, score: recommendationScore(provider, usecase, priority) }))
    .sort((a, b) => b.score - a.score || a.provider.name.localeCompare(b.provider.name, "en"))
    .slice(0, 3);

  elements["advisor-results"].replaceChildren(...recommendations.map(({ provider, score }) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `./providers/${provider.id}/`;
    link.className = "advisor-link";
    link.addEventListener("click", () => {
      sendAnalytics("advisor_provider_click", { provider_id: provider.id, usecase, priority });
    });
    const title = document.createElement("strong");
    title.textContent = provider.name;
    const meta = document.createElement("span");
    meta.textContent = `${freeLabels[provider.free_tier.type] ?? provider.free_tier.type} · ${serviceLabels[provider.service_type] ?? provider.service_type} · امتیاز ${score.toLocaleString("fa-IR")}`;
    const reason = document.createElement("small");
    reason.textContent = `${limitText(provider)} · ${accessLabels[provider.iran_access.status] ?? provider.iran_access.status}${provider.service_type === "community_gateway" ? " ⚠️ سرویس غیررسمی" : ""}`;
    link.append(title, meta, reason);
    item.append(link);
    return item;
  }));
}

function render() {
  const result = filteredProviders();
  elements["provider-grid"].replaceChildren(...result.map(createCard));
  elements["result-count"].textContent = `${result.length.toLocaleString("fa-IR")} مورد از ${providers.length.toLocaleString("fa-IR")}`;
  elements.empty.hidden = result.length !== 0;
  renderAdvisor();
}

function setStats() {
  elements["stat-total"].textContent = providers.length.toLocaleString("fa-IR");
  elements["stat-free"].textContent = providers.filter((provider) => provider.free_tier.status !== "none").length.toLocaleString("fa-IR");
  elements["stat-openai"].textContent = providers.filter((provider) => provider.api.openai_compatible).length.toLocaleString("fa-IR");
  elements["stat-fresh"].textContent = providers.filter((provider) => !isStale(provider)).length.toLocaleString("fa-IR");
}

function loadUrlFilters() {
  const params = new URLSearchParams(location.search);
  elements.search.value = params.get("q") ?? "";
  elements["free-type"].value = params.get("free") ?? "";
  elements["access-status"].value = params.get("access") ?? "";
  elements.capability.value = params.get("capability") ?? "";
  elements["openai-only"].checked = params.get("openai") === "1";
  elements.sort.value = params.get("sort") ?? "name";
}

function setupTheme() {
  const stored = localStorage.getItem("theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const current = stored || preferred;
  document.documentElement.dataset.theme = current;
  const toggle = elements["theme-toggle"];
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

function trackFilterChanges() {
  const form = elements.filters;
  let timeout;
  form.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const filters = currentFilters();
      const hasActive = filters.query || filters.freeType || filters.access || filters.capability || filters.openai || filters.sort !== "name";
      sendAnalytics(hasActive ? "filter_apply" : "filter_reset", {
        free_type: filters.freeType || "all",
        access_status: filters.access || "all",
        capability: filters.capability || "all"
      });
    }, 800);
  });
  elements["reset-filters"].addEventListener("click", () => {
    sendAnalytics("filter_reset", {});
  });
}

async function init() {
  setupTheme();
  loadUrlFilters();
  elements.filters.addEventListener("input", render);
  elements.sort.addEventListener("change", render);
  elements["advisor-usecase"].addEventListener("change", renderAdvisor);
  elements["advisor-priority"].addEventListener("change", renderAdvisor);
  elements.filters.addEventListener("reset", () => setTimeout(() => { elements.sort.value = "name"; render(); }, 0));
  trackFilterChanges();

  try {
    const response = await fetch("./catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    providers = catalog.providers;
    elements["catalog-updated"].textContent = `آخرین به‌روزرسانی داده: ${catalog.last_updated}`;
    setStats();
    render();
    elements.loading.hidden = true;
  } catch (error) {
    console.error(error);
    elements.loading.hidden = true;
    elements.error.hidden = false;
    elements["result-count"].textContent = "داده در دسترس نیست";
  }
}

init();
