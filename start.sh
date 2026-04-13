#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${ROOT_DIR}/pantryos/app"
DATA_DIR="${ROOT_DIR}/data/pantryos"
PID_FILE="${ROOT_DIR}/server.pid"
PORT="${APP_PORT:-3000}"
LOG_DIR="${ROOT_DIR}/logs"

mkdir -p "${DATA_DIR}"
mkdir -p "${LOG_DIR}"

if [ ! -f "${DATA_DIR}/state.json" ]; then
    cp "${APP_DIR}/data/default-state.json" "${DATA_DIR}/state.json"
fi

if [ ! -f "${DATA_DIR}/config.json" ]; then
    cp "${APP_DIR}/data/config.json" "${DATA_DIR}/config.json"
fi

cd "${APP_DIR}"

export NODE_ENV="${NODE_ENV:-development}"
export APP_HOST="${APP_HOST:-127.0.0.1}"
export APP_PORT="${PORT}"
export APP_DATA_FILE="${DATA_DIR}/state.json"
export APP_CONFIG_FILE="${DATA_DIR}/config.json"
export APP_SCHEMA_FILE="${APP_DIR}/data/schema.json"
export APP_PUBLIC_DIR="${APP_DIR}/public"
export APP_BASE_PATH="${APP_BASE_PATH:-/}"

node server/pantryos-server.js > "${LOG_DIR}/dev-server.log" 2>&1 &
SERVER_PID=$!
echo "${SERVER_PID}" > "${PID_FILE}"

sleep 2

if curl -fsS "http://127.0.0.1:${PORT}/api/health" > /dev/null; then
    echo "PantryOS dev server running on http://localhost:${PORT}"
    echo "PID: ${SERVER_PID}"
else
    echo "PantryOS failed to start. Check logs/dev-server.log"
    kill "${SERVER_PID}" 2>/dev/null || true
    exit 1
fi
