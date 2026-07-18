const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const suspiciousSecretPatterns = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/
];

export const PROVIDER_CONTENT_KEYS = Object.freeze([
  "intent_fa",
  "signup_steps_fa",
  "first_request",
  "common_errors",
  "when_not_to_use_fa",
  "related_guides",
  "last_reviewed"
]);

export const FIRST_REQUEST_KEYS = Object.freeze([
  "language",
  "code",
  "notes_fa",
  "source_url",
  "checked_at"
]);

export const COMMON_ERROR_KEYS = Object.freeze([
  "code",
  "title_fa",
  "resolution_fa",
  "source_url",
  "checked_at"
]);

const requiredContentKeys = new Set(PROVIDER_CONTENT_KEYS);
const requiredFirstRequestKeys = new Set(FIRST_REQUEST_KEYS);
const allowedContentKeys = new Set(PROVIDER_CONTENT_KEYS);
const allowedFirstRequestKeys = new Set(FIRST_REQUEST_KEYS);
const allowedCommonErrorKeys = new Set(COMMON_ERROR_KEYS);
const allowedLanguages = new Set(["curl", "python", "javascript"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasText(value, minLength = 1) {
  return typeof value === "string" && value.trim().length >= minLength;
}

function validDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function validHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function unknownKeys(value, allowed) {
  if (!isObject(value)) return [];
  return Object.keys(value).filter((key) => !allowed.has(key));
}

function missingKeys(value, required) {
  if (!isObject(value)) return [...required];
  return [...required].filter((key) => !(key in value));
}

function containsSuspiciousSecret(value) {
  return suspiciousSecretPatterns.some((pattern) => pattern.test(String(value ?? "")));
}

function validateTextArray(value, label, errors, { minItems = 1, minLength = 4 } = {}) {
  if (!Array.isArray(value) || value.length < minItems) {
    errors.push(`${label} must contain at least ${minItems} item(s)`);
    return;
  }
  value.forEach((item, index) => {
    if (!hasText(item, minLength)) errors.push(`${label}[${index}] must be a non-empty string`);
  });
}

export function validateProviderContent(content, { verificationDate, today = new Date() } = {}) {
  if (content === undefined) return [];
  const errors = [];

  if (!isObject(content)) return ["content must be an object"];

  for (const key of unknownKeys(content, allowedContentKeys)) errors.push(`content.${key} is not allowed`);
  for (const key of missingKeys(content, requiredContentKeys)) errors.push(`missing content.${key}`);

  if (!hasText(content.intent_fa, 80)) errors.push("content.intent_fa must contain at least 80 characters");
  validateTextArray(content.signup_steps_fa, "content.signup_steps_fa", errors, { minItems: 2, minLength: 8 });
  validateTextArray(content.when_not_to_use_fa, "content.when_not_to_use_fa", errors, { minItems: 1, minLength: 8 });

  if (!Array.isArray(content.related_guides) || content.related_guides.length < 1) {
    errors.push("content.related_guides must contain at least one guide slug");
  } else {
    if (new Set(content.related_guides).size !== content.related_guides.length) {
      errors.push("content.related_guides must be unique");
    }
    content.related_guides.forEach((slug, index) => {
      if (typeof slug !== "string" || !slugPattern.test(slug)) {
        errors.push(`content.related_guides[${index}] must be a lowercase slug`);
      }
    });
  }

  if (!validDate(content.last_reviewed)) {
    errors.push("content.last_reviewed must be a valid date");
  } else {
    const reviewedAt = new Date(`${content.last_reviewed}T00:00:00Z`);
    if (reviewedAt > today) errors.push("content.last_reviewed cannot be in the future");
    if (validDate(verificationDate) && content.last_reviewed > verificationDate) {
      errors.push("content.last_reviewed cannot be newer than verification.last_checked");
    }
  }

  const first = content.first_request;
  if (!isObject(first)) {
    errors.push("content.first_request must be an object");
  } else {
    for (const key of unknownKeys(first, allowedFirstRequestKeys)) errors.push(`content.first_request.${key} is not allowed`);
    for (const key of missingKeys(first, requiredFirstRequestKeys)) errors.push(`missing content.first_request.${key}`);
    if (!allowedLanguages.has(first.language)) errors.push("content.first_request.language must be curl, python, or javascript");
    if (!hasText(first.code, 20)) errors.push("content.first_request.code must contain at least 20 characters");
    if (!hasText(first.notes_fa, 20)) errors.push("content.first_request.notes_fa must contain at least 20 characters");
    if (!validHttps(first.source_url)) errors.push("content.first_request.source_url must be an HTTPS URL");
    if (!validDate(first.checked_at)) errors.push("content.first_request.checked_at must be a valid date");
    if (validDate(first.checked_at) && validDate(verificationDate) && first.checked_at > verificationDate) {
      errors.push("content.first_request.checked_at cannot be newer than verification.last_checked");
    }
    if (containsSuspiciousSecret(first.code)) errors.push("content.first_request.code appears to contain a credential or private key");
  }

  if (!Array.isArray(content.common_errors) || content.common_errors.length < 1) {
    errors.push("content.common_errors must contain at least one item");
  } else {
    content.common_errors.forEach((item, index) => {
      const prefix = `content.common_errors[${index}]`;
      if (!isObject(item)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      for (const key of unknownKeys(item, allowedCommonErrorKeys)) errors.push(`${prefix}.${key} is not allowed`);
      for (const key of ["code", "title_fa", "resolution_fa"]) {
        if (!hasText(item[key], key === "code" ? 2 : 12)) errors.push(`${prefix}.${key} must be non-empty`);
      }
      const hasSource = item.source_url !== undefined;
      const hasDate = item.checked_at !== undefined;
      if (hasSource !== hasDate) errors.push(`${prefix}.source_url and checked_at must be provided together`);
      if (hasSource && !validHttps(item.source_url)) errors.push(`${prefix}.source_url must be an HTTPS URL`);
      if (hasDate && !validDate(item.checked_at)) errors.push(`${prefix}.checked_at must be a valid date`);
      if (hasDate && validDate(item.checked_at) && validDate(verificationDate) && item.checked_at > verificationDate) {
        errors.push(`${prefix}.checked_at cannot be newer than verification.last_checked`);
      }
      if (containsSuspiciousSecret(item.resolution_fa)) errors.push(`${prefix}.resolution_fa appears to contain a credential`);
    });
  }

  return errors;
}

export function renderProviderContent(content, escapeHtml) {
  if (!content) return "";
  const first = content.first_request;
  const errors = content.common_errors.map((item) => {
    const source = item.source_url
      ? ` <a href="${escapeHtml(item.source_url)}" rel="nofollow noopener" target="_blank">منبع رسمی (${escapeHtml(item.checked_at)})</a>`
      : "";
    return `<li><strong>${escapeHtml(item.code)} — ${escapeHtml(item.title_fa)}</strong><p>${escapeHtml(item.resolution_fa)}${source}</p></li>`;
  }).join("");

  return `
      <section data-content-section="intent"><h2>هدف استفاده و نیت جست‌وجو</h2><p>${escapeHtml(content.intent_fa)}</p></section>
      <section data-content-section="signup"><h2>مراحل ثبت‌نام</h2><ol>${content.signup_steps_fa.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></section>
      <section data-content-section="first-request"><h2>نمونه اولین درخواست API</h2><pre><code class="language-${escapeHtml(first.language)}">${escapeHtml(first.code)}</code></pre><p>${escapeHtml(first.notes_fa)}</p><p><a href="${escapeHtml(first.source_url)}" rel="nofollow noopener" target="_blank">منبع رسمی نمونه درخواست</a> — بررسی‌شده در ${escapeHtml(first.checked_at)}</p></section>
      <section data-content-section="errors"><h2>خطاهای رایج و رفع اشکال</h2><ul>${errors}</ul></section>
      <section data-content-section="when-not-to-use"><h2>چه زمانی این Provider انتخاب مناسبی نیست؟</h2><ul>${content.when_not_to_use_fa.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
      <section data-content-section="links"><h2>راهنماهای مرتبط</h2><ul>${content.related_guides.map((slug) => `<li><a href="../../guides/${escapeHtml(slug)}/">${escapeHtml(slug)}</a></li>`).join("")}</ul><p class="freshness-badge">آخرین بازبینی محتوای این صفحه: ${escapeHtml(content.last_reviewed)}</p></section>`;
}
