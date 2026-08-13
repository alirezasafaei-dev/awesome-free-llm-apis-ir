import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { openDiscoverDatabase } from "../services/discover/database.mjs";
import { ValidationError, validateToolInput } from "../services/discover/validation.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "discover-db-test-"));
const databasePath = path.join(root, "discover.sqlite3");

function sample(overrides = {}) {
  return {
    slug: "vibe-ai",
    name: "Vibe AI",
    short_description_fa: "دستیار هوش مصنوعی برای چت و ساخت محتوا",
    description_fa: "ابزاری که قبل از معرفی توسط PersianToolbox تست شده است.",
    destination_url: "https://example.com/vibe",
    platform: "android",
    category: "assistant",
    capabilities: ["chat", "image", "code"],
    badges: ["تست‌شده", "فارسی"],
    access_note_fa: "جزئیات دسترسی را قبل از استفاده بررسی کن.",
    cta_label_fa: "دانلود و استفاده",
    featured: false,
    sort_order: 20,
    published: false,
    last_tested_date: "2026-08-13",
    ...overrides
  };
}

try {
  const repository = openDiscoverDatabase(databasePath);
  try {
    const draft = repository.createTool(sample());
    assert.equal(draft.slug, "vibe-ai");
    assert.equal(draft.published, false);
    assert.deepEqual(draft.capabilities, ["chat", "image", "code"]);
    assert.deepEqual(repository.listPublishedTools(), []);

    const normal = repository.createTool(sample({ slug: "normal-tool", name: "Normal Tool", destination_url: "https://example.com/normal", published: true, sort_order: 5 }));
    const featured = repository.createTool(sample({ slug: "featured-tool", name: "Featured Tool", destination_url: "https://example.com/featured", published: true, featured: true, sort_order: 100 }));
    assert.deepEqual(repository.listPublishedTools().map((tool) => tool.id), [featured.id, normal.id]);

    const updated = repository.updateTool(draft.id, { ...sample(), name: "Vibe AI Updated", published: true, featured: true, sort_order: 1 });
    assert.equal(updated.name, "Vibe AI Updated");
    assert.equal(updated.published, true);
    assert.equal(repository.listAdminTools().length, 3);

    assert.throws(() => repository.createTool(sample({ slug: "normal-tool", destination_url: "https://example.com/duplicate" })), /slug/i);
    assert.equal(repository.deleteTool(normal.id), true);
    assert.equal(repository.deleteTool(normal.id), false);
    assert.equal(repository.listAdminTools().length, 2);
  } finally {
    repository.close();
  }

  for (const destination_url of ["http://example.com/tool", "javascript:alert(1)", "https://user:password@example.com/tool", "file:///tmp/tool"]) {
    assert.throws(() => validateToolInput(sample({ destination_url })), ValidationError);
  }
  assert.throws(() => validateToolInput(sample({ last_tested_date: "13/08/2026" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ featured: "yes" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ unexpected: "field" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ slug: "Bad Slug" })), ValidationError);
  assert.throws(() => validateToolInput(sample({ name: "x".repeat(161) })), ValidationError);

  const normalized = validateToolInput(sample({ capabilities: [" chat ", "image", "chat"], badges: [" فارسی ", "فارسی"] }));
  assert.deepEqual(normalized.capabilities, ["chat", "image"]);
  assert.deepEqual(normalized.badges, ["فارسی"]);
  console.log("Discover SQLite/validation contract passed.");
} finally {
  await rm(root, { recursive: true, force: true });
}

await import("./test-discover-api.mjs");
