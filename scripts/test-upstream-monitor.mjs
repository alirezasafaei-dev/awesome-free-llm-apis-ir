import assert from "node:assert/strict";
import { compareSnapshots, validateConfig } from "./check-upstreams.mjs";

const config = {
  schema_version: "1.0.0",
  sources: [
    {
      repository: "owner/repo",
      role: "source_of_record",
      trust_tier: 1,
      classification: "catalog",
      paths: ["README.md"],
      review_policy: "Verify first-party documentation."
    }
  ]
};

assert.equal(validateConfig(config), config);
assert.throws(
  () => validateConfig({ ...config, sources: [{ ...config.sources[0], paths: ["../secret"] }] }),
  /unsafe path/
);
assert.throws(
  () => validateConfig({ ...config, sources: [config.sources[0], config.sources[0]] }),
  /duplicate repository/
);

function source(overrides = {}) {
  return {
    repository: "owner/repo",
    role: "source_of_record",
    trust_tier: 1,
    classification: "catalog",
    default_branch: "main",
    monitored_ref: "main",
    head_sha: "aaaaaaaaaaaaaaaa",
    archived: false,
    disabled: false,
    pushed_at: "2026-07-15T00:00:00Z",
    files: [{ path: "README.md", sha: "11111111", missing: false }],
    ...overrides
  };
}

function snapshot(item = source()) {
  return {
    schema_version: "1.0.0",
    collected_at: "2026-07-15T00:00:00Z",
    source_count: 1,
    sources: [item]
  };
}

const baseline = compareSnapshots(null, snapshot());
assert.equal(baseline.baseline, true);
assert.equal(baseline.meaningful, false);

const unchanged = compareSnapshots(snapshot(), snapshot());
assert.equal(unchanged.meaningful, false);
assert.equal(unchanged.changes.length, 0);

const headOnly = compareSnapshots(snapshot(), snapshot(source({ head_sha: "bbbbbbbbbbbbbbbb" })));
assert.equal(headOnly.meaningful, false);
assert.equal(headOnly.informational.length, 1);
assert.equal(headOnly.informational[0].type, "head_changed_without_monitored_file_change");

const fileChanged = compareSnapshots(
  snapshot(),
  snapshot(source({ head_sha: "bbbbbbbbbbbbbbbb", files: [{ path: "README.md", sha: "22222222", missing: false }] }))
);
assert.equal(fileChanged.meaningful, true);
assert.equal(fileChanged.changes[0].type, "monitored_file_changed");

const fileMissing = compareSnapshots(
  snapshot(),
  snapshot(source({ files: [{ path: "README.md", sha: null, missing: true }] }))
);
assert.equal(fileMissing.meaningful, true);
assert.equal(fileMissing.changes[0].type, "monitored_file_missing");

const archived = compareSnapshots(snapshot(), snapshot(source({ archived: true })));
assert.equal(archived.meaningful, true);
assert.equal(archived.changes[0].type, "archived_changed");

const added = compareSnapshots(
  snapshot(),
  {
    ...snapshot(),
    source_count: 2,
    sources: [source(), source({ repository: "owner/new-repo", head_sha: "cccccccccccccccc" })]
  }
);
assert.equal(added.meaningful, true);
assert.equal(added.changes.at(-1).type, "source_added");

console.log("Upstream monitor tests passed.");
