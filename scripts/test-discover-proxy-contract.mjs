import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root=process.cwd();
const caddy=await readFile(path.join(root,"deploy/caddy/llm.persiantoolbox.ir.caddy"),"utf8");
const nginx=await readFile(path.join(root,"deploy/nginx/ir.llm.persiantoolbox.ir.conf"),"utf8");
for(const signal of [
  "reverse_proxy 127.0.0.1:8003",
  "@discover_admin",
  "/discover/admin/*",
  "/discover/api/admin/*",
  "basic_auth @discover_admin",
  "DISCOVER_ADMIN_USER",
  "DISCOVER_ADMIN_PASSWORD_HASH",
  "Cache-Control \"no-store\""
]) assert.ok(caddy.includes(signal),`Canonical Caddy Discover contract missing: ${signal}`);
assert.ok(caddy.includes("handle /discover/api/*"),"Public/admin Discover API must be proxied before static handling");
assert.ok(!caddy.includes("reverse_proxy 0.0.0.0:8003"),"Discover must never proxy to a wildcard bind");
for(const signal of ["location = /discover", "location ^~ /discover/", "return 404;"]){
  assert.ok(nginx.includes(signal),`Iran mirror Discover isolation missing: ${signal}`);
}
console.log("Discover canonical proxy/admin protection and Iran isolation contract passed.");
