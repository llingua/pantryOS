#!/bin/bash

# Avvio PantryOS completo con tutte le funzionalità
# ==============================================

echo "🚀 Avvio PantryOS COMPLETO con tutte le funzionalità"
echo "=================================================="

# Crea directory dati
mkdir -p data/pantryos

# Copia schema se non esiste
if [ ! -f "addon-pantryos/pantryos/app/data/schema.json" ]; then
    echo "❌ Schema non trovato"
    exit 1
fi

# Copia dati di esempio se non esistono
if [ ! -f "data/pantryos/state.json" ]; then
    cp addon-pantryos/pantryos/app/data/default-state.json data/pantryos/state.json
    echo "✅ Dati di esempio copiati"
fi

# Vai nella directory dell'app
cd addon-pantryos/pantryos/app

# Avvia server con variabili minime
echo "🌐 Avvio server completo su http://localhost:8080..."

# Variabili ambiente per PantryOS completo
export NODE_ENV=development
export APP_HOST=0.0.0.0
export APP_PORT=8080
export APP_DATA_FILE=../../data/pantryos/state.json
export APP_SCHEMA_FILE=./data/schema.json
export APP_PUBLIC_DIR=./public
export APP_BASE_PATH=/
export APP_CULTURE=it
export APP_CURRENCY=EUR
export APP_TIMEZONE=Europe/Rome
export APP_LOG_LEVEL=info

# Avvia server completo
node server/pantryos-server.js &
SERVER_PID=$!

# Salva PID
echo $SERVER_PID > ../../server.pid
echo "✅ Server completo avviato con PID: $SERVER_PID"

# Attendi avvio
echo "⏳ Attesa avvio server completo..."
sleep 3

# Test
echo "🔍 Test connessione..."
if curl -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ PantryOS COMPLETO attivo su http://localhost:8080"
    echo ""
    echo "🎯 Funzionalità disponibili:"
    echo "  📍 Locations: http://localhost:8080/api/locations"
    echo "  🏷️  Product Groups: http://localhost:8080/api/product-groups"
    echo "  📏 Quantity Units: http://localhost:8080/api/quantity-units"
    echo "  🛍️  Products: http://localhost:8080/api/products"
    echo "  📱 Barcodes: http://localhost:8080/api/barcodes"
    echo "  📦 Items: http://localhost:8080/api/items"
    echo "  🛒 Shopping List: http://localhost:8080/api/shopping-list"
    echo "  ✅ Tasks: http://localhost:8080/api/tasks"
    echo ""
    echo "🌐 Web UI: http://localhost:8080"
    echo "🛑 Per fermare: kill $SERVER_PID"
else
    echo "❌ Errore avvio server"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
