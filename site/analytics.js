const plausible = window.plausible = window.plausible || function (...args) {
  (window.plausible.q = window.plausible.q || []).push(args);
};

function pathValue(href, segment) {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.href);
    const match = url.pathname.match(new RegExp(`/${segment}/([a-z0-9-]+)/?`));
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function currentPathValue(segment) {
  return pathValue(window.location.href, segment);
}

function providerIdFromCard(target) {
  const card = target.closest("[data-provider-id], .provider-card");
  if (!card) return null;
  if (card.dataset.providerId) return card.dataset.providerId;
  const label = card.querySelector(".provider-id")?.textContent ?? "";
  return label.split("·")[0]?.trim() || null;
}

function sendEvent(name, props = {}) {
  const safeProps = Object.fromEntries(
    Object.entries(props)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value.slice(0, 120)])
  );
  plausible(name, { props: safeProps });
}

function safeCampaignValue(value) {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value)
    ? value
    : null;
}

function trackPersianCampaignLanding() {
  const url = new URL(window.location.href);
  const campaign = safeCampaignValue(url.searchParams.get("utm_campaign"));
  if (!new Set(["persian_growth", "offsite_articles"]).has(campaign)) return;

  sendEvent("persian_campaign_landing", {
    campaign,
    guide_slug: currentPathValue("guides") ?? "home",
    source: safeCampaignValue(url.searchParams.get("utm_source")) ?? "unknown",
    medium: safeCampaignValue(url.searchParams.get("utm_medium")) ?? "unknown",
    content: safeCampaignValue(url.searchParams.get("utm_content")) ?? "unknown"
  });
}

function isPersianHomepage() {
  return ["/", "/index.html"].includes(window.location.pathname);
}

function trackHomepageJourney(target, href) {
  if (!isPersianHomepage()) return false;

  if (target.matches(".advanced-filter-panel > summary")) {
    sendEvent("catalog_advanced_open", { source: "homepage" });
    return true;
  }

  if (target.closest(".beginner-path")) {
    sendEvent("ux_path_click", { path: "beginner_explainer" });
    return true;
  }

  if (target.closest(".developer-path")) {
    sendEvent("ux_path_click", { path: "developer_finder" });
    return true;
  }

  if (target.closest(".clarity-hero") && href.includes("/api-finder/")) {
    sendEvent("ux_path_click", { path: "hero_finder_primary" });
    return true;
  }

  if (target.closest(".clarity-hero") && href.includes("#catalog")) {
    sendEvent("ux_path_click", { path: "hero_catalog_secondary" });
    return true;
  }

  if (target.closest(".plain-explainer") && href.includes("/api-finder/")) {
    sendEvent("ux_path_click", { path: "explainer_finder" });
    return true;
  }

  return false;
}

async function copyFromButton(button) {
  const explicitValue = button.dataset.copyText;
  if (!explicitValue) return;
  try {
    await navigator.clipboard.writeText(explicitValue);
    const statusEl = button.querySelector(".copy-status");
    const textEl = button.querySelector(".copy-text");
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
    const textEl = button.querySelector(".copy-text");
    if (textEl) textEl.textContent = "ناموفق";
  }
}

trackPersianCampaignLanding();

document.addEventListener("click", (event) => {
  const target = event.target.closest("a, button, summary");
  if (!target) return;

  const href = target instanceof HTMLAnchorElement ? target.href : "";
  if (trackHomepageJourney(target, href)) return;

  const providerId = providerIdFromCard(target) || pathValue(href, "providers") || currentPathValue("providers");
  const currentGuideSlug = currentPathValue("guides");
  const linkedGuideSlug = pathValue(href, "guides");
  const guideSlug = linkedGuideSlug || currentGuideSlug;

  if (target.classList.contains("copy-button")) {
    void copyFromButton(target);
    sendEvent("copy_base_url", { provider_id: providerId ?? "catalog" });
    return;
  }
  if (target.classList.contains("docs-link")) {
    sendEvent("provider_docs_click", { provider_id: providerId ?? "unknown" });
    return;
  }
  if (target.classList.contains("website-link")) {
    sendEvent("provider_website_click", { provider_id: providerId ?? "unknown" });
    return;
  }
  if (target.classList.contains("detail-link")) {
    sendEvent("provider_detail_click", { provider_id: providerId ?? "unknown" });
    return;
  }
  if (href.includes("issues/new?template=iran-access-report.yml")) {
    sendEvent("iran_access_report_click", { guide_slug: currentGuideSlug ?? "unknown" });
    return;
  }
  if (currentGuideSlug && href) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.hash === "#catalog") {
        sendEvent("guide_catalog_click", { guide_slug: currentGuideSlug });
        return;
      }
    } catch {
      // Ignore malformed non-navigation values.
    }
  }
  if (href.includes("github.com")) {
    sendEvent("github_click", {
      page_type: guideSlug ? "guide" : providerId ? "provider" : "home",
      guide_slug: guideSlug ?? ""
    });
    return;
  }
  if (href.endsWith("/catalog.json") || href.includes("/catalog.json?")) {
    sendEvent("catalog_download", { page_type: guideSlug ? "guide" : providerId ? "provider" : "home" });
    return;
  }
  const linkedProviderId = pathValue(href, "providers");
  if (linkedProviderId) {
    sendEvent("provider_page_click", { provider_id: linkedProviderId });
    return;
  }
  if (linkedGuideSlug) sendEvent("guide_page_click", { guide_slug: linkedGuideSlug });
});
