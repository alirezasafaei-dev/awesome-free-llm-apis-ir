# Awesome Free LLM APIs IR

A free, Persian-first, machine-readable catalog of free LLM APIs, focused on quotas, token limits, payment requirements, direct access from Iranian IP addresses, and separately verified VPN access.

Website: [llm.persiantoolbox.ir](https://llm.persiantoolbox.ir/) · Iran mirror: [ir.llm.persiantoolbox.ir](https://ir.llm.persiantoolbox.ir/) · [GitHub Pages fallback](https://alirezasafaei-dev.github.io/awesome-free-llm-apis-ir/)

> [!IMPORTANT]
> A free tier does not imply availability in Iran. Direct and VPN results are never conflated: every VPN report records its route and exit country. `Unknown` means there is not enough evidence; it does not mean the service works.

The canonical catalog is in [`data/providers`](data/providers), validated against [`schema/provider.schema.json`](schema/provider.schema.json). A **separate tools catalog** for proxies, session bridges, and routers lives in [`data/tools`](data/tools) with its own schema at [`schema/tool.schema.json`](schema/tool.schema.json), aggregated into [`catalog-tools.json`](catalog-tools.json). The main [Persian README](README.md) contains the generated summary table and contribution guidance.

## Principles

- Official documentation for quota claims
- Dated evidence for Iran access claims
- Separate labels for direct access, VPN access, and official regional policy
- No API keys or personal data in issues or pull requests
- Machine-readable, website-ready data
- Stale-data warnings instead of silent assumptions

```bash
npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [the Persian methodology](docs/METHODOLOGY.fa.md) for evidence rules.
