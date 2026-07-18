import process from "node:process";

const canonicalOrigin = "https://llm.persiantoolbox.ir";

const LANGUAGES = {
  fa: { hreflang: "fa", label: "فارسی", labelEn: "Persian" },
  en: { hreflang: "en", label: "English", labelEn: "English" }
};

export function hreflangLinks(entries) {
  return entries
    .map(({ hreflang, href }) => `    <link rel="alternate" hreflang="${hreflang}" href="${href}">`)
    .join("\n");
}

export function hreflangForLocale(locale) {
  return LANGUAGES[locale]?.hreflang ?? locale;
}

export function languageSwitcher(currentLocale, alternateUrl) {
  const current = LANGUAGES[currentLocale];
  const alt = currentLocale === "fa" ? LANGUAGES.en : LANGUAGES.fa;
  if (!alternateUrl) return "";
  const label = currentLocale === "fa" ? alt.label : current.label;
  return `<a class="lang-switcher" href="${alternateUrl}" hreflang="${alt.hreflang}" lang="${alt.hreflang}" dir="${currentLocale === "fa" ? "ltr" : "rtl"}">${label}</a>`;
}

export function sitemapXhtmlLinks(entries) {
  return entries
    .map(({ hreflang, href }) => `      <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join("\n");
}

export { canonicalOrigin, LANGUAGES };
