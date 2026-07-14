#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_ROOT="${1:-}"
if [[ "$DEPLOY_ROOT" != "/srv/awesome-free-llm-apis-ir" && !( "${DEPLOY_TEST_MODE:-0}" == "1" && "$DEPLOY_ROOT" == /tmp/awesome-free-llm-apis-ir-test-* ) ]]; then
  echo "Refusing unexpected deploy root: $DEPLOY_ROOT" >&2
  exit 64
fi

CURRENT="$(readlink -f "$DEPLOY_ROOT/current" 2>/dev/null || true)"
PREVIOUS="$(readlink -f "$DEPLOY_ROOT/previous" 2>/dev/null || true)"
if [[ -z "$CURRENT" || -z "$PREVIOUS" || ! -d "$PREVIOUS" ]]; then
  echo "No valid previous release is available." >&2
  exit 1
fi

ln -s "$PREVIOUS" "$DEPLOY_ROOT/.rollback-current-$$"
mv -Tf "$DEPLOY_ROOT/.rollback-current-$$" "$DEPLOY_ROOT/current"
ln -sfn "$CURRENT" "$DEPLOY_ROOT/previous"
echo "Rolled back from $CURRENT to $PREVIOUS"
