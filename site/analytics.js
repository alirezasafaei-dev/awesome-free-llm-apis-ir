const _paq = window._paq = window._paq || [];
_paq.push(["disableCookies"]);
_paq.push(["trackPageView"]);
_paq.push(["enableLinkTracking"]);
_paq.push(["setTrackerUrl", "https://plausible.alirezasafaei.dev/api/event"]);
_paq.push(["setSiteId", "awesome-free-llm-apis-ir"]);

document.addEventListener("click", (event) => {
  const target = event.target.closest("a, button");
  if (!target) return;
  const href = target.href || "";
  const text = target.textContent?.trim() || "";

  if (href.includes("/providers/")) {
    _paq.push(["trackEvent", "Navigation", "provider_page_view", href]);
  } else if (href.includes("/guides/")) {
    _paq.push(["trackEvent", "Navigation", "guide_page_view", href]);
  } else if (target.classList.contains("copy-button")) {
    _paq.push(["trackEvent", "Interaction", "copy_base_url"]);
  } else if (target.classList.contains("docs-link")) {
    _paq.push(["trackEvent", "Outbound", "provider_docs_click", href]);
  } else if (href.includes("github.com")) {
    _paq.push(["trackEvent", "Outbound", "github_click", href]);
  } else if (target.classList.contains("website-link")) {
    _paq.push(["trackEvent", "Outbound", "provider_website_click", href]);
  }
});

(function () {
  const u = "https://plausible.alirezasafaei.dev/";
  const d = document;
  const g = d.createElement("script");
  const s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = u + "js/script.js";
  s.parentNode.insertBefore(g, s);
})();
