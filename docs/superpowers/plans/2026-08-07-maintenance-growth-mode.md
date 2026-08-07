# Maintenance + Growth Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze product/provider expansion while keeping the repository and production site active, and make SEO, Google Search Console, measured distribution, security, and production reliability the only active workstreams.

**Architecture:** This is an operating-model transition rather than a product feature. Repository policy and public documentation will define the freeze, a dedicated 90-day growth playbook will become the active roadmap, and GitHub issues will be triaged so only growth/SEO, security, factual maintenance, and production reliability remain active. No provider data or production behavior is changed merely to make the backlog look complete.

**Tech Stack:** Markdown documentation, GitHub Issues/PRs, existing Node.js 22 validation/CI, existing production release gates.

## Global Constraints

- Repository and public website remain active; this is not archival.
- New providers are FROZEN until explicit owner reopening.
- Product features and speculative redesign are FROZEN.
- Existing provider facts may be corrected only with the existing evidence contract.
- Security and production reliability remain ACTIVE / P0.
- SEO / Search Console, content, and distribution are ACTIVE / PRIMARY.
- Human UX research and benchmark expansion are DEFERRED.
- Preserve `unknown` semantics; never convert missing evidence into a positive or negative provider claim.
- Preserve privacy, evidence, CI, and deployment safety gates.
- Iran mirror remains non-indexable; the primary domain remains canonical.
- No bought backlinks, comment spam, coordinated voting, bulk unsolicited messaging, secret leakage, or unsupported marketing claims.

---

### Task 1: Publish the operating-mode policy

**Files:**
- Create: `docs/MAINTENANCE_GROWTH_MODE.fa.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: approved design in `docs/superpowers/specs/2026-08-07-maintenance-growth-mode-design.md`
- Produces: one canonical human-facing policy and one agent-facing admission rule for future work

- [ ] **Step 1: Create the Persian operating-mode policy**

Write a concise policy that states: repository/site active; provider and feature expansion frozen; allowed change categories are security/privacy, production reliability, factual corrections, indexing/SEO defects, measured SEO improvements, growth instrumentation, and reproducible accessibility defects; development reopens only by explicit owner decision.

- [ ] **Step 2: Add a current-operating-mode section to `AGENTS.md`**

Insert a section near the mission/allowed workflow that prevents autonomous agents from adding providers, speculative product features, or redesign work during the freeze unless the owner explicitly reopens product development. Keep every existing hard safety boundary unchanged.

- [ ] **Step 3: Validate policy consistency**

Check that the new language does not authorize live Iran/VPN tests, production mutation, secret handling, direct-main pushes, or weaker evidence standards.

- [ ] **Step 4: Commit**

```bash
git add docs/MAINTENANCE_GROWTH_MODE.fa.md AGENTS.md
git commit -m "docs: establish maintenance and growth operating mode"
```

### Task 2: Make Growth the active roadmap

**Files:**
- Modify: `docs/SEO_GROWTH_ROADMAP.fa.md`
- Create: `docs/GROWTH_90_DAY_EXECUTION.fa.md`

**Interfaces:**
- Consumes: operating-mode policy from Task 1 and active GitHub growth issue #235
- Produces: strategic roadmap plus executable 90-day checklist

- [ ] **Step 1: Update the SEO roadmap header and product decision**

Make the 2026-08-07 maintenance/growth decision explicit. State that provider expansion is frozen for the phase and that the numerical 50-provider target is not active.

- [ ] **Step 2: Add the 90-day execution playbook**

Include four phases: Search Console/indexing baseline; existing-content optimization from observed queries; non-spam distribution; weekly measurement loop. Include exact metrics: impressions, clicks, CTR, average position, indexed pages, top queries, top landing pages, campaign source events, guide-to-Finder/provider/docs conversions, GitHub referral/stars/contributions when measurable.

- [ ] **Step 3: Encode missing-access semantics**

Require `UNAVAILABLE — ACCESS REQUIRED` rather than zero whenever Search Console/analytics access is missing.

- [ ] **Step 4: Commit**

```bash
git add docs/SEO_GROWTH_ROADMAP.fa.md docs/GROWTH_90_DAY_EXECUTION.fa.md
git commit -m "docs: promote SEO and measured growth to primary roadmap"
```

### Task 3: Make the freeze visible to maintainers and contributors

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

**Interfaces:**
- Consumes: policy and growth docs from Tasks 1-2
- Produces: visible repository status without changing generated provider-table content

- [ ] **Step 1: Add a maintenance/growth status note to the Persian README**

Place a short note near the introduction explaining that the catalog is in maintenance mode: no planned provider expansion, existing data remains maintained, and current priorities are SEO/discovery, evidence-backed corrections, security, and reliability. Link to `docs/MAINTENANCE_GROWTH_MODE.fa.md` and `docs/GROWTH_90_DAY_EXECUTION.fa.md`.

- [ ] **Step 2: Add the equivalent English note**

Keep the same semantics. Do not manually edit any generated provider table section.

- [ ] **Step 3: Commit**

```bash
git add README.md README.en.md
git commit -m "docs: expose maintenance and growth status"
```

### Task 4: Verify repository documentation changes

**Files:**
- Test: existing repository validation via `npm ci` and `npm test`

**Interfaces:**
- Consumes: Tasks 1-3
- Produces: CI-safe transition branch

- [ ] **Step 1: Install exactly from lockfile**

Run:

```bash
npm ci
```

Expected: success with no lockfile mutation.

- [ ] **Step 2: Run the full repository suite**

Run:

```bash
npm test
```

Expected: PASS across data/content/SEO/product/operations/privacy contracts.

- [ ] **Step 3: Review diff for generated-section drift**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended documentation/policy files changed.

### Task 5: Open and merge the transition PR

**Files:**
- GitHub PR from `agent/maintenance-growth-mode-20260807` to `main`

**Interfaces:**
- Consumes: verified branch from Task 4
- Produces: merged policy on default branch

- [ ] **Step 1: Open a focused PR**

Title: `docs: enter maintenance and growth mode`

PR body must state: no provider data changes; no product behavior changes; product/provider expansion frozen; #235 becomes primary growth track; #155/#195 remain active P0 dependencies; backlog triage occurs after merge.

- [ ] **Step 2: Require repository checks to complete**

Do not merge while any required check is failing or pending.

- [ ] **Step 3: Merge normally after green checks**

Use the repository's normal merge strategy. Never force-push or rewrite shared history.

### Task 6: Triage the development backlog after policy merge

**Files:**
- GitHub issues only

**Interfaces:**
- Consumes: merged operating-mode policy
- Produces: active backlog limited to growth/SEO, security, factual maintenance, and production reliability

- [ ] **Step 1: Close provider-expansion work as `not_planned`**

Add a standardized note and close: #226, #227, #228, #229, #230, #231, #170. The note must say the work is deferred by the 2026-08-07 maintenance/growth decision, may be reopened later, and published `unknown` values remain intentionally unchanged.

- [ ] **Step 2: Close provider-account/network expansion work as `not_planned`**

Close #33 and #35 with a note that additional authenticated provider verification is deferred during the growth phase. Explicitly state that #155 remains open and no credential/regional conclusion is inferred.

- [ ] **Step 3: Close human UX/speculative validation work as `not_planned`**

Close #124, #129, and #197. Explain that human UX research is deferred and may be reopened when Search Console/analytics or repeated user evidence justifies product work.

- [ ] **Step 4: Close mixed external/benchmark issue #114 as `not_planned`**

State that growth telemetry is superseded by #235, provider-account work is deferred, benchmark expansion is deferred, and #155 remains separately active.

- [ ] **Step 5: Close Hermes pilot #41 as `not_planned`**

State that additional automation-host rollout is not required for the current maintenance/growth phase and can be reopened later.

- [ ] **Step 6: Keep critical issues active**

Do not close #155. Do not close #195 while its own documented external security dependency remains unresolved. Keep #44, #69, and #235 open as growth execution tracks.

### Task 7: Clean transition metadata and publish final state

**Files:**
- GitHub issues #236, #237, #238

**Interfaces:**
- Consumes: completed merge and backlog triage
- Produces: no temporary meta clutter

- [ ] **Step 1: Close #237 and #238 as duplicates**

Reference #236 as the canonical transition tracker.

- [ ] **Step 2: Update #236 with completion evidence**

Record merged PR/SHA, list issues closed/deferred, list active issues retained, and list external owner-only blockers.

- [ ] **Step 3: Close #236 as completed**

Only after the transition PR is merged and backlog triage is verified.

### Task 8: Final verification and owner-only handoff

**Files:**
- No repository mutation unless verification reveals a defect

**Interfaces:**
- Consumes: final `main` state and issue state
- Produces: final audit and YOLO operator prompt for inaccessible systems

- [ ] **Step 1: Verify active issue set**

Expected primary active set: #44, #69, #155, #195, #235 plus any newly discovered genuine security/production defect. No provider-expansion or speculative UX issue should remain open.

- [ ] **Step 2: Verify open PRs**

Expected: zero stale/open implementation PRs after transition merge.

- [ ] **Step 3: Verify merged SHA status**

Check combined commit status and applicable workflow runs. Report any documentation-only workflows separately from production exact-revision gates.

- [ ] **Step 4: Produce owner-only YOLO prompt**

Include only actions inaccessible from this environment: Fireworks dashboard revocation/account review (#155); Search Console property/sitemap/indexing baseline; owner-account social publishing for #44/#69; analytics baseline; any VPS/dashboard action still genuinely required. Require sanitized evidence and prohibit secrets/screenshots/private infrastructure details in GitHub.
