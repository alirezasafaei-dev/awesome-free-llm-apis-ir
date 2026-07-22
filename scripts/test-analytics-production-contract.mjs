import { access, readFile, readdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const destination = path.join(root, ".site-dist");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npmCommand, ["run", "site:build"], {
  cwd: root,
  encoding: "utf8"
});
if (build.status !== 0) throw new Error(build.stderr || build.stdout || "Production site build failed");

const home = await readFile(path.join(destination, "index.html"), "utf8");
const guard = await readFile(path.join(root, "site", "plausible-guard.js"), "utf8");
if (!guard.includes("location.hostname !== tracker?.dataset.domain")) {
  throw new Error("Plausible tracker must ignore non-canonical mirrors before sending events");
}
if ((home.match(/src="\.\/plausible\.js"/g) || []).length !== 1) {
  throw new Error("Homepage must load exactly one root Plausible tracker");
}
if (!home.includes('src="./plausible-guard.js"') || home.indexOf("plausible-guard.js") > home.indexOf("plausible.js")) {
  throw new Error("Homepage must load the domain guard before the Plausible tracker");
}

for (const section of ["providers", "guides"]) {
  const sectionRoot = path.join(destination, section);
  await access(sectionRoot);
  const directories = await readdir(sectionRoot, { withFileTypes: true });
  for (const directory of directories) {
    if (!directory.isDirectory()) continue;
    if (section === "guides" && directory.name === "en") continue;
    const html = await readFile(path.join(sectionRoot, directory.name, "index.html"), "utf8");
    if ((html.match(/src="\.\.\/\.\.\/plausible\.js"/g) || []).length !== 1) {
      throw new Error(`${section}/${directory.name} must load exactly one root Plausible tracker`);
    }
    if (html.includes('src="./plausible.js"')) {
      throw new Error(`${section}/${directory.name} contains a broken nested tracker path`);
    }
  }
}

// English guides are one level deeper under guides/en/
const enSectionRoot = path.join(destination, "guides", "en");
await access(enSectionRoot);
const enDirectories = await readdir(enSectionRoot, { withFileTypes: true });
for (const directory of enDirectories) {
  if (!directory.isDirectory()) continue;
  const html = await readFile(path.join(enSectionRoot, directory.name, "index.html"), "utf8");
  if ((html.match(/src="\.\.\/\.\.\/\.\.\/plausible\.js"/g) || []).length !== 1) {
    throw new Error(`guides/en/${directory.name} must load exactly one root Plausible tracker`);
  }
  if (html.includes('src="./plausible.js"')) {
    throw new Error(`guides/en/${directory.name} contains a broken nested tracker path`);
  }
}

const caddy = await readFile(path.join(root, "deploy/caddy/llm.persiantoolbox.ir.caddy"), "utf8");
if (!caddy.includes("handle /api/event")) throw new Error("Caddy does not own the Plausible event route");
if (!caddy.includes("reverse_proxy 127.0.0.1:8002")) throw new Error("Caddy Plausible backend does not match the production contract");
const routeIndex = caddy.indexOf("route {");
const eventIndex = caddy.indexOf("handle /api/event");
const fallbackIndex = caddy.indexOf("try_files {path} {path}/ =404");
if (routeIndex < 0 || eventIndex < routeIndex || fallbackIndex < eventIndex) {
  throw new Error("Caddy must preserve analytics routing before the static try_files fallback");
}

const nginx = await readFile(path.join(root, "deploy/nginx/ir.llm.persiantoolbox.ir.conf"), "utf8");
if (!nginx.includes("script-src 'self'")) throw new Error("Iran mirror CSP must allow the self-hosted tracker");
if (!nginx.includes("connect-src 'self'")) throw new Error("Iran mirror CSP must allow same-origin event requests");
if (nginx.includes("plausible.alirezasafaei.dev")) throw new Error("Iran mirror still depends on the retired external Plausible origin");
if (!nginx.includes("location = /api/event")) throw new Error("Iran mirror must explicitly define its analytics event policy");
if (!nginx.includes("return 204")) throw new Error("Iran mirror must explicitly discard analytics events instead of serving SPA HTML");

await rm(destination, { recursive: true, force: true });
console.log("Production analytics contract is consistent across the canonical and Iran mirror builds.");
