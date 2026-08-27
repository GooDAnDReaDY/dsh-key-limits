#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/mnt/external/Project/DEV/dsh-key-limits}"
PROFILE="${PROFILE:-web}"
PKG="@goodandready/dsh-key-limits"
BASE="${SMOKE_BASE:-http://127.0.0.1:3080}"
export PATH="${HOME}/.nvm/versions/node/v24.15.0/bin:${HOME}/.ssh/bin:/usr/local/bin:/usr/bin:/bin"
cd "$ROOT"
echo "== build:client =="
node scripts/build-client.mjs
echo "== test =="
npm test
echo "== plugin remove/add =="
dsh plugin --profile "$PROFILE" remove "$PKG" || true
dsh plugin --profile "$PROFILE" add "file:$ROOT"
echo "== restart dsh-web =="
sudo systemctl restart dsh-web
sleep 5
systemctl is-active --quiet dsh-web
echo "== health =="
curl -sf "$BASE/dsh-key-limits/health" | grep -q '"ok":true'
code=$(curl -sf -o /dev/null -w '%{http_code}' "$BASE/plugins/$PKG/client.js" || true)
test "$code" = "200"
echo "== journal =="
if journalctl -u dsh-web -n 100 --no-pager | grep -iE 'failed to apply.*key-limits|key-limits.*is not defined'; then
  echo "FAIL" >&2; exit 1
fi
echo "SMOKE OK"
