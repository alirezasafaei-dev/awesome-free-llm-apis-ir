import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createDiscoverServer } from "../services/discover/server.mjs";

const root = await mkdtemp(path.join(os.tmpdir(), "discover-api-test-"));
const databasePath = path.join(root, "discover.sqlite3");

function sample(overrides = {}) {
  return {
    slug: "vibe-ai",
    name: "Vibe AI",
    short_description_fa: "دستیار هوش مصنوعی برای چت و ساخت محتوا",
    description_fa: "ابزاری تست‌شده برای معرفی در ریلز.",
    destination_url: "https://example.com/vibe",
    platform: "android",
    category: "assistant",
    capabilities: ["chat", "image", "code"],
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
  };
}

async function json(response) {
  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

const app = createDiscoverServer({ databasePath, host: "127.0.0.1", port: 0 });
try {
  await app.start();
  const address = app.server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const sameOriginHeaders = {
    "content-type": "application/json",
    "x-discover-csrf": "1",
    "origin": base,
    "sec-fetch-site": "same-origin"
  };

  const health = await fetch(`${base}/discover/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await json(health), { ok: true });
  assert.equal(health.headers.get("access-control-allow-origin"), null);
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");

  const icon = await fetch(`${base}/discover/api/icons/simple-icons/github.svg`);
  assert.equal(icon.status, 200);
  assert.equal(icon.headers.get("content-type"), "image/svg+xml; charset=utf-8");
  assert.equal(icon.headers.get("x-content-type-options"), "nosniff");
  assert.match(icon.headers.get("cache-control") || "", /max-age=/);
  const iconBody = await icon.text();
  assert.match(iconBody, /^<svg\b/);
  assert.ok(iconBody.includes("<path"));
  assert.ok(!/<script\b|on[a-z]+\s*=|foreignObject/i.test(iconBody));

  const missingIcon = await fetch(`${base}/discover/api/icons/simple-icons/not-a-real-simple-icon-zzzz.svg`);
  assert.equal(missingIcon.status, 404);
  assert.equal(missingIcon.headers.get("access-control-allow-origin"), null);

  const traversalIcon = await fetch(`${base}/discover/api/icons/simple-icons/..%2Fgithub.svg`);
  assert.equal(traversalIcon.status, 404);

  const initialPublic = await fetch(`${base}/discover/api/tools`);
  assert.equal(initialPublic.status, 200);
  assert.deepEqual(await json(initialPublic), { tools: [] });

  const missingCsrf = await fetch(`${base}/discover/api/admin/tools`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(sample())
  });
  assert.equal(missingCsrf.status, 403);

  const wrongContentType = await fetch(`${base}/discover/api/admin/tools`, {
    method: "POST",
    headers: { "x-discover-csrf": "1" },
    body: JSON.stringify(sample())
  });
  assert.equal(wrongContentType.status, 415);

  const crossSite = await fetch(`${base}/discover/api/admin/tools`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-discover-csrf": "1",
      "origin": "https://attacker.example",
      "sec-fetch-site": "cross-site"
    },
    body: JSON.stringify(sample())
  });
  assert.equal(crossSite.status, 403);

  const createdResponse = await fetch(`${base}/discover/api/admin/tools`, {
    method: "POST",
    headers: sameOriginHeaders,
    body: JSON.stringify(sample())
  });
  assert.equal(createdResponse.status, 201);
  const created = await json(createdResponse);
  assert.equal(created.tool.slug, "vibe-ai");
  assert.equal(created.tool.published, false);
  assert.equal(created.tool.icon_provider, "generic");
  assert.equal(created.tool.icon_key, "sparkles");

  const draftsHidden = await json(await fetch(`${base}/discover/api/tools`));
  assert.deepEqual(draftsHidden, { tools: [] });

  const adminList = await json(await fetch(`${base}/discover/api/admin/tools`));
  assert.equal(adminList.tools.length, 1);

  const updatedResponse = await fetch(`${base}/discover/api/admin/tools/${created.tool.id}`, {
    method: "PUT",
    headers: sameOriginHeaders,
    body: JSON.stringify(sample({ published: true, featured: true, name: "Vibe AI Published", icon_provider: "simple-icons", icon_key: "github" }))
  });
  assert.equal(updatedResponse.status, 200);
  const updated = await json(updatedResponse);
  assert.equal(updated.tool.published, true);
  assert.equal(updated.tool.icon_key, "github");

  const publicList = await json(await fetch(`${base}/discover/api/tools`));
  assert.equal(publicList.tools.length, 1);
  assert.equal(publicList.tools[0].name, "Vibe AI Published");
  assert.equal(publicList.tools[0].icon_provider, "simple-icons");

  const invalidUrl = await fetch(`${base}/discover/api/admin/tools/${created.tool.id}`, {
    method: "PUT",
    headers: sameOriginHeaders,
    body: JSON.stringify(sample({ destination_url: "javascript:alert(1)" }))
  });
  assert.equal(invalidUrl.status, 400);
  assert.equal((await json(invalidUrl)).error.code, "validation_error");

  const missingId = await fetch(`${base}/discover/api/admin/tools/999999`, {
    method: "PUT",
    headers: sameOriginHeaders,
    body: JSON.stringify(sample())
  });
  assert.equal(missingId.status, 404);

  const unsupportedMethod = await fetch(`${base}/discover/api/admin/tools/${created.tool.id}`, {
    method: "PATCH",
    headers: sameOriginHeaders,
    body: JSON.stringify(sample())
  });
  assert.equal(unsupportedMethod.status, 405);

  const tooLarge = await fetch(`${base}/discover/api/admin/tools`, {
    method: "POST",
    headers: sameOriginHeaders,
    body: JSON.stringify({ padding: "x".repeat(70 * 1024) })
  });
  assert.equal(tooLarge.status, 413);

  const deleted = await fetch(`${base}/discover/api/admin/tools/${created.tool.id}`, {
    method: "DELETE",
    headers: sameOriginHeaders
  });
  assert.equal(deleted.status, 204);
  assert.equal(await deleted.text(), "");

  const missingRoute = await fetch(`${base}/discover/api/nope`);
  assert.equal(missingRoute.status, 404);

  console.log("Discover HTTP API/security/icon contract passed.");
} finally {
  await app.stop().catch(() => {});
  await rm(root, { recursive: true, force: true });
}

await import("./test-discover-site.mjs");
