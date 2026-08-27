#!/usr/bin/env bash
set -euo pipefail
ROOT="/mnt/external/Project/DEV/dsh-key-limits"
cd "$ROOT"
git-cursor pull --ff-only origin main || true
exec bash scripts/smoke-staging.sh "$ROOT"
