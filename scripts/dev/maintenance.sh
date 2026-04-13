#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="${ROOT_DIR}/data/pantryos"
STATE_FILE="${DATA_DIR}/state.json"
DEFAULT_STATE="${ROOT_DIR}/pantryos/app/data/default-state.json"
PORT="${APP_PORT:-3000}"

mkdir -p "${DATA_DIR}"

echo "PantryOS maintenance"
echo "===================="

if [ ! -f "${STATE_FILE}" ]; then
    cp "${DEFAULT_STATE}" "${STATE_FILE}"
    echo "Created missing state file from default seed"
fi

node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('State JSON is valid')" "${STATE_FILE}"

if [ -f "${ROOT_DIR}/server.pid" ]; then
    PID="$(cat "${ROOT_DIR}/server.pid")"
    if ps -p "${PID}" > /dev/null 2>&1; then
        echo "Dev server appears to be running with PID ${PID}"
    else
        echo "Removing stale PID file"
        rm -f "${ROOT_DIR}/server.pid"
    fi
fi

if curl -fsS "http://127.0.0.1:${PORT}/api/health" > /dev/null 2>&1; then
    echo "Health endpoint is responding on port ${PORT}"
else
    echo "Health endpoint is not responding on port ${PORT}"
fi

echo "Suggested commands:"
echo "  npm run dev"
echo "  npm run stop"
echo "  npm run test"
echo "  npm run test:smoke"
