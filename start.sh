#!/bin/bash

# PantryOS Startup Script
# ======================
# Unified script for starting PantryOS with different modes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}PantryOS Startup Script${NC}"
    echo "========================"
    echo ""
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  simple    - Avvio semplice (standalone, default)"
    echo "  complete  - Avvio completo con tutte le funzionalità"
    echo "  help      - Mostra questo messaggio"
    echo ""
    echo "Examples:"
    echo "  $0              # Avvio semplice"
    echo "  $0 simple        # Avvio semplice"
    echo "  $0 complete      # Avvio completo"
}

# Function to start simple mode
start_simple() {
    echo -e "${GREEN}🚀 Avvio PantryOS (standalone)${NC}"
    echo "============================"
    
    # Crea directory dati
    mkdir -p data/pantryos
    
    # Copia dati di esempio se non esistono
    if [ ! -f "data/pantryos/state.json" ]; then
        cp pantryos/pantryos-addon/app/data/default-state.json data/pantryos/state.json
        echo -e "${GREEN}✅ Dati di esempio copiati${NC}"
    fi
    
    # Vai nella directory dell'app
    cd pantryos/pantryos-addon/app
    
    # Avvia server con variabili minime
    echo -e "${BLUE}🌐 Avvio server su http://localhost:8080...${NC}"
    
    # Variabili ambiente minime per test locale
    export NODE_ENV=development
    export APP_HOST=0.0.0.0
    export APP_PORT=8080
    export APP_DATA_FILE=../../../data/pantryos/state.json
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
    echo $SERVER_PID > ../../../server.pid
    echo -e "${GREEN}✅ Server avviato con PID: $SERVER_PID${NC}"
    
    # Attendi avvio
    echo -e "${YELLOW}⏳ Attesa avvio...${NC}"
    sleep 2
    
    # Test
    echo -e "${BLUE}🔍 Test connessione...${NC}"
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo -e "${GREEN}✅ PantryOS attivo su http://localhost:8080${NC}"
        echo ""
        echo -e "${BLUE}🎯 Testa subito:${NC}"
        echo "  curl http://localhost:8080/api/health"
        echo "  curl http://localhost:8080/api/state"
        echo ""
        echo -e "${YELLOW}🛑 Per fermare: kill $SERVER_PID${NC}"
    else
        echo -e "${RED}❌ Errore avvio server${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
}

# Function to start complete mode
start_complete() {
    echo -e "${GREEN}🚀 Avvio PantryOS COMPLETO con tutte le funzionalità${NC}"
    echo "=================================================="
    
    # Crea directory dati
    mkdir -p data/pantryos
    
    # Copia schema se non esiste
    if [ ! -f "pantryos/pantryos-addon/app/data/schema.json" ]; then
        echo -e "${RED}❌ Schema non trovato${NC}"
        exit 1
    fi
    
    # Copia dati di esempio se non esistono
    if [ ! -f "data/pantryos/state.json" ]; then
        cp pantryos/pantryos-addon/app/data/default-state.json data/pantryos/state.json
        echo -e "${GREEN}✅ Dati di esempio copiati${NC}"
    fi
    
    # Vai nella directory dell'app
    cd pantryos/pantryos-addon/app
    
    # Avvia server con variabili minime
    echo -e "${BLUE}🌐 Avvio server completo su http://localhost:8080...${NC}"
    
    # Variabili ambiente per PantryOS completo
    export NODE_ENV=development
    export APP_HOST=0.0.0.0
    export APP_PORT=8080
    export APP_DATA_FILE=../../../data/pantryos/state.json
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
    echo $SERVER_PID > ../../../server.pid
    echo -e "${GREEN}✅ Server completo avviato con PID: $SERVER_PID${NC}"
    
    # Attendi avvio
    echo -e "${YELLOW}⏳ Attesa avvio server completo...${NC}"
    sleep 3
    
    # Test
    echo -e "${BLUE}🔍 Test connessione...${NC}"
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo -e "${GREEN}✅ PantryOS COMPLETO attivo su http://localhost:8080${NC}"
        echo ""
        echo -e "${BLUE}🎯 Funzionalità disponibili:${NC}"
        echo "  📍 Locations: http://localhost:8080/api/locations"
        echo "  🏷️  Product Groups: http://localhost:8080/api/product-groups"
        echo "  📏 Quantity Units: http://localhost:8080/api/quantity-units"
        echo "  🛍️  Products: http://localhost:8080/api/products"
        echo "  📱 Barcodes: http://localhost:8080/api/barcodes"
        echo "  📦 Items: http://localhost:8080/api/items"
        echo "  🛒 Shopping List: http://localhost:8080/api/shopping-list"
        echo "  ✅ Tasks: http://localhost:8080/api/tasks"
        echo ""
        echo -e "${BLUE}🌐 Web UI: http://localhost:8080${NC}"
        echo -e "${YELLOW}🛑 Per fermare: kill $SERVER_PID${NC}"
    else
        echo -e "${RED}❌ Errore avvio server${NC}"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
}

# Main script logic
case "${1:-simple}" in
    "simple")
        start_simple
        ;;
    "complete")
        start_complete
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Modalità non riconosciuta: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
