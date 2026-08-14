import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const dir = path.join(process.cwd(), "site/discover/admin");
const [html, css, js] = await Promise.all([
  readFile(path.join(dir, "index.html"), "utf8"),
  readFile(path.join(dir, "admin.css"), "utf8"),
  readFile(path.join(dir, "admin.js"), "utf8")
]);

for (const signal of [
  "مدیریت لینک‌های ریلز", "admin-tool-form", "admin-tools-list", "destination_url", "icon_provider", "icon_key",
  "published", "featured", "sort_order", "admin-delete", "admin-drag-hint", "./vendor/sortable.min.js"
]) assert.ok(html.includes(signal), `Admin HTML missing ${signal}`);
assert.ok(!html.includes("cdn.jsdelivr.net") && !html.includes("unpkg.com"), "Admin must not load Sortable from a CDN");
assert.ok(css.includes(".admin-layout") && css.includes("@media"));
for (const signal of ["textContent", "activeId", "published", "featured", "icon_provider", "icon_key", "method:\"DELETE\"", "confirm(", "window.Sortable", "sort_order", "admin-drag-handle"]) {
  assert.ok(js.includes(signal), `Admin script missing ${signal}`);
}
assert.ok(!js.includes("iconPrefix"), "Legacy badge-encoded icon metadata must be removed from admin code");
assert.ok(!js.includes("startsWith(\"icon:\")"), "Admin badges must not carry icon metadata");
const syntax = spawnSync(process.execPath, ["--check", path.join(dir, "admin.js")], { encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr);
await access(path.join(process.cwd(), "scripts", "vendor-discover-assets.mjs"));
console.log("Discover admin structured-icon/local-sort contract passed.");
