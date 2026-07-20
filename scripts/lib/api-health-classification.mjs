const AUTH_REQUIRED_STATUSES = new Set([401, 403]);
const REACHABLE_CLIENT_STATUSES = new Set([400, 404, 405, 406, 409, 415, 422]);
const INFRASTRUCTURE_FAILURE_STATUSES = new Set([408, 425]);

export function classifyProbe(kind, result) {
  if (!result) return "unknown";
  if (result.error) return "down";

  const status = result.status;
  if (!Number.isInteger(status)) return "unknown";
  if (status >= 200 && status < 400) return "operational";
  if (status >= 500 || INFRASTRUCTURE_FAILURE_STATUSES.has(status)) return "down";

  if (kind === "api") {
    if (AUTH_REQUIRED_STATUSES.has(status)) return "auth_required";
    if (status === 429) return "rate_limited";
    if (REACHABLE_CLIENT_STATUSES.has(status)) return "reachable";
  }

  if (status >= 400 && status < 500) return "broken";
  return "unknown";
}

export function classifyEndpointStatus(results) {
  const apiClassification = classifyProbe("api", results.api);
  if (results.api) return apiClassification;

  const supporting = [
    classifyProbe("website", results.website),
    classifyProbe("docs", results.docs)
  ].filter((value) => value !== "unknown");

  if (!supporting.length) return "unknown";
  if (supporting.every((value) => value === "operational")) return "operational";
  if (supporting.every((value) => value === "down")) return "down";
  if (supporting.some((value) => value === "down" || value === "broken")) return "degraded";
  return "unknown";
}

export function collectBrokenUrls(results) {
  return Object.entries(results)
    .filter(([kind, result]) => {
      const classification = classifyProbe(kind, result);
      return classification === "down" || classification === "broken";
    })
    .map(([, result]) => result.url);
}

export function statusSymbol(kind, result) {
  const classification = classifyProbe(kind, result);
  if (classification === "operational") return "OK";
  if (["auth_required", "rate_limited", "reachable"].includes(classification)) return "REACHABLE";
  if (classification === "broken") return "WARN";
  if (classification === "down") return "FAIL";
  return "UNKNOWN";
}

export function statusNote(endpointStatus, apiResult) {
  if (endpointStatus === "auth_required") {
    return `Unauthenticated probe reached the API and received HTTP ${apiResult?.status}; credentials are required.`;
  }
  if (endpointStatus === "rate_limited") {
    return "The API endpoint was reachable but rejected the unauthenticated probe due to rate limiting.";
  }
  if (endpointStatus === "reachable") {
    return `The API host responded with HTTP ${apiResult?.status}; reachability is confirmed but inference is not verified.`;
  }
  if (endpointStatus === "down") {
    return apiResult?.error ? `API infrastructure probe failed: ${apiResult.error}` : `API infrastructure returned HTTP ${apiResult?.status ?? "unknown"}.`;
  }
  return null;
}

export const HEALTHY_NON_INFERENCE_STATUSES = new Set(["auth_required", "rate_limited", "reachable"]);
