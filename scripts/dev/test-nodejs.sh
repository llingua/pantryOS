#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${APP_PORT:-3000}"

cd "${ROOT_DIR}"

cleanup() {
    ./stop.sh >/dev/null 2>&1 || true
}

run_health_check() {
    curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null
    curl -fsS "http://127.0.0.1:${PORT}/api/config" >/dev/null
    curl -fsS "http://127.0.0.1:${PORT}/api/state" >/dev/null
}

run_crud_check() {
    RESPONSE="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/api/items" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Item","quantity":1,"location":"Test"}')"
    ITEM_ID="$(printf '%s' "${RESPONSE}" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')"

    if [ -z "${ITEM_ID}" ]; then
        echo "Unable to extract created item id"
        exit 1
    fi

    curl -fsS -X PATCH "http://127.0.0.1:${PORT}/api/items/${ITEM_ID}" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Item Updated","quantity":2}' >/dev/null

    curl -fsS -X DELETE "http://127.0.0.1:${PORT}/api/items/${ITEM_ID}" >/dev/null
}

case "${1:-all}" in
    start)
        ./start.sh
        ;;
    stop)
        cleanup
        ;;
    api)
        run_health_check
        echo "API smoke checks passed"
        ;;
    crud)
        run_crud_check
        echo "CRUD smoke checks passed"
        ;;
    all)
        trap cleanup EXIT
        ./start.sh
        run_health_check
        run_crud_check
        echo "All local Node.js checks passed"
        ;;
    *)
        echo "Usage: $0 [start|stop|api|crud|all]"
        exit 1
        ;;
esac
