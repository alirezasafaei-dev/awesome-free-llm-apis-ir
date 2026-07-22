# Autonomous Agent Operating Contract

## Mission

Maintain this repository as an evidence-backed, machine-readable catalog of free LLM APIs for Persian speakers and users in Iran. Prefer correctness, reproducibility, privacy, and explicit uncertainty over coverage or speed.

## Source-of-truth rules

1. Use first-party provider documentation for plan, quota, pricing, model, authentication, and regional-policy claims.
2. Treat third-party pages only as discovery leads unless the repository schema explicitly permits them.
3. Do not infer Iran accessibility from hosting region, provider nationality, anecdotal reports, or a successful request from a non-Iranian host.
4. Keep these evidence classes separate:
   - official policy/documentation
   - direct Iran network observation
   - authorized VPN observation
   - credential/account validation
   - unknown or conflicting evidence
5. Preserve `null` or `unknown` when evidence is incomplete. Never replace uncertainty with a plausible guess.
6. Every factual catalog change must include a dated source or a sanitized, dated test result allowed by the repository schema.

An authorized VPN observation is never direct Iran evidence. A successful result from the foreign automation host is also never a direct-Iran result.

## Allowed autonomous workflow

The default autonomous workflow is:

`research -> compare -> patch -> generate -> test -> summarize -> draft PR`

Agents may:

- inspect public first-party documentation;
- compare upstream facts with repository JSON;
- edit source data and non-generated documentation;
- run deterministic generators and validation commands;
- create a feature branch and draft pull request;
- report blockers and conflicting evidence without changing data.

When an authorized repository owner explicitly directs a merge or production release in the active conversation, agents may also follow the controlled-release procedure below. This exception is limited to that explicit instruction and does not authorize infrastructure changes outside the repository's release scripts.

## Hard safety boundaries

Agents must not:

- deploy the website or mutate production infrastructure without an explicit active-conversation instruction from an authorized repository owner;
- merge pull requests or push directly to `main` without an explicit active-conversation instruction from an authorized repository owner;
- use force-push, rewrite shared history, or delete branches autonomously;
- run live Iran/VPN verification unless an authorized human explicitly starts that task on the correct network runner;
- publish IP addresses, usernames, hostnames, SSH details, API keys, tokens, cookies, account emails, phone numbers, request headers, or raw response bodies;
- commit `.env`, `reports/local/`, local benchmark results, caches, or artifacts;
- bypass CAPTCHA, KYC, provider Terms of Service, rate limits, or access controls;
- classify a VPN result as direct Iran access;
- edit generated README/catalog sections manually;
- weaken privacy tests, validation rules, or evidence requirements to make a change pass.

If a task requires any prohibited action, stop and produce a sanitized operator checklist instead.

## Controlled release procedure

When the repository owner explicitly authorizes a merge and release, agents must:

1. Confirm the intended pull request is clean, all required checks pass, and the local worktree is clean.
2. Merge only the reviewed pull request with a normal merge strategy; never force-push or rewrite history.
3. Build and deploy only through the repository's documented release scripts and configured targets; do not improvise remote shell mutations.
4. Capture the full merged commit SHA, verify every public target exposes that exact revision, and run the production smoke and UX-smoke checks.
5. If a release check fails, use the repository's documented atomic rollback mechanism and report a sanitized failure summary.
6. Never publish infrastructure identifiers, credentials, raw responses, or private deployment logs.

## Required commands

Use Node.js 22 when available. Before proposing a pull request, run:

```bash
npm ci
npm test
```

For upstream-only investigation, also run:

```bash
npm run upstreams:check
npm run check:freshness
```

For a proposed live-verification plan, validate the command without network mutation first:

```bash
npm run verify:iran:dry
```

Generated outputs must be produced through repository scripts, normally:

```bash
npm run generate
```

Do not hand-edit generated sections.

## Pull-request policy

- One provider or one coherent automation change per PR whenever practical.
- Use a non-default branch such as `agent/provider-<id>-<date>`.
- Open as a draft unless every required gate passes and the evidence is complete.
- Include: source URLs, checked date, evidence class, files changed, tests run, limitations, and any human-only follow-up.
- Never claim that a provider works from Iran unless a sanitized direct-Iran result satisfies the repository's verification contract.
- Merge is permitted only through the controlled-release procedure after explicit repository-owner authorization.

## Scheduled-job policy

Unattended jobs are read-only by default. They may detect documentation drift, run repository checks, and write sanitized local reports. A scheduled job may prepare a patch or draft PR only when:

- it uses this repository as its explicit working directory;
- `npm test` passes;
- no secret or private evidence is included;
- no live network-location claim is changed;
- no production or deployment command is run unless a repository owner has explicitly authorized the controlled-release procedure in the active conversation.

When uncertain, create an issue/report with `unknown` status instead of changing provider data.

## Definition of done

A task is complete only when:

- the evidence supports the exact claim;
- generated files are synchronized;
- `npm test` passes;
- privacy-sensitive output is absent;
- limitations and unresolved conflicts are documented;
- the result is presented for human review as a draft PR or sanitized report, unless an explicitly authorized controlled release has completed with revision verification and production smoke checks.
