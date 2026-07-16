#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

JOB_NAME="${HERMES_DRIFT_JOB_NAME:-LLM provider drift read-only}"
SCHEDULE="${HERMES_DRIFT_SCHEDULE:-every 1d at 06:30}"
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
CONFIG_FILE="$HERMES_HOME/config.yaml"

log() { printf '[hermes-cron] %s\n' "$*"; }
die() { printf '[hermes-cron] ERROR: %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -ne 0 ]] || die "Do not run Hermes cron as root."
command -v hermes >/dev/null 2>&1 || die "Hermes is not installed or not on PATH."
[[ -d "$PROJECT_DIR/.git" ]] || die "Project Git checkout not found: $PROJECT_DIR"
[[ -f "$PROJECT_DIR/AGENTS.md" ]] || die "AGENTS.md is missing; merge/install the Hermes pilot files first."
[[ -f "$CONFIG_FILE" ]] || die "Hermes config not found: $CONFIG_FILE"

# Fail closed if the hardened unattended-command policy is not visible.
grep -Eq '^[[:space:]]*cron_mode:[[:space:]]*["'"']?deny["'"']?[[:space:]]*$' "$CONFIG_FILE" \
  || die "config.yaml must set approvals.cron_mode to deny before enabling unattended work."

[[ -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]] \
  || die "Project workspace is dirty; commit/stash or use a fresh checkout first."

log "Running repository gate before scheduling"
(
  cd "$PROJECT_DIR"
  npm ci
  npm test
)

if hermes cron list 2>/dev/null | grep -Fq "$JOB_NAME"; then
  log "Cron job already exists: $JOB_NAME"
  hermes cron list
  exit 0
fi

PROMPT='Read AGENTS.md and use the provider-evidence-ir skill. Perform a read-only provider documentation drift audit. Run npm run upstreams:check, npm run check:freshness, and npm test. Use only public first-party sources. Do not use credentials, run live Iran or VPN verification, edit files, create a branch or pull request, deploy, merge, or expose private data. Return a concise sanitized report with: outcome, providers checked, first-party drift found, tests, conflicts/unknowns, and human-only follow-up. For Iran-access changes, report live_verification_required and leave data unchanged.'

log "Creating read-only scheduled drift audit"
hermes cron create "$SCHEDULE" "$PROMPT" \
  --skill provider-evidence-ir \
  --workdir "$PROJECT_DIR" \
  --name "$JOB_NAME"

log "Cron job created. It will run only while the Hermes gateway scheduler is active."
hermes cron list

cat <<EOF

Next operator action after reviewing the job:
  hermes gateway install

Do not install the gateway as a system/root service for this pilot. Keep it under
the dedicated automation user and connect Telegram delivery only after a successful
manual run with:
  hermes cron run "$JOB_NAME"
EOF
