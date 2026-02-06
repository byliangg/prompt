#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

python3 "$ROOT_DIR/scripts/build-manifest.py"

PORT="${PORT:-8000}"
URL="http://localhost:${PORT}/index.html"

cd "$ROOT_DIR"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 0.5
if command -v open >/dev/null 2>&1; then
  open "$URL"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL"
else
  echo "Open: $URL"
fi

echo "Serving on $URL (press Ctrl+C to stop)"
wait "$SERVER_PID"
