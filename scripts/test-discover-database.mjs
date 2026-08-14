import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { openDiscoverDatabase } from "../services/discover/database.mjs";
import { ValidationError, validateToolInput } from "../services/discover/validation.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "discover-db-test-"));
const sample = (overrides = {}) => ({
  slug: "vibe-ai",
  name: "Vibe AI",
  short_description_fa: "دستیار هوش مصنوعی",
  description_fa: "ابزار تست‌شده",
  destination_url: "https://example.com/vibe",
  platform: "android",
  category: "assistant",
  capabilities: ["chat", "image"],
  badges: ["تست‌شده"],
  icon_provider: "generic",
  icon_key: "sparkles",
  access_note_fa: "",
  cta_label_fa: "باز کردن",
  featured: false,
  sort_order: 10,
  published: false,
  last_tested_date: "2026-08-13",
  ...overrides
});

try {
  const repo = openDiscoverDatabase(path.join(root, "discover.sqlite3"));
  try {
    const draft = repo.createTool(sample());
    assert.equal(draft.published, false);
    assert.equal(draft.icon_provider, "generic");
    assert.equal(draft.icon_key, "sparkles");
    assert.ok(!draft.badges.some((badge) => badge.startsWith("icon:")));
    assert.deepEqual(repo.listPublishedTools(), []);

    const normal = repo.createTool(sample({ slug: "normal", name: "Normal", destination_url: "https://example.com/normal", published: true, sort_order: 1 }));
    const featured = repo.createTool(sample({ slug: "featured", name: "Featured", destination_url: "https://example.com/featured", published: true, featured: true, sort_order: 99 }));
    assert.deepEqual(repo.listPublishedTools().map((tool) => tool.id), [featured.id, normal.id]);
    assert.equal(repo.updateTool(draft.id, { ...sample(), published: true, name: "Updated", icon_provider: "simple-icons", icon_key: "github" }).name, "Updated");
    assert.equal(repo.listAdminTools().find((tool) => tool.id === draft.id).icon_key, "github");
    assert.throws(() => repo.createTool(sample({ slug: "normal", destination_url: "https://example.com/duplicate" })), /slug/i);
    assert.equal(repo.deleteTool(normal.id), true);
  } finally {
    repo.close();
  }

  const legacyPath = path.join(root, "legacy.sqlite3");
  const legacy = new DatabaseSync(legacyPath);
  legacy.exec(`CREATE TABLE tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    short_description_fa TEXT NOT NULL,
    description_fa TEXT NOT NULL DEFAULT '',
    destination_url TEXT NOT NULL,
    platform TEXT NOT NULL,
    category TEXT NOT NULL,
    capabilities_json TEXT NOT NULL DEFAULT '[]',
    badges_json TEXT NOT NULL DEFAULT '[]',
    access_note_fa TEXT NOT NULL DEFAULT '',
    cta_label_fa TEXT NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0,
    last_tested_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;`);
  const now = new Date().toISOString();
  legacy.prepare(`INSERT INTO tools (
    slug,name,short_description_fa,description_fa,destination_url,platform,category,capabilities_json,badges_json,
    access_note_fa,cta_label_fa,featured,sort_order,published,last_tested_date,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    "legacy", "Legacy", "قدیمی", "", "https://example.com/legacy", "web", "assistant", "[]",
    JSON.stringify(["icon:github", "قدیمی"]), "", "باز کردن", 0, 0, 1, null, now, now
  );
  legacy.close();

  const migrated = openDiscoverDatabase(legacyPath);
  try {
    const tool = migrated.listAdminTools()[0];
    assert.equal(tool.icon_provider, "simple-icons");
    assert.equal(tool.icon_key, "github");
    assert.deepEqual(tool.badges, ["قدیمی"]);
    const columns = migrated.db.prepare("PRAGMA table_info(tools)").all().map((row) => row.name);
    assert.ok(columns.includes("icon_provider"));
    assert.ok(columns.includes("icon_key"));
  } finally {
    migrated.close();
  }

  for (const destination_url of ["http://example.com/tool", "file:///tmp/tool"]) {
    assert.throws(() => validateToolInput(sample({ destination_url })), ValidationError);
  }
  assert.throws(() => validateToolInput(sample({ last_tested_date: "13/08/2026" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ featured: "yes" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ icon_provider: "remote" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ icon_key: "https://evil.example/icon.svg" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ unexpected: "field" })), ValidationError);
  console.log("Discover SQLite/validation/icon migration contract passed.");
} finally {
  await rm(root, { recursive: true, force: true });
}

await import("./test-discover-api.mjs");
await import("./test-discover-admin-site.mjs");
await import("./test-discover-proxy-contract.mjs");
await import("./test-discover-service-contract.mjs");
await import("./test-discover-deploy-contract.mjs");
