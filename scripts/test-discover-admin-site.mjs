import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pagePath = path.join(root, "site", "discover", "admin", "index.html");
const cssPath = path.join(root, "site", "discover", "admin", "admin.css");
const jsPath = path.join(root, "site", "discover", "admin", "admin.js");
const [page, css, script] = await Promise.all([readFile(pagePath, "utf8"), readFile(cssPath, "utf8"), readFile(jsPath, "utf8")]);

for (const signal of [
  'lang="fa"', 'dir="rtl"', 'id="admin-tool-form"', 'id="admin-new-tool"', 'id="admin-tools-list"',
  'id="admin-save-status"', 'name="slug"', 'name="name"', 'name="short_description_fa"',
  'name="destination_url"', 'type="url"', 'name="platform"', 'name="category"',
  'name="capabilities"', 'name="badges"', 'name="featured"', 'name="published"',
  'name="sort_order"', 'type="number"', 'name="last_tested_date"', 'type="date"',
  'id="admin-save"', 'id="admin-cancel"', 'id="admin-delete"', 'src="./admin.js"'
]) assert.ok(page.includes(signal), `Admin page is missing ${signal}`);

assert.ok(css.includes(".admin-layout") && css.includes("@media"), "Admin CSS must be responsive");
for (const signal of [
  "/discover/api/admin/tools", "X-Discover-CSRF", 'method: "POST"', 'method: "PUT"', 'method: "DELETE"',
  "window.confirm", "textContent", "application/json", "published", "featured", "sort_order"
]) assert.ok(script.includes(signal), `Admin script is missing ${signal}`);
for (const forbidden of ["localStorage", "sessionStorage", "password", "token", "Authorization"]) {
  assert.ok(!script.includes(forbidden), `Admin JS must not handle/persist authentication material: ${forbidden}`);
}

const syntax = spawnSync(process.execPath, ["--check", jsPath], { encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr || "Admin JS syntax failed");
const build = spawnSync(process.execPath, [path.join(root, "scripts", "build-site-production.mjs")], {
  cwd: root, encoding: "utf8", env: { ...process.env, SOURCE_REVISION: "discover-admin-contract" }
});
assert.equal(build.status, 0, build.stderr || build.stdout || "Production build failed");
try {
  const built = await readFile(path.join(root, ".site-dist", "discover", "admin", "index.html"), "utf8");
  assert.ok(built.includes("مدیریت لینک‌های ریلز"));
} finally {
  await rm(path.join(root, ".site-dist"), { recursive: true, force: true });
}
console.log("Discover admin UI/CRUD contract passed.");
