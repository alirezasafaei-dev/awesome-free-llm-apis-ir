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

function sendEvent(name, props = {}) {
  const safeProps = Object.fromEntries(
    Object.entries(props)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => [key, value.slice(0, 120)])
  );
  plausible(name, { props: safeProps });
}

async function copyFromButton(button) {
  const explicitValue = button.dataset.copyText;
  if (!explicitValue) return;
  try {
    await navigator.clipboard.writeText(explicitValue);
    const original = button.textContent;
    button.textContent = "کپی شد";
    setTimeout(() => { button.textContent = original; }, 1400);
  } catch {
    button.textContent = "ناموفق";
  }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("a, button");
  if (!target) return;

  const href = target instanceof HTMLAnchorElement ? target.href : "";
  const cardProviderId = target.closest("[data-provider-id]")?.dataset.providerId ?? null;
  const providerId = cardProviderId || pathValue(href, "providers") || currentPathValue("providers");
  const guideSlug = pathValue(href, "guides") || currentPathValue("guides");

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
  if (href.includes("github.com")) {
    sendEvent("github_click", { page_type: guideSlug ? "guide" : providerId ? "provider" : "home" });
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
  const linkedGuideSlug = pathValue(href, "guides");
  if (linkedGuideSlug) {
    sendEvent("guide_page_click", { guide_slug: linkedGuideSlug });
  }
});
