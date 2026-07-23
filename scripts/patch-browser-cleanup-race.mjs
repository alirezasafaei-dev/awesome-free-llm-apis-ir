import { readFile, writeFile } from "node:fs/promises";

const path = "scripts/test-browser-product-journeys.mjs";
const before = await readFile(path, "utf8");
const oldBlock = `    try { client?.close(); } catch { /* best effort */ }
    chrome.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      sleep(2_000)
    ]);
    if (!processState.exited) chrome.kill("SIGKILL");
    await staticServer.close();
    await rm(userDataDir, { recursive: true, force: true });`;
const newBlock = `    try { client?.close(); } catch { /* best effort */ }
    const waitForChromeExit = () => processState.exited
      ? Promise.resolve()
      : new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill("SIGTERM");
    await Promise.race([waitForChromeExit(), sleep(2_000)]);
    if (!processState.exited) {
      chrome.kill("SIGKILL");
      await Promise.race([waitForChromeExit(), sleep(2_000)]);
    }
    await staticServer.close();
    let cleanupError = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        cleanupError = null;
        break;
      } catch (error) {
        cleanupError = error;
        if (!["ENOTEMPTY", "EBUSY", "EPERM"].includes(error.code)) throw error;
        await sleep(150 * (attempt + 1));
      }
    }
    if (cleanupError) throw cleanupError;`;

if (!before.includes(oldBlock)) throw new Error("browser cleanup block was not found");
await writeFile(path, before.replace(oldBlock, newBlock), "utf8");
console.log("Browser cleanup now waits for Chrome exit and retries transient profile removal failures.");
