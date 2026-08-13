import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const port = 4173;
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [path.join(root, "scripts", "serve-site.mjs"), "--port", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"]
});

let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => { stdout += chunk; });
child.stderr.on("data", (chunk) => { stderr += chunk; });

async function waitForReady() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Local server exited early with ${child.exitCode}.\n${stdout}\n${stderr}`);
    }
    try {
      const response = await fetch(`${origin}/`);
      if (response.status === 200) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not become ready.\n${stdout}\n${stderr}`);
}

try {
  await waitForReady();
  const home = await fetch(`${origin}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /<!doctype html>/i);

  const catalog = await fetch(`${origin}/catalog.json`);
  assert.equal(catalog.status, 200);
  const payload = await catalog.json();
  assert.ok(Number.isInteger(payload.provider_count) && payload.provider_count > 0);

  const missing = await fetch(`${origin}/definitely-not-a-real-route`);
  assert.equal(missing.status, 404);

  console.log("Local site HTTP smoke passed: homepage and catalog return 200; unknown route returns 404.");
} finally {
  if (child.exitCode === null) child.kill();
}
