#!/bin/bash

# Codex setup for PantryOS (Universal image)
# Prepares data dir and permissions without starting the server

set -euo pipefail

# Try to land in the repo root regardless of current PWD
if [ -d "/workspace/pantryOS" ]; then
  cd /workspace/pantryOS
elif [ -d "/workspace" ] && [ -d "/workspace/pantryOS" ]; then
  cd /workspace/pantryOS
fi

printf "\n🚀 Preparing PantryOS environment...\n\n"

# Ensure data dir exists
mkdir -p data/pantryos

# Pick a default state file from known locations
DEFAULT=""
CANDIDATES=(
  "pantryos/pantryos-addon/app/data/default-state.json"
  "pantryos/pantryos-addon/app/data/pantryos/default-state.json"
  "pantryos/pantryos-addon/app/data/empty-state.json"
)

for path in "${CANDIDATES[@]}"; do
  if [ -f "$path" ]; then
    DEFAULT="$path"
    break
  fi
done

# Copy state.json if missing
if [ ! -f "data/pantryos/state.json" ]; then
  if [ -n "$DEFAULT" ]; then
    cp "$DEFAULT" "data/pantryos/state.json"
    echo "✅ Copiato stato iniziale da: $DEFAULT"
  else
    # Fallback minimal state
    cat > "data/pantryos/state.json" << 'EOF'
{
  "items": [],
  "shoppingList": [],
  "tasks": []
}
EOF
    echo "⚠️  Nessun default-state trovato. Creato stato minimale."
  fi
else
  echo "ℹ️  data/pantryos/state.json già presente"
fi

# Make scripts executable if present
chmod +x start.sh stop.sh restart.sh 2>/dev/null || true

# Quick diagnostics (no failure)
ls -la pantryos/pantryos-addon/app/data 2>/dev/null || true

echo "\n✅ Setup completato. Usa:"
echo "   ./start.sh simple    # Avvio semplice"
echo "   ./start.sh complete  # Avvio completo"
