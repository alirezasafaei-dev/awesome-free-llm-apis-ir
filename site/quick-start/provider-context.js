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
      official_provider: "Provider رسمی",
      official_gateway: "Gateway رسمی",
      community_gateway: "Gateway اجتماعی",
      session_bridge: "Session bridge",
      self_hosted: "Self-hosted"
    },
    freeTier: {
      permanent_allowance: "سهمیه دائمی",
      free_models: "مدل‌های رایگان",
      monthly_credit: "اعتبار ماهانه",
      trial: "آزمایشی",
      unknown: "نامشخص"
    },
    access: {
      verified_working: "مستقیم از ایران تست شده",
      verified_working_vpn: "با VPN تست شده",
      direct_blocked_vpn_working: "مستقیم مسدود؛ VPN موفق",
      verified_blocked: "مستقیم مسدود",
      officially_unsupported: "به‌طور رسمی پشتیبانی نمی‌شود",
      intermittent: "ناپایدار",
      signup_blocked: "ثبت‌نام مسدود",
      unknown: "هنوز مدرک کافی نداریم"
    }
  };

  function safeHttpsUrl(value) {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : null;
    } catch {
      return null;
    }
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
    if (value === false) return "کارت بانکی لازم نیست";
    if (value === true) return "روش پرداخت لازم است";
    return "نیاز به پرداخت نامشخص است";
  }

  function environmentText(baseUrl, model) {
    return `export LLM_API_KEY="YOUR_API_KEY"\nexport LLM_BASE_URL="${baseUrl || "VERIFIED_BASE_URL"}"\nexport LLM_MODEL="${model || "VERIFIED_MODEL_ID"}"`;
  }

  function updateEnvironmentExample(baseUrl, model) {
    const section = document.getElementById("environment");
    const details = section?.querySelector("details.code-example");
    const code = details?.querySelector("pre code");
    const button = details?.querySelector(".copy-button");
    if (!code || !button) return;
    const value = environmentText(baseUrl, model);
    code.textContent = value;
    button.dataset.copyText = value;
  }

  function renderUnavailable(message) {
    const hero = document.querySelector(".quick-start-hero");
    if (!hero) return;
    const box = textElement("div", message, "provider-context-error");
    box.setAttribute("role", "status");
    hero.after(box);
  }

  try {
    const response = await fetch("../catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    const provider = (catalog.providers ?? []).find((item) => item.id === providerId);
    if (!provider) {
      renderUnavailable("Provider انتخاب‌شده در نسخه فعلی کاتالوگ پیدا نشد. از API Finder دوباره یک گزینه را انتخاب کنید؛ هیچ مقدار حدسی در نمونه‌کد قرار نگرفت.");
      return;
    }

    document.body.dataset.providerId = provider.id;
    document.body.dataset.usecase = usecase;
    document.body.dataset.region = region;

    const model = verifiedModel(provider);
    const apiBaseUrl = safeHttpsUrl(provider.api?.base_url);
    const docsUrl = safeHttpsUrl(provider.docs);
    const baseUrlLabel = apiBaseUrl ?? "در کاتالوگ ثبت نشده یا HTTPS معتبر نیست";
    const hero = document.querySelector(".quick-start-hero");
    if (!hero) return;

    const panel = document.createElement("section");
    panel.className = "provider-context-panel";
    panel.id = "selected-provider";
    panel.setAttribute("aria-labelledby", "selected-provider-title");
    panel.append(textElement("p", "انتخاب شما از API Finder", "eyebrow"));
    const title = textElement("h2", `${provider.name}: آماده‌سازی اولین درخواست`);
    title.id = "selected-provider-title";
    panel.append(title);
    panel.append(textElement(
      "p",
      provider.api?.openai_compatible && apiBaseUrl
        ? "اطلاعات زیر مستقیم از catalog.json بارگذاری شده است. کلید API فقط در متغیر محیطی دستگاه شما قرار می‌گیرد و در این صفحه وارد یا ذخیره نمی‌شود."
        : "این Provider یا Base URL آن برای نمونه OpenAI-compatible به‌صورت معتبر تأیید نشده است. از نمونه‌کد عمومی فقط پس از تطبیق با مستندات رسمی استفاده کنید."
    ));

    const grid = document.createElement("div");
    grid.className = "provider-context-grid";
    grid.append(
      contextItem("نوع سرویس", labels.service[provider.service_type] ?? provider.service_type ?? "نامشخص"),
      contextItem("نوع دسترسی رایگان", labels.freeTier[provider.free_tier?.type] ?? provider.free_tier?.type ?? "نامشخص"),
      contextItem("پرداخت", paymentLabel(provider.free_tier?.requires_payment_method)),
      contextItem("Base URL", baseUrlLabel, true),
      contextItem("وضعیت ایران", labels.access[provider.iran_access?.status] ?? provider.iran_access?.status ?? "نامشخص"),
      contextItem("آخرین بررسی", provider.verification?.last_checked ?? "تاریخ ثبت نشده"),
      contextItem("مدل نمونه", model ?? "VERIFIED_MODEL_ID", true),
      contextItem("کاربرد انتخاب‌شده", usecase)
    );
    panel.append(grid);

    const modelGuidance = textElement(
      "p",
      model
        ? `شناسه ${model} از یک limit منبع‌محور در کاتالوگ آمده است؛ قبل از اجرا، فعال‌بودن آن را در حساب و مستندات رسمی بررسی کنید.`
        : "مدل رایگان مشخص و قابل‌اتکایی در کاتالوگ ثبت نشده است. مقدار VERIFIED_MODEL_ID عمداً باقی می‌ماند تا شناسه را از داشبورد یا مستندات رسمی بردارید؛ سیستم مدل حدس نمی‌زند.",
      "provider-model-guidance"
    );
    panel.append(modelGuidance);

    const actions = document.createElement("div");
    actions.className = "provider-context-actions";
    if (docsUrl) {
      const docs = document.createElement("a");
      docs.className = "official-docs-link";
      docs.href = docsUrl;
      docs.target = "_blank";
      docs.rel = "noopener noreferrer";
      docs.textContent = "بازکردن مستندات رسمی";
      docs.addEventListener("click", () => plausible("official_docs_click", {
        provider_id: provider.id,
        usecase,
        region,
        source: "quick_start_context"
      }));
      actions.append(docs);
    }
    const evidence = document.createElement("a");
    evidence.className = "evidence-link";
    evidence.href = `../providers/${provider.id}/#evidence`;
    evidence.textContent = "دیدن شواهد و محدودیت‌ها";
    actions.append(evidence);
    panel.append(actions);
    hero.after(panel);

    if (provider.api?.openai_compatible && apiBaseUrl) updateEnvironmentExample(apiBaseUrl, model);

    plausible("quick_start_provider_loaded", {
      provider_id: provider.id,
      usecase,
      region,
      source: "finder_handoff"
    });
  } catch (error) {
    console.error(error);
    renderUnavailable("بارگذاری اطلاعات Provider ناموفق بود. نمونه‌کد عمومی بدون مقدار حدسی باقی مانده است؛ catalog.json و مستندات رسمی را بررسی کنید.");
  }
});
