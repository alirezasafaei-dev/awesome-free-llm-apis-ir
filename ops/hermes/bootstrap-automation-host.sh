#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Safe bootstrap for the guarded Hermes pilot on AUTOMATION_HOST.
# Run as a dedicated unprivileged user after this change is merged.

HERMES_REPO="${HERMES_REPO:-https://github.com/NousResearch/hermes-agent.git}"
HERMES_COMMIT="${HERMES_COMMIT:-659d1123c49ee6828627d07432ed8cf62578434a}"
HERMES_EXPECTED_VERSION="${HERMES_EXPECTED_VERSION:-0.18.2}"
HERMES_DIR="${HERMES_DIR:-$HOME/.local/share/hermes-agent-src}"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$HOME/automation/workspaces}"
PROJECT_REPO="${PROJECT_REPO:-https://github.com/alirezasafaei-dev/awesome-free-llm-apis-ir.git}"
PROJECT_DIR="${PROJECT_DIR:-$WORKSPACE_ROOT/awesome-free-llm-apis-ir}"
PROJECT_REF="${PROJECT_REF:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() { printf '[hermes-bootstrap] %s\n' "$*"; }
die() { printf '[hermes-bootstrap] ERROR: %s\n' "$*" >&2; exit 1; }

if [[ "${EUID}" -eq 0 ]]; then
  die "Do not run this pilot as root. Create/use a dedicated unprivileged automation user."
fi

for command_name in bash git curl node npm; do
  command -v "$command_name" >/dev/null 2>&1 || die "Required command not found: $command_name"
done

node -e 'const [major] = process.versions.node.split(".").map(Number); process.exit(major >= 20 ? 0 : 1)' \
  || die "Node.js 20+ is required. Node.js 22 is recommended."

mkdir -p "$HERMES_HOME" "$WORKSPACE_ROOT" "$(dirname "$HERMES_DIR")"
chmod 700 "$HERMES_HOME" "$WORKSPACE_ROOT" 2>/dev/null || true

if [[ ! -d "$HERMES_DIR/.git" ]]; then
  [[ ! -e "$HERMES_DIR" ]] || die "$HERMES_DIR exists but is not a Git checkout. Move it aside and rerun."
  log "Cloning Hermes source"
  git clone --filter=blob:none --no-checkout "$HERMES_REPO" "$HERMES_DIR"
else
  current_origin="$(git -C "$HERMES_DIR" remote get-url origin 2>/dev/null || true)"
  [[ "$current_origin" == "$HERMES_REPO" ]] || die "Unexpected Hermes origin: $current_origin"
fi

log "Fetching pinned Hermes commit $HERMES_COMMIT"
git -C "$HERMES_DIR" fetch --depth 1 origin "$HERMES_COMMIT"
git -C "$HERMES_DIR" checkout --detach "$HERMES_COMMIT"

log "Installing pinned Hermes source without running the interactive setup wizard"
(
  cd "$HERMES_DIR"
  # setup-hermes.sh may ask once about ripgrep and once about the setup wizard.
  # Answering no keeps bootstrap deterministic and prevents credential prompts.
  printf 'n\nn\n' | HERMES_HOME="$HERMES_HOME" bash ./setup-hermes.sh
)

export PATH="$HOME/.local/bin:$PATH"
command -v hermes >/dev/null 2>&1 || die "Hermes executable was not installed on PATH"
installed_version="$(hermes --version 2>/dev/null | tr -d '\r' || true)"
case "$installed_version" in
  *"$HERMES_EXPECTED_VERSION"*) log "Hermes version verified: $installed_version" ;;
  *) die "Expected Hermes $HERMES_EXPECTED_VERSION but got: ${installed_version:-unknown}" ;;
esac

if [[ ! -d "$PROJECT_DIR/.git" ]]; then
  [[ ! -e "$PROJECT_DIR" ]] || die "$PROJECT_DIR exists but is not a Git checkout. Move it aside and rerun."
  log "Cloning project workspace"
  git clone "$PROJECT_REPO" "$PROJECT_DIR"
else
  project_origin="$(git -C "$PROJECT_DIR" remote get-url origin 2>/dev/null || true)"
  [[ "$project_origin" == "$PROJECT_REPO" ]] || die "Unexpected project origin: $project_origin"
  [[ -z "$(git -C "$PROJECT_DIR" status --porcelain)" ]] || die "Project workspace has uncommitted changes; refusing to update it."
  log "Refreshing project workspace"
  git -C "$PROJECT_DIR" fetch origin "$PROJECT_REF"
fi

git -C "$PROJECT_DIR" checkout "$PROJECT_REF"
git -C "$PROJECT_DIR" pull --ff-only origin "$PROJECT_REF"

config_target="$HERMES_HOME/config.yaml"
if [[ ! -e "$config_target" ]]; then
  install -m 600 "$REPO_ROOT/ops/hermes/config.example.yaml" "$config_target"
  log "Installed hardened Hermes config at $config_target"
else
  log "Existing Hermes config preserved: $config_target"
  log "Review differences against $REPO_ROOT/ops/hermes/config.example.yaml manually"
fi

skill_target="$HERMES_HOME/skills/provider-evidence-ir"
mkdir -p "$skill_target"
install -m 600 "$REPO_ROOT/ops/hermes/skills/provider-evidence-ir/SKILL.md" "$skill_target/SKILL.md"
log "Installed provider-evidence-ir skill"

log "Installing project dependencies and running the complete repository gate"
(
  cd "$PROJECT_DIR"
  npm ci
  npm test
)

cat <<EOF

Hermes pilot bootstrap completed safely.

Installed source:  $HERMES_DIR
Hermes home:       $HERMES_HOME
Project workspace: $PROJECT_DIR

No model credential, GitHub write permission, gateway service, cron job, live Iran test,
or production deployment was configured automatically.

Required operator steps:
  1. Run: hermes setup
  2. Keep GitHub access read-only during the first observation runs.
  3. Review: $HERMES_HOME/config.yaml
  4. After a successful read-only trial, run:
       bash $PROJECT_DIR/ops/hermes/enable-readonly-drift-cron.sh
EOF
