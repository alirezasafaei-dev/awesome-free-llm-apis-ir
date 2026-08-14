import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root=process.cwd();
const caddy=await readFile(path.join(root,"deploy/caddy/llm.persiantoolbox.ir.caddy"),"utf8");
const canonicalGuard=await readFile(path.join(root,"site/discover/canonical-only.js"),"utf8");
for(const signal of [
  "reverse_proxy 127.0.0.1:8003",
  "@discover_admin",
  "/discover/admin/*",
  "/discover/api/admin/*",
  "basic_auth @discover_admin",
  "DISCOVER_ADMIN_USER",
  "DISCOVER_ADMIN_PASSWORD_HASH",
  "Cache-Control \"no-store\"",
  "handle /discover/api/*"
]) assert.ok(caddy.includes(signal),`Canonical Caddy Discover contract missing: ${signal}`);
assert.ok(!caddy.includes("reverse_proxy 0.0.0.0:8003"),"Discover must never proxy to a wildcard bind");
assert.ok(canonicalGuard.includes("ir.llm.persiantoolbox.ir"),"Mirror guard must identify the Iran mirror");
assert.ok(canonicalGuard.includes('target.hostname = "llm.persiantoolbox.ir"'),"Mirror guard must redirect to the canonical host");
assert.ok(canonicalGuard.includes("window.location.replace"),"Mirror guard must replace the partial mirror route");
console.log("Discover canonical proxy/admin protection and mirror canonicalization contract passed.");
