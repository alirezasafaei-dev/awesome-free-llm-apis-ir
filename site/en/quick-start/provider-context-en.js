const runProviderContextWhenReady = (callback) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else callback();
};

runProviderContextWhenReady(async () => {
  if (document.body.dataset.pageType !== "quick-start") return;

  const providerPattern = /^[a-z0-9-]{1,64}$/;
  const modelPattern = /^[A-Za-z0-9._:/-]{1,160}$/;
  const allowedUsecases = new Set(["chat", "coding", "reasoning", "embeddings"]);
  const allowedRegions = new Set(["iran", "iran-vpn", "any"]);
  const params = new URLSearchParams(location.search);
  const providerId = providerPattern.test(params.get("provider") ?? "") ? params.get("provider") : null;
  const usecase = allowedUsecases.has(params.get("usecase")) ? params.get("usecase") : "chat";
  const region = allowedRegions.has(params.get("region")) ? params.get("region") : "any";
  if (!providerId) return;

  const plausible = (name, props = {}) => {
    if (typeof window.plausible !== "function") return;
    const safeProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (!["provider_id", "usecase", "region", "source"].includes(key)) continue;
      if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) continue;
      safeProps[key] = value;
    }
    window.plausible(name, { props: safeProps });
  };

  const labels = {
    service: {
      official_provider: "Official provider",
      official_gateway: "Official gateway",
      community_gateway: "Community gateway",
      session_bridge: "Session bridge",
      self_hosted: "Self-hosted"
    },
    freeTier: {
      permanent_allowance: "Permanent allowance",
      free_models: "Free models",
      monthly_credit: "Monthly credit",
      trial: "Trial",
      unknown: "Unknown"
    },
    access: {
      verified_working: "Tested from Iran directly",
      verified_working_vpn: "Tested with VPN",
      direct_blocked_vpn_working: "Direct blocked; VPN working",
      verified_blocked: "Verified blocked",
      officially_unsupported: "Officially unsupported",
      intermittent: "Intermittent",
      signup_blocked: "Signup blocked",
      unknown: "No evidence yet"
    }
  };

  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .provider-context-panel{margin:22px 0;padding:clamp(18px,4vw,28px);border:1px solid color-mix(in srgb,var(--primary) 30%,var(--border));border-radius:22px;background:color-mix(in srgb,var(--primary) 6%,var(--surface));box-shadow:var(--shadow)}
      .provider-context-panel h2{margin:4px 0 8px;font-size:clamp(22px,3vw,32px)}
      .provider-context-panel>p{margin:0;color:var(--muted);line-height:1.9}
      .provider-context-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}
      .provider-context-item{min-width:0;padding:12px;border:1px solid var(--border);border-radius:14px;background:var(--surface)}
      .provider-context-item span{display:block;margin-bottom:5px;color:var(--muted);font-size:11px;font-weight:800}
      .provider-context-item strong,.provider-context-item code{overflow-wrap:anywhere}
      .provider-context-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
      .provider-context-actions a{min-height:44px;padding:10px 15px;border-radius:11px;text-decoration:none;font-weight:800}
      .provider-context-actions .official-docs-link{background:var(--primary);color:#fff}
      .provider-context-actions .evidence-link{border:1px solid var(--border);background:var(--surface);color:var(--text)}
      .provider-model-guidance{margin-top:12px;padding:12px;border-inline-start:4px solid var(--warning);border-radius:10px;background:color-mix(in srgb,var(--warning) 8%,var(--surface));color:var(--muted);font-size:13px;line-height:1.8}
      .provider-context-error{margin:20px 0;padding:16px;border:1px solid var(--warning);border-radius:16px;background:color-mix(in srgb,var(--warning) 8%,var(--surface))}
      @media(max-width:640px){.provider-context-grid{grid-template-columns:1fr}.provider-context-actions{flex-direction:column}.provider-context-actions a{width:100%;text-align:center}}
    `;
    document.head.append(style);
  }

  function textElement(tag, text, className = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function contextItem(label, value, asCode = false) {
    const item = document.createElement("div");
    item.className = "provider-context-item";
    item.append(textElement("span", label));
    item.append(textElement(asCode ? "code" : "strong", value));
    return item;
  }

  function verifiedModel(provider) {
    const models = (provider.free_tier?.limits ?? [])
      .map((limit) => typeof limit.model === "string" ? limit.model.trim() : "")
      .filter((model) => modelPattern.test(model));
    return [...new Set(models)][0] ?? null;
  }

  function paymentLabel(value) {
    if (value === false) return "No payment method required";
    if (value === true) return "Payment method required";
    return "Payment requirement unknown";
  }

  function environmentText(provider, model) {
    const baseUrl = provider.api?.base_url || "VERIFIED_BASE_URL";
    return `export LLM_API_KEY="YOUR_API_KEY"\nexport LLM_BASE_URL="${baseUrl}"\nexport LLM_MODEL="${model || "VERIFIED_MODEL_ID"}"`;
  }

  function updateEnvironmentExample(provider, model) {
    const section = document.getElementById("environment");
    const details = section?.querySelector("details.code-example");
    const code = details?.querySelector("pre code");
    const button = details?.querySelector(".copy-button");
    if (!code || !button) return;
    const value = environmentText(provider, model);
    code.textContent = value;
    button.dataset.copyText = value;
  }

  function renderUnavailable(message) {
    const hero = document.querySelector(".qs-en-hero");
    if (!hero) return;
    const box = textElement("div", message, "provider-context-error");
    box.setAttribute("role", "status");
    hero.after(box);
  }

  addStyles();

  try {
    const response = await fetch("../../catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    const provider = (catalog.providers ?? []).find((item) => item.id === providerId);
    if (!provider) {
      renderUnavailable("The selected provider was not found in the current catalog. Use the API Finder to select a different option; no guessed values were injected into the code samples.");
      return;
    }

    document.body.dataset.providerId = provider.id;
    document.body.dataset.usecase = usecase;
    document.body.dataset.region = region;

    const model = verifiedModel(provider);
    const baseUrl = provider.api?.base_url || "Not recorded in catalog";
    const hero = document.querySelector(".qs-en-hero");
    if (!hero) return;

    const panel = document.createElement("section");
    panel.className = "provider-context-panel";
    panel.id = "selected-provider";
    panel.setAttribute("aria-labelledby", "selected-provider-title");
    panel.append(textElement("p", "Your selection from the API Finder", "eyebrow"));
    const title = textElement("h2", `${provider.name}: preparing your first request`);
    title.id = "selected-provider-title";
    panel.append(title);
    panel.append(textElement(
      "p",
      provider.api?.openai_compatible
        ? "The information below is loaded directly from catalog.json. Your API key stays in your environment variables and is never entered or stored on this page."
        : "This provider is not verified as OpenAI-compatible in the catalog. Adapt the general code samples to match its official API documentation."
    ));

    const grid = document.createElement("div");
    grid.className = "provider-context-grid";
    grid.append(
      contextItem("Service type", labels.service[provider.service_type] ?? provider.service_type ?? "Unknown"),
      contextItem("Free tier type", labels.freeTier[provider.free_tier?.type] ?? provider.free_tier?.type ?? "Unknown"),
      contextItem("Payment", paymentLabel(provider.free_tier?.requires_payment_method)),
      contextItem("Base URL", baseUrl, true),
      contextItem("Iran access", labels.access[provider.iran_access?.status] ?? provider.iran_access?.status ?? "Unknown"),
      contextItem("Last checked", provider.verification?.last_checked ?? "No date recorded"),
      contextItem("Sample model", model ?? "VERIFIED_MODEL_ID", true),
      contextItem("Selected use case", usecase)
    );
    panel.append(grid);

    const modelGuidance = textElement(
      "p",
      model
        ? `The ID ${model} comes from a source-backed limit in the catalog. Verify it is active on your account and in official documentation before running.`
        : "No reliable free model ID is recorded in the catalog. VERIFIED_MODEL_ID is left intentionally so you copy the exact ID from your dashboard or official docs; the system does not guess model values.",
      "provider-model-guidance"
    );
    panel.append(modelGuidance);

    const actions = document.createElement("div");
    actions.className = "provider-context-actions";
    const docs = document.createElement("a");
    docs.className = "official-docs-link";
    docs.href = provider.docs;
    docs.target = "_blank";
    docs.rel = "noopener noreferrer";
    docs.textContent = "Open official docs";
    docs.addEventListener("click", () => plausible("official_docs_click", {
      provider_id: provider.id,
      usecase,
      region,
      source: "quick_start_context"
    }));
    const evidence = document.createElement("a");
    evidence.className = "evidence-link";
    evidence.href = `../../providers/${provider.id}/#evidence`;
    evidence.textContent = "View evidence and limitations";
    actions.append(docs, evidence);
    panel.append(actions);
    hero.after(panel);

    if (provider.api?.openai_compatible) updateEnvironmentExample(provider, model);

    plausible("quick_start_provider_loaded", {
      provider_id: provider.id,
      usecase,
      region,
      source: "finder_handoff"
    });
  } catch (error) {
    console.error(error);
    renderUnavailable("Failed to load provider data. General code samples remain without guessed values. Check catalog.json and official documentation.");
  }
});
