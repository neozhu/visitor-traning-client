#!/bin/sh
set -eu

: "${VITE_VISITSAFE_API_KEY:?Configure VITE_VISITSAFE_API_KEY in the container environment}"

runtime_config=$(jq -cna \
  --arg apiUrl "${VITE_VISITSAFE_API_URL:-}" \
  --arg apiKey "$VITE_VISITSAFE_API_KEY" \
  '{apiUrl: $apiUrl, apiKey: $apiKey}')

printf 'globalThis.__VISITSAFE_CONFIG__ = %s;\n' "$runtime_config" \
  > /usr/share/nginx/html/runtime-config.js
