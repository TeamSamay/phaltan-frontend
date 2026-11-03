#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DASHBOARD_DIR="$ROOT_DIR/dashboard"

if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "[SUTRA] .env file not found. Copy .env.example and configure hosts/ports first."
  exit 1
fi

set -a
source "$ROOT_DIR/.env"
set +a

cd "$DASHBOARD_DIR"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev -- --host 0.0.0.0
