import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root=process.cwd();
const installPath=path.join(root,"deploy/discover/install-discover-service.sh");
const unitPath=path.join(root,"deploy/discover/persiantoolbox-discover.service");
const [installer,unit]=await Promise.all([readFile(installPath,"utf8"),readFile(unitPath,"utf8")]);

for(const signal of [
  'BASE_DIR="/opt/persiantoolbox-discover"',
  'RELEASES_DIR="$BASE_DIR/releases"',
  "/var/lib/persiantoolbox-discover",
  "/etc/persiantoolbox-discover",
  "Node.js 22.13+",
  "discover.sqlite3",
  "pre-${RELEASE_ID}",
  "CURRENT_LINK.next",
  "mv -Tf",
  "systemctl daemon-reload",
  "systemctl restart",
  "127.0.0.1:8003/discover/api/health",
  "rollback"
]) assert.ok(installer.includes(signal),`Discover installer missing ${signal}`);
assert.ok(!installer.includes("rm -rf \"$DATA_DIR\""),"Installer must never recursively remove persistent data");
assert.ok(installer.includes("NR>10"),"Backup retention must be bounded");
for(const signal of ["User=persiantoolbox-discover","DISCOVER_HOST=127.0.0.1","ProtectSystem=strict","ReadWritePaths=/var/lib/persiantoolbox-discover"])assert.ok(unit.includes(signal));

if(process.platform!=="win32"){
  const syntax=spawnSync("bash",["-n",installPath],{encoding:"utf8"});
  assert.equal(syntax.status,0,syntax.stderr||"Discover installer shell syntax failed");
}
console.log("Discover deployment/service persistence contract passed.");
