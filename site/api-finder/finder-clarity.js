const runWhenReady = (callback) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else callback();
};

runWhenReady(() => {
  const form = document.getElementById("finder-form");
  const results = document.getElementById("finder-results");
  const loading = document.getElementById("finder-loading");
  const status = document.getElementById("finder-status");
  const disclosure = document.getElementById("finder-disclosure");
  const hero = document.querySelector(".api-finder-hero");
  if (!form || !results || !loading || !status || !disclosure || !hero) return;

  const allowed = {
    usecase: new Set(["chat", "coding", "reasoning", "embeddings"]),
    language: new Set(["persian", "english", "multilingual"]),
    budget: new Set(["no-card", "free-only", "any"]),
    latency: new Set(["low", "important", "critical"]),
    region: new Set(["iran", "iran-vpn", "any"])
  };
  const defaults = { usecase: "chat", language: "persian", budget: "no-card", latency: "low", region: "iran" };
  const safeCampaignPattern = /^[a-zA-Z0-9_-]{1,64}$/;

  const plausible = (name, props = {}) => {
    if (typeof window.plausible !== "function") return;
    const safeProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (!["provider_id", "usecase", "region", "result_count", "source"].includes(key)) continue;
      if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) continue;
      safeProps[key] = value;
    }
    window.plausible(name, { props: safeProps });
  };

  const fields = {
    usecase: document.getElementById("finder-usecase"),
    language: document.getElementById("finder-language"),
    budget: document.getElementById("finder-budget"),
    latency: document.getElementById("finder-latency"),
    region: document.getElementById("finder-region")
  };

  const fieldCopy = {
    usecase: ["چه چیزی می‌سازی؟", "گزینه‌ای را انتخاب کن که به کار اصلی پروژه نزدیک‌تر است."],
    language: ["خروجی به چه زبانی است؟", "این انتخاب فقط یک سیگنال کمکی است و کیفیت فارسی را تضمین نمی‌کند."],
    budget: ["چه محدودیت مالی داری؟", "رایگان بودن می‌تواند مدل رایگان، سهمیه دائمی، اعتبار یا Trial باشد."],
    latency: ["سرعت پاسخ چقدر مهم است؟", "RPM شاخص کامل Latency نیست؛ فقط در رتبه‌بندی اولیه اثر می‌گذارد."],
    region: ["از کجا استفاده می‌کنی؟", "Reachability، ثبت‌نام، ساخت کلید و Inference چهار مرحله جدا هستند."]
  };

  const optionCopy = {
    usecase: [
      ["chat", "چت‌بات و تولید محتوا"],
      ["coding", "کدنویسی و اتصال به ابزارها"],
      ["reasoning", "حل مسئله و استدلال"],
      ["embeddings", "جست‌وجوی معنایی و Embedding"]
    ],
    language: [
      ["persian", "پاسخ فارسی برایم مهم است"],
      ["english", "فقط انگلیسی کافی است"],
      ["multilingual", "پروژه چندزبانه است"]
    ],
    budget: [
      ["no-card", "بدون واردکردن کارت بانکی"],
      ["free-only", "فقط سهمیه یا مدل رایگان"],
      ["any", "Trial یا اعتبار هدیه هم قابل‌قبول است"]
    ],
    latency: [
      ["low", "فعلاً اولویت اصلی نیست"],
      ["important", "سرعت مهم است"],
      ["critical", "سرعت اولویت اصلی است"]
    ],
    region: [
      ["iran", "استفاده مستقیم از ایران"],
      ["iran-vpn", "استفاده از ایران با VPN مجاز"],
      ["any", "محدودیت منطقه برایم مهم نیست"]
    ]
  };

  function improveLabel(select, key) {
    if (!select) return null;
    const label = select.closest("label");
    if (!label) return null;
    const [title, help] = fieldCopy[key];
    for (const node of [...label.childNodes]) {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    }
    const titleElement = document.createElement("span");
    titleElement.textContent = title;
    const helpElement = document.createElement("small");
    helpElement.className = "finder-field-help";
    helpElement.textContent = help;
    label.prepend(titleElement);
    label.insertBefore(helpElement, select);
    select.setAttribute("aria-describedby", `finder-${key}-help`);
    helpElement.id = `finder-${key}-help`;
    for (const [value, text] of optionCopy[key]) {
      const option = [...select.options].find((item) => item.value === value);
      if (option) option.textContent = text;
    }
    return label;
  }

  function sanitizeSelections() {
    for (const [key, select] of Object.entries(fields)) {
      if (!select) continue;
      if (!allowed[key].has(select.value)) select.value = defaults[key];
    }
  }

  function currentFilters() {
    sanitizeSelections();
    return Object.fromEntries(Object.entries(fields).map(([key, select]) => [key, select?.value ?? defaults[key]]));
  }

  function filterSignature(filters = currentFilters()) {
    return [filters.usecase, filters.language, filters.budget, filters.latency, filters.region].join("|");
  }

  function shareUrl(filters = currentFilters()) {
    const url = new URL(location.pathname, location.origin);
    for (const [key, value] of Object.entries(filters)) {
      if (allowed[key].has(value) && value !== defaults[key]) url.searchParams.set(key, value);
    }
    return url.toString();
  }

  function sanitizeLocationQuery() {
    const current = new URL(location.href);
    const next = new URL(location.pathname, location.origin);
    const filters = currentFilters();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== defaults[key]) next.searchParams.set(key, value);
    }
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const value = current.searchParams.get(key);
      if (value && safeCampaignPattern.test(value)) next.searchParams.set(key, value);
    }
    if (`${current.pathname}${current.search}` !== `${next.pathname}${next.search}`) {
      history.replaceState(null, "", `${next.pathname}${next.search}${location.hash}`);
    }
  }

  form.classList.add("clarity-form");
  const usecaseLabel = improveLabel(fields.usecase, "usecase");
  const languageLabel = improveLabel(fields.language, "language");
  const budgetLabel = improveLabel(fields.budget, "budget");
  const latencyLabel = improveLabel(fields.latency, "latency");
  const regionLabel = improveLabel(fields.region, "region");
  sanitizeLocationQuery();

  const advanced = document.createElement("details");
  advanced.className = "finder-advanced";
  const advancedSummary = document.createElement("summary");
  advancedSummary.textContent = "تنظیمات پیشرفته: سرعت و مسیر دسترسی";
  const advancedFields = document.createElement("div");
  advancedFields.className = "finder-advanced-fields";
  if (latencyLabel) advancedFields.append(latencyLabel);
  if (regionLabel) advancedFields.append(regionLabel);
  const advancedNote = document.createElement("p");
  advancedNote.className = "finder-advanced-note";
  advancedNote.textContent = "این دو تنظیم رتبه را تغییر می‌دهند، اما جای تست واقعی شبکه و حساب را نمی‌گیرند.";
  advancedFields.append(advancedNote);
  advanced.append(advancedSummary, advancedFields);
  const actions = form.querySelector(".finder-actions");
  form.insertBefore(advanced, actions);

  const submit = document.getElementById("finder-submit");
  const reset = document.getElementById("finder-reset");
  if (submit) submit.textContent = "نمایش پیشنهادهای مناسب";
  if (reset) reset.textContent = "شروع دوباره";

  const heroTitle = hero.querySelector("h1");
  const heroDescription = hero.querySelector("p:not(.eyebrow)");
  if (heroTitle) heroTitle.innerHTML = "برای پروژه‌ات چند API مناسب<br><span>پیدا کن و دلیلش را ببین.</span>";
  if (heroDescription) heroDescription.textContent = "سه سؤال اصلی را جواب بده. سه پیشنهاد اصلی با توضیح ساده نمایش داده می‌شود؛ بعد می‌توانی گزینه‌های بیشتر، شواهد و محدودیت هر سرویس را بررسی کنی.";

  const intro = document.createElement("section");
  intro.className = "finder-clarity-intro";
  intro.setAttribute("aria-label", "مراحل استفاده از API Finder");
  intro.innerHTML = `
    <article><span>۱</span><strong>کار پروژه را بگو</strong><p>چت‌بات، کدنویسی، استدلال یا جست‌وجوی معنایی.</p></article>
    <article><span>۲</span><strong>محدودیت را مشخص کن</strong><p>زبان و نوع گزینه رایگان برایت چقدر مهم است؟</p></article>
    <article><span>۳</span><strong>یک گزینه را فعال کن</strong><p>Provider را انتخاب کن و نمونه‌کد همان سرویس را بساز.</p></article>`;
  hero.after(intro);

  const hint = document.createElement("p");
  hint.className = "finder-start-hint";
  hint.textContent = "سه پیشنهاد اولیه با تنظیمات رایج کاربران فارسی‌زبان نمایش داده می‌شود. این نمایش خودکار به‌عنوان تکمیل Finder شمرده نمی‌شود.";
  form.after(hint);
  status.classList.add("clarity-status");

  disclosure.classList.add("clarity-disclosure");
  const disclosureSummary = disclosure.querySelector("summary");
  if (disclosureSummary) disclosureSummary.textContent = "روش رتبه‌بندی و محدودیت‌های امتیاز";

  const limitations = document.createElement("section");
  limitations.className = "finder-limitations";
  limitations.innerHTML = `
    <h2>این پیشنهاد چه چیزی را تضمین نمی‌کند؟</h2>
    <ul>
      <li>امتیاز بالاتر، کیفیت قطعی مدل یا پایداری دائمی سرویس را تضمین نمی‌کند.</li>
      <li>بازشدن سایت یا پاسخ 401، موفقیت ثبت‌نام و اجرای مدل را ثابت نمی‌کند.</li>
      <li>RPM ثبت‌شده معادل Latency واقعی روی شبکه شما نیست.</li>
      <li>قبل از انتخاب، صفحه شواهد و مستندات رسمی Provider را بررسی کن.</li>
    </ul>`;
  disclosure.before(limitations);

  const resultTools = document.createElement("div");
  resultTools.className = "finder-share-actions";
  resultTools.hidden = true;
  const showMore = document.createElement("button");
  showMore.className = "finder-show-more";
  showMore.type = "button";
  const shareButton = document.createElement("button");
  shareButton.className = "finder-share-button";
  shareButton.type = "button";
  shareButton.textContent = "کپی لینک این پیشنهادها";
  const shareStatus = document.createElement("span");
  shareStatus.className = "finder-share-status";
  shareStatus.setAttribute("role", "status");
  shareStatus.setAttribute("aria-live", "polite");
  resultTools.append(showMore, shareButton, shareStatus);
  results.after(resultTools);

  let finderStarted = false;
  const markStarted = (event) => {
    if (finderStarted || event.isTrusted === false) return;
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.closest("select, button")) return;
    finderStarted = true;
    const filters = currentFilters();
    plausible("api_finder_started", { usecase: filters.usecase, region: filters.region, source: "guided_form" });
  };
  form.addEventListener("pointerdown", markStarted, { passive: true });
  form.addEventListener("keydown", (event) => {
    if (["Enter", " ", "ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) markStarted(event);
  });
  form.addEventListener("change", markStarted);
  advanced.addEventListener("toggle", () => {
    if (advanced.open) plausible("api_finder_advanced_open", { source: "guided_form" });
  });

  let expanded = false;
  let visibleCards = [];
  function applyResultLimit() {
    visibleCards.forEach((card, index) => { card.hidden = !expanded && index >= 3; });
    const hiddenCount = Math.max(0, visibleCards.length - 3);
    showMore.hidden = hiddenCount === 0;
    showMore.textContent = expanded ? "نمایش فقط ۳ پیشنهاد اصلی" : `نمایش ${hiddenCount} گزینه بیشتر`;
    showMore.setAttribute("aria-expanded", String(expanded));
  }
  showMore.addEventListener("click", () => {
    expanded = !expanded;
    applyResultLimit();
  });

  function providerIdFromCard(card) {
    const raw = card.querySelector(".finder-id")?.textContent?.trim() ?? "";
    const id = raw.split("·")[0]?.trim() ?? "";
    return /^[a-z0-9-]{1,64}$/.test(id) ? id : null;
  }

  function enhanceCard(card) {
    if (card.dataset.clarityEnhanced === "true") return;
    card.dataset.clarityEnhanced = "true";
    const providerId = providerIdFromCard(card);
    if (providerId) card.dataset.providerId = providerId;

    const scoreLabel = card.querySelector(".finder-total-score small");
    if (scoreLabel) scoreLabel.textContent = "امتیاز تطابق؛ نه تضمین";

    const positiveLabels = [...card.querySelectorAll(".finder-breakdown-item")]
      .filter((item) => item.querySelector(".value")?.textContent?.trim().startsWith("+"))
      .map((item) => item.querySelector(".label")?.textContent?.trim())
      .filter(Boolean)
      .slice(0, 2);
    const access = card.querySelector(".access-badge")?.textContent?.trim() || "نیازمند بررسی شواهد";
    const summary = document.createElement("p");
    summary.className = "finder-fit-summary";
    summary.textContent = positiveLabels.length
      ? `دلیل رتبه بالا: ${positiveLabels.join(" و ")}. وضعیت ثبت‌شده: ${access}.`
      : `این گزینه بر اساس مجموع معیارها رتبه گرفته است. وضعیت ثبت‌شده: ${access}.`;
    const extra = card.querySelector(".finder-card-extra");
    if (extra) card.insertBefore(summary, extra);

    const breakdown = card.querySelector(".finder-breakdown");
    if (breakdown) {
      const details = document.createElement("details");
      details.className = "finder-score-details";
      const detailsSummary = document.createElement("summary");
      detailsSummary.textContent = "جزئیات عددی امتیاز";
      breakdown.replaceWith(details);
      details.append(detailsSummary, breakdown);
    }

    const actionsElement = card.querySelector(".finder-card-actions");
    if (actionsElement && providerId && !actionsElement.querySelector(".finder-quick-start-link")) {
      const filters = currentFilters();
      const quickStart = document.createElement("a");
      quickStart.className = "finder-quick-start-link";
      const params = new URLSearchParams({ provider: providerId, usecase: filters.usecase, region: filters.region });
      quickStart.href = `../quick-start/?${params.toString()}`;
      quickStart.textContent = "انتخاب و ساخت اولین درخواست";
      quickStart.addEventListener("click", () => {
        plausible("api_finder_provider_selected", {
          provider_id: providerId,
          usecase: filters.usecase,
          region: filters.region,
          source: "result_card"
        });
      });
      for (const link of actionsElement.querySelectorAll("a")) link.classList.add("finder-secondary-link");
      actionsElement.prepend(quickStart);
    }
  }

  let renderMode = "default";
  let defaultResultsReported = false;
  let pendingCompletionSignature = null;
  let lastCompletionSignature = "";
  let lastResultCount = "0";

  form.addEventListener("submit", (event) => {
    if (event.isTrusted === false) return;
    const filters = currentFilters();
    const signature = filterSignature(filters);
    renderMode = "explicit";
    pendingCompletionSignature = signature === lastCompletionSignature ? null : signature;
  });

  const resultObserver = new MutationObserver(() => {
    const cards = [...results.querySelectorAll(".finder-card")];
    cards.forEach(enhanceCard);
    if (!cards.length) return;
    visibleCards = cards;
    expanded = false;
    applyResultLimit();
    resultTools.hidden = false;
    lastResultCount = String(cards.length);
    const filters = currentFilters();

    if (renderMode === "explicit" && pendingCompletionSignature) {
      lastCompletionSignature = pendingCompletionSignature;
      pendingCompletionSignature = null;
      plausible("api_finder_completed", {
        usecase: filters.usecase,
        region: filters.region,
        result_count: lastResultCount,
        source: "explicit_submit"
      });
      renderMode = "idle";
      return;
    }

    if (!defaultResultsReported) {
      defaultResultsReported = true;
      plausible("api_finder_default_results_viewed", {
        usecase: filters.usecase,
        region: filters.region,
        result_count: lastResultCount,
        source: "default_render"
      });
    }
  });
  resultObserver.observe(results, { childList: true });

  shareButton.addEventListener("click", async () => {
    const filters = currentFilters();
    try {
      await navigator.clipboard.writeText(shareUrl(filters));
      shareStatus.textContent = "لینک امن کپی شد";
      plausible("api_finder_share", {
        usecase: filters.usecase,
        region: filters.region,
        result_count: lastResultCount,
        source: "results_toolbar"
      });
    } catch {
      shareStatus.textContent = "کپی ناموفق بود؛ آدرس مرورگر را کپی کنید";
    }
  });

  let defaultRenderRequested = false;
  const runInitialRecommendation = () => {
    if (defaultRenderRequested || !loading.hidden) return;
    defaultRenderRequested = true;
    renderMode = "default";
    sanitizeSelections();
    if (!results.querySelector(".finder-card") && typeof window.runFinder === "function") {
      window.runFinder();
    }
  };
  const loadingObserver = new MutationObserver(runInitialRecommendation);
  loadingObserver.observe(loading, { attributes: true, attributeFilter: ["hidden"] });
  runInitialRecommendation();

  if (!usecaseLabel || !languageLabel || !budgetLabel) {
    console.warn("API Finder clarity enhancement could not locate all core fields.");
  }
});
