#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="${ROOT_DIR}/data/pantryos"
STATE_FILE="${DATA_DIR}/state.json"
CONFIG_FILE="${DATA_DIR}/config.json"

mkdir -p "${DATA_DIR}"

if [ ! -f "${STATE_FILE}" ]; then
    cp "${ROOT_DIR}/pantryos/app/data/default-state.json" "${STATE_FILE}"
    echo "Created ${STATE_FILE}"
else
    echo "State file already present"
fi

if [ ! -f "${CONFIG_FILE}" ]; then
    cp "${ROOT_DIR}/pantryos/app/data/config.json" "${CONFIG_FILE}"
    echo "Created ${CONFIG_FILE}"
else
    echo "Config file already present"
fi

chmod +x "${ROOT_DIR}/start.sh" "${ROOT_DIR}/stop.sh" "${ROOT_DIR}/restart.sh" 2>/dev/null || true

echo "PantryOS environment prepared"
echo "Next steps:"
echo "  npm run dev"
echo "  npm run test"
