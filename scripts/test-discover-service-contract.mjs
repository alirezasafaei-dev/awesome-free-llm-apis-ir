import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
const unit=await readFile(path.join(process.cwd(),"deploy/discover/persiantoolbox-discover.service"),"utf8");
for(const signal of ["User=persiantoolbox-discover","DISCOVER_HOST=127.0.0.1","DISCOVER_PORT=8003","/var/lib/persiantoolbox-discover/discover.sqlite3","/opt/persiantoolbox-discover/current","StateDirectory=persiantoolbox-discover","NoNewPrivileges=true","ProtectSystem=strict","ReadWritePaths=/var/lib/persiantoolbox-discover"])assert.ok(unit.includes(signal),`Discover service contract missing ${signal}`);
assert.ok(!unit.includes("DISCOVER_HOST=0.0.0.0"));
assert.ok(!unit.includes("/srv/awesome-free-llm-apis-ir/current/discover.sqlite3"));
console.log("Discover persistent loopback service contract passed.");
