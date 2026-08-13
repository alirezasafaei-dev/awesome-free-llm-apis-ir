# Windows 11 Development Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make native Windows 11 development reproducible for this repository while keeping Linux production deployment unchanged.

**Architecture:** Add a PowerShell bootstrap/verification entry point, a deterministic local static server that uses Node only, Windows CI coverage, concise Windows documentation, and an OpenCode owner command for autonomous workstation/server reconciliation. Production scripts remain Linux-specific and are not rewritten.

**Tech Stack:** PowerShell 7/Windows PowerShell, Node.js 22, npm, GitHub Actions, existing Node build/test scripts.

## Global Constraints

- Repository target on owner workstation: `C:\asdev\awesome-free-llm-apis-ir`.
- Node.js 22 is preferred; repository engine floor remains `>=20`.
- Use `npm ci`; do not mutate the lockfile during bootstrap.
- Do not require WSL for normal local development.
- Do not weaken tests or evidence/privacy contracts.
- Production remains Linux/VPS based; local Windows support must not rewrite production deployment semantics.
- Never commit `.env`, credentials, private infrastructure identifiers, or machine-specific state.

---

### Task 1: Native Windows bootstrap

**Files:**
- Create: `scripts/windows/bootstrap.ps1`
- Test manually/CI via PowerShell parse and execution on `windows-latest`.

**Interfaces:**
- Consumes: repository root, Git, Node, npm.
- Produces: verified dependencies, `node_modules`, build output, optional local server launch.

- [ ] Validate OS/tooling and Node major version.
- [ ] Run `npm ci`, `npm test`, `npm run site:build`, and `npm run site:check` with fail-fast diagnostics.
- [ ] Support switches to skip tests/build or launch the local site without modifying repository state.
- [ ] Return non-zero on failures and print a compact final status.

### Task 2: Dependency-free local site server

**Files:**
- Create: `scripts/serve-site.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `.site-dist`.
- Produces: localhost-only HTTP server, default port `4173`.

- [ ] Add a Node HTTP static server with path traversal protection and common MIME types.
- [ ] Bind to `127.0.0.1` by default.
- [ ] Add `npm run site:serve`.
- [ ] Make missing `.site-dist` fail with a clear build instruction.

### Task 3: Windows CI smoke gate

**Files:**
- Create: `.github/workflows/windows-smoke.yml`

**Interfaces:**
- Consumes: repository scripts on `windows-latest`, Node 22.
- Produces: evidence that install, tests, build and site checks execute natively on Windows.

- [ ] Checkout repository with pinned official actions.
- [ ] Setup Node 22 with npm cache.
- [ ] Run `npm ci`, `npm test`, `npm run site:build`, `npm run site:check`.
- [ ] Run PowerShell syntax validation for bootstrap script.

### Task 4: Windows documentation and line endings

**Files:**
- Create: `docs/WINDOWS11_DEVELOPMENT.fa.md`
- Create: `.gitattributes`

**Interfaces:**
- Produces: one-page setup/recovery runbook and stable cross-platform text checkout behavior.

- [ ] Document clone path, bootstrap command, local URL, Git safety and environment rules.
- [ ] Keep deployment/VPS instructions explicitly separate.
- [ ] Normalize repository text files to LF while preserving binary assets.

### Task 5: OpenCode owner operator command

**Files:**
- Create: `.opencode/commands/owner-yolo.md`

**Interfaces:**
- Consumes: explicit repository-owner invocation and available workstation/server credentials.
- Produces: autonomous end-to-end reconciliation with verification and rollback discipline.

- [ ] Instruct the agent to inspect first, then execute workstation setup, tests/build, GitHub state, and documented server health/release operations when authorized and reachable.
- [ ] Prefer fixing root causes over asking repeated questions.
- [ ] Preserve hard boundaries: no secrets in Git/output, no force-push/history rewrite, backups before destructive server changes, rollback on failed release verification.
- [ ] Require one final evidence report instead of incremental prompting.

### Task 6: Verification

- [ ] Review diff for machine-specific or secret material.
- [ ] Use GitHub Actions Windows job as the native-Windows execution proof.
- [ ] Open a draft PR with exact limitations and wait for CI evidence before merge.
