const SHORTLIST_STORAGE_KEY = "llm-provider-shortlist-v1";
const SHORTLIST_LIMIT = 3;
const PROVIDER_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const whenReady = (callback) => {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback, { once: true });
  else callback();
};

whenReady(() => {
  const results = document.getElementById("finder-results");
  if (!results) return;

  function safeProviderIds(values) {
    const ids = [];
    for (const value of Array.isArray(values) ? values : []) {
      if (typeof value !== "string" || !PROVIDER_ID_PATTERN.test(value) || ids.includes(value)) continue;
      ids.push(value);
      if (ids.length === SHORTLIST_LIMIT) break;
    }
    return ids;
  }

  function readShortlist() {
    try {
      return safeProviderIds(JSON.parse(localStorage.getItem(SHORTLIST_STORAGE_KEY) || "[]"));
    } catch {
      return [];
    }
  }

  function saveShortlist(ids) {
    const safe = safeProviderIds(ids);
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(safe));
    } catch {
      // The compare URL remains usable when storage is unavailable.
    }
    return safe;
  }

  function plausible(name, props = {}) {
    if (typeof window.plausible !== "function") return;
    const safeProps = {};
    for (const [key, value] of Object.entries(props)) {
      if (!["provider_id", "result_count", "source"].includes(key)) continue;
      if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) continue;
      safeProps[key] = value;
    }
    window.plausible(name, { props: safeProps });
  }

  const bar = document.createElement("aside");
  bar.className = "finder-shortlist";
  bar.setAttribute("aria-label", "فهرست مقایسه Providerها");
  bar.innerHTML = `
    <div>
      <strong>مقایسه Providerها</strong>
      <span id="finder-shortlist-status" role="status" aria-live="polite"></span>
    </div>
    <div class="finder-shortlist-actions">
      <a id="finder-shortlist-open" class="button primary" href="../compare/">مقایسه انتخاب‌ها</a>
      <button id="finder-shortlist-clear" class="button secondary" type="button">پاک‌کردن</button>
    </div>`;
  results.before(bar);

  const status = document.getElementById("finder-shortlist-status");
  const open = document.getElementById("finder-shortlist-open");
  const clear = document.getElementById("finder-shortlist-clear");
  if (!status || !open || !clear) return;

  let shortlist = readShortlist();

  function compareHref(ids = shortlist) {
    const safe = safeProviderIds(ids);
    if (!safe.length) return "../compare/";
    const params = new URLSearchParams({ providers: safe.join(",") });
    return `../compare/?${params.toString()}`;
  }

  function providerIdFromCard(card) {
    const fromDataset = card.dataset.providerId;
    if (fromDataset && PROVIDER_ID_PATTERN.test(fromDataset)) return fromDataset;
    const raw = card.querySelector(".finder-id")?.textContent?.trim() || "";
    const id = raw.split("·")[0]?.trim() || "";
    return PROVIDER_ID_PATTERN.test(id) ? id : null;
  }

  function renderBar(message = "") {
    open.href = compareHref();
    open.setAttribute("aria-disabled", String(shortlist.length < 2));
    open.textContent = shortlist.length >= 2 ? `مقایسه ${shortlist.length} Provider` : "حداقل ۲ Provider انتخاب کن";
    clear.hidden = shortlist.length === 0;
    status.textContent = message || (shortlist.length ? `${shortlist.length} از ${SHORTLIST_LIMIT} انتخاب شده` : "هنوز گزینه‌ای انتخاب نشده است");

    for (const card of results.querySelectorAll(".finder-card")) {
      const id = providerIdFromCard(card);
      const button = card.querySelector(".finder-shortlist-toggle");
      if (!id || !button) continue;
      const selected = shortlist.includes(id);
      button.setAttribute("aria-pressed", String(selected));
      button.textContent = selected ? "حذف از مقایسه" : "افزودن به مقایسه";
      button.classList.toggle("is-selected", selected);
    }
  }

  function toggleProvider(id) {
    if (!id) return;
    if (shortlist.includes(id)) {
      shortlist = saveShortlist(shortlist.filter((value) => value !== id));
      plausible("api_finder_compare_remove", { provider_id: id, result_count: String(shortlist.length), source: "result_card" });
      renderBar("از فهرست مقایسه حذف شد");
      return;
    }
    if (shortlist.length >= SHORTLIST_LIMIT) {
      renderBar(`حداکثر ${SHORTLIST_LIMIT} Provider قابل مقایسه است`);
      return;
    }
    shortlist = saveShortlist([...shortlist, id]);
    plausible("api_finder_compare_add", { provider_id: id, result_count: String(shortlist.length), source: "result_card" });
    renderBar("به فهرست مقایسه اضافه شد");
  }

  function enhanceCard(card) {
    const id = providerIdFromCard(card);
    const actions = card.querySelector(".finder-card-actions");
    if (!id || !actions || actions.querySelector(".finder-shortlist-toggle")) return;
    card.dataset.providerId = id;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "finder-shortlist-toggle";
    button.addEventListener("click", () => toggleProvider(id));
    actions.append(button);
  }

  const observer = new MutationObserver(() => {
    for (const card of results.querySelectorAll(".finder-card")) enhanceCard(card);
    renderBar();
  });
  observer.observe(results, { childList: true });
  for (const card of results.querySelectorAll(".finder-card")) enhanceCard(card);

  open.addEventListener("click", (event) => {
    if (shortlist.length < 2) {
      event.preventDefault();
      renderBar("برای مقایسه حداقل دو Provider انتخاب کن");
      return;
    }
    plausible("api_finder_compare_open", { result_count: String(shortlist.length), source: "shortlist_bar" });
  });

  clear.addEventListener("click", () => {
    shortlist = saveShortlist([]);
    plausible("api_finder_compare_clear", { result_count: "0", source: "shortlist_bar" });
    renderBar("فهرست مقایسه پاک شد");
  });

  renderBar();
});
