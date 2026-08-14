#!/usr/bin/env bash
set -Eeuo pipefail

OUTPUT_DIR="${1:-.discover-runtime}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/node-runtime-manifest.env"

for command in curl sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command missing: $command" >&2
    exit 2
  }
done

install -d -m 0755 "$OUTPUT_DIR"

fetch_runtime() {
  local arch="$1"
  local expected_sha="$2"
  local file="node-v${NODE_RUNTIME_VERSION}-linux-${arch}.tar.gz"
  local target="$OUTPUT_DIR/$file"
  local url="https://nodejs.org/dist/v${NODE_RUNTIME_VERSION}/${file}"
  local tmp="${target}.tmp"

  rm -f "$tmp"
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    --retry 3 --retry-delay 2 --max-time 180 \
    "$url" -o "$tmp"
  printf '%s  %s\n' "$expected_sha" "$tmp" | sha256sum -c -
  mv -f "$tmp" "$target"
}

fetch_runtime x64 "$NODE_RUNTIME_X64_SHA256"
fetch_runtime arm64 "$NODE_RUNTIME_ARM64_SHA256"

printf 'Prepared verified Node.js %s runtimes for Linux x64 and arm64.\n' "$NODE_RUNTIME_VERSION"
