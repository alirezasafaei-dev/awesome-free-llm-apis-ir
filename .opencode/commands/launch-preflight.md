---
description: Audit the launch state and run repository gates without publishing
agent: launch-operator
---

Perform a launch preflight only. Do not publish, send, submit, deploy, merge, or close anything.

1. Read `AGENTS.md`, `docs/OPENCODE_LAUNCH_EXECUTION_PROMPT.fa.md`, Issue #44 context available in the repository, `docs/LAUNCH_LOG.md`, and `artifacts/owner-actions/README.md`.
2. Inspect the current branch, working tree, latest `main`, open launch-related pull requests, and existing release/discussion state.
3. Run:

```bash
npm ci
npm test
npm run site:build
```

4. Verify:
   - provider and guide counts are derived from repository data;
   - canonical and UTM links pass their tests;
   - Launch Log validation passes;
   - privacy tests pass;
   - no secret, private endpoint, account identifier, or session artifact is introduced;
   - no publication is incorrectly marked `PUBLISHED`.
5. Do not edit files during this command unless the owner separately approves a narrowly-scoped repair.
6. Return an evidence-backed status report and exactly one recommended next action.
