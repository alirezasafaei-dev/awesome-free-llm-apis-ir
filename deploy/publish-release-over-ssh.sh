#!/usr/bin/env bash
# Upload and activate one immutable release with bounded retries for transient SSH transport failures.

set -Eeuo pipefail

: "${SSH_HOST:?SSH_HOST is required}"
: "${SSH_USER:?SSH_USER is required}"
: "${SSH_PORT:?SSH_PORT is required}"
: "${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"

readonly RELEASE_ARCHIVE="site-release.tar.gz"
readonly RELEASE_SCRIPT="deploy/remote-release.sh"
readonly ROLLBACK_SCRIPT="deploy/rollback-release.sh"
readonly REMOTE_ARCHIVE="/tmp/llm-site-${GITHUB_SHA}.tar.gz"
readonly REMOTE_RELEASE_SCRIPT="/tmp/llm-release-${GITHUB_SHA}.sh"
readonly REMOTE_ROLLBACK_SCRIPT="/tmp/llm-rollback-${GITHUB_SHA}.sh"
readonly MAX_ATTEMPTS=5
readonly BASE_DELAY_SECONDS=5

for file in "$RELEASE_ARCHIVE" "$RELEASE_SCRIPT" "$ROLLBACK_SCRIPT"; do
  [[ -s "$file" ]] || {
    echo "Required release input is missing or empty: $file" >&2
    exit 66
  }
done

SSH_COMMON=(
  -i "$HOME/.ssh/id_ed25519"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o ConnectTimeout=15
  -o ConnectionAttempts=2
  -o ServerAliveInterval=10
  -o ServerAliveCountMax=2
)
SSH=(ssh "${SSH_COMMON[@]}" -p "$SSH_PORT")
SCP=(scp "${SSH_COMMON[@]}" -P "$SSH_PORT")

retry_transport() {
  local description="$1"
  shift
  local attempt status delay

  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    if "$@"; then
      return 0
    else
      status=$?
    fi

    if (( attempt == MAX_ATTEMPTS )); then
      echo "SSH transport failed after ${MAX_ATTEMPTS} attempts: ${description}" >&2
      return "$status"
    fi

    delay=$((BASE_DELAY_SECONDS * attempt))
    echo "SSH transport attempt ${attempt}/${MAX_ATTEMPTS} failed for ${description}; retrying in ${delay}s." >&2
    sleep "$delay"
  done
}

retry_transport "release archive upload" \
  "${SCP[@]}" "$RELEASE_ARCHIVE" "${SSH_USER}@${SSH_HOST}:${REMOTE_ARCHIVE}"
retry_transport "release script upload" \
  "${SCP[@]}" "$RELEASE_SCRIPT" "${SSH_USER}@${SSH_HOST}:${REMOTE_RELEASE_SCRIPT}"
retry_transport "rollback script upload" \
  "${SCP[@]}" "$ROLLBACK_SCRIPT" "${SSH_USER}@${SSH_HOST}:${REMOTE_ROLLBACK_SCRIPT}"
retry_transport "release activation" \
  "${SSH[@]}" "${SSH_USER}@${SSH_HOST}" \
  "bash ${REMOTE_RELEASE_SCRIPT} ${DEPLOY_ROOT} ${REMOTE_ARCHIVE} ${GITHUB_SHA}"
