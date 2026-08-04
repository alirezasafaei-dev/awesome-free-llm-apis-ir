/**
 * Shared product navigation renderer.
 * Produces deterministic, accessible navigation markup for all product pages.
 */

const FA_LINKS = [
  { href: "../", label: "خانه", key: "home" },
  { href: "../api-finder/", label: "انتخاب API", key: "finder" },
  { href: "../quick-start/", label: "شروع سریع", key: "quick" },
  { href: "../compare/", label: "مقایسه", key: "compare" },
  { href: "../tools/", label: "ابزارها", key: "tools" }
];

const EN_LINKS = [
  { href: "../", label: "Home", key: "home" },
  { href: "../api-finder/", label: "API Finder", key: "finder" },
  { href: "../quick-start/", label: "Quick Start", key: "quick" },
  { href: "../compare/", label: "Compare", key: "compare" }
];

function currentAttr(key, active) {
  return key === active ? ' aria-current="page"' : "";
}

/**
 * @param {{ active: string, lang?: string, languageHref?: string, theme?: boolean }} config
 * @returns {string}
 */
export function renderProductNav({ active, lang = "fa", languageHref, theme = false }) {
  const links = lang === "en" ? EN_LINKS : FA_LINKS;
  const navLinks = links
    .map(({ href, label, key }) => `<a href="${href}"${currentAttr(key, active)}>${label}</a>`)
    .join("");

  const languageLink = languageHref
    ? `<a class="language-link" href="${languageHref}">${lang === "en" ? "فارسی" : "EN"}</a>`
    : "";

  const themeToggle = theme
    ? '<button id="theme-toggle" class="icon-button" type="button" aria-pressed="false" aria-label="تغییر به پوسته روشن">◐</button>'
    : "";

  return navLinks + languageLink + themeToggle;
}

/**
 * Navigation page configurations for all product pages.
 */
export const NAV_PAGES = {
  "api-finder/index.html": { active: "finder", lang: "fa", languageHref: "../en/api-finder/", theme: true },
  "quick-start/index.html": { active: "quick", lang: "fa", languageHref: "../en/quick-start/" },
  "compare/index.html": { active: "compare", lang: "fa", languageHref: "../en/compare/" },
  "tools/index.html": { active: "tools", lang: "fa", languageHref: "../en/" },
  "en/api-finder/index.html": { active: "finder", lang: "en", languageHref: "../../api-finder/" },
  "en/quick-start/index.html": { active: "quick", lang: "en", languageHref: "../../quick-start/" },
  "en/compare/index.html": { active: "compare", lang: "en", languageHref: "../../compare/" }
};

/**
 * Navigation CSS to append to ux-clarity.css.
 */
export const NAV_CSS = `/* Product navigation P2 */
.topbar nav a[aria-current="page"] {
  color: var(--text);
  font-weight: 900;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
}

.topbar nav .language-link {
  color: var(--primary);
  font-weight: 900;
}

@media (max-width: 720px) {
  .topbar {
    align-items: center;
  }

  .topbar nav {
    min-width: 0;
    max-width: calc(100vw - 76px);
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    padding: 4px 2px 8px;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .topbar nav::-webkit-scrollbar {
    display: none;
  }

  .topbar nav a,
  .topbar nav button {
    flex: 0 0 auto;
  }
}
`;
