import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = await mkdtemp(path.join(os.tmpdir(), "caddy-upgrade-test-"));
const bin = path.join(root, "bin");
const payload = path.join(root, "payload");
await mkdir(bin);
await mkdir(payload);
const caddyBin = path.join(bin, "caddy");
const serviceLog = path.join(root, "systemctl.log");
const config = path.join(root, "Caddyfile");
await writeFile(config, "example.test { respond ok }\n");

const fakeCaddy = (version, validationExit = 0) => `#!/usr/bin/env bash
if [[ "$1" == version ]]; then echo "${version}"; exit 0; fi
if [[ "$1" == validate ]]; then exit ${validationExit}; fi
exit 0
`;
await writeFile(caddyBin, fakeCaddy("2.6.2"));
await chmod(caddyBin, 0o755);
await writeFile(path.join(payload, "caddy"), fakeCaddy("2.11.4"));
await chmod(path.join(payload, "caddy"), 0o755);
await writeFile(path.join(bin, "systemctl"), `#!/usr/bin/env bash
echo "$*" >> "$SERVICE_LOG"
exit "\${SYSTEMCTL_EXIT:-0}"
`);
await chmod(path.join(bin, "systemctl"), 0o755);
const archive = path.join(root, "caddy.tar.gz");
assert.equal(spawnSync("tar", ["-C", payload, "-czf", archive, "caddy"]).status, 0);
const digest = spawnSync("sha256sum", [archive], { encoding: "utf8" }).stdout.split(" ")[0];

const run = (extraEnv = {}) => spawnSync("bash", ["deploy/caddy/upgrade-caddy.sh", archive, digest], {
  cwd: process.cwd(), encoding: "utf8",
  env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CADDY_BIN: caddyBin, CADDYFILE: config, BACKUP_ROOT: path.join(root, "backups"), CADDY_UPGRADE_UNPRIVILEGED: "1", CADDY_HEALTH_URL: "", SERVICE_LOG: serviceLog, ...extraEnv }
});

let result = run();
assert.equal(result.status, 0, result.stderr);
assert.match(await readFile(caddyBin, "utf8"), /2\.11\.4/);
assert.match(await readFile(serviceLog, "utf8"), /restart caddy/);

await writeFile(caddyBin, fakeCaddy("2.6.2"));
await chmod(caddyBin, 0o755);
await writeFile(serviceLog, "");
result = run({ SYSTEMCTL_EXIT: "1" });
assert.notEqual(result.status, 0, "failed restart must fail the upgrade");
assert.match(await readFile(caddyBin, "utf8"), /2\.6\.2/, "failed upgrade must restore the prior binary");

result = spawnSync("bash", ["deploy/caddy/upgrade-caddy.sh", archive, "0".repeat(64)], {
  cwd: process.cwd(), encoding: "utf8",
  env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CADDY_BIN: caddyBin, CADDYFILE: config, BACKUP_ROOT: path.join(root, "backups"), CADDY_UPGRADE_UNPRIVILEGED: "1", CADDY_HEALTH_URL: "", SERVICE_LOG: serviceLog }
});
assert.notEqual(result.status, 0, "checksum mismatch must be rejected");

console.log("Caddy pinned upgrade validates, installs, restarts and rolls back safely.");
