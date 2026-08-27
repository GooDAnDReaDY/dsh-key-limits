#!/usr/bin/env bash
set -euo pipefail
echo "== build:client =="
node scripts/build-client.mjs
echo "== test =="
npm test
echo "== package dry-run =="
npm pack --dry-run
echo "Source checks complete. Install the resulting package only through the isolated test-server workflow."
