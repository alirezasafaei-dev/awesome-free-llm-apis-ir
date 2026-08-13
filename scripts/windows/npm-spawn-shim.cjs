"use strict";

const childProcess = require("node:child_process");
const { syncBuiltinESMExports } = require("node:module");

if (process.platform === "win32") {
  const originalSpawnSync = childProcess.spawnSync;
  childProcess.spawnSync = function spawnSyncWindowsNpm(command, args, options) {
    if (command === "npm" && !(options && Object.hasOwn(options, "shell"))) {
      options = { ...options, shell: true };
    }
    return originalSpawnSync.call(this, command, args, options);
  };
  syncBuiltinESMExports();
}
