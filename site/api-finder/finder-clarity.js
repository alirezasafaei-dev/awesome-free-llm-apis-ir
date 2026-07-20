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

  const plausible = (name, props = {}) => {
    if (typeof window.plausible === "function") window.plausible(name, { props });
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

  form.classList.add("clarity-form");
  const usecaseLabel = improveLabel(fields.usecase, "usecase");
  const languageLabel = improveLabel(fields.language, "language");
  const budgetLabel = improveLabel(fields.budget, "budget");
  const latencyLabel = improveLabel(fields.latency, "latency");
  const regionLabel = improveLabel(fields.region, "region");

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
  if (heroDescription) heroDescription.textContent = "سه سؤال اصلی را جواب بده. پنج پیشنهاد اولیه با توضیح ساده نمایش داده می‌شود؛ بعد می‌توانی شواهد، محدودیت و مستندات رسمی هر سرویس را بررسی کنی.";

  const intro = document.createElement("section");
  intro.className = "finder-clarity-intro";
  intro.setAttribute("aria-label", "مراحل استفاده از API Finder");
  intro.innerHTML = `
    <article><span>۱</span><strong>کار پروژه را بگو</strong><p>چت‌بات، کدنویسی، استدلال یا جست‌وجوی معنایی.</p></article>
    <article><span>۲</span><strong>محدودیت را مشخص کن</strong><p>زبان و نوع گزینه رایگان برایت چقدر مهم است؟</p></article>
    <article><span>۳</span><strong>دلیل پیشنهاد را بخوان</strong><p>رتبه اولیه است؛ شواهد و مستندات را قبل از ثبت‌نام کنترل کن.</p></article>`;
  hero.after(intro);

  const hint = document.createElement("p");
  hint.className = "finder-start-hint";
  hint.textContent = "پیشنهاد اولیه با تنظیمات رایج کاربران فارسی‌زبان به‌صورت خودکار نمایش داده می‌شود. هر انتخاب را تغییر بده تا نتایج دوباره محاسبه شوند.";
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

  let finderStarted = false;
  form.addEventListener("focusin", () => {
    if (finderStarted) return;
    finderStarted = true;
    plausible("api_finder_started", { source: "guided_form" });
  });
  advanced.addEventListener("toggle", () => {
    if (advanced.open) plausible("api_finder_advanced_open", { source: "guided_form" });
  });

  function enhanceCard(card) {
    if (card.dataset.clarityEnhanced === "true") return;
    card.dataset.clarityEnhanced = "true";
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
    if (actionsElement && !actionsElement.querySelector(".finder-quick-start-link")) {
      const quickStart = document.createElement("a");
      quickStart.className = "finder-quick-start-link";
      quickStart.href = "../quick-start/";
      quickStart.textContent = "ساخت اولین درخواست";
      actionsElement.append(quickStart);
    }
  }

  let lastCompletionSignature = "";
  const resultObserver = new MutationObserver(() => {
    const cards = [...results.querySelectorAll(".finder-card")];
    cards.forEach(enhanceCard);
    if (!cards.length) return;
    const signature = cards.map((card) => card.querySelector(".finder-id")?.textContent?.trim()).join("|");
    if (signature && signature !== lastCompletionSignature) {
      lastCompletionSignature = signature;
      plausible("api_finder_completed", { result_count: String(cards.length) });
    }
  });
  resultObserver.observe(results, { childList: true });

  let autoSubmitted = false;
  const runInitialRecommendation = () => {
    if (autoSubmitted || !loading.hidden || location.search) return;
    autoSubmitted = true;
    form.requestSubmit();
  };
  const loadingObserver = new MutationObserver(runInitialRecommendation);
  loadingObserver.observe(loading, { attributes: true, attributeFilter: ["hidden"] });
  runInitialRecommendation();

  if (!usecaseLabel || !languageLabel || !budgetLabel) {
    console.warn("API Finder clarity enhancement could not locate all core fields.");
  }
});
