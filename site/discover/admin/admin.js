const form = document.querySelector("#admin-tool-form");
const list = document.querySelector("#admin-tools-list");
const statusEl = document.querySelector("#admin-save-status");

async function loadTools() {
  const response = await fetch("/discover/api/admin/tools", { headers: { accept: "application/json" } });
  const data = await response.json();
  list.textContent = `${data.tools?.length ?? 0} ابزار`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusEl.textContent = "در حال ذخیره…";
  const payload = {
    slug: form.elements.slug.value.trim(),
    name: form.elements.name.value.trim(),
    short_description_fa: form.elements.short_description_fa.value.trim(),
    description_fa: form.elements.description_fa.value.trim(),
    destination_url: form.elements.destination_url.value.trim(),
    platform: form.elements.platform.value,
    category: form.elements.category.value.trim(),
    capabilities: [],
    badges: [],
    access_note_fa: form.elements.access_note_fa.value.trim(),
    cta_label_fa: form.elements.cta_label_fa.value.trim(),
    featured: form.elements.featured.checked,
    sort_order: Number(form.elements.sort_order.value || 0),
    published: form.elements.published.checked,
    last_tested_date: form.elements.last_tested_date.value || null
  };
  const response = await fetch("/discover/api/admin/tools", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Discover-CSRF": "1" },
    body: JSON.stringify(payload)
  });
  statusEl.textContent = response.ok ? "ذخیره شد." : "ذخیره ناموفق بود.";
  if (response.ok) await loadTools();
});

void loadTools();
