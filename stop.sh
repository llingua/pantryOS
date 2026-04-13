#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${ROOT_DIR}/server.pid"
PORT="${APP_PORT:-3000}"

if [ -f "${PID_FILE}" ]; then
    PID="$(cat "${PID_FILE}")"
    if ps -p "${PID}" > /dev/null 2>&1; then
        kill "${PID}"
        sleep 1
    fi
    rm -f "${PID_FILE}"
fi

RUNNING_PID="$(lsof -ti :"${PORT}" 2>/dev/null || true)"
if [ -n "${RUNNING_PID}" ]; then
    kill "${RUNNING_PID}" 2>/dev/null || true
fi

echo "PantryOS dev server stopped"
