const canonicalOrigin = "https://llm.persiantoolbox.ir";

const LANGUAGES = {
  "fa-IR": { hreflang: "fa-IR", label: "فارسی", labelEn: "Persian", dir: "rtl" },
  en: { hreflang: "en", label: "English", labelEn: "English", dir: "ltr" }
};

const TRANSLATION_MAP = {
  "practical-free-llm-api-iran": {
    fa: "/guides/practical-free-llm-api-iran/",
    en: "/guides/en/en-practical-free-llm-api-iran/"
  },
  "build-persian-chatbot-python-free-llm-api": {
    fa: "/guides/build-persian-chatbot-python-free-llm-api/",
    en: "/guides/en/en-build-persian-chatbot-python/"
  },
  "fix-llm-api-401-403-model-not-found": {
    fa: "/guides/fix-llm-api-401-403-model-not-found/",
    en: "/guides/en/en-fix-llm-api-401-403/"
  },
  "llm-api-rate-limit-429": {
    fa: "/guides/llm-api-rate-limit-429/",
    en: "/guides/en/en-llm-api-rate-limit-429/"
  },
  "use-free-llm-api-nodejs": {
    fa: "/guides/use-free-llm-api-nodejs/",
    en: "/guides/en/en-use-free-llm-api-nodejs/"
  }
};

function resolveUrl(path) {
  return `${canonicalOrigin}${path}`;
}

function hreflangEntries(pathFa, pathEn) {
  const faUrl = resolveUrl(pathFa);
  const enUrl = resolveUrl(pathEn);
  return [
    { hreflang: "fa-IR", href: faUrl },
    { hreflang: "en", href: enUrl },
    { hreflang: "x-default", href: faUrl }
  ];
}

function hreflangEntriesSelf(path, locale) {
  const url = resolveUrl(path);
  const result = [{ hreflang: locale, href: url }];
  if (locale !== "x-default") result.push({ hreflang: "x-default", href: url });
  return result;
}

export function hreflangLinks(entries) {
  return entries
    .map(({ hreflang, href }) => `    <link rel="alternate" hreflang="${hreflang}" href="${href}">`)
    .join("\n");
}

export function languageSwitcher(currentLocale, counterpartPath) {
  if (!counterpartPath) return "";
  const alt = currentLocale === "fa-IR" ? LANGUAGES.en : LANGUAGES["fa-IR"];
  return `<a class="lang-switcher" href="${counterpartPath}" hreflang="${alt.hreflang}" lang="${alt.hreflang}" dir="${alt.dir}">${alt.label}</a>`;
}

export function sitemapXhtmlLinks(entries) {
  return entries
    .map(({ hreflang, href }) => `      <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>`)
    .join("\n");
}

export function getTranslationPair(translationKey) {
  return TRANSLATION_MAP[translationKey] || null;
}

export function hreflangEntriesForTranslation(translationKey) {
  const pair = getTranslationPair(translationKey);
  if (!pair) return null;
  return hreflangEntries(pair.fa, pair.en);
}

export function sitemapXhtmlForTranslation(translationKey) {
  const pair = getTranslationPair(translationKey);
  if (!pair) return null;
  return {
    faXhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: resolveUrl(pair.fa) },
      { hreflang: "en", href: resolveUrl(pair.en) },
      { hreflang: "x-default", href: resolveUrl(pair.fa) }
    ]),
    enXhtml: sitemapXhtmlLinks([
      { hreflang: "fa-IR", href: resolveUrl(pair.fa) },
      { hreflang: "en", href: resolveUrl(pair.en) },
      { hreflang: "x-default", href: resolveUrl(pair.fa) }
    ])
  };
}

export function sitemapXhtmlSelf(path, locale) {
  return sitemapXhtmlLinks(hreflangEntriesSelf(path, locale));
}

export { canonicalOrigin, LANGUAGES, TRANSLATION_MAP, resolveUrl, hreflangEntries, hreflangEntriesSelf };
