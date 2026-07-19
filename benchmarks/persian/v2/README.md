# Comprehensive Persian AI Benchmark 2026 (v2)

This benchmark evaluates free LLM APIs on Persian language tasks using deterministic scoring — no LLM-as-judge, no paid grader. Every answer is either correct or not based on exact, normalized, numeric, or JSON-equality rules.

## What it measures

20 prompts across 7 categories:

| Category | Prompts | What it tests |
|---|---|---|
| instruction_following | 3 | Adherence to precise formatting instructions in Persian |
| reading_comprehension | 3 | Understanding short Persian passages and extracting facts |
| numeric_reasoning | 3 | Arithmetic and percentage calculations with Persian numerals |
| structured_output | 3 | Generating valid JSON from Persian descriptions |
| persian_text | 3 | Correct Persian script (digits, half-spaces, Arabic character normalization) |
| translation | 3 | Persian↔English translation accuracy (new in v2) |
| context_retrieval | 2 | Extracting multiple facts from longer Persian passages (new in v2) |

## What it does NOT measure

- Creative writing, literary quality, or style
- General knowledge beyond what is in the prompt
- Safety, bias, or alignment
- Multi-turn conversation

## How to run

Set environment variables in `.env`:

```dotenv
BENCHMARK_PROVIDER_ID=groq
BENCHMARK_API_BASE_URL=https://api.groq.com/openai/v1
BENCHMARK_API_KEY=...
BENCHMARK_MODEL=llama-3.1-8b-instant
```

Then:

```bash
npm run benchmark:v2:validate
npm run benchmark:v2:dry
npm run benchmark:v2:run
```

To run specific prompts or specify output:

```bash
npm run benchmark:v2:run -- --prompts=instruction-01,trans-01 --output=benchmarks/results/local/my-run.json
```

Results are saved to `benchmarks/results/local/` and gitignored by default.

## Interpreting results

- **Score = passed / scored × 100**. Only prompts that received a valid response count toward scoring.
- **Network errors and timeouts** do not count as zero points — they make the run incomplete.
- **Temperature must be 0** and all prompts must execute for a valid leaderboard entry.
- Per-category breakdown reveals specific strengths (e.g., strong at JSON but weak at Persian script).

## Comparison with v1

| Aspect | v1 | v2 |
|---|---|---|
| Total prompts | 15 | 20 |
| Categories | 5 | 7 |
| Translation | — | 3 prompts (Persian↔English) |
| Context retrieval | — | 2 prompts (long passage, multi-fact) |
| Existing categories | instruction_following, reading_comprehension, numeric_reasoning, structured_output, persian_text | Same 5 + 2 new |
| README language | Persian only | English (this file) |

v2 is a superset of v1's coverage. Results from v1 and v2 should not be compared directly due to different prompt sets.

## Publication rules

1. The `manifest.json` and `prompts.json` of the exact version must not be modified.
2. Provider name and exact model identifier are required.
3. Temperature must be 0; all prompts must execute.
4. Network failure or rate limiting does not yield a zero score — the run is incomplete and must not appear in a leaderboard.
5. Full raw JSON report must accompany any published result.

License: MIT
