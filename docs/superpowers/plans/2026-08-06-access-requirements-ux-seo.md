# Access and Account Requirement Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present Iran connection method and account prerequisites as separate, plain-language facts across the catalog, Finder, Compare, Provider pages, SEO metadata, and generated documentation.

**Architecture:** Add a pure shared presentation module that derives connection and account-requirement labels from canonical provider data. Keep `iran_access.status` focused on observed connection behavior, use the existing `free_tier.requires_payment_method` for payment-card requirements, and add structured `signup_requirements` only for non-payment prerequisites such as a foreign mobile number or identity verification. All browser and build renderers consume the same module.

**Tech Stack:** Node.js 20+, browser ES modules, JSON Schema draft 2020-12, static HTML/CSS, GitHub Actions.

## Global Constraints

- Never describe a provider that works through VPN as blocked; Persian copy must say `متصل با فیلترشکن`.
- A payment-card requirement must be shown as `نیاز به کارت بانکی بین‌المللی`, not as network or signup blocking.
- A foreign-phone requirement must be shown as `نیاز به شماره موبایل خارجی`, not as network or signup blocking.
- Connection method and account prerequisites must be separate UI facts.
- No unsupported inference, credential, or regional claim may be introduced.
- Generated README, catalog, data, sitemap, and provider pages must remain synchronized.
- All changes must be test-first and all CI gates must pass before merge.

---

### Task 1: Lock the presentation contract

**Files:**
- Create: `scripts/test-provider-presentation-semantics.mjs`
- Modify: `package.json`
- Modify: `scripts/run-test-phase.mjs`

**Interfaces:**
- Consumes: canonical Provider objects.
- Produces: failing expectations for `connectionPresentation(provider, locale)` and `accountRequirementPresentation(provider, locale)` exported by `site/provider-presentation.js`.

- [ ] **Step 1: Write failing tests for VPN, card, foreign phone, identity verification, and ordinary direct access.**
- [ ] **Step 2: Register the test in the Product CI phase and aggregate test command.**
- [ ] **Step 3: Run the Product phase and verify failure because the shared module does not exist.**
- [ ] **Step 4: Commit the red test.**

### Task 2: Add shared presentation semantics

**Files:**
- Create: `site/provider-presentation.js`
- Modify: `site/app.js`
- Modify: `site/api-finder/finder-core.js`
- Modify: `site/en/api-finder/finder-core.js`
- Modify: `site/compare/compare.js`
- Modify: `site/en/compare/compare.js`
- Modify: `site/quick-start/provider-context.js`
- Modify: `site/en/quick-start/provider-context-en.js`

**Interfaces:**
- Produces: `connectionPresentation`, `accountRequirementPresentation`, `freeTierLabel`, and `serviceTypeLabel`.
- Returns: `{ label, shortLabel, ariaLabel, tone, status }` for connection and `{ label, shortLabel, ariaLabel, tone, requirements }` for account prerequisites.

- [ ] **Step 1: Implement the smallest pure module that satisfies the failing tests.**
- [ ] **Step 2: Replace duplicated user-facing access labels in browser surfaces with shared semantics.**
- [ ] **Step 3: Render connection and account prerequisite as separate facts wherever both are available.**
- [ ] **Step 4: Run the focused test and Product phase until green.**
- [ ] **Step 5: Commit the implementation.**

### Task 3: Structure non-payment signup requirements

**Files:**
- Modify: `schema/provider.schema.json`
- Modify: `scripts/validate.mjs`
- Modify: `data/providers/freetheai.json`
- Modify: `data/providers/siliconflow.json`
- Modify: `data/providers/nvidia-nim.json`
- Modify: `data/providers/modelscope.json`
- Modify: `data/providers/vercel-ai-gateway.json`

**Interfaces:**
- Produces optional `signup_requirements: string[]` using `foreign_mobile_number`, `identity_verification`, and `account_activation`.

- [ ] **Step 1: Add failing schema/data assertions for structured signup requirements.**
- [ ] **Step 2: Extend the schema and validator.**
- [ ] **Step 3: Migrate only records with dated evidence.**
- [ ] **Step 4: Run validation, privacy, normalization, and data contracts.**
- [ ] **Step 5: Commit the data migration.**

### Task 4: Align build, SEO, and generated documentation

**Files:**
- Modify: `scripts/build-site.mjs`
- Modify: `scripts/build-guides.mjs`
- Modify: `scripts/generate-readme.mjs`
- Modify: `scripts/generate-data-json.mjs`
- Modify: relevant UI/SEO contract tests.

**Interfaces:**
- Consumes: shared presentation functions and canonical provider data.
- Produces: plain-language metadata, provider descriptions, README rows, and public machine data with separate connection/account labels.

- [ ] **Step 1: Add failing final-artifact assertions.**
- [ ] **Step 2: Replace blocked-oriented public copy with connection and prerequisite copy.**
- [ ] **Step 3: Ensure SEO descriptions do not imply regional blocking when the evidence is an account prerequisite.**
- [ ] **Step 4: Regenerate public outputs and verify exact parity.**
- [ ] **Step 5: Commit the build and content alignment.**

### Task 5: Exact-head verification and release

**Files:**
- No source changes unless a failing gate identifies a root cause.

- [ ] **Step 1: Run all required exact-head CI gates.**
- [ ] **Step 2: Inspect every failing job and fix root causes only.**
- [ ] **Step 3: Review open PR threads and final diff.**
- [ ] **Step 4: Mark ready, squash merge with expected head SHA.**
- [ ] **Step 5: Verify exact revision on Global, Iran mirror, and GitHub Pages.**
- [ ] **Step 6: Verify Production Smoke and UX Smoke.**
