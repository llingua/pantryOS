#!/bin/bash

# Avvio semplice PantryOS senza Home Assistant
# ========================================

echo "🚀 Avvio PantryOS (standalone)"
echo "============================"

# Crea directory dati
mkdir -p data/pantryos

# Copia dati di esempio se non esistono
if [ ! -f "data/pantryos/state.json" ]; then
    cp addon-pantryos/pantryos/app/data/default-state.json data/pantryos/state.json
    echo "✅ Dati di esempio copiati"
fi

# Vai nella directory dell'app
cd addon-pantryos/pantryos/app

# Avvia server con variabili minime
echo "🌐 Avvio server su http://localhost:8080..."

# Variabili ambiente minime per test locale
export NODE_ENV=development
export APP_HOST=0.0.0.0
export APP_PORT=8080
export APP_DATA_FILE=../../data/pantryos/state.json
export APP_PUBLIC_DIR=./public
export APP_BASE_PATH=/
export APP_CULTURE=it
export APP_CURRENCY=EUR
export APP_TIMEZONE=Europe/Rome
export APP_LOG_LEVEL=info

# Avvia server
node server/server.js &
SERVER_PID=$!

# Salva PID
echo $SERVER_PID > ../../server.pid
echo "✅ Server avviato con PID: $SERVER_PID"

# Attendi avvio
echo "⏳ Attesa avvio..."
sleep 2

# Test
echo "🔍 Test connessione..."
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ PantryOS attivo su http://localhost:8080"
    echo ""
    echo "🎯 Testa subito:"
    echo "  curl http://localhost:8080/api/health"
    echo "  curl http://localhost:8080/api/state"
    echo ""
    echo "🛑 Per fermare: kill $SERVER_PID"
else
    echo "❌ Errore avvio server"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
