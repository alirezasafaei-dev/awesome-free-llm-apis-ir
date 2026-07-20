# Iran verification snapshot — 2026-07-20

## Scope

This snapshot records only evidence that is safe to publish from authorized Iran test environments. It intentionally excludes complete IP addresses, account identifiers, API keys, Authorization headers, private hostnames and raw infrastructure logs.

## Evidence interpretation

- A successful authenticated or intentionally anonymous model request with a valid model response may support `verified_working`.
- HTTP 401, 403, 404, TLS success, DNS success or website reachability only establish a limited layer of connectivity. They do not prove account creation, API-key issuance or model inference.
- Timeout, connection refusal or a single routing failure is inconclusive and must not be presented as proof of geographic blocking.
- Direct Iran, VPN/supported-route and credential validation results remain separate evidence classes.

## Results included in PR #123

### Successful model requests

- Kilo Gateway: anonymous direct-Iran model request returned HTTP 200 and Persian model content.
- OVHcloud AI Endpoints: anonymous direct-Iran model request returned HTTP 200 and a model response.

### Connectivity-only evidence; status remains unknown

- Agnes AI: the model endpoint returned HTTP 401; an authorized key is required for inference validation.
- FreeTheAI: the model endpoint returned HTTP 401; an authorized Discord-issued key is required.
- NVIDIA NIM: the endpoint returned an HTTP response, but a valid Developer Program key and model request are required.
- Vercel AI Gateway: the endpoint returned HTTP 401; a configured Gateway and authorized key are required.
- Fireworks AI: the direct connection timed out; the result is inconclusive and requires an active authorized account plus a supported-route comparison.

## Remaining work

- Issue #33: execute five credential-gated model requests.
- Issue #35: run the independent ASN and authorized VPN comparison matrix.
- Keep account, network and inference failures classified separately.

## Publication guardrail

No future update may publish a complete test-host IP, API credential, account identity, private dashboard capture or unrelated infrastructure detail. Public evidence should be the minimum needed to reproduce the classification logic without exposing operational assets.
