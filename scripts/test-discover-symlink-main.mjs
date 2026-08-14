import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm } from "node:fs/promises";
import { symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const repository = process.cwd();
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "discover-symlink-main-"));
const releaseId = "deadbeef00000001";
const releaseDir = path.join(tempRoot, "releases", releaseId);
const currentLink = path.join(tempRoot, "current");
const healthUrl = "http://127.0.0.1:18303/discover/api/health";
const databasePath = path.join(tempRoot, "discover.sqlite3");
let child = null;

function linkTarget(target, linkPath) {
  if (process.platform === "win32") {
    symlinkSync(target, linkPath, "junction");
  } else {
    symlinkSync(target, linkPath, "dir");
  }
}

async function poll(fn, timeoutMs, message) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await fn()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(message);
}

try {
  // Reproduce the production layout: the release is installed at a real path,
  // and systemd invokes the module through a /opt/.../current symlink. Node
  // resolves import.meta.url to the real release path while process.argv[1]
  // remains the symlink path.
  await mkdir(path.join(releaseDir, "services"), { recursive: true });
  await mkdir(path.join(tempRoot, "node_modules"), { recursive: true });
  await cp(path.join(repository, "services/discover"), path.join(releaseDir, "services/discover"), { recursive: true });
  await cp(path.join(repository, "node_modules/simple-icons"), path.join(tempRoot, "node_modules/simple-icons"), { recursive: true });
  linkTarget(releaseDir, currentLink);

  const modulePath = path.join(currentLink, "services", "discover", "server.mjs");

  child = spawn(process.execPath, [modulePath], {
    cwd: repository,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DISCOVER_HOST: "127.0.0.1",
      DISCOVER_PORT: "18303",
      DISCOVER_DATABASE_PATH: databasePath,
      SOURCE_REVISION: "symlink-main-test"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });

  await poll(async () => {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return (await response.json()).ok === true;
    } catch {}
    return false;
  }, 15000, `Discover server did not listen through a symlinked invocation within 15s.\n${stderr}`);

  console.log("Discover server starts and becomes healthy when invoked through a release symlink.");
} finally {
  if (child && !child.killed) {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once("exit", resolve);
      setTimeout(resolve, 3000);
    }).catch(() => {});
  }
  await rm(tempRoot, { recursive: true, force: true });
}

assert.ok(true, "Invoked-through-symlink server contract passed.");
