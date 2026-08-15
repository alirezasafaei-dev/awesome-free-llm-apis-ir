const tests = [
  "./test-discover-database.mjs",
  "./test-discover-api.mjs",
  "./test-discover-admin-site.mjs",
  "./test-discover-proxy-contract.mjs",
  "./test-discover-symlink-main.mjs",
  "./test-discover-service-contract.mjs",
  "./test-discover-deploy-contract.mjs",
  "./test-discover-workflow-contract.mjs",
  "./test-caddy-upgrade.mjs"
];

for (const test of tests) {
  await import(test);
}

console.log("Discover complete contract suite passed.");
