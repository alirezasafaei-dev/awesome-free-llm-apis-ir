#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${1:-}"
ARCHIVE="${2:-}"
REVISION="${3:-}"

if [[ "$DEPLOY_ROOT" != "/srv/awesome-free-llm-apis-ir" && !( "${DEPLOY_TEST_MODE:-0}" == "1" && "$DEPLOY_ROOT" == /tmp/awesome-free-llm-apis-ir-test-* ) ]]; then
  echo "Refusing unexpected deploy root: $DEPLOY_ROOT" >&2
  exit 64
fi
if [[ ! "$REVISION" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Revision must be a full Git SHA." >&2
  exit 64
fi
if [[ ! -f "$ARCHIVE" ]]; then
  echo "Release archive does not exist." >&2
  exit 66
fi
if tar -tzf "$ARCHIVE" | grep -Eq '(^|/)\.\.(/|$)|^/'; then
  echo "Unsafe path found in release archive." >&2
  exit 65
fi

umask 022
mkdir -p "$DEPLOY_ROOT/releases"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STAGING="$DEPLOY_ROOT/releases/.staging-${REVISION}-${STAMP}-$$"
RELEASE="$DEPLOY_ROOT/releases/${REVISION}-${STAMP}"

cleanup() {
  rm -rf -- "$STAGING"
}
trap cleanup EXIT

mkdir -p "$STAGING"
tar -xzf "$ARCHIVE" -C "$STAGING"
test -s "$STAGING/index.html"
test -s "$STAGING/catalog.json"
test -s "$STAGING/build-meta.json"

if ! grep -Eq "\"source_revision\"[[:space:]]*:[[:space:]]*\"$REVISION\"" "$STAGING/build-meta.json"; then
  echo "Artifact revision mismatch" >&2
  exit 65
fi
if ! grep -Eq '"provider_count"[[:space:]]*:[[:space:]]*[1-9][0-9]*' "$STAGING/build-meta.json"; then
  echo "Invalid provider count" >&2
  exit 65
fi

mv -- "$STAGING" "$RELEASE"
trap - EXIT

PREVIOUS=""
if [[ -L "$DEPLOY_ROOT/current" ]]; then
  PREVIOUS="$(readlink -f "$DEPLOY_ROOT/current" || true)"
fi

ln -s "$RELEASE" "$DEPLOY_ROOT/.current-${REVISION}-$$"
mv -Tf "$DEPLOY_ROOT/.current-${REVISION}-$$" "$DEPLOY_ROOT/current"
if [[ -n "$PREVIOUS" && -d "$PREVIOUS" && "$PREVIOUS" != "$RELEASE" ]]; then
  ln -sfn "$PREVIOUS" "$DEPLOY_ROOT/previous"
fi

CURRENT_REAL="$(readlink -f "$DEPLOY_ROOT/current")"
PREVIOUS_REAL="$(readlink -f "$DEPLOY_ROOT/previous" 2>/dev/null || true)"
mapfile -t OLD_RELEASES < <(find "$DEPLOY_ROOT/releases" -mindepth 1 -maxdepth 1 -type d ! -name '.staging-*' -printf '%T@ %p\n' | sort -nr | awk 'NR > 5 { $1=""; sub(/^ /, ""); print }')
for old in "${OLD_RELEASES[@]}"; do
  [[ "$old" == "$CURRENT_REAL" || "$old" == "$PREVIOUS_REAL" ]] && continue
  rm -rf -- "$old"
done

rm -f -- "$ARCHIVE"
echo "Activated revision $REVISION at $RELEASE"
