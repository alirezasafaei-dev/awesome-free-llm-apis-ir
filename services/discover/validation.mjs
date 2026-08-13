const FIELD_NAMES = new Set([
  "slug", "name", "short_description_fa", "description_fa", "destination_url", "platform", "category",
  "capabilities", "badges", "access_note_fa", "cta_label_fa", "featured", "sort_order", "published", "last_tested_date"
]);
const PLATFORMS = new Set(["android", "ios", "web", "telegram", "desktop", "multi"]);

export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

function text(value, field, { min = 0, max, required = true } = {}) {
  if (value == null) {
    if (required) throw new ValidationError(`${field} is required`, field);
    return "";
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`, field);
  const normalized = value.trim();
  if (normalized.length < min) throw new ValidationError(`${field} is too short`, field);
  if (max != null && normalized.length > max) throw new ValidationError(`${field} is too long`, field);
  return normalized;
}

function flag(value, field) {
  if (typeof value !== "boolean") throw new ValidationError(`${field} must be a boolean`, field);
  return value;
}

function integer(value, field) {
  if (!Number.isInteger(value) || value < -10000 || value > 10000) throw new ValidationError(`${field} must be an integer between -10000 and 10000`, field);
  return value;
}

function list(value, field) {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`, field);
  if (value.length > 12) throw new ValidationError(`${field} has too many items`, field);
  const result = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== "string") throw new ValidationError(`${field} entries must be strings`, field);
    const normalized = item.trim();
    if (!normalized || normalized.length > 64) throw new ValidationError(`${field} contains an invalid entry`, field);
    if (!seen.has(normalized)) { seen.add(normalized); result.push(normalized); }
  }
  return result;
}

function checkedDate(value, field) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError(`${field} must use YYYY-MM-DD`, field);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ValidationError(`${field} is not a valid date`, field);
  return value;
}

function checkedUrl(value) {
  const raw = text(value, "destination_url", { min: 8, max: 2048 });
  let url;
  try { url = new URL(raw); } catch { throw new ValidationError("destination_url must be a valid URL", "destination_url"); }
  if (url.protocol !== "https:") throw new ValidationError("destination_url must use HTTPS", "destination_url");
  if (url.username || url.password) throw new ValidationError("destination_url must not contain user info", "destination_url");
  return url.href;
}

export function validateToolInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError("tool payload must be an object");
  for (const key of Object.keys(value)) if (!FIELD_NAMES.has(key)) throw new ValidationError(`unknown field: ${key}`, key);

  const slug = text(value.slug, "slug", { min: 1, max: 80 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ValidationError("slug must contain lowercase letters, numbers and single hyphens", "slug");
  const platform = text(value.platform, "platform", { min: 1, max: 32 });
  if (!PLATFORMS.has(platform)) throw new ValidationError("platform is not supported", "platform");
  const category = text(value.category, "category", { min: 1, max: 80 });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category)) throw new ValidationError("category must be a stable lowercase slug", "category");

  return {
    slug,
    name: text(value.name, "name", { min: 1, max: 160 }),
    short_description_fa: text(value.short_description_fa, "short_description_fa", { min: 1, max: 280 }),
    description_fa: text(value.description_fa, "description_fa", { max: 4000, required: false }),
    destination_url: checkedUrl(value.destination_url),
    platform,
    category,
    capabilities: list(value.capabilities, "capabilities"),
    badges: list(value.badges, "badges"),
    access_note_fa: text(value.access_note_fa, "access_note_fa", { max: 500, required: false }),
    cta_label_fa: text(value.cta_label_fa, "cta_label_fa", { min: 1, max: 80 }),
    featured: flag(value.featured, "featured"),
    sort_order: integer(value.sort_order, "sort_order"),
    published: flag(value.published, "published"),
    last_tested_date: checkedDate(value.last_tested_date, "last_tested_date")
  };
}
