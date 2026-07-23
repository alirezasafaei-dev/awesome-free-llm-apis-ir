import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/test-browser-product-journeys.mjs";
const before = await readFile(path, "utf8");
const oldBlock = `    const finderResults = await evaluate(\`(() => ({
      cardCount: document.querySelectorAll(".finder-card").length,
      denominators: [...document.querySelectorAll(".finder-total-score small")].map((node) => node.textContent.trim()),
      url: location.href
    }))()\`);
    assert(finderResults.cardCount >= 2, "Finder did not render enough result cards");
    assert(finderResults.denominators.every((value) => /100/.test(value) && !/130/.test(value)), "Finder score denominator is not 100");
    assert(new URL(finderResults.url).searchParams.get("latency") === "critical", "Finder did not preserve request-capacity priority in URL state");`;
const newBlock = `    const finderResults = await evaluate(\`(() => ({
      cardCount: document.querySelectorAll(".finder-card").length,
      scores: [...document.querySelectorAll(".finder-total-score strong")].map((node) => Number(node.textContent.trim())),
      scoreLabels: [...document.querySelectorAll(".finder-total-score small")].map((node) => node.textContent.trim()),
      visibleText: document.getElementById("finder-results")?.textContent || "",
      url: location.href
    }))()\`);
    assert(finderResults.cardCount >= 2, "Finder did not render enough result cards");
    assert(finderResults.scores.every((value) => Number.isFinite(value) && value <= 100), "Finder rendered an invalid score or a score above 100");
    assert(finderResults.scoreLabels.every((value) => /امتیاز تطابق/.test(value) && /تضمین/.test(value)), "Finder does not explain that ranking is a match score rather than a guarantee");
    assert(!/(?:130|۱۳۰)/.test(finderResults.visibleText), "Legacy 130-point denominator remains visible in Finder results");
    assert(new URL(finderResults.url).searchParams.get("latency") === "critical", "Finder did not preserve request-capacity priority in URL state");`;

if (!before.includes(oldBlock)) {
  throw new Error("browser score assertion block was not found");
}
const after = before.replace(oldBlock, newBlock);
await writeFile(path, after, "utf8");
console.log("Browser score assertion updated for the user-visible clarity label and 100-point ceiling.");
