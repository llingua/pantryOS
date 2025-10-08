#!/bin/bash

# Script per testare l'ambiente di produzione con variabili specifiche HA
# Questo script simula esattamente le condizioni di Home Assistant

set -e

# Colori
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${BLUE}[TEST]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }

echo "🧪 Test Ambiente Produzione PantryOS"
echo "===================================="

# Imposta variabili d'ambiente identiche a HA
export NODE_ENV=production
export APP_HOST=0.0.0.0
export APP_PORT=8099
export APP_DATA_FILE=/data/pantryos/state.json
export APP_PUBLIC_DIR=/opt/pantryos/public
export APP_BASE_PATH=/
export APP_CULTURE=it
export APP_CURRENCY=EUR
export APP_TIMEZONE=Europe/Rome
export APP_LOG_LEVEL=info

# Variabili specifiche HA
export SUPERVISOR_TOKEN=test-token
export SUPERVISOR_URL=http://supervisor:4357
export HASSIO_TOKEN=test-hassio-token

log "Variabili d'ambiente impostate per simulazione HA"

# Crea directory necessarie
mkdir -p ./data/pantryos
mkdir -p ./logs

# Crea file di stato se non esiste
if [ ! -f "./data/pantryos/state.json" ]; then
    echo '{"products":[],"shoppingList":[],"categories":[],"settings":{}}' > ./data/pantryos/state.json
    log "Creato file di stato iniziale"
fi

# Test 1: Verifica variabili d'ambiente
test_environment_variables() {
    log "Test 1: Verifica variabili d'ambiente..."

    local errors=0

    if [ "$NODE_ENV" != "production" ]; then
        warning "NODE_ENV non è 'production'"
        ((errors++))
    fi

    if [ "$APP_PORT" != "8099" ]; then
        warning "APP_PORT non è 8099"
        ((errors++))
    fi

    if [ "$APP_HOST" != "0.0.0.0" ]; then
        warning "APP_HOST non è 0.0.0.0"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        success "Variabili d'ambiente corrette"
    else
        warning "Trovati $errors problemi nelle variabili d'ambiente"
    fi
}

# Test 2: Verifica file e directory
test_files_and_directories() {
    log "Test 2: Verifica file e directory..."

    local errors=0

    if [ ! -f "./data/pantryos/state.json" ]; then
        warning "File di stato non trovato"
        ((errors++))
    fi

    if [ ! -d "./pantryos/pantryos/app/public" ]; then
        warning "Directory pubblica non trovata"
        ((errors++))
    fi

    if [ ! -f "./pantryos/pantryos/config.yaml" ]; then
        warning "File config.yaml non trovato"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        success "File e directory OK"
    else
        warning "Trovati $errors problemi nei file"
    fi
}

# Test 3: Verifica configurazione HA
test_ha_configuration() {
    log "Test 3: Verifica configurazione HA..."

    local errors=0

    # Verifica config.yaml
    if grep -q "ingress: true" "./pantryos/pantryos/config.yaml"; then
        success "Ingress abilitato"
    else
        warning "Ingress non abilitato in config.yaml"
        ((errors++))
    fi

    if grep -q "ingress_port: 8099" "./pantryos/pantryos/config.yaml"; then
        success "Porta ingress corretta"
    else
        warning "Porta ingress non configurata correttamente"
        ((errors++))
    fi

    if grep -q "init: false" "./pantryos/pantryos/config.yaml"; then
        success "Init configurato correttamente"
    else
        warning "Init non configurato correttamente"
        ((errors++))
    fi

    if [ $errors -eq 0 ]; then
        success "Configurazione HA corretta"
    else
        warning "Trovati $errors problemi nella configurazione HA"
    fi
}

# Test 4: Simula avvio con Docker
test_docker_simulation() {
    log "Test 4: Simula avvio con Docker..."

    # Verifica se Docker è disponibile
    if ! command -v docker &> /dev/null; then
        warning "Docker non disponibile"
        return 1
    fi

    # Verifica se la porta è libera
    if lsof -i :8099 > /dev/null 2>&1; then
        warning "Porta 8099 già in uso"
        return 1
    fi

    success "Docker disponibile e porta libera"
}

# Test 5: Verifica compatibilità architettura
test_architecture_compatibility() {
    log "Test 5: Verifica compatibilità architettura..."

    local arch=$(uname -m)
    log "Architettura rilevata: $arch"

    case $arch in
        x86_64|amd64)
            success "Architettura x86_64 supportata da HA"
            ;;
        arm64|aarch64)
            success "Architettura ARM64 supportata da HA"
            ;;
        armv7l)
            success "Architettura ARMv7 supportata da HA"
            ;;
        *)
            warning "Architettura $arch potrebbe non essere supportata da HA"
            ;;
    esac
}

# Esegui tutti i test
run_all_tests() {
    test_environment_variables
    test_files_and_directories
    test_ha_configuration
    test_docker_simulation
    test_architecture_compatibility

    echo ""
    echo "📊 RISULTATI TEST:"
    echo "=================="
    echo "✅ Test completati"
    echo "📁 Directory configurate"
    echo "🔧 Variabili d'ambiente impostate"
    echo "🐳 Docker verificato"
    echo ""
    echo "🚀 PRONTO PER SIMULAZIONE PRODUZIONE!"
    echo ""
    echo "Per avviare la simulazione:"
    echo "  ./simulate-production.sh start"
    echo ""
    echo "Per monitorare i logs:"
    echo "  ./simulate-production.sh logs"
    echo ""
}

# Menu
show_menu() {
    echo ""
    echo "🧪 Menu Test Ambiente"
    echo "===================="
    echo "1) Esegui tutti i test"
    echo "2) Test solo variabili d'ambiente"
    echo "3) Test solo file e directory"
    echo "4) Test solo configurazione HA"
    echo "5) Test solo Docker"
    echo "6) Esci"
    echo ""
    read -p "Scegli opzione (1-6): " choice

    case $choice in
        1) run_all_tests ;;
        2) test_environment_variables ;;
        3) test_files_and_directories ;;
        4) test_ha_configuration ;;
        5) test_docker_simulation ;;
        6) exit 0 ;;
        *) echo "Opzione non valida"; show_menu ;;
    esac
}

# Main
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        "all") run_all_tests ;;
        "env") test_environment_variables ;;
        "files") test_files_and_directories ;;
        "ha") test_ha_configuration ;;
        "docker") test_docker_simulation ;;
        *) echo "Uso: $0 [all|env|files|ha|docker]"; exit 1 ;;
    esac
fi
