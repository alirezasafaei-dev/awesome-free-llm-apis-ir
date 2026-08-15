#!/usr/bin/env bash
# Atomically upgrade Caddy from a checksum-pinned official archive.

set -Eeuo pipefail

readonly TARGET_VERSION="2.11.4"
readonly ARCHIVE="${1:-}"
readonly EXPECTED_SHA256="${2:-}"
readonly CADDY_BIN="${CADDY_BIN:-$(command -v caddy)}"
readonly CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
readonly BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/caddy/binary}"
readonly HEALTH_URL="${CADDY_HEALTH_URL-https://llm.persiantoolbox.ir/}"
WORK_DIR=""
BACKUP=""
INSTALLED=false

privileged() {
  if [[ "${CADDY_UPGRADE_UNPRIVILEGED:-0}" == "1" ]]; then "$@"; else sudo "$@"; fi
}

cleanup() { [[ -z "$WORK_DIR" || ! -d "$WORK_DIR" ]] || rm -rf "$WORK_DIR"; }

rollback() {
  local status=$?
  if [[ "$INSTALLED" == true && -n "$BACKUP" ]]; then
    echo "[caddy-upgrade] restoring prior binary" >&2
    privileged install -m 755 "$BACKUP" "$CADDY_BIN" || true
    privileged systemctl restart caddy || true
  fi
  cleanup
  exit "$status"
}
trap rollback ERR INT TERM
trap cleanup EXIT

[[ -n "$ARCHIVE" && -f "$ARCHIVE" ]] || { echo "Caddy archive is required" >&2; exit 1; }
[[ "$(uname -m)" == "x86_64" ]] || { echo "Pinned Caddy payload requires x86_64" >&2; exit 1; }
[[ "$EXPECTED_SHA256" =~ ^[0-9a-f]{64}$ ]] || { echo "Full SHA-256 is required" >&2; exit 1; }
[[ -x "$CADDY_BIN" && -f "$CADDYFILE" ]] || { echo "Current Caddy binary/config is missing" >&2; exit 1; }
for command in sha256sum tar install systemctl; do command -v "$command" >/dev/null; done

actual_sha256="$(sha256sum "$ARCHIVE" | awk '{print $1}')"
[[ "$actual_sha256" == "$EXPECTED_SHA256" ]] || { echo "Caddy archive checksum mismatch" >&2; exit 1; }

current_version="$($CADDY_BIN version | sed 's/^v//')"
if [[ "$current_version" == "$TARGET_VERSION" ]]; then
  echo "[caddy-upgrade] Caddy $TARGET_VERSION already installed"
  exit 0
fi

WORK_DIR="$(mktemp -d)"
tar -xzf "$ARCHIVE" -C "$WORK_DIR" caddy
chmod 755 "$WORK_DIR/caddy"
[[ "$("$WORK_DIR/caddy" version | sed 's/^v//')" == "$TARGET_VERSION" ]] || { echo "Unexpected Caddy payload version" >&2; exit 1; }
"$WORK_DIR/caddy" validate --config "$CADDYFILE" --adapter caddyfile >/dev/null

privileged install -d -m 700 "$BACKUP_ROOT"
BACKUP="$BACKUP_ROOT/caddy-${current_version}-$(date -u +%Y%m%dT%H%M%SZ)"
privileged install -m 700 "$CADDY_BIN" "$BACKUP"
privileged install -m 755 "$WORK_DIR/caddy" "$CADDY_BIN"
INSTALLED=true

[[ "$($CADDY_BIN version | sed 's/^v//')" == "$TARGET_VERSION" ]]
privileged "$CADDY_BIN" validate --config "$CADDYFILE" --adapter caddyfile >/dev/null
privileged systemctl restart caddy
privileged systemctl is-active --quiet caddy
if [[ -n "$HEALTH_URL" ]]; then
  curl --fail --silent --show-error --location --max-time 20 --output /dev/null "$HEALTH_URL"
fi

INSTALLED=false
trap - ERR INT TERM
echo "[caddy-upgrade] upgraded Caddy ${current_version} -> ${TARGET_VERSION}; backup: ${BACKUP}"
