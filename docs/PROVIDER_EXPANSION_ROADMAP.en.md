# Provider Expansion Roadmap

Last reviewed: 2026-08-05

## Objective

Grow the number of accepted providers from **22** to at least **50** with real evidence.

> **Important:** Documentary research alone is insufficient for provider acceptance. Every provider must have at least one successful authenticated inference request.

## Research Date

2026-08-05

## Baseline

| Metric | Value |
|---|---|
| Current provider count in catalog | 22 |
| Target | ≥ 50 |
| Screened candidates | 33 |
| Remaining gap | ≥ 28 |

## Acceptance Criteria

A provider counts toward 50 only when **all** of the following pass:

| Criterion | Description |
|---|---|
| `OFFICIAL_DOCUMENTED_API` | A public API documented in official documentation exists |
| `AUTHORIZED_AUTH_FLOW` | An authorized, repeatable authentication flow exists |
| `AUTHENTICATED_INFERENCE` | At least one successful authenticated inference request completed |
| `QUALIFYING_FREE_ACCESS` | Qualifying free access (non-trial or explicitly labeled trial) exists |
| `OFFICIAL_PRICING_OR_QUOTA_SOURCE` | Official pricing or quota source recorded |
| `EXACT_MODEL_OR_CAPABILITY_RECORDED` | Exact model or capability recorded |
| `LIMITS_RECORDED_WITHOUT_GUESSING` | Limits recorded without guessing |
| `PAYMENT_AND_KYC_STATUS_RECORDED_OR_UNKNOWN` | Payment and KYC status recorded or `unknown` |
| `PRIVACY_VALIDATION` | Privacy requirements met |
| `GENERATED_OUTPUTS_SYNCED` | Generated outputs synchronized |
| `CI` | All CI tests pass |

### Iran Status

Iran status is recorded **separately** and only after paired testing:

```text
IRAN_STATUS=unknown
```

Paired testing requires:
- `country=IR, route=direct`
- `country=non-IR, route=direct`

Within a comparable test window.

## Free-Access Type Taxonomy

| Type | Description | Ranking Priority |
|---|---|---|
| `permanent_allowance` | Permanent free quota without expiry | High |
| `free_models` | Free models without payment requirement | High |
| `community_funded` | Community-funded | High |
| `host_your_own_compute_credit` | Self-hosted compute credit | High |
| `recurring_credit` | Recurring periodic credit | Medium |
| `monthly_credit` | Monthly free credit | Medium |
| `one_time_credit` | One-time credit | Low |
| `time_limited_credit` | Time-limited credit | Low |
| `conditional_program` | Conditional program | Low |
| `trial` | Trial period | Low |

## Service-Type Taxonomy

| Type | Description | In Main Catalog |
|---|---|---|
| `official_provider` | Official model creator service | ✅ |
| `official_gateway` | Official gateway with public documentation | ✅ |
| `community_gateway` | Community-hosted gateway with published API | ✅ with label |
| `managed_model_hosting` | Managed model hosting | ✅ |
| `integrated_inference` | Integrated inference | ✅ |
| `session_bridge` | Session/Cookie to API conversion | ❌ |
| `self_hosted` | Self-hostable software | ❌ |

> **Important:** `managed_model_hosting` must not be described as an instant drop-in gateway unless official evidence proves otherwise.

## Execution Waves

### Wave A — Immediate Priority

| Provider | Expected Service Type | Expected Free-Access Type | Status |
|---|---|---|---|
| Z.AI | official_gateway | free_models | candidate |
| Jina AI | official_provider | free_models | candidate |
| IBM watsonx.ai | official_provider | recurring_credit | candidate |
| Pinecone Inference | official_gateway | free_models | candidate |
| Weaviate Embeddings | official_provider | free_models | candidate |

### Wave B — Persistent Access or Recurring Hosting Credit

| Provider | Expected Service Type | Expected Free-Access Type |
|---|---|---|
| Ollama Cloud | managed_model_hosting | community_funded |
| ElevenLabs | official_provider | free_models |
| Modal | managed_model_hosting | host_your_own_compute_credit |
| Beam | managed_model_hosting | host_your_own_compute_credit |
| Roboflow | official_provider | free_models |
| AI Horde | community_gateway | community_funded |
| Bytez | official_gateway | free_models |
| Pollinations | official_provider | free_models |

> **Important:** `Modal` and `Beam` must be classified as `managed_model_hosting` unless current official evidence proves a different service type.

### Wave C — New Gateways Requiring Enhanced Provenance Review

| Provider | Expected Service Type |
|---|---|
| AINative Studio | official_gateway |
| ZyloAI | official_gateway |
| BazaarLink | official_gateway |
| Speka | official_gateway |
| ApiFreeLLM | community_gateway |
| InferGrove | official_gateway |

**Enhanced review for every Wave C candidate requires:**

- Operator identity
- Terms and Privacy
- Retention and training policy
- Authenticated model listing
- Model provenance
- Silent model substitution
- Usage token consistency
- Quota metering
- Reset behavior
- Post-quota behavior
- Accidental overage risk
- Rate-limit headers
- Stability across multiple normal test windows

> **Important:** Do not stress test third-party infrastructure.

### Wave D — Trial, One-Time Credit, or Conditional Program

| Provider | Expected Service Type |
|---|---|
| Alibaba Cloud Model Studio | official_provider |
| Mixedbread | official_provider |
| AssemblyAI | official_provider |
| Deepgram | official_provider |
| Voyage AI | official_provider |
| Eden AI | official_gateway |
| Stability AI Platform | official_provider |
| Baseten | managed_model_hosting |
| AI21 Labs | official_provider |
| Novita AI | official_gateway |
| Bento Inference Platform | managed_model_hosting |
| Nebius Builder Program | managed_model_hosting |
| KushCompute Embeddings | official_provider |
| Clarifai | official_provider |

> **Important:** These may only be cataloged with explicit trial/credit/conditional labeling and lower ranking than persistent free tiers.

## Rejected Candidates

These should not enter active onboarding without new official evidence:

| Provider | Reason | Research Date |
|---|---|---|
| Together AI | Does not offer persistent free tier | 2026-08-05 |
| Chutes | Persistent free level not documented | 2026-08-05 |
| Nscale | Persistent free tier not documented | 2026-08-05 |
| Nebius Standard Token Factory | Initial trial only | 2026-08-05 |
| Nomic Atlas Starter | Limited to playgrounds | 2026-08-05 |
| Segmind | Persistent free API tier not documented | 2026-08-05 |
| Replicate | Payment required | 2026-08-05 |
| DeepInfra | Upfront payment required | 2026-08-05 |

> **Note:** This is not permanent rejection. Re-evaluate when new official evidence emerges.

## Evidence Boundaries

### Accepted evidence

- Official provider documentation (pricing, quota, models)
- Successful authenticated live test
- Direct Iran test (with date, ASN, and proof)
- VPN test from abroad (with exit country)
- Successful signup and credential issuance
- Authenticated model listing

### Not accepted as evidence

- Network reachability alone
- HTTP 401/403/404 alone
- Successful DNS alone
- Signup success alone (without model test)
- Community claims or reports without dated proof
- Foreign host test result as Iran access

## Repository Workflow

### PR Structure

1. **PR 1 — Roadmap and infrastructure:** Expansion roadmaps, main roadmap links, parent/Wave A Issue references, schema extensions, candidate backlog, verification harness dry-run, contract tests, ranking safeguards
2. **Subsequent PRs:** One provider per PR, unless multiple records are technically identical and share the same evidence path

### Rules

- A provider is accepted only after real evidence exists
- Iran status is recorded separately
- Account info, keys, full IPs, and private responses are never published
- Generated outputs must be rebuilt in CI

## Definition of Done

A provider is considered "done" only when:

- [ ] Official API and Pricing documentation reviewed
- [ ] Signup and payment status recorded
- [ ] Credential issued
- [ ] Model listing (if supported) reviewed
- [ ] At least one low-volume authenticated inference succeeded
- [ ] Metering before and after observed
- [ ] Rate-limit headers observed
- [ ] Model/capability used recorded
- [ ] Free-tier persistence type recorded
- [ ] Reset/expiry behavior recorded
- [ ] Foreign-control result recorded
- [ ] Iran result left unknown (unless paired testing completed)
- [ ] Provider JSON record updated
- [ ] Generated outputs rebuilt
- [ ] `npm test` passes

## Next Single Action

Verify Z.AI: check official API documentation, free-model documentation, signup status, and credential issuance availability.

## Issue Links

- Parent Issue: `[P0][Provider Expansion] Grow the verified catalog from 22 to 50 providers`
- Issue #33: Complete authenticated inference for account-dependent providers
- Issue #35: Complete Iran vs foreign direct-control matrix
- Issue #114: Complete live intelligence, benchmark and telemetry operations
- Issue #170: Confirm revocation/validity of AI Router

> **Important:** AI Router must not be duplicated. If a provider already exists in the catalog, do not create a separate record.
