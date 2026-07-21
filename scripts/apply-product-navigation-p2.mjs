import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dist = path.join(process.cwd(), ".site-dist");

const pages = {
  "api-finder/index.html": { current: "finder", languageHref: "../en/api-finder/", theme: true },
  "quick-start/index.html": { current: "quick", languageHref: "../en/quick-start/" },
  "compare/index.html": { current: "compare", languageHref: "../en/compare/" },
  "tools/index.html": { current: "tools", languageHref: "../en/" },
  "en/api-finder/index.html": { current: "finder", languageHref: "../../api-finder/", english: true },
  "en/quick-start/index.html": { current: "quick", languageHref: "../../quick-start/", english: true },
  "en/compare/index.html": { current: "compare", languageHref: "../../compare/", english: true }
};

function current(name, active) {
  return name === active ? ' aria-current="page"' : "";
}

function navMarkup(config) {
  if (config.english) {
    return `<a href="../">Home</a><a href="../api-finder/"${current("finder", config.current)}>API Finder</a><a href="../quick-start/"${current("quick", config.current)}>Quick Start</a><a href="../compare/"${current("compare", config.current)}>Compare</a><a class="language-link" href="${config.languageHref}">فارسی</a>`;
  }

  const theme = config.theme
    ? '<button id="theme-toggle" class="icon-button" type="button" aria-pressed="false" aria-label="تغییر به پوسته روشن">◐</button>'
    : "";

  return `<a href="../">خانه</a><a href="../api-finder/"${current("finder", config.current)}>انتخاب API</a><a href="../quick-start/"${current("quick", config.current)}>شروع سریع</a><a href="../compare/"${current("compare", config.current)}>مقایسه</a><a href="../tools/"${current("tools", config.current)}>ابزارها</a><a class="language-link" href="${config.languageHref}">EN</a>${theme}`;
}

function replaceTopbarNav(html, markup, relativePath) {
  const pattern = /(<header class="topbar">[\s\S]*?<nav aria-label="[^"]+"?[^>]*>)[\s\S]*?(<\/nav>)/i;
  if (!pattern.test(html)) throw new Error(`${relativePath}: topbar navigation not found`);
  return html.replace(pattern, `$1${markup}$2`);
}

for (const [relativePath, config] of Object.entries(pages)) {
  const filePath = path.join(dist, relativePath);
  const before = await readFile(filePath, "utf8");
  const after = replaceTopbarNav(before, navMarkup(config), relativePath);
  if (after !== before) {
    await writeFile(filePath, after, "utf8");
    console.log(`patched product navigation: ${relativePath}`);
  } else {
    console.log(`verified product navigation: ${relativePath}`);
  }
}

const cssPath = path.join(dist, "ux-clarity.css");
const css = await readFile(cssPath, "utf8");
const marker = "/* Product navigation P2 */";
if (!css.includes(marker)) {
  await writeFile(cssPath, `${css}\n\n${marker}\n.topbar nav a[aria-current="page"] {
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
`, "utf8");
  console.log("patched product navigation CSS");
} else {
  console.log("verified product navigation CSS");
}

console.log(`Product navigation P2 complete (${Object.keys(pages).length} pages).`);
