# Project roadmap

Last reviewed: 2026-07-16

This document defines the main project priorities. The detailed growth plan is maintained in [`docs/SEO_GROWTH_ROADMAP.fa.md`](SEO_GROWTH_ROADMAP.fa.md).

## Current baseline

- 22 providers in the main catalog
- 8 proxies, routers, session bridges, and related tools in the separate catalog
- 9 providers with a successful model request from Iran
- 5 providers with credential-validated geographic blocking
- 2 providers with signup or account-verification barriers
- 1 provider with official lack of Iran support
- 5 providers whose Iran-access status remains unknown
- Schema, validator, privacy, and backlog contracts are enforced in CI

## Strategic decision

The current provider count is sufficient for the first product version. Broad catalog expansion is paused. The primary focus is now:

1. A stable and fast live website
2. Technical SEO and indexability
3. Persian search-intent pages and useful guides
4. Organic-growth measurement
5. Professional distribution of the website and repository

A new provider should be accepted only when it offers distinct practical value, a verified free tier, and complete canonical data.

## P0 — Live website and technical SEO

Status: **in progress**

Primary work:

- Generate a standalone canonical HTML page for every provider
- Generate a dynamic sitemap and crawlable internal links
- Add unique metadata, Open Graph, and structured data
- Keep the canonical domain as the only indexable copy
- Keep the Iran mirror under `noindex`
- Enforce page and sitemap counts in CI
- Register Google Search Console and Bing Webmaster Tools
- Add privacy-friendly analytics and core interaction events
- Monitor coverage, selected canonicals, and Core Web Vitals

Execution track: Issue #42

Exit criteria:

- The homepage and all provider pages are produced by the build
- Every sitemap URL returns a valid response from the canonical domain
- Provider pages are discovered in Search Console
- No duplicate indexable copy exists across deployments
- The first search and analytics baseline is recorded

## P1 — Persian SEO content

Status: **planned**

- Search-intent guides for choosing providers
- Comparison pages generated from canonical catalog data
- Practical guides for OpenAI SDKs, Base URLs, fallback, and key security
- Internal links between guides and provider pages
- Search Console queries used to prioritize future content
- No thin, duplicate, or keyword-stuffed pages

Execution track: Issue #43

## P1 — Repository launch and distribution

Status: **planned**

- Finalize consistent Persian and English positioning
- Produce screenshots, a social card, and a short demo
- Improve README calls to action, GitHub topics, and releases
- Publish through relevant developer channels and Persian technical media
- Conduct targeted outreach for legitimate mentions and backlinks
- Measure each channel with UTM parameters and analytics
- Do not buy backlinks or use comment spam

Execution track: Issue #44

## Data and security maintenance

These tracks continue, but they do not block the growth program unless they introduce a security or data-integrity risk:

- Issue #32: final host hardening
- Issue #33: complete five account-dependent provider tests
- Issue #35: complete the network matrix
- Issue #39: investigate route-specific LLM7.io and OVHcloud timeouts
- Periodic re-checks of limits, models, payment requirements, and signup constraints
- Upstream monitoring and repository audits

Credential validation through a non-Iranian route does not mean that a complete VPN-access matrix has been executed. Endpoint reachability also does not prove successful model execution.

## P2 — Product development

After an indexing and traffic baseline exists:

- Independent Tools and Repository Audits pages
- A catalog change feed
- Interactive comparisons with shareable URLs
- Complete English versions of key pages
- Expand the Persian benchmark only when demand is demonstrated

## Current execution order

1. Complete and deploy the provider-page SEO foundation
2. Execute Issue #42 and record the first search/analytics baseline
3. Publish the first Persian content cluster through Issue #43
4. Execute the launch and distribution package in Issue #44
5. Complete remaining security and verification tracks
6. Build product features based on observed usage data
