const runWhenReady = (callback) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else callback();
};

runWhenReady(() => {
  const search = document.getElementById("tool-search");
  const type = document.getElementById("tool-type");
  const deployment = document.getElementById("tool-deployment");
  const risk = document.getElementById("tool-risk");
  const reset = document.getElementById("tool-reset");
  const count = document.getElementById("tool-result-count");
  const empty = document.getElementById("tool-empty");
  const cards = [...document.querySelectorAll(".tool-card")];
  if (!search || !type || !deployment || !risk || !reset || !count || !empty || !cards.length) return;

  const riskRank = { low: 0, medium: 1, high: 2, critical: 3 };
  let interactionStarted = false;

  function plausible(name, props = {}) {
    if (typeof window.plausible !== "function") return;
    const safeProps = Object.fromEntries(
      Object.entries(props).filter(([, value]) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value))
    );
    window.plausible(name, { props: safeProps });
  }

  function markInteraction(source) {
    if (interactionStarted) return;
    interactionStarted = true;
    plausible("tools_catalog_started", { source });
  }

  function applyFilters(source = "controls") {
    const query = search.value.trim().toLocaleLowerCase("fa");
    const maxRisk = risk.value === "all" ? Number.POSITIVE_INFINITY : riskRank[risk.value];
    let visible = 0;

    for (const card of cards) {
      const matchesSearch = !query || card.dataset.toolName?.includes(query) || card.dataset.toolId?.includes(query);
      const matchesType = type.value === "all" || card.dataset.toolType === type.value;
      const matchesDeployment = deployment.value === "all" || card.dataset.deployment === deployment.value;
      const cardRisk = riskRank[card.dataset.risk] ?? 99;
      const matchesRisk = cardRisk <= maxRisk;
      const show = matchesSearch && matchesType && matchesDeployment && matchesRisk;
      card.hidden = !show;
      if (show) visible += 1;
    }

    count.textContent = String(visible);
    empty.hidden = visible !== 0;
    plausible("tools_filter_changed", {
      source,
      tool_type: type.value,
      deployment: deployment.value,
      risk: risk.value,
      result_count: String(visible)
    });
  }

  search.addEventListener("input", () => {
    markInteraction("search");
    applyFilters("search");
  });
  for (const select of [type, deployment, risk]) {
    select.addEventListener("change", () => {
      markInteraction("select");
      applyFilters("select");
    });
  }
  reset.addEventListener("click", () => {
    search.value = "";
    type.value = "all";
    deployment.value = "all";
    risk.value = "all";
    applyFilters("reset");
    search.focus();
  });

  document.addEventListener("click", async (event) => {
    const copy = event.target.closest(".tool-copy");
    if (copy) {
      const value = copy.dataset.copyText;
      if (!value) return;
      const status = copy.querySelector(".copy-status");
      try {
        await navigator.clipboard.writeText(value);
        if (status) status.textContent = "کپی شد";
        plausible("tool_install_copy", { tool_id: copy.closest(".tool-card")?.dataset.toolId ?? "unknown" });
      } catch {
        if (status) status.textContent = "ناموفق";
      }
      setTimeout(() => { if (status) status.textContent = ""; }, 1600);
      return;
    }

    const repository = event.target.closest(".tool-repository-link");
    if (repository) plausible("tool_repository_click", { tool_id: repository.dataset.toolId ?? "unknown" });
  });
});
