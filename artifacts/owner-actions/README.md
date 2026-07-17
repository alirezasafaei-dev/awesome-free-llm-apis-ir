# Owner Action Packets — Content Package Index

## Current status

- GitHub Release `v0.1.0-seo`: published
- GitHub Discussions: disabled / owner action required
- External channels: not yet published unless a real Public URL is recorded in `docs/LAUNCH_LOG.md`
- Demo: script and secure recording runbook ready; video asset still required
- Measurement: 24h, 72h and 7d runbook ready

## Core operator files

- Hermes prompt: `docs/HERMES_LAUNCH_EXECUTION_PROMPT.fa.md`
- Launch Log: `docs/LAUNCH_LOG.md`
- Demo script: `docs/DEMO_SCRIPT.fa-en.md`
- Secure recording: `DEMO_RECORDING.md`
- Measurement: `MEASUREMENT.md`

## Recommended order

1. Verify existing GitHub Release URL.
2. Enable/publish GitHub Discussion if owner chooses.
3. LinkedIn فارسی.
4. Telegram official channel.
5. X فارسی یا Thread.
6. Instagram Carousel and Story.
7. Virgool.
8. Record and approve Demo.
9. Instagram Reel, YouTube and Aparat.
10. LinkedIn English.
11. Reddit after per-community review.
12. Hacker News only with owner-written, non-AI-edited text.
13. Product Hunt only after eligibility gate; default is defer while primarily a directory/list.
14. Personalized outreach, one recipient per approval.

## File index

| File | Channel | Default state | UTM source |
|---|---|---|---|
| `GITHUB_RELEASE.md` | GitHub Release | PUBLISHED/VERIFY | github |
| `GITHUB_DISCUSSION.md` | GitHub Discussion | OWNER_BLOCKED | github |
| `LINKEDIN.md` | LinkedIn | DRAFT_READY | linkedin |
| `X.md` | X | DRAFT_READY | x |
| `TELEGRAM.md` | Telegram | DRAFT_READY | telegram |
| `INSTAGRAM.md` | Carousel/Story/Reel | ASSET_REQUIRED/DEMO_REQUIRED | instagram |
| `VIRGOOL.md` | Virgool | DRAFT_READY | virgool |
| `YOUTUBE_APARAT.md` | YouTube/Aparat | DEMO_REQUIRED | youtube/aparat |
| `PRODUCT_HUNT.md` | Product Hunt | DEFER_NOT_ELIGIBLE | producthunt |
| `HACKER_NEWS.md` | Hacker News | HUMAN_REWRITE_REQUIRED | hackernews |
| `REDDIT.md` | Reddit | COMMUNITY_REVIEW | reddit |
| `OUTREACH.md` | Direct outreach | PER_RECIPIENT_APPROVAL | none/public-link only |

## Common publication workflow

1. `git pull --ff-only origin main`
2. `npm ci && npm test && npm run site:build`
3. Validate counts from Catalog/Build.
4. `npm run launch:links:test`
5. Prepare Draft and assets.
6. Show Account, Destination, text, asset and UTM.
7. Receive independent approval for that exact action.
8. Publish only that action.
9. Open public page and extract real Public URL.
10. Record UTC and URL in Launch Log.
11. `npm run launch:log:test && npm test`
12. Commit Log on a separate branch and open Draft PR.
13. Follow `MEASUREMENT.md` for 24h, 72h and 7d.

## Approval template

```text
APPROVE_CHANNEL=
ACCOUNT_DISPLAY_NAME=
DESTINATION=
LANGUAGE=
FINAL_TEXT_SHA256=
ASSETS=
UTM_URL=
IRREVERSIBLE_ACTION=
```

Approval does not transfer between channels or publication types.

## Evidence template

```text
CHANNEL=
LAUNCH_ID=
PUBLIC_URL=
PUBLISHED_AT_UTC=
ACCOUNT_DISPLAY_NAME=
UTM_SOURCE=
CAMPAIGN=
ASSET_PATHS=
LOG_PR_URL=
24H_DUE=
72H_DUE=
7D_DUE=
```

## Prohibited

- Cookie, Password, Token or Session export
- Dashboard screenshots or PII in Repository
- Mass-posting, Mass-DM, BCC, vote solicitation or coordinated upvotes
- Guessed metrics
- Treating VPN/foreign-host results as direct-Iran evidence
- Claiming `PUBLISHED` without a public URL
