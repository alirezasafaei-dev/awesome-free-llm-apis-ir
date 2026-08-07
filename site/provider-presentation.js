const connectionCopy = Object.freeze({
  fa: Object.freeze({
    verified_working: "متصل مستقیم",
    vpn: "متصل با فیلترشکن",
    direct_unavailable: "اتصال مستقیم برقرار نشد",
    officially_unsupported: "ایران رسماً پشتیبانی نمی‌شود",
    intermittent: "اتصال ناپایدار",
    direct_endpoint: "Endpoint مستقیم در دسترس است",
    unknown: "وضعیت اتصال نامشخص"
  }),
  en: Object.freeze({
    verified_working: "Works directly",
    vpn: "Works with a VPN",
    direct_unavailable: "Direct connection unavailable",
    officially_unsupported: "Iran is officially unsupported",
    intermittent: "Intermittent connection",
    direct_endpoint: "Endpoint is directly reachable",
    unknown: "Connection status unknown"
  })
});

const accountCopy = Object.freeze({
  fa: Object.freeze({
    international_payment_card: "نیاز به کارت بانکی بین‌المللی",
    foreign_mobile_number: "نیاز به شماره موبایل خارجی",
    identity_verification: "نیاز به احراز هویت",
    account_activation: "نیاز به فعال‌سازی حساب",
    signup: "نیاز به تکمیل شرایط ثبت‌نام",
    no_payment_card: "بدون نیاز به کارت بانکی بین‌المللی",
    unknown: "پیش‌نیاز حساب نامشخص"
  }),
  en: Object.freeze({
    international_payment_card: "International payment card required",
    foreign_mobile_number: "Foreign mobile number required",
    identity_verification: "Identity verification required",
    account_activation: "Account activation required",
    signup: "Additional signup requirements",
    no_payment_card: "No international payment card required",
    unknown: "Account requirements unknown"
  })
});

const freeTierCopy = Object.freeze({
  fa: Object.freeze({
    permanent_allowance: "سهمیه دائمی",
    free_models: "مدل‌های رایگان",
    monthly_credit: "اعتبار ماهانه",
    one_time_credit: "اعتبار یک‌باره",
    trial: "آزمایشی",
    unknown: "نامشخص"
  }),
  en: Object.freeze({
    permanent_allowance: "Permanent allowance",
    free_models: "Free models",
    monthly_credit: "Monthly credit",
    one_time_credit: "One-time credit",
    trial: "Trial",
    unknown: "Unknown"
  })
});

const serviceTypeCopy = Object.freeze({
  fa: Object.freeze({
    official_provider: "Provider رسمی",
    official_gateway: "Gateway رسمی",
    community_gateway: "Gateway اجتماعی",
    session_bridge: "Session bridge",
    self_hosted: "Self-hosted"
  }),
  en: Object.freeze({
    official_provider: "Official provider",
    official_gateway: "Official gateway",
    community_gateway: "Community gateway",
    session_bridge: "Session bridge",
    self_hosted: "Self-hosted"
  })
});

function normalizedLocale(locale) {
  return locale === "en" ? "en" : "fa";
}

function hasDirectHttpEvidence(provider) {
  return (provider?.iran_access?.evidence ?? []).some((item) => {
    if (item?.type !== "connectivity_test" || item?.connectivity_result !== "http_response") return false;
    const source = String(item.source ?? "").toLowerCase();
    const route = provider?.iran_access?.network?.route;
    return route === "direct" || source.includes("direct");
  });
}

export function connectionPresentation(provider, locale = "fa") {
  const lang = normalizedLocale(locale);
  const copy = connectionCopy[lang];
  const status = provider?.iran_access?.status ?? "unknown";

  if (status === "verified_working") {
    return { label: copy.verified_working, shortLabel: copy.verified_working, ariaLabel: copy.verified_working, tone: "positive", status };
  }
  if (status === "verified_working_vpn" || status === "direct_blocked_vpn_working") {
    return { label: copy.vpn, shortLabel: copy.vpn, ariaLabel: copy.vpn, tone: "vpn", status };
  }
  if (status === "verified_blocked") {
    return { label: copy.direct_unavailable, shortLabel: copy.direct_unavailable, ariaLabel: copy.direct_unavailable, tone: "negative", status };
  }
  if (status === "officially_unsupported") {
    return { label: copy.officially_unsupported, shortLabel: copy.officially_unsupported, ariaLabel: copy.officially_unsupported, tone: "negative", status };
  }
  if (status === "intermittent") {
    return { label: copy.intermittent, shortLabel: copy.intermittent, ariaLabel: copy.intermittent, tone: "warning", status };
  }
  if ((status === "signup_blocked" || status === "account_activation_blocked") && hasDirectHttpEvidence(provider)) {
    return { label: copy.direct_endpoint, shortLabel: copy.direct_endpoint, ariaLabel: copy.direct_endpoint, tone: "neutral", status };
  }
  return { label: copy.unknown, shortLabel: copy.unknown, ariaLabel: copy.unknown, tone: "neutral", status };
}

export function accountRequirementPresentation(provider, locale = "fa") {
  const lang = normalizedLocale(locale);
  const requirementKeys = [];

  if (provider?.free_tier?.requires_payment_method === true) {
    requirementKeys.push("international_payment_card");
  }

  for (const requirement of provider?.signup_requirements ?? []) {
    if (["foreign_mobile_number", "identity_verification", "account_activation"].includes(requirement)) {
      requirementKeys.push(requirement);
    }
  }

  if (requirementKeys.length === 0) {
    if (provider?.iran_access?.status === "account_activation_blocked") requirementKeys.push("account_activation");
    else if (provider?.iran_access?.status === "signup_blocked") requirementKeys.push("signup");
    else if (provider?.free_tier?.requires_payment_method === false) requirementKeys.push("no_payment_card");
    else requirementKeys.push("unknown");
  }

  const uniqueRequirements = [...new Set(requirementKeys)];
  const labels = uniqueRequirements.map((key) => accountCopy[lang][key] ?? key);
  const label = labels.join(lang === "fa" ? " · " : "; ");
  const positive = uniqueRequirements.length === 1 && uniqueRequirements[0] === "no_payment_card";
  const unknown = uniqueRequirements.length === 1 && uniqueRequirements[0] === "unknown";

  return {
    label,
    shortLabel: label,
    ariaLabel: label,
    tone: positive ? "positive" : unknown ? "neutral" : "warning",
    requirements: uniqueRequirements
  };
}

export function freeTierLabel(type, locale = "fa") {
  const lang = normalizedLocale(locale);
  return freeTierCopy[lang][type] ?? type;
}

export function serviceTypeLabel(type, locale = "fa") {
  const lang = normalizedLocale(locale);
  return serviceTypeCopy[lang][type] ?? type;
}

function ensureProviderCardAccountRequirementField() {
  if (typeof document === "undefined") return;
  const template = document.getElementById("provider-template");
  const facts = template?.content?.querySelector(".facts");
  if (!facts || facts.querySelector(".account-requirement-label")) return;

  const row = document.createElement("div");
  const term = document.createElement("dt");
  const value = document.createElement("dd");
  term.textContent = document.documentElement.lang === "en" ? "Account requirements" : "پیش‌نیاز حساب";
  value.className = "account-requirement-label";
  row.append(term, value);
  facts.append(row);
}

ensureProviderCardAccountRequirementField();