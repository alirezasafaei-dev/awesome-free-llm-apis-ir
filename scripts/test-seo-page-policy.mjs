import {
  isInteractiveApplication,
  isNoindexPage,
  parseRobotsContent,
  shouldEnforceIndexMetadata,
  shouldEnforceMinimumWordCount
} from "./seo-page-policy.mjs";

const article = `<!doctype html><html><head>
<meta name="robots" content="index,follow">
<script type="application/ld+json">{"@type":"TechArticle"}</script>
</head><body>article</body></html>`;

const noindex = `<!doctype html><html><head>
<meta name="robots" content="noindex,follow">
</head><body>utility</body></html>`;

const reversedRobots = `<!doctype html><html><head>
<meta content="NOINDEX, FOLLOW" name="robots">
</head><body>utility</body></html>`;

const webApp = `<!doctype html><html><head>
<meta name="robots" content="index,follow">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication"}</script>
</head><body>interactive tool</body></html>`;

if (parseRobotsContent(article) !== "index,follow") throw new Error("Could not parse standard robots meta");
if (isNoindexPage(article)) throw new Error("Indexable article was classified as noindex");
if (!shouldEnforceIndexMetadata(article)) throw new Error("Indexable article metadata checks were disabled");
if (!shouldEnforceMinimumWordCount(article)) throw new Error("Article word-count threshold was disabled");

if (!isNoindexPage(noindex)) throw new Error("Noindex page was not detected");
if (shouldEnforceIndexMetadata(noindex)) throw new Error("Noindex page should not require hreflang or JSON-LD");
if (shouldEnforceMinimumWordCount(noindex)) throw new Error("Noindex utility page should not require article word count");

if (!isNoindexPage(reversedRobots)) throw new Error("Reversed robots attributes were not detected");
if (shouldEnforceIndexMetadata(reversedRobots)) throw new Error("Reversed noindex meta should disable index-only metadata checks");
if (shouldEnforceMinimumWordCount(reversedRobots)) throw new Error("Reversed noindex meta should disable article word count");

if (!isInteractiveApplication(webApp)) throw new Error("WebApplication JSON-LD was not detected");
if (!shouldEnforceIndexMetadata(webApp)) throw new Error("Indexable WebApplication metadata checks were disabled");
if (shouldEnforceMinimumWordCount(webApp)) throw new Error("Interactive application should not require article word count");

console.log("SEO page-policy tests passed.");
