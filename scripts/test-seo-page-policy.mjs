import {
  isInteractiveApplication,
  isNoindexPage,
  parseRobotsContent,
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
if (!shouldEnforceMinimumWordCount(article)) throw new Error("Article word-count threshold was disabled");

if (!isNoindexPage(noindex)) throw new Error("Noindex page was not detected");
if (shouldEnforceMinimumWordCount(noindex)) throw new Error("Noindex utility page should not require article word count");

if (!isNoindexPage(reversedRobots)) throw new Error("Reversed robots attributes were not detected");
if (shouldEnforceMinimumWordCount(reversedRobots)) throw new Error("Reversed noindex meta should disable article word count");

if (!isInteractiveApplication(webApp)) throw new Error("WebApplication JSON-LD was not detected");
if (shouldEnforceMinimumWordCount(webApp)) throw new Error("Interactive application should not require article word count");

console.log("SEO page-policy tests passed.");
