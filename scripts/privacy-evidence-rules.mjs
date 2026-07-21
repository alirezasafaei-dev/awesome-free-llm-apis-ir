import { isIP } from "node:net";

const IPV4_PATTERN = /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g;
const IPV6_CANDIDATE_PATTERN = /(?<![A-Za-z0-9])[A-Fa-f0-9:]{2,}(?![A-Za-z0-9])/g;
const SSH_IP_TARGET_PATTERN = /\b[A-Za-z_][A-Za-z0-9._-]*@(?:(?:\d{1,3}\.){3}\d{1,3}|\[[A-Fa-f0-9:]+\])/g;
const CREDENTIAL_PATTERN = /(?:^|[^A-Za-z0-9])((?:sk-|fw_|vck_|hf_|gsk_|pplx-|xai-|ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_-]{4,})(?=$|[^A-Za-z0-9_-])/g;
const LABELED_IDENTIFIER_PATTERN = /\b(?:account|team|organization|org|tenant|workspace|customer)\s+(?:id\s*[:=#]?\s*)?([A-Za-z0-9][A-Za-z0-9._-]{5,})\b/gi;
const EXPLICIT_IDENTIFIER_PATTERN = /\b(?:account|team|organization|org|tenant|workspace|customer)[_-]?id\s*[:=#]\s*([A-Za-z0-9][A-Za-z0-9._-]{5,})\b/gi;
const PERSIAN_IDENTIFIER_PATTERN = /(?:شناسه\s*)?(?:حساب|تیم|سازمان|فضای\s*کاری)\s*[:=#]\s*([A-Za-z0-9][A-Za-z0-9._-]{5,})/g;

const STRICT_EVIDENCE_FILES = new Set([
  "README.md",
  "README.en.md",
  "catalog.json",
  "data.json",
  "data/verification-backlog.json",
  ".github/ISSUE_TEMPLATE/iran-access-report.yml"
]);

/** @typedef {"ssh_target" | "ipv4" | "ipv6" | "credential_fragment" | "account_identifier"} PrivacyViolationKind */

/**
 * @param {string} value
 * @returns {boolean}
 */
function isPublicIpv4(value) {
  if (isIP(value) !== 4) return false;
  const [a, b, c] = value.split(".").map(Number);
  return !(
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

/**
 * @param {string} candidate
 * @returns {boolean}
 */
function looksLikeSensitiveIdentifier(candidate) {
  return /[-_\d]/.test(candidate) && !/^(?:activation|verification|blocked|unknown|direct|foreign)$/i.test(candidate);
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function extractIpv6(text) {
  const matches = [];
  for (const match of text.matchAll(IPV6_CANDIDATE_PATTERN)) {
    if (isIP(match[0]) === 6) matches.push(match[0]);
  }
  return matches;
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function extractAccountIdentifiers(text) {
  const candidates = [];
  for (const pattern of [LABELED_IDENTIFIER_PATTERN, EXPLICIT_IDENTIFIER_PATTERN, PERSIAN_IDENTIFIER_PATTERN]) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const candidate = match[1];
      if (looksLikeSensitiveIdentifier(candidate)) candidates.push(candidate);
    }
  }
  return candidates;
}

/**
 * @param {string} text
 * @param {{ strictEvidence?: boolean }} [options]
 * @returns {PrivacyViolationKind[]}
 */
export function detectPrivacyViolations(text, options = {}) {
  const strictEvidence = options.strictEvidence === true;
  /** @type {PrivacyViolationKind[]} */
  const violations = [];

  if (SSH_IP_TARGET_PATTERN.test(text)) violations.push("ssh_target");
  SSH_IP_TARGET_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(IPV4_PATTERN)) {
    const address = match[0];
    if (isIP(address) !== 4) continue;
    if (strictEvidence || isPublicIpv4(address)) violations.push("ipv4");
  }

  if (extractIpv6(text).length > 0) violations.push("ipv6");

  CREDENTIAL_PATTERN.lastIndex = 0;
  if (CREDENTIAL_PATTERN.test(text)) violations.push("credential_fragment");
  CREDENTIAL_PATTERN.lastIndex = 0;

  if (strictEvidence && extractAccountIdentifiers(text).length > 0) {
    violations.push("account_identifier");
  }

  return [...new Set(violations)];
}

/**
 * @param {string} file
 * @returns {boolean}
 */
export function isStrictEvidencePath(file) {
  return (
    STRICT_EVIDENCE_FILES.has(file) ||
    /^data\/providers\/[^/]+\.json$/.test(file) ||
    /^docs\/.*(?:verification|evidence|methodology|security).*\.(?:md|txt)$/i.test(file)
  );
}
