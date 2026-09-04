#!/usr/bin/env bash

set -euo pipefail
set +x

readonly KEYCHAIN_ACCOUNT="${DEVOPS_BUILD_KEYCHAIN_ACCOUNT:-devops-build}"
readonly KEYCHAIN_PREFIX="devops-build"
readonly SUPPORTED_PROVIDERS="gemini openai anthropic"

usage() {
  printf '%s\n' \
    'Store, remove, or load DevOps Build API keys using macOS Keychain.' \
    '' \
    'Usage:' \
    '  scripts/keychain-secrets.sh set <gemini|openai|anthropic>' \
    '  scripts/keychain-secrets.sh remove <gemini|openai|anthropic>' \
    '  scripts/keychain-secrets.sh run [netlify-dev arguments...]' \
    '  scripts/keychain-secrets.sh list' \
    '' \
    'The set command lets macOS prompt for the secret. The secret is never' \
    'placed in a command argument, project file, browser request, or browser storage.'
}

require_macos_keychain() {
  if [[ "$(uname -s)" != 'Darwin' ]] || [[ ! -x /usr/bin/security ]]; then
    printf '%s\n' 'This helper requires macOS Keychain (/usr/bin/security).' >&2
    exit 1
  fi
}

key_name_for_provider() {
  case "${1:-}" in
    gemini) printf '%s' 'GEMINI_API_KEY' ;;
    openai) printf '%s' 'OPENAI_API_KEY' ;;
    anthropic) printf '%s' 'ANTHROPIC_API_KEY' ;;
    *)
      printf 'Unsupported provider: %s\n' "${1:-missing}" >&2
      usage >&2
      exit 2
      ;;
  esac
}

service_for_key() {
  printf '%s/%s' "$KEYCHAIN_PREFIX" "$1"
}

store_key() {
  local key_name service
  key_name="$(key_name_for_provider "$1")"
  service="$(service_for_key "$key_name")"
  printf 'macOS will securely prompt for %s.\n' "$key_name"
  /usr/bin/security add-generic-password \
    -U \
    -a "$KEYCHAIN_ACCOUNT" \
    -s "$service" \
    -l "DevOps Build ${key_name}" \
    -w
  printf 'Stored %s in macOS Keychain.\n' "$key_name"
}

remove_key() {
  local key_name service
  key_name="$(key_name_for_provider "$1")"
  service="$(service_for_key "$key_name")"
  if /usr/bin/security delete-generic-password -a "$KEYCHAIN_ACCOUNT" -s "$service" >/dev/null 2>&1; then
    printf 'Removed %s from macOS Keychain.\n' "$key_name"
  else
    printf '%s is not stored in macOS Keychain.\n' "$key_name"
  fi
}

list_keys() {
  local provider key_name service
  for provider in $SUPPORTED_PROVIDERS; do
    key_name="$(key_name_for_provider "$provider")"
    service="$(service_for_key "$key_name")"
    if /usr/bin/security find-generic-password -a "$KEYCHAIN_ACCOUNT" -s "$service" >/dev/null 2>&1; then
      printf '%s: stored\n' "$provider"
    else
      printf '%s: not stored\n' "$provider"
    fi
  done
}

run_netlify() {
  local provider key_name service key_value loaded_count=0
  for provider in $SUPPORTED_PROVIDERS; do
    key_name="$(key_name_for_provider "$provider")"
    service="$(service_for_key "$key_name")"
    if key_value="$(/usr/bin/security find-generic-password -w -a "$KEYCHAIN_ACCOUNT" -s "$service" 2>/dev/null)"; then
      export "${key_name}=${key_value}"
      unset key_value
      loaded_count=$((loaded_count + 1))
    fi
  done

  if [[ "$loaded_count" -eq 0 ]]; then
    printf '%s\n' 'No provider keys are stored. Add one with the set command.' >&2
    exit 1
  fi

  exec npx netlify dev "$@"
}

require_macos_keychain

command_name="${1:-help}"
case "$command_name" in
  set)
    [[ "$#" -eq 2 ]] || { usage >&2; exit 2; }
    store_key "$2"
    ;;
  remove)
    [[ "$#" -eq 2 ]] || { usage >&2; exit 2; }
    remove_key "$2"
    ;;
  list)
    [[ "$#" -eq 1 ]] || { usage >&2; exit 2; }
    list_keys
    ;;
  run)
    shift
    run_netlify "$@"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
