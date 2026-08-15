import process from "node:process";

const base = String(process.env.DISCOVER_BASE_URL || "https://llm.persiantoolbox.ir/discover").replace(/\/$/, "");
const user = process.env.DISCOVER_ADMIN_USER || "";
const password = process.env.DISCOVER_ADMIN_PASSWORD || "";
const revision = String(process.env.GITHUB_SHA || Date.now().toString(16)).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "manual";
const origin = new URL(base).origin;
const auth = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
let readNonce = 0;

if (!user || !password) throw new Error("Discover admin credentials are required for live CRUD verification");

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { throw new Error(`Discover live verification returned non-JSON HTTP ${response.status}`); }
}

async function admin(path, { method = "GET", body } = {}) {
  const mutation = !["GET", "HEAD"].includes(method);
  const response = await fetch(`${base}/api/admin${path}`, {
    method,
    headers: {
      authorization: auth,
      accept: "application/json",
      ...(mutation ? {
        "content-type": "application/json",
        "x-discover-csrf": "1",
        origin,
        "sec-fetch-site": "same-origin"
      } : {})
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(`Discover admin ${method} ${path} failed with HTTP ${response.status}${payload?.error?.code ? ` (${payload.error.code})` : ""}`);
  return payload;
}

async function publicTools() {
  readNonce += 1;
  const response = await fetch(`${base}/api/tools?verify=${revision}-${readNonce}`, {
    headers: { accept: "application/json", "cache-control": "no-cache", pragma: "no-cache" }
  });
  const payload = await parseJson(response);
  if (!response.ok || !Array.isArray(payload?.tools)) throw new Error(`Discover public tools verification failed with HTTP ${response.status}`);
  return payload.tools;
}

const slug = `release-smoke-${revision}`;
const initial = {
  slug,
  name: "Discover release smoke",
  short_description_fa: "رکورد موقت برای آزمون انتشار بدون دیپلوی",
  description_fa: "این رکورد به‌صورت خودکار ساخته و در پایان حذف می‌شود.",
  destination_url: "https://example.com/discover-release-smoke",
  platform: "web",
  category: "utility",
  capabilities: ["release-smoke"],
  badges: ["temporary"],
  icon_provider: "generic",
  icon_key: "sparkles",
  access_note_fa: "",
  cta_label_fa: "آزمون",
  featured: false,
  sort_order: 9990,
  published: false,
  last_tested_date: new Date().toISOString().slice(0, 10)
};

let id = null;
try {
  const existing = await admin("/tools");
  const stale = existing?.tools?.find((tool) => tool.slug === slug);
  if (stale?.id) await admin(`/tools/${stale.id}`, { method: "DELETE" });

  const created = await admin("/tools", { method: "POST", body: initial });
  id = created?.tool?.id;
  if (!Number.isInteger(id)) throw new Error("Discover live CRUD create did not return an integer id");
  if (created.tool.published !== false) throw new Error("Discover live CRUD draft unexpectedly published");

  const editedBody = {
    ...initial,
    name: "Discover release smoke edited",
    category: "ai-productivity",
    icon_provider: "simple-icons",
    icon_key: "github",
    featured: true,
    sort_order: 5
  };
  const edited = await admin(`/tools/${id}`, { method: "PUT", body: editedBody });
  if (
    edited?.tool?.name !== editedBody.name ||
    edited?.tool?.category !== "ai-productivity" ||
    edited?.tool?.icon_key !== "github" ||
    edited?.tool?.featured !== true ||
    edited?.tool?.sort_order !== 5
  ) throw new Error("Discover live CRUD edit/category/icon/featured verification failed");

  const publishedBody = { ...editedBody, published: true };
  await admin(`/tools/${id}`, { method: "PUT", body: publishedBody });
  const visible = (await publicTools()).find((tool) => tool.slug === slug);
  if (!visible || visible.name !== editedBody.name || visible.category !== "ai-productivity" || visible.icon_key !== "github" || visible.featured !== true) {
    throw new Error("Discover live CRUD publish was not visible through public API");
  }

  const reorderedBody = { ...publishedBody, sort_order: 777 };
  const reordered = await admin(`/tools/${id}`, { method: "PUT", body: reorderedBody });
  if (reordered?.tool?.sort_order !== 777) throw new Error("Discover live CRUD reorder verification failed");
  const reorderedVisible = (await publicTools()).find((tool) => tool.slug === slug);
  if (reorderedVisible?.sort_order !== 777) throw new Error("Discover live CRUD reordered value was not visible through public API");

  await admin(`/tools/${id}`, { method: "PUT", body: { ...reorderedBody, published: false } });
  if ((await publicTools()).some((tool) => tool.slug === slug)) throw new Error("Discover live CRUD unpublish remained visible through public API");

  await admin(`/tools/${id}`, { method: "DELETE" });
  id = null;
  const finalAdmin = await admin("/tools");
  if (finalAdmin?.tools?.some((tool) => tool.slug === slug)) throw new Error("Discover live CRUD delete verification failed");

  console.log("Discover live CRUD proof passed: create -> edit/category/icon/featured -> publish -> public -> reorder -> unpublish -> delete.");
} finally {
  if (id != null) {
    await admin(`/tools/${id}`, { method: "DELETE" }).catch(() => {});
  }
}
