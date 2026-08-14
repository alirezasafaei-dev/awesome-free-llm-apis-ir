#!/usr/bin/env bash
set -Eeuo pipefail

SOURCE_DIR="${1:-}"
RELEASE_ID="${2:-}"
SERVICE_NAME="persiantoolbox-discover"
SERVICE_USER="persiantoolbox-discover"
BASE_DIR="/opt/persiantoolbox-discover"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
RUNTIME_DIR="$BASE_DIR/runtime"
NODE_CURRENT_LINK="$RUNTIME_DIR/node-current"
DATA_DIR="/var/lib/persiantoolbox-discover"
DB_PATH="$DATA_DIR/discover.sqlite3"
BACKUP_DIR="$DATA_DIR/backups"
CONFIG_DIR="/etc/persiantoolbox-discover"
UNIT_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/persiantoolbox-discover.service"
UNIT_DEST="/etc/systemd/system/${SERVICE_NAME}.service"
RUNTIME_MANIFEST="$SOURCE_DIR/deploy/discover/node-runtime-manifest.env"
RUNTIME_SOURCE_DIR="$SOURCE_DIR/.discover-runtime"

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
if [[ ! -f "$SOURCE_DIR/node_modules/simple-icons/package.json" ]]; then
  echo "Discover runtime dependency node_modules/simple-icons is missing from staged source." >&2
  exit 2
fi
if [[ ! -f "$RUNTIME_MANIFEST" ]]; then
  echo "Discover Node runtime manifest is missing from staged source." >&2
  exit 2
fi

for command in curl install mv readlink sha256sum tar uname useradd systemctl; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command is missing: $command" >&2
    exit 3
  }
done

# shellcheck disable=SC1090
source "$RUNTIME_MANIFEST"
case "$(uname -m)" in
  x86_64|amd64)
    NODE_ARCH="x64"
    NODE_ARCH_SHA256="$NODE_RUNTIME_X64_SHA256"
    ;;
  aarch64|arm64)
    NODE_ARCH="arm64"
    NODE_ARCH_SHA256="$NODE_RUNTIME_ARM64_SHA256"
    ;;
  *)
    echo "Unsupported Discover Node runtime architecture: $(uname -m)" >&2
    exit 3
    ;;
esac

NODE_ARCHIVE="node-v${NODE_RUNTIME_VERSION}-linux-${NODE_ARCH}.tar.gz"
NODE_ARCHIVE_PATH="$RUNTIME_SOURCE_DIR/$NODE_ARCHIVE"
if [[ ! -f "$NODE_ARCHIVE_PATH" ]]; then
  echo "Bundled Discover Node runtime is missing: $NODE_ARCHIVE" >&2
  exit 3
fi
printf '%s  %s\n' "$NODE_ARCH_SHA256" "$NODE_ARCHIVE_PATH" | sha256sum -c - >/dev/null

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
fi
install -d -m 0755 "$BASE_DIR" "$RELEASES_DIR" "$RUNTIME_DIR"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$DATA_DIR" "$BACKUP_DIR"
install -d -o root -g "$SERVICE_USER" -m 0750 "$CONFIG_DIR"

NODE_RUNTIME_RELEASE="$RUNTIME_DIR/node-v${NODE_RUNTIME_VERSION}-linux-${NODE_ARCH}"
if [[ ! -x "$NODE_RUNTIME_RELEASE/bin/node" ]]; then
  runtime_stage="$RUNTIME_DIR/.node-v${NODE_RUNTIME_VERSION}-linux-${NODE_ARCH}.${RELEASE_ID}.tmp"
  rm -rf -- "$runtime_stage"
  install -d -m 0755 "$runtime_stage"
  tar -xzf "$NODE_ARCHIVE_PATH" -C "$runtime_stage" --strip-components=1
  "$runtime_stage/bin/node" -e 'const [M,m]=process.versions.node.split(".").map(Number); if(M<22 || (M===22 && m<13)) process.exit(1)'
  chown -R root:root "$runtime_stage"
  find "$runtime_stage" -type d -exec chmod 0755 {} +
  mv "$runtime_stage" "$NODE_RUNTIME_RELEASE"
fi
NODE_BIN="$NODE_RUNTIME_RELEASE/bin/node"
"$NODE_BIN" -e 'const [M,m]=process.versions.node.split(".").map(Number); if(M<22 || (M===22 && m<13)) process.exit(1)' || {
  echo "Bundled Node.js 22.13+ runtime verification failed." >&2
  exit 3
}

DEST="$RELEASES_DIR/$RELEASE_ID"
if [[ -e "$DEST" ]]; then
  echo "Release already exists: $DEST" >&2
  exit 4
fi
install -d -m 0755 "$DEST/services" "$DEST/node_modules"
cp -a "$SOURCE_DIR/services/discover" "$DEST/services/"
cp -a "$SOURCE_DIR/node_modules/simple-icons" "$DEST/node_modules/"
chown -R root:root "$DEST"
find "$DEST" -type d -exec chmod 0755 {} +
find "$DEST" -type f -exec chmod 0644 {} +

PREVIOUS=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS="$(readlink -f "$CURRENT_LINK" || true)"
fi
PREVIOUS_RUNTIME=""
if [[ -L "$NODE_CURRENT_LINK" ]]; then
  PREVIOUS_RUNTIME="$(readlink -f "$NODE_CURRENT_LINK" || true)"
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

ln -sfn "$NODE_RUNTIME_RELEASE" "$NODE_CURRENT_LINK.next"
mv -Tf "$NODE_CURRENT_LINK.next" "$NODE_CURRENT_LINK"
ln -sfn "$DEST" "$CURRENT_LINK.next"
mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
install -m 0644 "$UNIT_SOURCE" "$UNIT_DEST"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null

rollback() {
  echo "Discover service health check failed; restoring previous service/runtime release." >&2
  systemctl stop "$SERVICE_NAME" >/dev/null 2>&1 || true

  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    ln -sfn "$PREVIOUS" "$CURRENT_LINK.next"
    mv -Tf "$CURRENT_LINK.next" "$CURRENT_LINK"
  else
    rm -f "$CURRENT_LINK"
  fi

  if [[ -n "$PREVIOUS_RUNTIME" && -d "$PREVIOUS_RUNTIME" ]]; then
    ln -sfn "$PREVIOUS_RUNTIME" "$NODE_CURRENT_LINK.next"
    mv -Tf "$NODE_CURRENT_LINK.next" "$NODE_CURRENT_LINK"
  else
    rm -f "$NODE_CURRENT_LINK"
  fi

  if [[ "$service_was_active" == true && -n "$PREVIOUS" && -d "$PREVIOUS" && -x "$NODE_CURRENT_LINK/bin/node" ]]; then
    systemctl start "$SERVICE_NAME" >/dev/null 2>&1 || true
  fi
}
trap rollback ERR

systemctl restart "$SERVICE_NAME"
for _ in {1..20}; do
  if curl --fail --silent --show-error --max-time 2 http://127.0.0.1:8003/discover/api/health | grep -q '"ok":true'; then
    trap - ERR
    echo "Discover service release $RELEASE_ID is healthy on loopback using bundled Node.js $NODE_RUNTIME_VERSION ($NODE_ARCH)."
    exit 0
  fi
  sleep 1
done
false
