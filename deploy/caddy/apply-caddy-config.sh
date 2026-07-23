#!/usr/bin/env bash
# Validate, install and reload the canonical Caddy site configuration atomically.

set -Eeuo pipefail

readonly CONFIG_SRC="deploy/caddy/llm.persiantoolbox.ir.caddy"
readonly CONFIG_DST="/etc/caddy/sites-enabled/llm.persiantoolbox.ir.caddy"
readonly CADDYFILE="/etc/caddy/Caddyfile"
readonly SITES_DIR="/etc/caddy/sites-enabled"
readonly IMPORT_LINE="import /etc/caddy/sites-enabled/*"
readonly TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
readonly BACKUP_ROOT="/var/backups/caddy/llm.persiantoolbox.ir/${TIMESTAMP}"

WORK_DIR=""
BACKUP_READY=false
INSTALL_COMPLETE=false
HAD_SITE_CONFIG=false

log() {
  printf '[caddy-deploy] %s\n' "$*"
}

fail() {
  printf '[caddy-deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
    rm -rf "$WORK_DIR"
  fi
}

rollback() {
  local exit_code=$?
  if [[ "$INSTALL_COMPLETE" == true || "$BACKUP_READY" != true ]]; then
    cleanup
    exit "$exit_code"
  fi

  printf '[caddy-deploy] Installation failed; restoring backup from %s\n' "$BACKUP_ROOT" >&2
  sudo install -m 644 "$BACKUP_ROOT/Caddyfile" "$CADDYFILE"
  if [[ "$HAD_SITE_CONFIG" == true ]]; then
    sudo install -m 644 "$BACKUP_ROOT/site.caddy" "$CONFIG_DST"
  else
    sudo rm -f "$CONFIG_DST"
  fi

  if sudo caddy validate --config "$CADDYFILE" --adapter caddyfile; then
    sudo systemctl reload caddy || true
  else
    printf '[caddy-deploy] WARNING: restored configuration did not validate; manual intervention required.\n' >&2
  fi

  cleanup
  exit "$exit_code"
}

trap rollback ERR INT TERM
trap cleanup EXIT

for command in caddy curl install mktemp sed sudo systemctl; do
  command -v "$command" >/dev/null 2>&1 || fail "required command is missing: $command"
done

[[ -f "$CONFIG_SRC" ]] || fail "source configuration not found: $CONFIG_SRC"
[[ -f "$CADDYFILE" ]] || fail "main Caddyfile not found: $CADDYFILE"

WORK_DIR="$(mktemp -d)"
readonly CANDIDATE_ROOT="$WORK_DIR/candidate"
readonly CANDIDATE_CADDYFILE="$CANDIDATE_ROOT/Caddyfile"
readonly CANDIDATE_SITES="$CANDIDATE_ROOT/sites-enabled"
readonly CANDIDATE_SITE="$CANDIDATE_SITES/llm.persiantoolbox.ir.caddy"

install -d -m 700 "$CANDIDATE_SITES"
sudo cat "$CADDYFILE" > "$CANDIDATE_CADDYFILE"
if [[ -d "$SITES_DIR" ]]; then
  sudo cp -a "$SITES_DIR/." "$CANDIDATE_SITES/"
fi
install -m 644 "$CONFIG_SRC" "$CANDIDATE_SITE"

if grep -qF "$IMPORT_LINE" "$CANDIDATE_CADDYFILE"; then
  sed -i "s|${IMPORT_LINE}|import ${CANDIDATE_SITES}/*|g" "$CANDIDATE_CADDYFILE"
else
  printf '\nimport %s/*\n' "$CANDIDATE_SITES" >> "$CANDIDATE_CADDYFILE"
fi

caddy fmt --overwrite "$CANDIDATE_CADDYFILE" >/dev/null
caddy fmt --overwrite "$CANDIDATE_SITE" >/dev/null
log "validating complete candidate configuration"
caddy validate --config "$CANDIDATE_CADDYFILE" --adapter caddyfile

log "creating protected backup"
sudo install -d -m 700 "$BACKUP_ROOT"
sudo install -m 600 "$CADDYFILE" "$BACKUP_ROOT/Caddyfile"
if [[ -f "$CONFIG_DST" ]]; then
  HAD_SITE_CONFIG=true
  sudo install -m 600 "$CONFIG_DST" "$BACKUP_ROOT/site.caddy"
fi
BACKUP_READY=true

log "installing site configuration atomically"
sudo install -d -m 755 "$SITES_DIR"
readonly STAGED_SITE="$SITES_DIR/.llm.persiantoolbox.ir.caddy.${TIMESTAMP}.tmp"
sudo install -m 644 "$CANDIDATE_SITE" "$STAGED_SITE"
sudo mv -f "$STAGED_SITE" "$CONFIG_DST"

if ! sudo grep -qF "$IMPORT_LINE" "$CADDYFILE"; then
  readonly STAGED_CADDYFILE="$WORK_DIR/Caddyfile.live"
  sudo cat "$CADDYFILE" > "$STAGED_CADDYFILE"
  printf '\n%s\n' "$IMPORT_LINE" >> "$STAGED_CADDYFILE"
  caddy fmt --overwrite "$STAGED_CADDYFILE" >/dev/null
  sudo install -m 644 "$STAGED_CADDYFILE" "$CADDYFILE"
fi

log "validating installed configuration"
sudo caddy validate --config "$CADDYFILE" --adapter caddyfile

log "reloading Caddy"
sudo systemctl reload caddy
sudo systemctl is-active --quiet caddy

log "checking canonical site without emitting analytics events"
curl --fail --silent --show-error --location --max-time 20 --output /dev/null \
  https://llm.persiantoolbox.ir/

INSTALL_COMPLETE=true
trap - ERR INT TERM
log "configuration installed successfully"
log "backup retained at: $BACKUP_ROOT"
