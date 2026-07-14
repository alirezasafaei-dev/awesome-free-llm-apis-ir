import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dir = path.join(process.cwd(), "data", "providers");
const urls = new Set();
for (const file of (await readdir(dir)).filter((f) => f.endsWith(".json"))) {
  const p = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  [p.website, p.docs, p.models?.source, ...p.sources].filter(Boolean).forEach((url) => urls.add(url));
}

let failures = 0;
for (const url of [...urls].sort()) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: { "user-agent": "awesome-free-llm-apis-ir-link-checker/1.0" }
    });
    if (response.status >= 500) {
      failures += 1;
      console.error(`FAIL ${response.status} ${url}`);
    } else {
      console.log(`OK   ${response.status} ${url}`);
    }
    await response.body?.cancel();
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${url} (${error.message})`);
  }
}

if (failures) process.exit(1);
console.log(`Checked ${urls.size} unique links.`);

