import { DatabaseSync } from "node:sqlite";
import { validateToolInput, ValidationError } from "./validation.mjs";

function decode(row) {
  if (!row) return null;
  return {
    id: Number(row.id), slug: row.slug, name: row.name,
    short_description_fa: row.short_description_fa, description_fa: row.description_fa,
    destination_url: row.destination_url, platform: row.platform, category: row.category,
    capabilities: JSON.parse(row.capabilities_json), badges: JSON.parse(row.badges_json),
    access_note_fa: row.access_note_fa, cta_label_fa: row.cta_label_fa,
    featured: Boolean(row.featured), sort_order: Number(row.sort_order), published: Boolean(row.published),
    last_tested_date: row.last_tested_date, created_at: row.created_at, updated_at: row.updated_at
  };
}

function encode(input, createdAt = null) {
  const now = new Date().toISOString();
  return {
    slug: input.slug, name: input.name, short_description_fa: input.short_description_fa,
    description_fa: input.description_fa, destination_url: input.destination_url,
    platform: input.platform, category: input.category,
    capabilities_json: JSON.stringify(input.capabilities), badges_json: JSON.stringify(input.badges),
    access_note_fa: input.access_note_fa, cta_label_fa: input.cta_label_fa,
    featured: input.featured ? 1 : 0, sort_order: input.sort_order, published: input.published ? 1 : 0,
    last_tested_date: input.last_tested_date, created_at: createdAt ?? now, updated_at: now
  };
}

function rethrowConstraint(error) {
  if (String(error?.message ?? "").includes("tools.slug")) throw new ValidationError("slug must be unique", "slug");
  throw error;
}

export function openDiscoverDatabase(databasePath) {
  const db = new DatabaseSync(databasePath, { timeout: 5000 });
  db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  db.exec(`CREATE TABLE IF NOT EXISTS tools (
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
    featured INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0,1)),
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0,1)),
    last_tested_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  ) STRICT;`);
  db.exec("CREATE INDEX IF NOT EXISTS tools_public_order_idx ON tools(published, featured DESC, sort_order ASC, name ASC);");

  const byId = db.prepare("SELECT * FROM tools WHERE id = ?");
  const listAdmin = db.prepare("SELECT * FROM tools ORDER BY featured DESC, sort_order ASC, name COLLATE NOCASE ASC");
  const listPublic = db.prepare("SELECT * FROM tools WHERE published = 1 ORDER BY featured DESC, sort_order ASC, name COLLATE NOCASE ASC");
  const insert = db.prepare(`INSERT INTO tools (
    slug,name,short_description_fa,description_fa,destination_url,platform,category,capabilities_json,badges_json,
    access_note_fa,cta_label_fa,featured,sort_order,published,last_tested_date,created_at,updated_at
  ) VALUES (
    :slug,:name,:short_description_fa,:description_fa,:destination_url,:platform,:category,:capabilities_json,:badges_json,
    :access_note_fa,:cta_label_fa,:featured,:sort_order,:published,:last_tested_date,:created_at,:updated_at
  )`);
  const update = db.prepare(`UPDATE tools SET
    slug=:slug,name=:name,short_description_fa=:short_description_fa,description_fa=:description_fa,
    destination_url=:destination_url,platform=:platform,category=:category,capabilities_json=:capabilities_json,
    badges_json=:badges_json,access_note_fa=:access_note_fa,cta_label_fa=:cta_label_fa,featured=:featured,
    sort_order=:sort_order,published=:published,last_tested_date=:last_tested_date,updated_at=:updated_at
    WHERE id=:id`);
  const removeById = db.prepare("DELETE FROM tools WHERE id = ?");

  return {
    db,
    listPublishedTools: () => listPublic.all().map(decode),
    listAdminTools: () => listAdmin.all().map(decode),
    createTool(payload) {
      const row = encode(validateToolInput(payload));
      try { const result = insert.run(row); return decode(byId.get(Number(result.lastInsertRowid))); }
      catch (error) { return rethrowConstraint(error); }
    },
    updateTool(id, payload) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId < 1) return null;
      const existing = byId.get(numericId);
      if (!existing) return null;
      const row = encode(validateToolInput(payload), existing.created_at);
      delete row.created_at;
      row.id = numericId;
      try { update.run(row); return decode(byId.get(numericId)); }
      catch (error) { return rethrowConstraint(error); }
    },
    deleteTool(id) {
      const numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId < 1) return false;
      return Number(removeById.run(numericId).changes) > 0;
    },
    close: () => db.close()
  };
}
