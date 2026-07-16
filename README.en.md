# Awesome Free LLM APIs IR

A free, Persian-first, machine-readable catalog of free LLM APIs, focused on quotas, token limits, payment requirements, direct access from Iranian IP addresses, and separately verified VPN access.

Website: [llm.persiantoolbox.ir](https://llm.persiantoolbox.ir/) · Iran mirror: [ir.llm.persiantoolbox.ir](https://ir.llm.persiantoolbox.ir/) · [GitHub Pages fallback](https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/)

> [!IMPORTANT]
> A free tier does not imply availability in Iran. Direct and VPN results are never conflated: every VPN report records its route and exit country. `Unknown` means there is not enough evidence; it does not mean the service works.

The canonical catalog is in [`data/providers`](data/providers), validated against [`schema/provider.schema.json`](schema/provider.schema.json). A **separate tools catalog** for proxies, session bridges, and routers lives in [`data/tools`](data/tools) with its own schema at [`schema/tool.schema.json`](schema/tool.schema.json), aggregated into [`catalog-tools.json`](catalog-tools.json). The main [Persian README](README.md) contains the generated summary table and contribution guidance.

## Current status

Live counts are intentionally not duplicated in this document because static counters become stale as the catalog changes. Use the machine-readable sources instead:

- [`catalog.json`](catalog.json) — provider count and full canonical provider records
- [`data.json`](data.json) — compact website/client projection
- [`catalog-tools.json`](catalog-tools.json) — independent tools count and records
- [`data/upstreams.json`](data/upstreams.json) — watched upstream repositories
- [`data/repository-audits.json`](data/repository-audits.json) — Add / Watch / Reject audit decisions
- [`data/verification-backlog.json`](data/verification-backlog.json) — remaining unknown providers, blockers, execution tracks, and tracking issues
- [`docs/ROADMAP.en.md`](docs/ROADMAP.en.md) — current phases, gaps, and acceptance criteria

## Principles

- Official documentation for quota claims
- Dated evidence for Iran access claims
- Separate labels for direct access, VPN access, and official regional policy
- No API keys, full IP addresses, infrastructure usernames, or personal data in published files, issues, or pull requests
- Machine-readable, website-ready data
- Stale-data warnings instead of silent assumptions
- Public schema and executable validation must describe the same contract

## Quick start

```bash
npm install
npm test
npm run validate
npm run providers:normalize
npm run privacy:test
npm run verification:backlog:test
npm run generate
```

## Related

- [`docs/ROADMAP.en.md`](docs/ROADMAP.en.md) — canonical roadmap
- [`docs/VERIFICATION_BACKLOG.fa.md`](docs/VERIFICATION_BACKLOG.fa.md) — executable remaining-work backlog (Persian)
- [`catalog-tools.json`](catalog-tools.json) — separate tools/proxies/bridges catalog
- [`data/upstreams.json`](data/upstreams.json) — watched upstream repositories
- [`docs/TOOLS_CATALOG.fa.md`](docs/TOOLS_CATALOG.fa.md) — tools catalog documentation (Persian)
- [`docs/IRAN_LIVE_VERIFICATION.fa.md`](docs/IRAN_LIVE_VERIFICATION.fa.md) — Iran live test guide and results (Persian)
- [`docs/GITHUB_REPOSITORY_AUDITS.fa.md`](docs/GITHUB_REPOSITORY_AUDITS.fa.md) — repository-audit methodology and decisions (Persian)

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [the Persian methodology](docs/METHODOLOGY.fa.md) for evidence rules.
