import { createServer } from "node:http";
import process from "node:process";
import { verifyLiveRelease } from "./check-live-release-revision.mjs";

const EXPECTED_SHA = "a".repeat(40);

/**
 * @typedef {object} ServerState
 * @property {string} revision
 * @property {number} providerCount
 * @property {boolean} noindex
 */

/**
 * @param {ServerState} initialState
 * @returns {Promise<{ baseUrl: string, state: ServerState, close: () => Promise<void> }>}
 */
async function startTarget(initialState) {
  const state = { ...initialState };
  const server = createServer((request, response) => {
    if (request.url === "/build-meta.json") {
      response.statusCode = 200;
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify({
        source_revision: state.revision,
        provider_count: state.providerCount
      }));
      return;
    }

    if (request.url === "/") {
      response.statusCode = 200;
      response.setHeader("content-type", "text/html; charset=utf-8");
      if (state.noindex) response.setHeader("x-robots-tag", "noindex, nofollow");
      response.end("<!doctype html><html><body>release</body></html>");
      return;
    }

    response.statusCode = 404;
    response.end("not found");
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address");

  return {
    baseUrl: `http://127.0.0.1:${address.port}/`,
    state,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

/**
 * @param {Promise<unknown>} promise
 * @param {RegExp} pattern
 * @param {string} label
 * @returns {Promise<void>}
 */
async function expectFailure(promise, pattern, label) {
  try {
    await promise;
  } catch (error) {
    if (pattern.test(error.message)) {
      console.log(`OK: ${label}`);
      return;
    }
    throw new Error(`${label}: unexpected error: ${error.message}`);
  }
  throw new Error(`${label}: expected failure but verification passed`);
}

const globalTarget = await startTarget({ revision: EXPECTED_SHA, providerCount: 22, noindex: false });
const iranTarget = await startTarget({ revision: EXPECTED_SHA, providerCount: 22, noindex: true });
const pagesTarget = await startTarget({ revision: EXPECTED_SHA, providerCount: 22, noindex: false });

const targets = [
  { name: "global", baseUrl: globalTarget.baseUrl, robotsPolicy: "index" },
  { name: "iran", baseUrl: iranTarget.baseUrl, robotsPolicy: "noindex" },
  { name: "pages", baseUrl: pagesTarget.baseUrl, robotsPolicy: "index" }
];

try {
  const snapshots = await verifyLiveRelease({
    expectedRevision: EXPECTED_SHA,
    targets,
    attempts: 1,
    delayMs: 0,
    timeoutMs: 2_000
  });
  if (snapshots.length !== 3 || snapshots.some((snapshot) => snapshot.providerCount !== 22)) {
    throw new Error("Successful verification returned an invalid snapshot set");
  }
  console.log("OK: exact revision and mirror policies pass");

  pagesTarget.state.revision = "b".repeat(40);
  await expectFailure(
    verifyLiveRelease({ expectedRevision: EXPECTED_SHA, targets, attempts: 1, delayMs: 0, timeoutMs: 2_000 }),
    /deployed revision does not match expected revision/,
    "stale Pages revision is rejected"
  );
  pagesTarget.state.revision = EXPECTED_SHA;

  iranTarget.state.noindex = false;
  await expectFailure(
    verifyLiveRelease({ expectedRevision: EXPECTED_SHA, targets, attempts: 1, delayMs: 0, timeoutMs: 2_000 }),
    /required noindex header is missing/,
    "Iran mirror without noindex is rejected"
  );
  iranTarget.state.noindex = true;

  globalTarget.state.noindex = true;
  await expectFailure(
    verifyLiveRelease({ expectedRevision: EXPECTED_SHA, targets, attempts: 1, delayMs: 0, timeoutMs: 2_000 }),
    /indexable target returned noindex/,
    "canonical target with noindex is rejected"
  );
  globalTarget.state.noindex = false;

  pagesTarget.state.providerCount = 21;
  await expectFailure(
    verifyLiveRelease({ expectedRevision: EXPECTED_SHA, targets, attempts: 1, delayMs: 0, timeoutMs: 2_000 }),
    /different provider counts/,
    "cross-target provider-count drift is rejected"
  );
  pagesTarget.state.providerCount = 22;

  await expectFailure(
    verifyLiveRelease({ expectedRevision: "short-sha", targets, attempts: 1, delayMs: 0, timeoutMs: 2_000 }),
    /full 40-character commit SHA/,
    "abbreviated expected revision is rejected"
  );
} finally {
  await Promise.all([globalTarget.close(), iranTarget.close(), pagesTarget.close()]);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("Live release revision verifier tests passed.");
