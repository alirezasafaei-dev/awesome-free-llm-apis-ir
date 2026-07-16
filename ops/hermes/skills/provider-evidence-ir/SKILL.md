---
name: provider-evidence-ir
description: "Research and maintain evidence-backed free LLM provider metadata, with strict separation of official policy, direct-Iran, VPN, and credential evidence."
version: 1.0.0
author: ASDEV
license: MIT
platforms: [linux]
metadata:
  hermes:
    tags: [llm, provider, iran, evidence, verification, privacy, catalog]
---

# Provider Evidence for Iran

Use this skill only inside the `awesome-free-llm-apis-ir` repository. Read `AGENTS.md`, `CONTRIBUTING.md`, the relevant provider JSON, and the live-verification guide before editing.

## Objective

Detect and safely resolve provider metadata drift without overstating free-tier availability or Iran access. Produce a tested patch or a sanitized report. Never convert incomplete evidence into a definitive claim.

## Evidence model

Keep these dimensions independent:

1. **Official provider facts**: plans, quotas, prices, models, authentication, payment requirements, regional policy, and documentation URLs.
2. **Direct Iran observation**: a dated request from an authorized direct Iranian network runner.
3. **VPN observation**: a dated request through an explicitly recorded, authorized VPN exit country.
4. **Credential validation**: whether an authorized credential works, independent of the network result.
5. **Unknown/conflict**: missing, stale, contradictory, or non-authoritative evidence.

A successful foreign-host request is not evidence of direct Iran access. A VPN result is not a direct result. A provider's location is not a regional-access result.

## Research procedure

### 1. Establish current repository state

- Read the target `data/providers/<id>.json` file.
- Find the provider's open issue or verification backlog entry.
- Record the current checked date, source URLs, access status, quota, plan type, and unknown fields.
- Do not edit generated README or catalog sections directly.

### 2. Collect first-party evidence

Use only official provider documentation, pricing pages, API references, status pages, terms, or official announcements for catalog facts.

For each claim, record:

- exact field affected;
- source URL;
- page title or document identity;
- checked date in ISO format;
- whether the source is explicit, ambiguous, or conflicting;
- a short paraphrase, not a long quotation.

If official sources conflict, preserve uncertainty and document both sources. Do not choose the more convenient value.

### 3. Decide whether a data change is justified

A data patch is allowed only when the exact repository field is supported by accepted evidence. Otherwise create a sanitized finding or issue update and leave the field `null`/`unknown`.

Never infer:

- payment-method requirements from the existence of a free plan;
- Iran access from a successful non-Iranian test;
- direct access from VPN success;
- a permanent free tier from a trial or temporary credit;
- a stable quota when the official documentation is model/account dependent.

### 4. Apply the smallest coherent patch

- Change source JSON or non-generated documentation only.
- Preserve schema and naming conventions.
- Run normalization/generation scripts instead of hand-editing generated output.
- Avoid unrelated cleanup.

### 5. Validate

Run:

```bash
npm ci
npm run upstreams:check
npm run check:freshness
npm test
```

For any proposed live verification command, run only:

```bash
npm run verify:iran:dry
```

Do not run the live command from the automation host. Live direct-Iran, ASN, VPN, signup, and credential checks require an authorized human-operated runner.

### 6. Privacy review

Before producing a report or PR, confirm that it contains no:

- IP address or network endpoint;
- SSH username, hostname, fingerprint, or key material;
- API key, token, cookie, authorization header, or raw request headers;
- account email, phone number, billing identity, or screenshot with account data;
- raw response body that may contain identifiers;
- local report or `.env` content.

Report only sanitized status, timestamp, provider, endpoint path, model, HTTP status/error class, route class, and approved high-level network metadata.

### 7. Deliver

Prefer a draft PR. The description must include:

- provider and scope;
- evidence class;
- first-party sources and checked date;
- exact fields changed;
- commands and results;
- unresolved conflicts/unknowns;
- human-only follow-up;
- explicit statement that no production deployment or live Iran test was performed.

If no justified patch exists, produce a sanitized report with one of these outcomes:

- `no_change_supported`
- `documentation_drift_detected`
- `conflicting_first_party_sources`
- `live_verification_required`
- `blocked_by_credentials_or_signup`
- `privacy_or_security_blocker`

## Scheduled drift mode

For unattended scheduled runs:

- operate read-only until a first-party drift is confirmed;
- do not use provider credentials;
- do not run live Iran/VPN tests;
- do not deploy or merge;
- prepare at most one coherent provider patch per draft PR;
- if `npm test` fails, do not open a data PR; report the failure with sanitized logs;
- if evidence affects Iran-access classification, report `live_verification_required` rather than modifying that status.
