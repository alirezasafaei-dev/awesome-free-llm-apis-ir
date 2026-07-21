import { pathToFileURL } from "node:url";
import process from "node:process";

export const DEFAULT_RELEASE_TARGETS = Object.freeze([
  Object.freeze({
    name: "global",
    baseUrl: "https://llm.persiantoolbox.ir/",
    robotsPolicy: "index"
  }),
  Object.freeze({
    name: "iran",
    baseUrl: "https://ir.llm.persiantoolbox.ir/",
    robotsPolicy: "noindex"
  }),
  Object.freeze({
    name: "pages",
    baseUrl: "https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/",
    robotsPolicy: "index"
  })
]);

/**
 * @typedef {object} ReleaseTarget
 * @property {string} name
 * @property {string} baseUrl
 * @property {"index" | "noindex"} robotsPolicy
 */

/**
 * @typedef {object} ReleaseSnapshot
 * @property {string} name
 * @property {string} sourceRevision
 * @property {number} providerCount
 */

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeRevision(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * @param {string} baseUrl
 * @param {string} relativePath
 * @returns {string}
 */
function targetUrl(baseUrl, relativePath) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(relativePath, normalizedBase).toString();
}

/**
 * @param {string} url
 * @param {number} timeoutMs
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeoutMs, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "awesome-free-llm-apis-ir-release-verifier/1.0"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @param {ReleaseTarget} target
 * @param {string} expectedRevision
 * @param {{ timeoutMs: number, fetchImpl?: typeof fetch }} options
 * @returns {Promise<ReleaseSnapshot>}
 */
export async function inspectReleaseTarget(target, expectedRevision, options) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const rootResponse = await fetchWithTimeout(targetUrl(target.baseUrl, ""), options.timeoutMs, fetchImpl);
  if (!rootResponse.ok) {
    throw new Error(`${target.name}: root returned HTTP ${rootResponse.status}`);
  }

  const robotsHeader = rootResponse.headers.get("x-robots-tag") ?? "";
  if (target.robotsPolicy === "noindex" && !/noindex/i.test(robotsHeader)) {
    throw new Error(`${target.name}: required noindex header is missing`);
  }
  if (target.robotsPolicy === "index" && /noindex/i.test(robotsHeader)) {
    throw new Error(`${target.name}: indexable target returned noindex`);
  }

  const metadataResponse = await fetchWithTimeout(targetUrl(target.baseUrl, "build-meta.json"), options.timeoutMs, fetchImpl);
  if (!metadataResponse.ok) {
    throw new Error(`${target.name}: build metadata returned HTTP ${metadataResponse.status}`);
  }

  const contentType = metadataResponse.headers.get("content-type") ?? "";
  if (!/application\/json|text\/json/i.test(contentType)) {
    throw new Error(`${target.name}: build metadata has invalid content type`);
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = await metadataResponse.json();
  } catch (error) {
    throw new Error(`${target.name}: build metadata is invalid JSON (${error.message})`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`${target.name}: build metadata must be an object`);
  }

  const metadata = /** @type {{ source_revision?: unknown, provider_count?: unknown }} */ (parsed);
  const sourceRevision = normalizeRevision(metadata.source_revision);
  const expected = normalizeRevision(expectedRevision);
  if (!expected || !/^[a-f0-9]{40}$/.test(expected)) {
    throw new Error("Expected revision must be a full 40-character commit SHA");
  }
  if (sourceRevision !== expected) {
    throw new Error(`${target.name}: deployed revision does not match expected revision`);
  }

  if (!Number.isInteger(metadata.provider_count) || Number(metadata.provider_count) < 1) {
    throw new Error(`${target.name}: provider_count is invalid`);
  }

  return {
    name: target.name,
    sourceRevision,
    providerCount: Number(metadata.provider_count)
  };
}

/**
 * @param {{
 *   expectedRevision: string,
 *   targets?: readonly ReleaseTarget[],
 *   attempts?: number,
 *   delayMs?: number,
 *   timeoutMs?: number,
 *   fetchImpl?: typeof fetch,
 *   onAttempt?: (attempt: number, message: string) => void
 * }} options
 * @returns {Promise<ReleaseSnapshot[]>}
 */
export async function verifyLiveRelease(options) {
  const targets = options.targets ?? DEFAULT_RELEASE_TARGETS;
  const attempts = options.attempts ?? 24;
  const delayMs = options.delayMs ?? 10_000;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const onAttempt = options.onAttempt ?? (() => {});

  if (!Number.isInteger(attempts) || attempts < 1) throw new Error("attempts must be a positive integer");
  if (!Number.isFinite(delayMs) || delayMs < 0) throw new Error("delayMs must be non-negative");
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) throw new Error("timeoutMs must be at least 1000 milliseconds");
  if (!Array.isArray(targets) || targets.length === 0) throw new Error("At least one release target is required");

  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const snapshots = await Promise.all(
        targets.map((target) => inspectReleaseTarget(target, options.expectedRevision, { timeoutMs, fetchImpl: options.fetchImpl }))
      );
      const counts = new Set(snapshots.map((snapshot) => snapshot.providerCount));
      if (counts.size !== 1) throw new Error("Public targets expose different provider counts");
      return snapshots;
    } catch (error) {
      lastError = error;
      onAttempt(attempt, error.message);
      if (attempt < attempts) await sleep(delayMs);
    }
  }

  throw new Error(`Live release verification failed after ${attempts} attempt(s): ${lastError?.message ?? "unknown error"}`);
}

/**
 * @param {string[]} argv
 * @returns {{ expectedRevision: string, attempts: number, delayMs: number, timeoutMs: number }}
 */
function parseArgs(argv) {
  const options = {
    expectedRevision: process.env.EXPECTED_REVISION ?? "",
    attempts: Number(process.env.RELEASE_VERIFY_ATTEMPTS ?? 24),
    delayMs: Number(process.env.RELEASE_VERIFY_DELAY_MS ?? 10_000),
    timeoutMs: Number(process.env.RELEASE_VERIFY_TIMEOUT_MS ?? 15_000)
  };

  for (const argument of argv) {
    if (argument.startsWith("--expected-revision=")) options.expectedRevision = argument.slice("--expected-revision=".length);
    else if (argument.startsWith("--attempts=")) options.attempts = Number(argument.slice("--attempts=".length));
    else if (argument.startsWith("--delay-ms=")) options.delayMs = Number(argument.slice("--delay-ms=".length));
    else if (argument.startsWith("--timeout-ms=")) options.timeoutMs = Number(argument.slice("--timeout-ms=".length));
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const snapshots = await verifyLiveRelease({
    ...options,
    onAttempt(attempt, message) {
      console.error(`Live release attempt ${attempt}/${options.attempts} failed: ${message}`);
    }
  });

  console.log(JSON.stringify({
    status: "verified",
    expectedRevision: normalizeRevision(options.expectedRevision),
    providerCount: snapshots[0].providerCount,
    targets: snapshots.map((snapshot) => snapshot.name)
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
