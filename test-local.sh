#!/bin/bash

# Script per testare PantryOS in locale con integrazione Home Assistant
# =================================================================

set -e

echo "🚀 Avvio test locale PantryOS con Home Assistant"
echo "=============================================="

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

# Verifica prerequisiti
check_prerequisites() {
    log "Verifica prerequisiti..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker non trovato. Installa Docker per continuare."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose non trovato. Installa Docker Compose per continuare."
        exit 1
    fi
    
    success "Prerequisiti verificati"
}

# Crea configurazione Home Assistant
setup_ha_config() {
    log "Configurazione Home Assistant..."
    
    mkdir -p ha-config
    
    # Crea configuration.yaml base
    cat > ha-config/configuration.yaml << 'EOF'
# Home Assistant Configuration per test PantryOS
default_config:

# Configurazione per addon PantryOS
homeassistant:
  name: Home Assistant Test
  latitude: 45.4642
  longitude: 9.1900
  elevation: 120
  unit_system: metric
  time_zone: Europe/Rome
  country: IT
  language: it

# Abilita API
api:
  use_ssl: false

# Configurazione per test
logger:
  default: info
  logs:
    homeassistant.components.api: debug

# Configurazione ingress
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 127.0.0.1
    - ::1
    - 172.16.0.0/12
    - 192.168.0.0/16
    - 10.0.0.0/8
EOF

    success "Configurazione Home Assistant creata"
}

# Avvia i servizi
start_services() {
    log "Avvio servizi Docker..."
    
    # Pulisci container esistenti
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Build e avvio
    docker-compose up --build -d
    
    success "Servizi avviati"
}

# Verifica stato servizi
check_services() {
    log "Verifica stato servizi..."
    
    # Attendi che i servizi siano pronti
    sleep 10
    
    # Verifica PantryOS
    if curl -s http://localhost:8080/api/health > /dev/null; then
        success "PantryOS è attivo su http://localhost:8080"
    else
        error "PantryOS non risponde su porta 8080"
        return 1
    fi
    
    # Verifica Home Assistant (opzionale)
    if curl -s http://localhost:8123 > /dev/null; then
        success "Home Assistant è attivo su http://localhost:8123"
    else
        warning "Home Assistant non risponde (normale se non configurato)"
    fi
}

# Mostra informazioni di test
show_test_info() {
    echo ""
    echo "🎯 INFORMAZIONI DI TEST"
    echo "======================="
    echo ""
    echo "📍 PantryOS: http://localhost:8080"
    echo "🏠 Home Assistant: http://localhost:8123"
    echo ""
    echo "🔧 Comandi utili:"
    echo "  - Logs PantryOS: docker-compose logs -f pantryos-local"
    echo "  - Logs HA: docker-compose logs -f homeassistant"
    echo "  - Stop: docker-compose down"
    echo "  - Restart: docker-compose restart"
    echo ""
    echo "📊 Test API:"
    echo "  - Health: curl http://localhost:8080/api/health"
    echo "  - State: curl http://localhost:8080/api/state"
    echo "  - Config: curl http://localhost:8080/api/config"
    echo ""
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

# Menu principale
main() {
    echo "PantryOS Local Test Environment"
    echo "============================"
    echo ""
    echo "1) Setup completo (configurazione + avvio)"
    echo "2) Solo avvio servizi"
    echo "3) Solo test API"
    echo "4) Stop servizi"
    echo "5) Logs"
    echo "6) Exit"
    echo ""
    read -p "Scegli opzione (1-6): " choice
    
    case $choice in
        1)
            check_prerequisites
            setup_ha_config
            start_services
            check_services
            test_api
            show_test_info
            ;;
        2)
            start_services
            check_services
            show_test_info
            ;;
        3)
            test_api
            ;;
        4)
            log "Stop servizi..."
            docker-compose down
            success "Servizi fermati"
            ;;
        5)
            echo "Logs disponibili:"
            echo "1) PantryOS logs"
            echo "2) Home Assistant logs"
            echo "3) Tutti i logs"
            read -p "Scegli (1-3): " log_choice
            case $log_choice in
                1) docker-compose logs -f pantryos-local ;;
                2) docker-compose logs -f homeassistant ;;
                3) docker-compose logs -f ;;
            esac
            ;;
        6)
            echo "Arrivederci!"
            exit 0
            ;;
        *)
            error "Opzione non valida"
            exit 1
            ;;
    esac
}

# Esegui se chiamato direttamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
