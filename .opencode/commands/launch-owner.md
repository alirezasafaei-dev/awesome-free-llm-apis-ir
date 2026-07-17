---
description: Prepare one owner-authenticated publication and stop before the irreversible action
agent: launch-operator
---

Prepare exactly one owner-authenticated publication for the channel named by the user.

Rules:

1. Run `/launch-preflight` first or verify that a current successful preflight exists for the same repository revision.
2. Read the matching file under `artifacts/owner-actions/` and the corresponding row in `docs/LAUNCH_LOG.md`.
3. Derive counts from repository data. Do not reuse stale hardcoded counts.
4. Validate the final UTM URL.
5. Show this approval preview:

```text
CHANNEL=
LAUNCH_ID=
ACCOUNT_DISPLAY_NAME=
DESTINATION=
LANGUAGE=
FINAL_TEXT=
FINAL_TEXT_SHA256=
ASSETS=
UTM_URL=
IRREVERSIBLE_ACTION=
```

6. Stop before clicking or invoking the irreversible action.
7. Require an exact fresh approval for this channel. A generic “continue” is insufficient.
8. After a human performs or explicitly authorizes the action, verify the public page and capture only:

```text
PUBLIC_URL=
PUBLISHED_AT_UTC=
```

9. Update only the matching Launch Log row on a non-default branch, run Launch Log and full repository tests, and open a draft PR.
10. Never publish multiple channels in one run. Never merge the PR.

Special gates:

- Instagram Carousel, Story, and Reel are independent approvals and independent Launch Log rows.
- YouTube must be staged Private/Unlisted first; Aparat must be saved without public publication first.
- Product Hunt defaults to deferred unless the eligibility gate is explicitly satisfied.
- Hacker News final submission text must be owner-written and not AI-edited.
- Reddit requires a fresh rule review for the exact subreddit.
- Outreach requires one named recipient and one approval; no bulk send or automated follow-up.
