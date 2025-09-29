#!/bin/bash

# Script per testare PantryOS Node.js direttamente (senza Docker)
# =============================================================

set -e

echo "🚀 Test PantryOS Node.js Locale"
echo "============================"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verifica prerequisiti Node.js
check_nodejs() {
    log "Verifica prerequisiti Node.js..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js non trovato. Installa Node.js per continuare."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log "Node.js versione: $NODE_VERSION"
    
    success "Node.js verificato"
}

# Setup ambiente di test
setup_environment() {
    log "Setup ambiente di test..."
    
    # Crea directory per dati
    mkdir -p data/pantryos
    
    # Copia dati di esempio se non esistono
    if [ ! -f "data/pantryos/state.json" ]; then
        cp addon-pantryos/pantryos/app/data/default-state.json data/pantryos/state.json
        success "Dati di esempio copiati"
    fi
    
    # Crea file .env per configurazione
    cat > .env << 'EOF'
NODE_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8080
APP_DATA_FILE=./data/pantryos/state.json
APP_PUBLIC_DIR=./addon-pantryos/pantryos/app/public
APP_BASE_PATH=/
APP_CULTURE=it
APP_CURRENCY=EUR
APP_TIMEZONE=Europe/Rome
APP_LOG_LEVEL=debug
EOF

    success "Ambiente configurato"
}

# Avvia server Node.js
start_server() {
    log "Avvio server Node.js..."
    
    # Carica variabili ambiente
    export $(cat .env | xargs)
    
    # Avvia server in background
    cd addon-pantryos/pantryos/app
    node server/server.js &
    SERVER_PID=$!
    
    # Salva PID per cleanup
    echo $SERVER_PID > ../../server.pid
    
    # Attendi che il server sia pronto
    log "Attesa avvio server..."
    sleep 3
    
    # Verifica che il server sia attivo
    if curl -s http://localhost:8080/api/health > /dev/null; then
        success "Server Node.js attivo su http://localhost:8080"
    else
        error "Server non risponde"
        return 1
    fi
}

# Test API
test_api() {
    log "Test API PantryOS..."
    
    echo "🔍 Test endpoint /api/health..."
    if curl -s http://localhost:8080/api/health | grep -q "ok"; then
        success "Health check OK"
    else
        error "Health check fallito"
        return 1
    fi
    
    echo "🔍 Test endpoint /api/config..."
    if curl -s http://localhost:8080/api/config | grep -q "culture"; then
        success "Config endpoint OK"
    else
        error "Config endpoint fallito"
        return 1
    fi
    
    echo "🔍 Test endpoint /api/state..."
    if curl -s http://localhost:8080/api/state | grep -q "items"; then
        success "State endpoint OK"
    else
        error "State endpoint fallito"
        return 1
    fi
    
    success "Tutti i test API sono passati!"
}

# Test CRUD operations
test_crud() {
    log "Test operazioni CRUD..."
    
    echo "🔍 Test aggiunta item..."
    ITEM_RESPONSE=$(curl -s -X POST http://localhost:8080/api/items \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Item","quantity":1,"location":"Test"}')
    
    if echo "$ITEM_RESPONSE" | grep -q "id"; then
        success "Aggiunta item OK"
        ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        log "Item ID: $ITEM_ID"
    else
        error "Aggiunta item fallita"
        return 1
    fi
    
    echo "🔍 Test aggiornamento item..."
    UPDATE_RESPONSE=$(curl -s -X PATCH http://localhost:8080/api/items/$ITEM_ID \
        -H "Content-Type: application/json" \
        -d '{"name":"Test Item Updated","quantity":2}')
    
    if echo "$UPDATE_RESPONSE" | grep -q "Test Item Updated"; then
        success "Aggiornamento item OK"
    else
        error "Aggiornamento item fallito"
        return 1
    fi
    
    echo "🔍 Test eliminazione item..."
    DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:8080/api/items/$ITEM_ID)
    
    if [ "$DELETE_RESPONSE" = "" ]; then
        success "Eliminazione item OK"
    else
        error "Eliminazione item fallita"
        return 1
    fi
}

# Mostra informazioni
show_info() {
    echo ""
    echo "🎯 INFORMAZIONI DI TEST"
    echo "======================="
    echo ""
    echo "📍 PantryOS: http://localhost:8080"
    echo "📊 API Health: http://localhost:8080/api/health"
    echo "📊 API State: http://localhost:8080/api/state"
    echo "📊 API Config: http://localhost:8080/api/config"
    echo ""
    echo "🔧 Comandi utili:"
    echo "  - Stop server: kill \$(cat server.pid)"
    echo "  - Logs: tail -f server.log"
    echo "  - Test API: curl http://localhost:8080/api/health"
    echo ""
    echo "📁 File di configurazione:"
    echo "  - Dati: ./data/pantryos/state.json"
    echo "  - Config: ./.env"
    echo "  - PID: ./server.pid"
    echo ""
}

# Cleanup
cleanup() {
    log "Cleanup..."
    
    if [ -f "server.pid" ]; then
        PID=$(cat server.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            success "Server fermato"
        fi
        rm -f server.pid
    fi
}

# Menu principale
main() {
    echo "PantryOS Node.js Test Environment"
    echo "=============================="
    echo ""
    echo "1) Setup completo (configurazione + avvio + test)"
    echo "2) Solo avvio server"
    echo "3) Solo test API"
    echo "4) Test CRUD completo"
    echo "5) Stop server"
    echo "6) Info e status"
    echo "7) Exit"
    echo ""
    read -p "Scegli opzione (1-7): " choice
    
    case $choice in
        1)
            check_nodejs
            setup_environment
            start_server
            test_api
            test_crud
            show_info
            ;;
        2)
            check_nodejs
            setup_environment
            start_server
            show_info
            ;;
        3)
            test_api
            ;;
        4)
            test_crud
            ;;
        5)
            cleanup
            ;;
        6)
            show_info
            ;;
        7)
            cleanup
            echo "Arrivederci!"
            exit 0
            ;;
        *)
            error "Opzione non valida"
            exit 1
            ;;
    esac
}

# Trap per cleanup automatico
trap cleanup EXIT

# Esegui se chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
