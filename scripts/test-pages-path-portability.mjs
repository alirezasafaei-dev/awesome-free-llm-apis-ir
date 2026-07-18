import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const englishHome = await readFile(path.join(root, "site", "en", "index.html"), "utf8");

const forbiddenRootRelativeLinks = [...englishHome.matchAll(/href="(\/(?!\/)[^"]*)"/g)].map((match) => match[1]);
if (forbiddenRootRelativeLinks.length) {
  throw new Error(`English landing page contains deployment-root links that break GitHub Pages: ${forbiddenRootRelativeLinks.join(", ")}`);
}

for (const requiredHref of ["../#catalog", "../catalog.json"]) {
  if (!englishHome.includes(`href="${requiredHref}"`)) {
    throw new Error(`English landing page is missing portable link ${requiredHref}`);
  }
}

if (englishHome.includes("/en/catalog.json") || englishHome.includes("/en/providers/")) {
  throw new Error("English landing page contains a broken /en/ runtime route");
}

const cases = [
  {
    relative: "../#catalog",
    base: "https://llm.persiantoolbox.ir/en/",
    expected: "https://llm.persiantoolbox.ir/#catalog"
  },
  {
    relative: "../catalog.json",
    base: "https://llm.persiantoolbox.ir/en/",
    expected: "https://llm.persiantoolbox.ir/catalog.json"
  },
  {
    relative: "../#catalog",
    base: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/en/",
    expected: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/#catalog"
  },
  {
    relative: "../catalog.json",
    base: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/en/",
    expected: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/catalog.json"
  },
  {
    relative: "../../../styles.css",
    base: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/guides/en/example/",
    expected: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/styles.css"
  },
  {
    relative: "../../../#catalog",
    base: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/guides/en/example/",
    expected: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/#catalog"
  }
];

for (const { relative, base, expected } of cases) {
  const resolved = new URL(relative, base).href;
  if (resolved !== expected) {
    throw new Error(`${relative} from ${base} resolved to ${resolved}; expected ${expected}`);
  }
}

console.log("English landing and guide paths are portable across production and GitHub Pages.");
