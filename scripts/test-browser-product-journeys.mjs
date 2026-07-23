import { spawn, spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIST = path.join(ROOT, ".site-dist");
const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"]
]);

/** @param {boolean} condition @param {string} message */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function reservePort() {
  const server = createTcpServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object", "unable to reserve a local port");
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function startStaticServer() {
  await stat(DIST);
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "POST" && url.pathname === "/api/event") {
        request.resume();
        response.writeHead(202, { "cache-control": "no-store" });
        response.end();
        return;
      }

      let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (!relative) relative = "index.html";
      let filePath = path.resolve(DIST, relative);
      const distPrefix = `${path.resolve(DIST)}${path.sep}`;
      if (filePath !== path.resolve(DIST) && !filePath.startsWith(distPrefix)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      let fileStats;
      try {
        fileStats = await stat(filePath);
      } catch {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
        return;
      }
      if (fileStats.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        try {
          fileStats = await stat(filePath);
        } catch {
          response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
          return;
        }
      }
      if (!fileStats.isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }

      const type = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
      response.writeHead(200, {
        "content-type": type,
        "content-length": fileStats.size,
        "cache-control": "no-store"
      });
      if (request.method === "HEAD") response.end();
      else createReadStream(filePath).pipe(response);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(error.message);
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object", "static server did not expose a port");
  return {
    baseUrl: `http://127.0.0.1:${address.port}/`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

function findChrome() {
  for (const candidate of ["google-chrome-stable", "google-chrome", "chromium", "chromium-browser"]) {
    const result = spawnSync("which", [candidate], { encoding: "utf8" });
    if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  }
  throw new Error("Chrome/Chromium executable was not found on the runner");
}

async function waitForBrowser(debugPort, processState) {
  const endpoint = `http://127.0.0.1:${debugPort}/json/version`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (processState.exited) throw new Error(`Chrome exited before DevTools became available:\n${processState.stderr}`);
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(500) });
      if (response.ok) {
        const payload = await response.json();
        if (payload.webSocketDebuggerUrl) return payload.webSocketDebuggerUrl;
      }
    } catch {
      // Browser startup is asynchronous.
    }
    await sleep(100);
  }
  throw new Error(`Chrome DevTools endpoint did not start:\n${processState.stderr}`);
}

class CdpClient {
  /** @param {WebSocket} socket */
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", (event) => this.handleMessage(event));
    socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("CDP socket closed"));
      this.pending.clear();
    });
  }

  /** @param {string} url */
  static connect(url) {
    return new Promise((resolve, reject) => {
      assert(typeof WebSocket === "function", "Node runtime does not provide WebSocket support");
      const socket = new WebSocket(url);
      socket.addEventListener("open", () => resolve(new CdpClient(socket)), { once: true });
      socket.addEventListener("error", () => reject(new Error("Unable to connect to Chrome DevTools")), { once: true });
    });
  }

  /** @param {MessageEvent} event */
  handleMessage(event) {
    const message = JSON.parse(String(event.data));
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result || {});
      return;
    }
    const listeners = this.listeners.get(message.method) || [];
    for (const listener of [...listeners]) listener(message.params || {}, message.sessionId || null);
  }

  /** @param {string} method @param {Record<string, unknown>} [params] @param {string|null} [sessionId] */
  send(method, params = {}, sessionId = null) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify(payload));
    });
  }

  /** @param {string} method @param {(params: Record<string, unknown>, sessionId: string|null) => void} listener */
  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
    return () => this.listeners.set(method, (this.listeners.get(method) || []).filter((value) => value !== listener));
  }

  /** @param {string} method @param {string|null} sessionId @param {number} [timeoutMs] */
  waitForEvent(method, sessionId, timeoutMs = 15_000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeoutMs);
      const unsubscribe = this.on(method, (params, eventSessionId) => {
        if (sessionId && eventSessionId !== sessionId) return;
        clearTimeout(timer);
        unsubscribe();
        resolve(params);
      });
    });
  }

  close() {
    this.socket.close();
  }
}

async function main() {
  const staticServer = await startStaticServer();
  const debugPort = await reservePort();
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "llm-browser-gate-"));
  const processState = { exited: false, stderr: "" };
  const chrome = spawn(findChrome(), [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-background-networking",
    "--disable-component-update",
    "--no-first-run",
    "--remote-debugging-address=127.0.0.1",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });
  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", (chunk) => {
    processState.stderr = `${processState.stderr}${chunk}`.slice(-20_000);
  });
  chrome.once("exit", () => { processState.exited = true; });

  let client;
  let sessionId;
  try {
    const browserWs = await waitForBrowser(debugPort, processState);
    client = await CdpClient.connect(browserWs);
    const { targetId } = await client.send("Target.createTarget", { url: "about:blank" });
    const attached = await client.send("Target.attachToTarget", { targetId, flatten: true });
    sessionId = attached.sessionId;
    assert(sessionId, "Chrome did not return a page session");

    await Promise.all([
      client.send("Page.enable", {}, sessionId),
      client.send("Runtime.enable", {}, sessionId),
      client.send("Log.enable", {}, sessionId)
    ]);

    const runtimeErrors = [];
    client.on("Runtime.exceptionThrown", (params, eventSessionId) => {
      if (eventSessionId !== sessionId) return;
      const details = params.exceptionDetails || {};
      runtimeErrors.push(details.exception?.description || details.text || "Unknown runtime exception");
    });
    client.on("Runtime.consoleAPICalled", (params, eventSessionId) => {
      if (eventSessionId !== sessionId || params.type !== "error") return;
      const values = (params.args || []).map((arg) => arg.value || arg.description || "").filter(Boolean);
      runtimeErrors.push(`console.error: ${values.join(" ")}`);
    });

    /** @param {string} expression */
    async function evaluate(expression) {
      const result = await client.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true
      }, sessionId);
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || `Evaluation failed: ${expression}`);
      }
      return result.result?.value;
    }

    /** @param {string} expression @param {number} [timeoutMs] */
    async function waitUntil(expression, timeoutMs = 15_000) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await sleep(100);
      }
      throw new Error(`Timed out waiting for browser condition: ${expression}`);
    }

    /** @param {string} relativeUrl */
    async function navigate(relativeUrl) {
      runtimeErrors.length = 0;
      const loaded = client.waitForEvent("Page.loadEventFired", sessionId);
      const result = await client.send("Page.navigate", { url: new URL(relativeUrl, staticServer.baseUrl).toString() }, sessionId);
      if (result.errorText) throw new Error(`Navigation failed: ${result.errorText}`);
      await loaded;
      await sleep(200);
    }

    async function assertNoRuntimeErrors(context) {
      await sleep(150);
      assert(runtimeErrors.length === 0, `${context} produced JavaScript errors:\n${runtimeErrors.join("\n")}`);
    }

    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    console.log("[browser] desktop homepage");
    await navigate("/");
    const home = await evaluate(`(() => ({
      title: document.querySelector("h1")?.textContent || "",
      primaryHref: document.querySelector(".hero-actions .button.primary")?.getAttribute("href") || "",
      skipHref: document.querySelector(".skip-link")?.getAttribute("href") || "",
      overflow: document.documentElement.scrollWidth - window.innerWidth
    }))()`);
    assert(/API/.test(home.title), "homepage H1 does not explain the API product");
    assert(home.primaryHref.includes("api-finder"), "homepage primary CTA does not open API Finder");
    assert(home.skipHref === "#main-content", "homepage skip link is missing or incorrect");
    assert(home.overflow <= 1, `desktop homepage has horizontal overflow: ${home.overflow}px`);

    await evaluate(`document.activeElement?.blur()`);
    await client.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
    await client.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 }, sessionId);
    const focusedClass = await evaluate(`document.activeElement?.className || ""`);
    assert(String(focusedClass).includes("skip-link"), "first keyboard focus target is not the skip link");
    await assertNoRuntimeErrors("desktop homepage");

    console.log("[browser] Finder completion, shortlist and theme");
    await navigate("/api-finder/");
    await waitUntil(`document.querySelectorAll(".finder-card").length >= 2`);
    const finderSource = await evaluate(`(() => ({
      hasLanguage: Boolean(document.querySelector("#finder-language")),
      hasForm: Boolean(document.querySelector("#finder-form")),
      overflow: document.documentElement.scrollWidth - window.innerWidth
    }))()`);
    assert(!finderSource.hasLanguage, "unsupported language selector is present in the built Finder");
    assert(finderSource.hasForm, "Finder form is missing");
    assert(finderSource.overflow <= 1, `desktop Finder has horizontal overflow: ${finderSource.overflow}px`);

    await evaluate(`(() => {
      const values = {
        "finder-usecase": "reasoning",
        "finder-budget": "free-only",
        "finder-latency": "critical",
        "finder-region": "any"
      };
      for (const [id, value] of Object.entries(values)) {
        const element = document.getElementById(id);
        if (!element) throw new Error("Missing Finder control: " + id);
        element.value = value;
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      document.getElementById("finder-form").requestSubmit();
    })()`);
    await waitUntil(`new URL(location.href).searchParams.get("usecase") === "reasoning"`);
    await waitUntil(`document.querySelectorAll(".finder-card").length >= 2`);
    await waitUntil(`document.querySelectorAll(".finder-shortlist-toggle").length >= 2`);

    const finderResults = await evaluate(`(() => ({
      cardCount: document.querySelectorAll(".finder-card").length,
      scores: [...document.querySelectorAll(".finder-total-score strong")].map((node) => Number(node.textContent.trim())),
      scoreLabels: [...document.querySelectorAll(".finder-total-score small")].map((node) => node.textContent.trim()),
      visibleText: document.getElementById("finder-results")?.textContent || "",
      url: location.href
    }))()`);
    assert(finderResults.cardCount >= 2, "Finder did not render enough result cards");
    assert(finderResults.scores.every((value) => Number.isFinite(value) && value <= 100), "Finder rendered an invalid score or a score above 100");
    assert(finderResults.scoreLabels.every((value) => /امتیاز تطابق/.test(value) && /تضمین/.test(value)), "Finder does not explain that ranking is a match score rather than a guarantee");
    assert(!/(?:130|۱۳۰)/.test(finderResults.visibleText), "Legacy 130-point denominator remains visible in Finder results");
    assert(new URL(finderResults.url).searchParams.get("latency") === "critical", "Finder did not preserve request-capacity priority in URL state");

    await evaluate(`(() => {
      const buttons = [...document.querySelectorAll(".finder-shortlist-toggle")].slice(0, 2);
      buttons.forEach((button) => button.click());
    })()`);
    await waitUntil(`document.getElementById("finder-shortlist-open")?.getAttribute("aria-disabled") === "false"`);
    const compareHref = await evaluate(`document.getElementById("finder-shortlist-open")?.href || ""`);
    assert(compareHref.includes("providers="), "shortlist did not produce a shareable comparison URL");

    const themeBefore = await evaluate(`document.documentElement.dataset.theme || ""`);
    await evaluate(`document.getElementById("theme-toggle")?.click()`);
    const themeAfter = await evaluate(`document.documentElement.dataset.theme || ""`);
    assert(themeBefore !== themeAfter, "theme toggle did not change the active theme");
    await assertNoRuntimeErrors("Finder journey");

    console.log("[browser] Compare journey");
    runtimeErrors.length = 0;
    const compareLoaded = client.waitForEvent("Page.loadEventFired", sessionId);
    const compareNavigation = await client.send("Page.navigate", { url: compareHref }, sessionId);
    if (compareNavigation.errorText) throw new Error(`Compare navigation failed: ${compareNavigation.errorText}`);
    await compareLoaded;
    await waitUntil(`document.querySelectorAll(".compare-card").length >= 2`);
    const compareState = await evaluate(`(() => ({
      cards: document.querySelectorAll(".compare-card").length,
      resultsHidden: document.getElementById("compare-results")?.hidden,
      overflow: document.documentElement.scrollWidth - window.innerWidth
    }))()`);
    assert(compareState.cards >= 2, "Compare did not render shortlisted providers");
    assert(compareState.resultsHidden === false, "Compare results remain hidden");
    assert(compareState.overflow <= 1, `desktop Compare has horizontal overflow: ${compareState.overflow}px`);
    await evaluate(`document.getElementById("compare-clear")?.click()`);
    const cleared = await evaluate(`({
      emptyVisible: document.getElementById("compare-empty")?.hidden === false,
      cardCount: document.querySelectorAll(".compare-card").length,
      providersParam: new URL(location.href).searchParams.get("providers")
    })`);
    assert(cleared.emptyVisible && cleared.cardCount === 0 && !cleared.providersParam, "Compare clear action did not reset state");
    await assertNoRuntimeErrors("Compare journey");

    console.log("[browser] mobile responsive guard");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true
    }, sessionId);
    await navigate("/");
    const mobileHome = await evaluate(`({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      primaryWidth: Math.round(document.querySelector(".hero-actions .button.primary")?.getBoundingClientRect().width || 0),
      viewport: window.innerWidth
    })`);
    assert(mobileHome.overflow <= 1, `mobile homepage has horizontal overflow: ${mobileHome.overflow}px`);
    assert(mobileHome.primaryWidth > 0 && mobileHome.primaryWidth <= mobileHome.viewport, "mobile primary CTA exceeds the viewport");

    await navigate("/api-finder/");
    await waitUntil(`document.querySelectorAll(".finder-card").length >= 1`);
    const mobileFinder = await evaluate(`({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      formWidth: Math.round(document.getElementById("finder-form")?.getBoundingClientRect().width || 0),
      viewport: window.innerWidth
    })`);
    assert(mobileFinder.overflow <= 1, `mobile Finder has horizontal overflow: ${mobileFinder.overflow}px`);
    assert(mobileFinder.formWidth > 0 && mobileFinder.formWidth <= mobileFinder.viewport, "mobile Finder form exceeds the viewport");
    await assertNoRuntimeErrors("mobile journeys");

    console.log("Browser product journeys passed: real JavaScript, Finder, shortlist, Compare, theme, keyboard and responsive behavior are healthy.");
  } finally {
    try { client?.close(); } catch { /* best effort */ }
    chrome.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => chrome.once("exit", resolve)),
      sleep(2_000)
    ]);
    if (!processState.exited) chrome.kill("SIGKILL");
    await staticServer.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

await main();
