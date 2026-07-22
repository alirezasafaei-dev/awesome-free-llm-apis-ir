const statusDefinitions = [
  { status: "account_activation_blocked", labels: ["فعال‌سازی حساب", "account activation"] },
  { status: "direct_blocked_vpn_working", labels: ["مستقیم مسدود / vpn موفق", "مستقیم مسدود، vpn موفق"] },
  { status: "verified_working_vpn", labels: ["با vpn تست‌شده"] },
  { status: "verified_working", labels: ["مستقیم تست‌شده", "اجرای مستقیم تأییدشده"] },
  { status: "officially_unsupported", labels: ["پشتیبانی‌نشده رسمی"] },
  { status: "verified_blocked", labels: ["مستقیم مسدود", "مسدودیت تأییدشده"] },
  { status: "signup_blocked", labels: ["ثبت‌نام مسدود", "مانع ثبت‌نام"] },
  { status: "intermittent", labels: ["ناپایدار"] },
  { status: "unknown", labels: ["نامشخص"] }
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

  const searchable = normalize(`${visibleText} ${badge.getAttribute("aria-label") ?? ""}`);
  const definition = statusDefinitions.find((item) => item.labels.some((label) => searchable.includes(normalize(label))));
  if (definition) badge.dataset.status = definition.status;

  if (definition?.status === "account_activation_blocked") {
    badge.textContent = "مانع فعال‌سازی حساب";
    badge.setAttribute("aria-label", "وضعیت دسترسی ایران: مانع فعال‌سازی یا استفاده از حساب آزمایش‌شده");
  }
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
