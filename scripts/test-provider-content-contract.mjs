import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  COMMON_ERROR_KEYS,
  FIRST_REQUEST_KEYS,
  PROVIDER_CONTENT_KEYS,
  renderProviderContent,
  validateProviderContent
} from "./provider-content-contract.mjs";

const root = process.cwd();
const schema = JSON.parse(await readFile(path.join(root, "schema", "provider-content.schema.json"), "utf8"));

const schemaRequired = [...schema.required].sort();
const contractRequired = [...PROVIDER_CONTENT_KEYS].sort();
if (JSON.stringify(schemaRequired) !== JSON.stringify(contractRequired)) {
  throw new Error(`Provider content required keys drifted: schema=${schemaRequired.join(",")} contract=${contractRequired.join(",")}`);
}

const schemaFirstRequestKeys = Object.keys(schema.properties.first_request.properties).sort();
if (JSON.stringify(schemaFirstRequestKeys) !== JSON.stringify([...FIRST_REQUEST_KEYS].sort())) {
  throw new Error("first_request keys drifted between JSON Schema and runtime contract");
}

const schemaCommonErrorKeys = Object.keys(schema.properties.common_errors.items.properties).sort();
if (JSON.stringify(schemaCommonErrorKeys) !== JSON.stringify([...COMMON_ERROR_KEYS].sort())) {
  throw new Error("common_errors keys drifted between JSON Schema and runtime contract");
}

const fixture = {
  schema_version: "1.0.0",
  provider_id: "example-provider",
  intent_fa: "این متن نمونه توضیح می‌دهد این Provider برای چه نوع پروژه‌ای مناسب است و کاربر پیش از انتخاب باید چه محدودیت‌هایی را بررسی کند.",
  signup_steps_fa: [
    "از لینک رسمی Provider وارد صفحه ثبت‌نام شوید.",
    "پس از ساخت حساب، کلید را فقط در متغیر محیطی ذخیره کنید."
  ],
  first_request: {
    language: "curl",
    code: "curl https://api.example.com/v1/models -H 'Authorization: Bearer $LLM_API_KEY'",
    notes_fa: "این نمونه فقط از متغیر محیطی استفاده می‌کند و هیچ کلید واقعی در مخزن ذخیره نمی‌شود.",
    source_url: "https://docs.example.com/quickstart",
    checked_at: "2026-07-18"
  },
  common_errors: [
    {
      code: "401",
      title_fa: "کلید نامعتبر یا منقضی",
      resolution_fa: "کلید را دوباره از پنل رسمی ایجاد کنید و از قرارگرفتن فاصله یا کوتیشن اضافی جلوگیری کنید.",
      source_url: "https://docs.example.com/errors",
      checked_at: "2026-07-18"
    }
  ],
  when_not_to_use_fa: [
    "برای پروژه‌ای که تضمین SLA یا سهمیه ثابت قراردادی می‌خواهد مناسب نیست."
  ],
  related_guides: ["openai-sdk-custom-base-url"],
  last_reviewed: "2026-07-18"
};

const validErrors = validateProviderContent(fixture, {
  verificationDate: "2026-07-18",
  knownProviderIds: new Set(["example-provider"]),
  today: new Date("2026-07-18T23:59:59Z")
});
if (validErrors.length) throw new Error(`Valid provider content fixture failed: ${validErrors.join(" | ")}`);

const secretFixture = structuredClone(fixture);
secretFixture.first_request.code = "curl -H 'Authorization: Bearer sk-this-is-a-real-looking-secret-123456' https://api.example.com/v1/models";
const secretErrors = validateProviderContent(secretFixture, {
  verificationDate: "2026-07-18",
  knownProviderIds: new Set(["example-provider"]),
  today: new Date("2026-07-18T23:59:59Z")
});
if (!secretErrors.some((message) => message.includes("credential"))) {
  throw new Error("Provider content contract did not reject a secret-like value");
}

const escapedFixture = structuredClone(fixture);
escapedFixture.intent_fa += " <script>alert(1)</script>";
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");
const html = renderProviderContent(escapedFixture, escapeHtml);
if (html.includes("<script>alert(1)</script>")) throw new Error("Provider content renderer emitted unescaped HTML");
if (!html.includes("&lt;script&gt;alert(1)&lt;/script&gt;")) throw new Error("Provider content renderer did not preserve escaped text");
if (!html.includes("../../guides/openai-sdk-custom-base-url/")) throw new Error("Provider content renderer emitted an invalid related-guide URL");
for (const section of ["intent", "signup", "first-request", "errors", "when-not-to-use", "links"]) {
  if (!html.includes(`data-content-section="${section}"`)) throw new Error(`Missing rendered provider content section: ${section}`);
}

console.log("Provider editorial content schema, validation, secret checks, and rendering contract passed.");
