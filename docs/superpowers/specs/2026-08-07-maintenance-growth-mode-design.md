# Maintenance Freeze + Growth Mode Design

Date: 2026-08-07
Status: Approved for implementation
Repository: `alirezasafaei-dev/awesome-free-llm-apis-ir`
Production baseline: `50d37dcbaf825306e44b0fa258cef92698cbe827`

## 1. Decision

The repository and public website remain active. Product development is frozen for the current phase. The project enters a maintenance-and-growth operating mode focused on SEO, Google Search Console, content distribution, measured organic acquisition, and production reliability.

This is not archival. `main`, CI, deployment, security remediation, factual corrections, and availability fixes remain active.

## 2. Operating Modes

| Area | Mode | Policy |
|---|---|---|
| New providers | FROZEN | No provider expansion during the growth phase unless the owner explicitly reopens development. |
| Product features | FROZEN | No speculative features, redesigns, or roadmap expansion. |
| Existing provider facts | MAINTENANCE | Correct stale or demonstrably wrong facts using the existing evidence contract. |
| Security | ACTIVE / P0 | Security incidents and credential-remediation work remain actionable. |
| Production reliability | ACTIVE / P0 | Fix outages, broken deploys, regressions, bad redirects, indexing defects, privacy defects, and critical performance failures. |
| CI and dependency safety | ACTIVE | Keep validation and release gates healthy; avoid unrelated upgrades. |
| SEO / Search Console | ACTIVE / PRIMARY | Technical SEO, indexing, query analysis, CTR optimization, and internal-link improvements are the primary engineering-adjacent workstream. |
| Content | ACTIVE / PRIMARY | Publish and improve evidence-backed guides around existing catalog data and observed search intent. |
| Distribution / marketing | ACTIVE / PRIMARY | Use UTM-tagged, channel-appropriate, non-spam distribution and measured outreach. |
| Human UX research | DEFERRED | Reopen only when growth data or repeated user failures justify product changes. |
| Benchmark expansion | DEFERRED | No new benchmark program during freeze unless directly required for a growth/content objective. |

## 3. Backlog Policy

### Close as `not planned` / deferred during this phase

Provider expansion and speculative development issues should be closed with a standardized maintenance-freeze note. This includes the provider expansion parent and Wave A verification issues when their purpose is to expand/fully verify the catalog rather than correct an already published false claim.

Current known candidates:

- #226 Provider Expansion 22 -> 50
- #227 Z.AI Wave A verification
- #228 Jina AI Wave A verification
- #229 IBM watsonx.ai Wave A verification
- #230 Pinecone Inference Wave A verification
- #231 Weaviate Embeddings Wave A verification

The existing five providers may remain published with explicit `unknown` values. The freeze must not convert unknown evidence into a positive or negative claim.

### Keep open if genuinely external/security-critical

- #155 Fireworks credential revocation confirmation: remain open until the external provider-dashboard action is actually confirmed, or close only if the owner provides sanitized confirmation that the acceptance criteria are complete.
- Any live production regression, privacy issue, security issue, or indexing defect.

### Reclassify / consolidate into growth mode

Growth-oriented work should become the primary active roadmap instead of being treated as secondary launch cleanup. Existing anchors include:

- #44 Launch/distribution
- #69 Persian Campaign 1
- SEO growth roadmap and content/distribution documentation

Issues whose only remaining work is human UX research, provider-account testing, benchmark expansion, or speculative feature work should be closed/deferred unless they are required to resolve an active security or production correctness defect.

## 4. Growth Strategy

### North Star

Increase qualified organic users who enter from search or trusted distribution, find a relevant guide/provider, and perform a meaningful action such as:

- open a provider page;
- use Finder/Compare/Quick Start;
- click official provider documentation;
- copy an API base URL or implementation pattern;
- visit/star/contribute to the GitHub repository.

### 90-day focus

#### Phase A — Indexing and measurement

- Verify Google Search Console property ownership and primary canonical domain.
- Submit/revalidate the main sitemap.
- Inspect indexing of homepage, guides, provider pages, Finder, Compare, and Quick Start.
- Record exact-date baseline: impressions, clicks, CTR, average position, indexed pages, top queries, top landing pages.
- Treat unavailable access as `UNAVAILABLE — ACCESS REQUIRED`, never as zero.
- Verify Bing Webmaster Tools only after Google baseline is stable.

#### Phase B — Existing-content optimization

Prioritize URLs already receiving impressions. Improve titles, descriptions, introductions, FAQ/structured data, internal links, and intent alignment only when Search Console or analytics evidence justifies the change.

Primary content clusters:

1. Best/free LLM APIs for Iran
2. OpenAI-compatible APIs
3. No-card / free-tier / trial-vs-credit queries
4. Coding and embedding API queries
5. Base URL / SDK migration / fallback tutorials
6. Iran-specific access and verification methodology

Do not manufacture new low-value pages merely to increase URL count.

#### Phase C — Distribution

Primary channels:

- Google organic search
- GitHub README / Releases / Discussions where appropriate
- LinkedIn Persian and English
- Telegram
- Virgool and Persian technical publications
- targeted maintainer/newsletter outreach
- Aparat/YouTube short demo when an existing guide has a clear visual use case

Rules:

- one UTM scheme per channel/campaign;
- no bought links;
- no comment spam;
- no bulk unsolicited messaging;
- no coordinated voting;
- no claims beyond the dated catalog evidence.

#### Phase D — Feedback loop

Every 7 days, collect:

- organic impressions and clicks;
- CTR and average position by landing page/query;
- indexed-page deltas;
- campaign landing events by source;
- guide -> provider/finder/docs conversion events when available;
- GitHub referral/stars/contributions where measurable;
- broken or stale high-traffic pages.

Decisions should come from these measurements, not aesthetic preference.

## 5. Maintenance Change Admission Rules

During the freeze, a code/content change is admitted only if it matches at least one category:

1. Security/privacy remediation.
2. Production availability or release reliability.
3. Incorrect or stale published fact with sufficient evidence.
4. Indexing/canonical/sitemap/structured-data defect.
5. Search Console/analytics-measured SEO improvement.
6. Growth campaign instrumentation or attribution defect.
7. Accessibility/user-flow defect demonstrated by reproducible evidence.

Everything else is deferred unless the owner explicitly reopens product development.

## 6. Release and Safety Rules

- Preserve the evidence classes and `unknown` semantics in `AGENTS.md`.
- Never weaken tests, privacy controls, evidence gates, or deployment safety to simplify maintenance.
- No force push or shared-history rewrite.
- No direct production mutation outside documented release procedures.
- No secret, credential, account artifact, full IP, SSH detail, or private dashboard evidence in issues/docs.
- The Iran mirror remains non-indexable; the primary domain remains the canonical indexable property.

## 7. Implementation Deliverables

Implementation should produce the following repository state:

1. A visible maintenance/growth-mode policy document linked from project documentation.
2. Existing SEO roadmap updated to make product/provider freeze explicit and growth the active roadmap.
3. A 90-day growth execution checklist with Search Console baseline, weekly cadence, content optimization, campaign distribution, and measurement.
4. Provider-expansion issues closed as `not planned` with a consistent freeze note.
5. Non-growth speculative backlog either closed/deferred or explicitly retained only when security/production-critical.
6. Growth issues #44 and #69 retained/reframed as active execution tracks.
7. No provider data modified merely to make the backlog appear complete.
8. No production deployment required unless documentation changes affect the generated/public site.
9. CI/tests verified before merge.

## 8. Definition of Done

The transition is complete when:

- the repository clearly states that product/provider development is frozen;
- the site and repository remain operational and maintainable;
- active backlog contains only growth, SEO, security, factual maintenance, and production reliability work;
- expansion/speculative issues are closed/deferred with context, not silently abandoned;
- Search Console and growth measurement have a concrete execution checklist;
- no unresolved issue is falsely marked complete;
- CI is green for repository changes;
- any owner-account, provider-dashboard, Search Console, social publishing, or VPS-only actions are listed separately as external operator actions.

## 9. Reopening Development

Product development can resume only by an explicit owner decision. At that point, deferred issues may be reopened selectively based on measured user demand, search demand, security needs, or strong provider value. The previous numerical target of 50 providers is not automatically restored.
