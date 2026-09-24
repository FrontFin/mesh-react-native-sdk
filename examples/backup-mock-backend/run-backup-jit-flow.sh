#!/usr/bin/env bash
# OR-453 — exercise the client-direct backup JIT contract end to end, without the
# app or the widget. Ported from FrontBackEnd scripts/jit-local-mock/run-jit-flow.sh,
# adapted from the Mesh-facing (HMAC) contract to the client-direct (bearer) one.
#
#   1. mint a short-lived, user-scoped backup token
#   2. POST /backup/jit/initiate  (Authorization: Bearer <token>)
#   3. poll GET /backup/jit/status until `ready`
#
# Use it to sanity-check the mock backend, or to prove the endpoints a real
# client would implement for OR-452.
set -euo pipefail

API="${API:-http://localhost:4600}"
USER_ID="${USER_ID:-rn-example-user}"
# USDC · Ethereum from the demo pairs. Override NETWORK_ID/SYMBOL to try another.
NETWORK_ID="${NETWORK_ID:-e3c7fdd8-b1fc-4e51-85ae-bb276e075611}"
SYMBOL="${SYMBOL:-USDC}"

jval() { python3 -c 'import sys,json;print((json.load(sys.stdin) or {}).get(sys.argv[1],""))' "$1"; }

echo "── backend=$API  user=$USER_ID  network=$NETWORK_ID  symbol=$SYMBOL"

echo "1. mint backup token"
TOKEN=$(curl -s -X POST "$API/backup/token" -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$USER_ID\"}" | jval token)
[ -n "$TOKEN" ] || { echo "   no token minted"; exit 1; }
echo "   token ok (${TOKEN:0:16}…)"

AUTH=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')

echo "2. POST /backup/jit/initiate"
# `|| true` so a transient curl/tunnel error doesn't abort the script under
# `set -e`; the status poll below is the real gate.
INIT=$(curl -s -X POST "$API/backup/jit/initiate" "${AUTH[@]}" \
  -d "{\"userId\":\"$USER_ID\",\"networkId\":\"$NETWORK_ID\",\"symbol\":\"$SYMBOL\"}" || true)
echo "   ${INIT:0:300}"

echo "3. poll /backup/jit/status until ready"
ADDR=""
for i in $(seq 1 20); do
  S=$(curl -s -G "$API/backup/jit/status" "${AUTH[@]}" \
        --data-urlencode "userId=$USER_ID" \
        --data-urlencode "networkId=$NETWORK_ID" \
        --data-urlencode "symbol=$SYMBOL" || true)
  ST=$(echo "$S" | jval status)
  echo "   [$i] status=${ST:-?}"
  if [ "$ST" = "ready" ]; then
    ADDR=$(echo "$S" | jval address)
    echo "   resolved address=$ADDR"; break
  fi
  [ "$ST" = "error" ] && { echo "   terminal error: $S"; exit 1; }
  sleep 2
done
[ -n "$ADDR" ] || { echo "   never became ready"; exit 1; }

echo "✓ backup JIT resolved for $SYMBOL — a real deposit would show this address as a QR."
