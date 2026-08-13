import { ValidationError } from "./validation.mjs";

export class BodyTooLargeError extends Error {
  constructor() {
    super("request body is too large");
    this.name = "BodyTooLargeError";
  }
}

export function sendJson(response, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...extraHeaders
  });
  response.end(body);
}

export function sendEmpty(response, status, extraHeaders = {}) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...extraHeaders
  });
  response.end();
}

export async function readJsonBody(request, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  let tooLarge = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) throw new BodyTooLargeError();
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new SyntaxError("invalid JSON body");
  }
}

export function enforceMutationRequest(request) {
  const contentType = String(request.headers["content-type"] ?? "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return { ok: false, status: 415, code: "json_required", message: "application/json is required" };
  }
  if (request.headers["x-discover-csrf"] !== "1") {
    return { ok: false, status: 403, code: "csrf_required", message: "mutation request rejected" };
  }
  if (String(request.headers["sec-fetch-site"] ?? "").toLowerCase() === "cross-site") {
    return { ok: false, status: 403, code: "cross_site_rejected", message: "mutation request rejected" };
  }
  const origin = request.headers.origin;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (!originHost || originHost !== request.headers.host) {
        return { ok: false, status: 403, code: "origin_rejected", message: "mutation request rejected" };
      }
    } catch {
      return { ok: false, status: 403, code: "origin_rejected", message: "mutation request rejected" };
    }
  }
  return { ok: true };
}

export function errorResponse(error) {
  if (error instanceof ValidationError) {
    return {
      status: 400,
      payload: { error: { code: "validation_error", message: error.message, field: error.field } }
    };
  }
  if (error instanceof BodyTooLargeError) {
    return { status: 413, payload: { error: { code: "body_too_large", message: "request body is too large" } } };
  }
  if (error instanceof SyntaxError) {
    return { status: 400, payload: { error: { code: "invalid_json", message: "request body must be valid JSON" } } };
  }
  return { status: 500, payload: { error: { code: "internal_error", message: "request failed" } } };
}
