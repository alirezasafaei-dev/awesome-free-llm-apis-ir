import assert from "node:assert/strict";
import {
  classifyEndpointStatus,
  classifyProbe,
  collectBrokenUrls,
  statusNote,
  statusSymbol
} from "./lib/api-health-classification.mjs";

const result = (status, url = "https://api.example.test/v1") => ({ status, url, latency: 20, error: null });
const failure = (message = "fetch failed", url = "https://api.example.test/v1") => ({ status: null, url, latency: 30_001, error: message });

for (const status of [401, 403]) {
  assert.equal(classifyProbe("api", result(status)), "auth_required");
  assert.equal(classifyEndpointStatus({ api: result(status) }), "auth_required");
  assert.deepEqual(collectBrokenUrls({ api: result(status) }), []);
  assert.equal(statusSymbol("api", result(status)), "REACHABLE");
  assert.match(statusNote("auth_required", result(status)), /credentials are required/);
}

for (const status of [400, 404, 405, 406, 409, 415, 422]) {
  assert.equal(classifyProbe("api", result(status)), "reachable");
  assert.equal(classifyEndpointStatus({ api: result(status) }), "reachable");
  assert.deepEqual(collectBrokenUrls({ api: result(status) }), []);
}

assert.equal(classifyProbe("api", result(429)), "rate_limited");
assert.equal(classifyEndpointStatus({ api: result(429) }), "rate_limited");
assert.deepEqual(collectBrokenUrls({ api: result(429) }), []);

for (const status of [200, 204, 301, 307]) {
  assert.equal(classifyEndpointStatus({ api: result(status) }), "operational");
}

for (const status of [408, 425, 500, 502, 503]) {
  assert.equal(classifyProbe("api", result(status)), "down");
  assert.equal(classifyEndpointStatus({ api: result(status) }), "down");
  assert.deepEqual(collectBrokenUrls({ api: result(status) }), ["https://api.example.test/v1"]);
}

assert.equal(classifyEndpointStatus({ api: failure("DNS lookup failed") }), "down");
assert.equal(classifyEndpointStatus({ api: failure("The operation was aborted due to timeout") }), "down");

const mixedSupportingChecks = {
  website: result(200, "https://example.test/"),
  docs: result(404, "https://example.test/docs")
};
assert.equal(classifyEndpointStatus(mixedSupportingChecks), "degraded");
assert.deepEqual(collectBrokenUrls(mixedSupportingChecks), ["https://example.test/docs"]);

const authWithBrokenDocs = {
  api: result(401),
  website: result(200, "https://example.test/"),
  docs: result(404, "https://example.test/docs")
};
assert.equal(classifyEndpointStatus(authWithBrokenDocs), "auth_required");
assert.deepEqual(collectBrokenUrls(authWithBrokenDocs), ["https://example.test/docs"]);

console.log("API health classification contract passed: auth, reachability, rate limiting and infrastructure outages are separate evidence layers.");
