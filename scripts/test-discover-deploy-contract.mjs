import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root=process.cwd();
const installPath=path.join(root,"deploy/discover/install-discover-service.sh");
const unitPath=path.join(root,"deploy/discover/persiantoolbox-discover.service");
const runtimePath=path.join(root,"deploy/discover/prepare-node-runtime.sh");
const manifestPath=path.join(root,"deploy/discover/node-runtime-manifest.env");
const [installer,unit,runtime,manifest]=await Promise.all([
  readFile(installPath,"utf8"),readFile(unitPath,"utf8"),readFile(runtimePath,"utf8"),readFile(manifestPath,"utf8")
]);

for(const signal of [
  'BASE_DIR="/opt/persiantoolbox-discover"', 'RELEASES_DIR="$BASE_DIR/releases"',
  'RUNTIME_DIR="$BASE_DIR/runtime"', 'NODE_CURRENT_LINK="/usr/local/bin/persiantoolbox-discover-node"',
  'NODE_VERSIONED_BIN="/usr/local/bin/persiantoolbox-discover-node-${NODE_RUNTIME_VERSION}"',
  "/var/lib/persiantoolbox-discover", "/etc/persiantoolbox-discover", "discover.sqlite3",
  "pre-${RELEASE_ID}", "CURRENT_LINK.next", "NODE_CURRENT_LINK.next", "mv -Tf", "uname -m",
  ".discover-runtime", "sha256sum", "node_modules/simple-icons", "127.0.0.1:8003/discover/api/health",
  "runuser", "DISCOVER_PREFLIGHT_ONLY=1", "systemctl status", "journalctl -u", "--no-pager", "rollback"
]) assert.ok(installer.includes(signal),`Discover installer missing ${signal}`);
assert.ok(installer.includes('install -m 0755 "$NODE_BIN" "$NODE_VERSIONED_BIN"'),"Installer must install the verified app-specific Node executable into /usr/local/bin");
assert.ok(installer.includes("restorecon"),"Installer should restore the standard executable security context when SELinux tooling is present");
assert.ok(!installer.includes('command -v node'),"Installer must not depend on the VPS system Node");
assert.ok(!installer.includes("rm -rf \"$DATA_DIR\""),"Installer must never recursively remove persistent data");
assert.ok(!/npm\s+(?:i|install|ci)\b/.test(installer),"Installer must not mutate dependencies on the VPS");
assert.ok(installer.includes("NR>10"),"Backup retention must be bounded");
assert.ok(!installer.includes("systemctl show-environment"),"Diagnostics must not dump systemd environment");
assert.ok(!installer.includes("printenv"),"Diagnostics must not dump process environment");

for(const signal of [
  "NODE_RUNTIME_VERSION=22.23.2",
  "NODE_RUNTIME_X64_SHA256=b294a556e639d64338823920e5866c21c02741742d2e1529ee1a225c1ec9252a",
  "NODE_RUNTIME_ARM64_SHA256=013b59cfd2819703a6f4a14ab891fc46fc2a4e3f5bcd92de3fb4929b43e35b30"
]) assert.ok(manifest.includes(signal),`Node runtime manifest missing ${signal}`);
for(const signal of ["https://nodejs.org/dist/", 'file="node-v${NODE_RUNTIME_VERSION}-linux-${arch}.tar.gz"', 'fetch_runtime x64 "$NODE_RUNTIME_X64_SHA256"', 'fetch_runtime arm64 "$NODE_RUNTIME_ARM64_SHA256"', "sha256sum -c"])
  assert.ok(runtime.includes(signal),`Node runtime preparation missing ${signal}`);

for(const signal of [
  "User=persiantoolbox-discover", "DISCOVER_HOST=127.0.0.1", "ProtectSystem=strict",
  "ReadWritePaths=/var/lib/persiantoolbox-discover",
  "ExecStart=/usr/local/bin/persiantoolbox-discover-node /opt/persiantoolbox-discover/current/services/discover/server.mjs"
]) assert.ok(unit.includes(signal),`Discover service contract missing ${signal}`);
assert.ok(!unit.includes("ExecStart=/usr/bin/node"),"Discover service must not depend on /usr/bin/node");
assert.ok(!unit.includes("ExecStart=/opt/persiantoolbox-discover/runtime"),"systemd must not execute the private Node binary from the MAC-denied /opt path");

if(process.platform!=="win32"){
  for(const file of [installPath,runtimePath]){
    const syntax=spawnSync("bash",["-n",file],{encoding:"utf8"});
    assert.equal(syntax.status,0,syntax.stderr||`Shell syntax failed: ${file}`);
  }
}
console.log("Discover deployment/service systemd-safe exec-path contract passed.");
