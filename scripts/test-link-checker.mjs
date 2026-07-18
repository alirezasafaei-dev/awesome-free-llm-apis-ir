import assert from "node:assert/strict";
import { classifyStatus } from "./check-links.mjs";

for (const status of [200, 204, 301, 308]) assert.equal(classifyStatus(status), "ok");
for (const status of [401, 403]) assert.equal(classifyStatus(status), "warning");
for (const status of [408, 425, 429, 500, 503]) assert.equal(classifyStatus(status), "retry");
for (const status of [400, 404, 410, 451]) assert.equal(classifyStatus(status), "failure");

console.log("Link checker status classification tests passed.");
