import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const transientStatuses = new Set([408, 425, 429]);
const warningStatuses = new Set([401, 403]);

export function classifyStatus(status) {
  if (status >= 200 && status < 400) return "ok";
  if (warningStatuses.has(status)) return "warning";
  if (transientStatuses.has(status) || status >= 500) return "retry";
  return "failure";
}

async function request(url, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": "awesome-free-llm-apis-ir-link-checker/1.1" }
      });
      if (classifyStatus(response.status) !== "retry" || attempt === attempts) return response;
      await response.body?.cancel();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
  }
  throw lastError;
}

async function main() {
  const dir = path.join(process.cwd(), "data", "providers");
  const urls = new Set();
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json"))) {
    const provider = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    [provider.website, provider.docs, provider.models?.source, ...provider.sources]
      .filter(Boolean)
      .forEach((url) => urls.add(url));
  }

  let failures = 0;
  let cursor = 0;
  const sortedUrls = [...urls].sort();
  async function worker() {
    while (cursor < sortedUrls.length) {
      const url = sortedUrls[cursor];
      cursor += 1;
      try {
        const response = await request(url);
        const classification = classifyStatus(response.status);
        if (classification === "failure" || classification === "retry") {
          failures += 1;
          console.error(`FAIL ${response.status} ${url}`);
        } else if (classification === "warning") {
          console.warn(`WARN ${response.status} ${url}`);
        } else {
          console.log(`OK   ${response.status} ${url}`);
        }
        await response.body?.cancel();
      } catch (error) {
        failures += 1;
        console.error(`FAIL ${url} (${error.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(6, sortedUrls.length) }, () => worker()));

  if (failures) process.exitCode = 1;
  else console.log(`Checked ${urls.size} unique links.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
