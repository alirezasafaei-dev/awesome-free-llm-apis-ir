const statusDefinitions = [
  { status: "direct_blocked_vpn_working", labels: ["متصل با فیلترشکن", "works with a vpn"] },
  { status: "verified_working_vpn", labels: ["متصل با فیلترشکن", "works with a vpn"] },
  { status: "verified_working", labels: ["متصل مستقیم", "works directly"] },
  { status: "officially_unsupported", labels: ["ایران رسماً پشتیبانی نمی‌شود", "officially unsupported"] },
  { status: "verified_blocked", labels: ["اتصال مستقیم برقرار نشد", "direct connection unavailable"] },
  { status: "signup_blocked", labels: ["endpoint مستقیم در دسترس است", "endpoint is directly reachable"] },
  { status: "account_activation_blocked", labels: ["endpoint مستقیم در دسترس است", "endpoint is directly reachable"] },
  { status: "intermittent", labels: ["اتصال ناپایدار", "intermittent connection"] },
  { status: "unknown", labels: ["وضعیت اتصال نامشخص", "connection status unknown"] }
];

const structuralEmojiPattern = /^[✅🛡️⛔🚫⚠️🧾❔]\s*/u;

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return value.toLocaleLowerCase("fa").replaceAll("ي", "ی").replaceAll("ك", "ک").trim();
}

/**
 * @param {HTMLElement} badge
 * @returns {void}
 */
function enhanceStatusBadge(badge) {
  const visibleText = badge.textContent?.replace(structuralEmojiPattern, "").trim() ?? "";
  if (visibleText && badge.textContent !== visibleText) badge.textContent = visibleText;

  if (badge.dataset.status) return;
  const searchable = normalize(`${visibleText} ${badge.getAttribute("aria-label") ?? ""}`);
  const definition = statusDefinitions.find((item) => item.labels.some((label) => searchable.includes(normalize(label))));
  if (definition) badge.dataset.status = definition.status;
}

/**
 * @param {HTMLElement} card
 * @returns {void}
 */
function enhanceProviderCard(card) {
  const providerId = card.querySelector(".provider-id")?.textContent?.split("·")[0]?.trim();
  if (providerId) card.dataset.providerId = providerId;

  const badge = card.querySelector(".access-badge");
  if (badge instanceof HTMLElement) enhanceStatusBadge(badge);
}

/** @returns {void} */
function enhanceCatalog() {
  document.querySelectorAll(".provider-card").forEach((card) => {
    if (card instanceof HTMLElement) enhanceProviderCard(card);
  });
}

const grid = document.getElementById("provider-grid");
if (grid) {
  const observer = new MutationObserver(enhanceCatalog);
  observer.observe(grid, { childList: true });
  enhanceCatalog();
}

const search = document.getElementById("search");
const clearButton = document.getElementById("clear-search");

if (search instanceof HTMLInputElement) {
  search.setAttribute("aria-keyshortcuts", "/");

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
    event.preventDefault();
    search.focus();
  });

  const updateClearState = () => {
    if (clearButton instanceof HTMLButtonElement) clearButton.hidden = search.value.length === 0;
  };

  search.addEventListener("input", updateClearState);
  updateClearState();

  if (clearButton instanceof HTMLButtonElement) {
    clearButton.addEventListener("click", () => {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.focus();
    });
  }
}
