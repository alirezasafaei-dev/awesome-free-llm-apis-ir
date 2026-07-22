from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

BASE_REVISION = "bb78c225740d51cdaa2b82161900fe3ed25c93d7"

RESTORE_PATHS = [
    "content/fa/ai-api-iran.md",
    "docs/METHODOLOGY.fa.md",
    "schema/provider.schema.json",
    "scripts/build-guides.mjs",
    "scripts/build-site.mjs",
    "scripts/generate-data-json.mjs",
    "scripts/generate-readme.mjs",
    "scripts/test-advisor-scoring.mjs",
    "scripts/test-provider-content-pages.mjs",
    "scripts/validate.mjs",
    "site/api-finder/index.html",
    "site/app.js",
    "site/compare/compare.js",
    "site/en/api-finder/index.html",
    "site/en/compare/compare.js",
    "site/en/quick-start/provider-context-en.js",
    "site/index.html",
    "site/quick-start/provider-context.js",
]


def load_json(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save_json(path: str, value: dict[str, Any]) -> None:
    Path(path).write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def restore_status_aware_sources() -> None:
    for path in RESTORE_PATHS:
        content = subprocess.check_output(
            ["git", "show", f"{BASE_REVISION}:{path}"],
        )
        target = Path(path)
        target.write_bytes(content)
        if target.suffix in {".js", ".mjs", ".html", ".md"}:
            text = target.read_text(encoding="utf-8")
            text = text.replace("فعال‌سازی حساب مسدود", "مانع فعال‌سازی حساب")
            text = text.replace("Account activation blocked", "Account activation barrier")
            target.write_text(text, encoding="utf-8")


def sanitize_route(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    return value.replace(
        "FOREIGN_SERVER (DE, Hetzner AS24940)",
        "FOREIGN_SERVER — DE direct (AS24940)",
    )


def sanitize_route_fields(provider: dict[str, Any]) -> None:
    for evidence in provider["iran_access"]["evidence"]:
        for key in ("source", "credential_validated_from"):
            if key in evidence:
                evidence[key] = sanitize_route(evidence[key])


def update_agnes() -> None:
    path = "data/providers/agnes-ai.json"
    provider = load_json(path)
    sanitize_route_fields(provider)
    save_json(path, provider)


def update_fireworks() -> None:
    path = "data/providers/fireworks-ai.json"
    provider = load_json(path)
    access = provider["iran_access"]
    access["status"] = "account_activation_blocked"
    access["test_method"] = "live_request"
    access["notes_fa"] = (
        "حساب‌های آزمایش‌شده پس از ایجاد، به‌دلیل مانع سطح حساب نتوانستند استنتاج موفق انجام دهند. "
        "مسیر ایران نیز رفتار شبکه‌ای ناپایدار داشت؛ این شواهد به همه کاربران یا همه شبکه‌های ایران تعمیم داده نمی‌شود."
    )
    sanitize_route_fields(provider)
    for evidence in access["evidence"]:
        if evidence.get("timestamp") == "2026-07-21T17:00:00.000Z":
            evidence["notes_fa"] = (
                "حساب آزمایش‌شده از مسیر کنترل خارجی نتوانست مدل‌ها را فهرست کند و درخواست استنتاج با HTTP 404 رد شد؛ "
                "خطای حساب یا سهمیه از وضعیت شبکه ایران قابل تفکیک نیست."
            )
        if evidence.get("timestamp") == "2026-07-21T17:50:00.000Z":
            evidence["notes_fa"] = (
                "حساب جدید آزمایش‌شده پس از ایجاد، از مسیر کنترل خارجی نیز با HTTP 403 و کلاس خطای "
                "sanctioned_origin_country رد شد. این نتیجه فقط مانع فعال‌سازی یا استفاده همان حساب آزمایش‌شده را نشان می‌دهد."
            )
    save_json(path, provider)


def update_vercel() -> None:
    path = "data/providers/vercel-ai-gateway.json"
    provider = load_json(path)
    provider["free_tier"]["requires_payment_method"] = None
    provider["free_tier"]["notes_fa"] = (
        "اسناد رسمی اعتبار رایگان ماهانه ۵ دلار را برای حساب‌های تیمی اعلام می‌کنند. حساب آزمایش‌شده پیش از اجرای مدل "
        "با مانع customer_verification_required روبه‌رو شد؛ این مشاهده الزام عمومی کارت برای همه حساب‌ها را ثابت نمی‌کند."
    )
    access = provider["iran_access"]
    access["status"] = "account_activation_blocked"
    access["test_method"] = "connectivity_probe"
    access["notes_fa"] = (
        "Endpointها از ایران قابل دسترس‌اند، اما حساب آزمایش‌شده پیش از اجرای مدل با مانع customer_verification_required متوقف شد. "
        "فهرست عمومی مدل‌ها اعتبار کلید را اثبات نمی‌کند و استنتاج احراز هویت‌شده از ایران هنوز انجام نشده است."
    )
    sanitize_route_fields(provider)
    for evidence in access["evidence"]:
        if evidence.get("timestamp") != "2026-07-21T17:28:00.000Z":
            continue
        evidence["http_status"] = 403
        evidence["model_tested"] = "request blocked before model execution"
        evidence["endpoint"] = "https://ai-gateway.vercel.sh/v1/chat/completions"
        evidence.pop("credential_validated_from", None)
        evidence.pop("credential_validated_status", None)
        evidence["notes_fa"] = (
            "درخواست استنتاج حساب آزمایش‌شده از مسیر کنترل خارجی پیش از اجرای مدل با HTTP 403 و کلاس خطای "
            "customer_verification_required متوقف شد. GET /v1/models عمومی است و اعتبار Credential را اثبات نمی‌کند."
        )
    provider["notes_fa"] = (
        "برای حساب آزمایش‌شده ثبت‌نام و دسترسی به Endpoint عمومی انجام شد، اما فعال‌سازی استنتاج به مانع بررسی مشتری رسید. "
        "این نتیجه حساب‌محور است و نباید به همه حساب‌ها تعمیم داده شود."
    )
    save_json(path, provider)


def update_signup_barrier(path: str, note: str) -> None:
    provider = load_json(path)
    access = provider["iran_access"]
    access["test_method"] = "signup_only"
    signup_evidence = access["evidence"][-1]
    signup_evidence["type"] = "signup_test"
    signup_evidence["source"] = "TESTED_SIGNUP_FLOW"
    signup_evidence["notes_fa"] = note
    if provider["id"] == "freetheai":
        access["notes_fa"] = (
            "Endpoint از ایران قابل دسترس است، اما جریان آزمایش‌شده صدور کلید در مرحله احراز شماره تلفن متوقف شد. "
            "این نتیجه فقط برای همان جریان و حساب آزمایش‌شده معتبر است."
        )
    else:
        access["notes_fa"] = (
            "Endpoint از ایران قابل دسترس است، اما جریان ثبت‌نام آزمایش‌شده در مرحله احراز شماره تلفن متوقف شد. "
            "این نتیجه فقط برای همان حساب و جریان آزمایش‌شده معتبر است."
        )
    save_json(path, provider)


def update_backlog() -> None:
    path = "data/verification-backlog.json"
    backlog = load_json(path)
    network_track = next(
        track for track in backlog["tracks"] if track["id"] == "network_matrix"
    )
    network_track["status"] = "partially_completed"
    backlog["providers"] = [
        {
            "provider_id": "fireworks-ai",
            "track_issue": 35,
            "blocker_type": "account_activation_and_valid_credential",
            "next_action": "After credential rotation and account activation, run identical authorized inference from Iran and foreign direct routes.",
            "requires_local_execution": True,
            "automatable": False,
        },
        {
            "provider_id": "freetheai",
            "track_issue": 35,
            "blocker_type": "credential_issuance",
            "next_action": "Complete an authorized signup flow, obtain a key, then run identical inference from both direct routes.",
            "requires_local_execution": True,
            "automatable": False,
        },
        {
            "provider_id": "nvidia-nim",
            "track_issue": 35,
            "blocker_type": "credential_issuance",
            "next_action": "Complete an authorized Developer Program flow, obtain a key, then run identical inference from both direct routes.",
            "requires_local_execution": True,
            "automatable": False,
        },
        {
            "provider_id": "vercel-ai-gateway",
            "track_issue": 35,
            "blocker_type": "account_activation",
            "next_action": "Resolve the tested account verification barrier, then run identical authenticated inference from both direct routes.",
            "requires_local_execution": True,
            "automatable": False,
        },
    ]
    save_json(path, backlog)


def update_schema() -> None:
    path = Path("schema/provider.schema.json")
    schema = path.read_text(encoding="utf-8")
    enum_before = (
        '"type": { "enum": ["official_docs", "live_test", '
        '"connectivity_test", "community_report"] },'
    )
    enum_after = (
        '"type": { "enum": ["official_docs", "live_test", '
        '"connectivity_test", "signup_test", "community_report"] },'
    )
    if enum_before not in schema:
        raise RuntimeError("Provider evidence enum marker not found")
    schema = schema.replace(enum_before, enum_after, 1)
    community_rule = '''              {
                "if": { "properties": { "type": { "const": "community_report" } } },
                "then": { "required": ["url", "checked_at", "notes_fa"] }
              },'''
    signup_rule = community_rule + '''
              {
                "if": { "properties": { "type": { "const": "signup_test" } } },
                "then": { "required": ["checked_at", "source", "notes_fa"] }
              },'''
    if community_rule not in schema:
        raise RuntimeError("Community report schema rule not found")
    path.write_text(schema.replace(community_rule, signup_rule, 1), encoding="utf-8")


def update_methodology() -> None:
    path = Path("docs/METHODOLOGY.fa.md")
    text = path.read_text(encoding="utf-8")
    section = (
        "\n## شواهد جریان ثبت‌نام\n\n"
        "نوع `signup_test` فقط نتیجه یک جریان ثبت‌نام یا صدور کلید آزمایش‌شده را ثبت می‌کند. "
        "این Evidence باید حساب‌محور و محدود به همان جریان نوشته شود و نباید به همه کاربران یا کل شبکه ایران تعمیم داده شود.\n"
    )
    if "## شواهد جریان ثبت‌نام" not in text:
        text += section
    path.write_text(text, encoding="utf-8")


def update_privacy_rules() -> None:
    path = Path("scripts/privacy-evidence-rules.mjs")
    text = path.read_text(encoding="utf-8")
    constant = (
        "const PERSIAN_IDENTIFIER_PATTERN = /(?:شناسه\\s*)?"
        "(?:حساب|تیم|سازمان|فضای\\s*کاری)\\s*[:=#]\\s*"
        "([A-Za-z0-9][A-Za-z0-9._-]{5,})/g;"
    )
    replacement = constant + (
        '\nconst RAW_ERROR_PAYLOAD_PATTERN = /\\\\?\\{\\s*\\\\?"'
        '(?:error|blocked|reason|message|details|success)"\\\\?\\s*:/i;'
    )
    if constant not in text:
        raise RuntimeError("Privacy constant marker not found")
    text = text.replace(constant, replacement, 1)
    text = text.replace(
        '"ssh_target" | "ipv4" | "ipv6" | "credential_fragment" | "account_identifier"',
        '"ssh_target" | "ipv4" | "ipv6" | "credential_fragment" | "account_identifier" | "raw_error_payload"',
        1,
    )
    detection = '''  if (strictEvidence && extractAccountIdentifiers(text).length > 0) {
    violations.push("account_identifier");
  }

  return [...new Set(violations)];'''
    detection_with_raw = '''  if (strictEvidence && extractAccountIdentifiers(text).length > 0) {
    violations.push("account_identifier");
  }

  if (strictEvidence && RAW_ERROR_PAYLOAD_PATTERN.test(text)) {
    violations.push("raw_error_payload");
  }

  return [...new Set(violations)];'''
    if detection not in text:
        raise RuntimeError("Privacy detection marker not found")
    path.write_text(text.replace(detection, detection_with_raw, 1), encoding="utf-8")


def update_privacy_tests() -> None:
    path = Path("scripts/test-evidence-privacy.mjs")
    text = path.read_text(encoding="utf-8")
    positive = 'mustBlock("شناسه حساب: account_987654", "account_identifier");'
    positive_after = positive + (
        '\nmustBlock(\'Provider returned {\\\\"blocked\\\\":true,'
        '\\\\"reason\\\\":\\\\"example\\\\"}\', "raw_error_payload");'
    )
    if positive not in text:
        raise RuntimeError("Privacy positive fixture marker not found")
    text = text.replace(positive, positive_after, 1)
    safe = 'mustPass("sanctioned_origin_country");'
    if safe not in text:
        raise RuntimeError("Privacy safe fixture marker not found")
    text = text.replace(
        safe,
        safe + '\nmustPass("customer_verification_required");',
        1,
    )
    insertion_marker = "\nif (process.exitCode) {"
    semantics = r'''

const providerById = Object.fromEntries(providerIds.map((id) => [
  id,
  JSON.parse(readFileSync(`${root}/data/providers/${id}.json`, "utf8"))
]));
const backlog = JSON.parse(readFileSync(`${root}/data/verification-backlog.json`, "utf8"));
const agnes = providerById["agnes-ai"];
const fireworks = providerById["fireworks-ai"];
const freetheai = providerById.freetheai;
const nvidia = providerById["nvidia-nim"];
const vercel = providerById["vercel-ai-gateway"];

assertFixture(agnes.iran_access.status === "verified_working", "Agnes retains authenticated Iran inference status");
assertFixture(fireworks.iran_access.status === "account_activation_blocked", "Fireworks account barrier is distinct from signup failure");
assertFixture(vercel.iran_access.status === "account_activation_blocked", "Vercel account barrier is distinct from signup failure");
assertFixture(freetheai.iran_access.status === "signup_blocked", "FreeTheAI remains a bounded signup barrier");
assertFixture(nvidia.iran_access.status === "signup_blocked", "NVIDIA remains a bounded signup barrier");
assertFixture(vercel.free_tier.requires_payment_method === null, "Vercel account barrier is not generalized into universal payment policy");

const vercelLive = vercel.iran_access.evidence.find((entry) => entry.timestamp === "2026-07-21T17:28:00.000Z");
assertFixture(Boolean(vercelLive), "Vercel account-barrier evidence exists");
assertFixture(!("credential_validated_from" in vercelLive), "Public model listing is not credential validation");
assertFixture(vercelLive?.http_status === 403, "Vercel evidence records the inference barrier response");

for (const provider of [freetheai, nvidia]) {
  assertFixture(provider.iran_access.test_method === "signup_only", `${provider.id} uses signup-only method`);
  assertFixture(provider.iran_access.evidence.some((entry) => entry.type === "signup_test"), `${provider.id} uses structured signup evidence`);
}

const serialized = JSON.stringify(Object.values(providerById));
for (const [pattern, label] of [
  [/Hetzner/i, "hosting-provider infrastructure detail"],
  [/\{\s*"blocked"\s*:/i, "raw JSON error payload"],
  [/requires a valid credit card on file to service requests/i, "verbatim provider error message"],
  [/کاربر ایرانی به شماره خارجی دسترسی ندارد/, "unbounded statement about Iranian users"]
]) {
  assertFixture(!pattern.test(serialized), `${label} is absent from public evidence`);
}

const networkTrack = backlog.tracks.find((track) => track.id === "network_matrix");
assertFixture(networkTrack?.issue === 35, "network matrix remains linked to Issue #35");
assertFixture(networkTrack?.status === "partially_completed", "network matrix remains open until identical authenticated tests exist");
assertFixture(backlog.providers.length === 4, "four externally blocked provider tests remain explicit");
'''
    if insertion_marker not in text:
        raise RuntimeError("Privacy test insertion marker not found")
    path.write_text(text.replace(insertion_marker, semantics + insertion_marker, 1), encoding="utf-8")


def main() -> None:
    restore_status_aware_sources()
    update_agnes()
    update_fireworks()
    update_vercel()
    update_signup_barrier(
        "data/providers/freetheai.json",
        "حساب آزمایشی مورد استفاده برای دریافت کلید از ربات FreeTheAI نتوانست مرحله احراز شماره تلفن Discord را تکمیل کند؛ در این جریان کلید صادر نشد.",
    )
    update_signup_barrier(
        "data/providers/nvidia-nim.json",
        "حساب آزمایشی NVIDIA Developer Program نتوانست مرحله احراز شماره تلفن را تکمیل کند؛ در این جریان کلید API صادر نشد.",
    )
    update_backlog()
    update_schema()
    update_methodology()
    update_privacy_rules()
    update_privacy_tests()


if __name__ == "__main__":
    main()
