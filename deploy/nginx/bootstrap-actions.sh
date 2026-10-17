#!/usr/bin/env bash
# Operator-only bootstrap. Never run this from uploaded CI artifacts.
set -Eeuo pipefail
[[ "$EUID" == 0 ]] || { echo 'Run as root.' >&2; exit 64; }
PUBLIC_KEY="${1:?public key file required}"
DEPLOY_USER="${2:?dedicated deployment account required}"
[[ "$DEPLOY_USER" =~ ^[a-z][a-z0-9-]{7,30}$ ]] || exit 64
[[ -s "$PUBLIC_KEY" && "$(wc -l < "$PUBLIC_KEY")" == 1 ]] || exit 64
ssh-keygen -lf "$PUBLIC_KEY" >/dev/null
grep -q '^ssh-ed25519 ' "$PUBLIC_KEY"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TRUSTED=/usr/local/lib/llm-actions
LOGIN=/var/lib/llm-actions-login
[[ ! -e "/etc/sudoers.d/llm-actions" ]] || { echo 'Existing bootstrap requires operator review.' >&2; exit 65; }
! id "$DEPLOY_USER" >/dev/null 2>&1
systemctl is-active --quiet nginx persiantoolbox-discover
test -L /srv/awesome-free-llm-apis-ir/current
test -s /etc/persiantoolbox-discover/admin-owner-credentials
useradd --system --user-group --no-create-home --home-dir "$LOGIN" --shell /bin/sh "$DEPLOY_USER"
install -d -o root -g root -m 0755 "$TRUSTED" "$TRUSTED/discover" "$LOGIN" "$LOGIN/.ssh"
install -d -o root -g root -m 0700 /var/lib/llm-actions
install -o root -g root -m 0755 "$ROOT/deploy/nginx/actions-deploy.py" "$TRUSTED/actions-deploy.py"
install -o root -g root -m 0755 "$ROOT/deploy/nginx/ssh-entrypoint.py" "$TRUSTED/ssh-entrypoint.py"
install -o root -g root -m 0644 "$ROOT"/deploy/discover/* "$TRUSTED/discover/"
install -o root -g root -m 0644 "$ROOT/deploy/remote-release.sh" "$TRUSTED/remote-release.sh"
install -o root -g root -m 0644 "$ROOT/scripts/check-discover-live-crud.mjs" "$TRUSTED/check-discover-live-crud.mjs"
printf 'restrict,command="/usr/local/lib/llm-actions/ssh-entrypoint.py" %s\n' "$(cat "$PUBLIC_KEY")" > "$LOGIN/.ssh/authorized_keys"
chmod 0644 "$LOGIN/.ssh/authorized_keys"
candidate="$(mktemp)"
trap 'rm -f "$candidate"' EXIT
printf '%s ALL=(root) NOPASSWD: /usr/local/lib/llm-actions/actions-deploy.py *\n' "$DEPLOY_USER" > "$candidate"
visudo -cf "$candidate" >/dev/null
install -o root -g root -m 0440 "$candidate" /etc/sudoers.d/llm-actions
echo 'Restricted application deployment account installed; no existing SSH identity or application was changed.'
