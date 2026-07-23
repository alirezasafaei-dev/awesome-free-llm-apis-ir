import { readFile } from "node:fs/promises";

const provider = JSON.parse(
  await readFile(new URL("../data/providers/fireworks-ai.json", import.meta.url), "utf8")
);
const evidence = provider.iran_access?.evidence ?? [];
const failures = [];

const iranNetworkFailure = evidence.find(
  (item) => item.checked_at === "2026-07-22" && item.source === "IRAN_VPS — direct connectivity probe"
);
if (!iranNetworkFailure) {
  failures.push("missing dated Iran network-failure evidence");
} else {
  if (iranNetworkFailure.type !== "connectivity_test") {
    failures.push("Iran network failure must use connectivity_test, not live_test");
  }
  if (iranNetworkFailure.connectivity_result !== "network_error") {
    failures.push("Iran network failure must preserve connectivity_result=network_error");
  }
  if ("http_status" in iranNetworkFailure) {
    failures.push("network_error evidence must omit http_status because no HTTP response was received");
  }
}

const foreign404 = evidence.find((item) => item.timestamp === "2026-07-22T20:06:44.658Z");
if (!foreign404 || foreign404.http_status !== 404) {
  failures.push("missing dated foreign HTTP 404 evidence");
}

const unsupportedCredentialClaims = /(credential revoked|credential expired|کلید.{0,20}(?:باطل|منقضی)|ابطال.{0,20}کلید|انقضای.{0,20}کلید)/iu;
for (const [label, value] of [
  ["foreign 404 notes", foreign404?.notes_fa],
  ["top-level Iran-access notes", provider.iran_access?.notes_fa]
]) {
  if (unsupportedCredentialClaims.test(value ?? "")) {
    failures.push(`${label} makes an unsupported credential-state claim`);
  }
}

if (failures.length) {
  console.error("Verification evidence semantics failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Verification evidence semantics passed: network, HTTP and credential conclusions remain separate.");
