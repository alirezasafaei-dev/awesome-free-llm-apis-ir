#!/usr/bin/env bash
# apply-caddy-config.sh — Persist canonical Caddy config to filesystem
#
# Run from the project root AFTER the Caddy config has been validated and
# deployed via the API.  This writes the repo version to /etc/caddy/ with
# a backup of the existing config, validates it, and reloads Caddy.
#
# Prerequisites: sudo, caddy, and a clone of this repo.
# Usage: bash deploy/caddy/apply-caddy-config.sh

set -Eeuo pipefail

CONFIG_SRC="deploy/caddy/llm.persiantoolbox.ir.caddy"
CONFIG_DST="/etc/caddy/sites-enabled/llm.persiantoolbox.ir.caddy"
CADDYFILE="/etc/caddy/Caddyfile"

if [[ ! -f "$CONFIG_SRC" ]]; then
  echo "Source config not found: $CONFIG_SRC" >&2
  echo "Run this from the repository root." >&2
  exit 1
fi

echo "=== Step 1: Validate source config syntax ==="
if command -v caddy &>/dev/null; then
  TMPDIR="$(mktemp -d)"
  cp "$CONFIG_SRC" "$TMPDIR/llm.persiantoolbox.ir.caddy"
  if [[ -f "$CADDYFILE" ]]; then
    cp "$CADDYFILE" "$TMPDIR/Caddyfile"
  else
    printf 'import /etc/caddy/sites-enabled/*\n' > "$TMPDIR/Caddyfile"
  fi
  if ! caddy validate --config "$TMPDIR/Caddyfile" 2>&1; then
    echo "Caddy config validation FAILED. Aborting." >&2
    rm -rf "$TMPDIR"
    exit 1
  fi
  rm -rf "$TMPDIR"
  echo "Caddy config syntax is valid."
else
  echo "caddy binary not found locally — skipping pre-flight validation."
  echo "The server-side caddy validate will catch syntax errors."
fi

echo ""
echo "=== Step 2: Backup existing config ==="
BACKUP="/tmp/llm-caddy-backup-$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -f "$CONFIG_DST" ]]; then
  sudo cp "$CONFIG_DST" "$BACKUP"
  echo "Backup saved to $BACKUP"
else
  echo "No existing config at $CONFIG_DST — nothing to back up."
fi

echo ""
echo "=== Step 3: Install new config ==="
sudo cp "$CONFIG_SRC" "$CONFIG_DST"
echo "Installed $CONFIG_SRC -> $CONFIG_DST"

echo ""
echo "=== Step 4: Ensure import in main Caddyfile ==="
if [[ -f "$CADDYFILE" ]]; then
  if ! grep -qF 'import /etc/caddy/sites-enabled/*' "$CADDYFILE"; then
    echo 'import /etc/caddy/sites-enabled/*' | sudo tee -a "$CADDYFILE" >/dev/null
    echo "Added import line to $CADDYFILE"
  fi
fi

echo ""
echo "=== Step 5: Format and validate ==="
sudo caddy fmt --overwrite "$CADDYFILE" 2>/dev/null || true
sudo caddy fmt --overwrite "$CONFIG_DST" 2>/dev/null || true
sudo caddy validate --config "$CADDYFILE"

echo ""
echo "=== Step 6: Reload Caddy ==="
sudo systemctl reload caddy
echo "Caddy reloaded successfully."

echo ""
echo "=== Step 7: Verify analytics proxy ==="
HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
  -X POST -H 'Content-Type: text/plain' \
  --data '{"n":"pageview","u":"https://llm.persiantoolbox.ir/","d":"llm.persiantoolbox.ir","v":34}' \
  https://llm.persiantoolbox.ir/api/event 2>/dev/null || echo 'timeout')"
if [[ "$HTTP_CODE" == "202" ]]; then
  echo "Analytics endpoint returned HTTP $HTTP_CODE — OK."
else
  echo "Warning: analytics endpoint returned HTTP $HTTP_CODE (expected 202)." >&2
  echo "Check Plausible backend at 127.0.0.1:8002." >&2
fi

echo ""
echo "=== Caddy config applied and persisted ==="
echo "Backup: $BACKUP (if it exists)"
