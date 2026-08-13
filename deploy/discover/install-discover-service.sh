#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="${1:-}"
RELEASE_ID="${2:-}"
SERVICE_NAME="persiantoolbox-discover"
SERVICE_USER="persiantoolbox-discover"
BASE_DIR="/opt/persiantoolbox-discover"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
DATA_DIR="/var/lib/persiantoolbox-discover"
DB_PATH="$DATA_DIR/discover.sqlite3"
BACKUP_DIR="$DATA_DIR/backups"
CONFIG_DIR="/etc/persiantoolbox-discover"
UNIT_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/persiantoolbox-discover.service"
UNIT_DEST="/etc/systemd/system/${SERVICE_NAME}.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 2
fi
if [[ -z "$SOURCE_DIR" || ! -d "$SOURCE_DIR/services/discover" ]]; then
  echo "Usage: $0 <staged-repository-root> <release-id>" >&2
  exit 2
fi
if [[ ! "$RELEASE_ID" =~ ^[A-Za-z0-9._-]{7,80}$ ]]; then
  echo "release-id must be 7-80 safe characters." >&2
  exit 2
fi
if [[ ! -f "$SOURCE_DIR/services/discover/server.mjs" ]]; then
  echo "Discover server entrypoint is missing from staged source." >&2
  exit 2
fi

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js is required." >&2
  exit 3
fi
node -e 'const [M,m]=process.versions.node.split(".").map(Number); if(M<22 || (M===22 && m<13)) process.exit(1)' || {
  echo "Node.js 22.13+ is required." >&2
  exit 3
}

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
fi
install -d -m 0755 "$BASE_DIR" "$RELEASES_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$DATA_DIR" "$BACKUP_DIR"
install -d -o root -g "$SERVICE_USER" -m 0750 "$CONFIG_DIR"

DEST="$RELEASES_DIR/$RELEASE_ID"
if [[ -e "$DEST" ]]; then
  echo "Release already exists: $DEST" >&2
  exit 4
fi
install -d -m 0755 "$DEST/services"
cp -a "$SOURCE_DIR/services/discover" "$DEST/services/"
chown -R root:root "$DEST"
find "$DEST" -type d -exec chmod 0755 {} +
find "$DEST" -type f -exec chmod 0644 {} +

PREVIOUS=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS="$(readlink -f "$CURRENT_LINK" || true)"
fi

service_was_active=false
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
  service_was_active=true
  systemctl stop "$SERVICE_NAME"
fi

if [[ -f "$DB_PATH" ]]; then
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  cp -a "$DB_PATH" "$BACKUP_DIR/discover-${timestamp}-pre-${RELEASE_ID}.sqlite3"
  chown "$SERVICE_USER:$SERVICE_USER" "$BACKUP_DIR/discover-${timestamp}-pre-${RELEASE_ID}.sqlite3"
  chmod 0640 "$BACKUP_DIR/discover-${timestamp}-pre-${RELEASE_ID}.sqlite3"
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'discover-*-pre-*.sqlite3' -printf '%T@ %p\n' | sort -nr | awk 'NR>10 {print substr($0,index($0,$2))}' | xargs -r rm -f --
fi

ln -sfn "$DEST" "$CURRENT_LINK.next"
mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
install -m 0644 "$UNIT_SOURCE" "$UNIT_DEST"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null

rollback() {
  echo "Discover service health check failed; restoring previous service release." >&2
  systemctl stop "$SERVICE_NAME" >/dev/null 2>&1 || true
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$CURRENT_LINK.next"
    mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
    systemctl start "$SERVICE_NAME" >/dev/null 2>&1 || true
  fi
}
trap rollback ERR

systemctl restart "$SERVICE_NAME"
for _ in {1..20}; do
  if curl --fail --silent --show-error --max-time 2 http://127.0.0.1:8003/discover/api/health | grep -q '"ok":true'; then
    trap - ERR
    echo "Discover service release $RELEASE_ID is healthy on loopback."
    exit 0
  fi
  sleep 1
done
false
