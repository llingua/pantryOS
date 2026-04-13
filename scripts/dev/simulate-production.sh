#!/bin/bash

# Script per simulare l'ambiente di produzione Home Assistant
# Questo script avvia PantryOS con le stesse condizioni di HA

set -e

echo "🏠 Simulazione ambiente Home Assistant per PantryOS"
echo "=================================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Verifica dipendenze
check_dependencies() {
    log "Verifico dipendenze..."

    if ! command -v docker &> /dev/null; then
        error "Docker non trovato. Installa Docker per continuare."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose non trovato. Installa Docker Compose per continuare."
        exit 1
    fi

    success "Dipendenze verificate"
}

# Crea directory necessarie
setup_directories() {
    log "Configuro directory per simulazione..."

    mkdir -p ./data/pantryos
    mkdir -p ./ha-config
    mkdir -p ./logs

    # Crea file di stato vuoto se non esiste
    if [ ! -f "./data/pantryos/state.json" ]; then
        echo '{"products":[],"shoppingList":[],"categories":[],"settings":{}}' > ./data/pantryos/state.json
        log "Creato file di stato iniziale"
    fi

    success "Directory configurate"
}

# Crea configurazione HA per test
create_ha_config() {
    log "Creo configurazione Home Assistant per test..."

    cat > ./ha-config/configuration.yaml << 'EOF'
# Configurazione HA per test PantryOS
default_config:

# Configurazione Ingress
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.16.0.0/12
    - 192.168.0.0/16
    - 10.0.0.0/8

# Configurazione addon
homeassistant:
  name: Home Assistant Test
  latitude: 45.4642
  longitude: 9.1900
  elevation: 120
  unit_system: metric
  time_zone: Europe/Rome
  country: IT
  language: it

# Abilita Ingress
panel_custom:
  - name: pantryos
    sidebar_title: PantryOS
    sidebar_icon: mdi:food-apple
    url_path: pantryos
    module_url: /api/hassio_ingress/{{panel}}/
EOF

    success "Configurazione HA creata"
}

# Avvia simulazione produzione
start_production_simulation() {
    log "Avvio simulazione ambiente produzione..."

    # Stop eventuali container esistenti
    docker-compose down 2>/dev/null || true

    # Build e avvio con configurazione produzione
    docker-compose up --build -d

    success "Simulazione avviata"
}

# Mostra informazioni di accesso
show_access_info() {
    echo ""
    echo "🎉 Simulazione ambiente produzione avviata!"
    echo "=========================================="
    echo ""
    echo "📱 PantryOS (come addon HA):"
    echo "   URL: http://localhost:8080"
    echo "   Porta interna: 8099 (come in HA)"
    echo ""
    echo "🏠 Home Assistant Core:"
    echo "   URL: http://localhost:8123"
    echo "   Username: admin"
    echo "   Password: (creata al primo avvio)"
    echo ""
    echo "📊 Logs:"
    echo "   PantryOS: docker-compose logs -f pantryos-local"
    echo "   HA Core: docker-compose logs -f homeassistant"
    echo ""
    echo "🛠️  Comandi utili:"
    echo "   Stop: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo "   Shell: docker-compose exec pantryos-local sh"
    echo ""
}

# Funzione per monitorare logs
monitor_logs() {
    log "Avvio monitoraggio logs..."
    echo "Premi Ctrl+C per fermare il monitoraggio"
    docker-compose logs -f pantryos-local
}

# Funzione per test API
test_api() {
    log "Test API PantryOS..."

    # Attendi che il servizio sia pronto
    sleep 5

    # Test endpoint principale
    if curl -s http://localhost:8080/ > /dev/null; then
        success "API PantryOS risponde correttamente"
    else
        error "API PantryOS non risponde"
        return 1
    fi

    # Test endpoint dati
    if curl -s http://localhost:8080/api/state > /dev/null; then
        success "Endpoint /api/state funziona"
    else
        warning "Endpoint /api/state potrebbe non essere disponibile"
    fi
}

# Menu principale
show_menu() {
    echo ""
    echo "🔧 Menu Simulazione Produzione"
    echo "=============================="
    echo "1) Avvia simulazione completa"
    echo "2) Solo PantryOS (senza HA Core)"
    echo "3) Monitora logs"
    echo "4) Test API"
    echo "5) Stop simulazione"
    echo "6) Shell container"
    echo "7) Esci"
    echo ""
    read -p "Scegli opzione (1-7): " choice

    case $choice in
        1)
            check_dependencies
            setup_directories
            create_ha_config
            start_production_simulation
            show_access_info
            ;;
        2)
            check_dependencies
            setup_directories
            docker-compose up --build -d pantryos-local
            echo "PantryOS avviato su http://localhost:8080"
            ;;
        3)
            monitor_logs
            ;;
        4)
            test_api
            ;;
        5)
            docker-compose down
            success "Simulazione fermata"
            ;;
        6)
            docker-compose exec pantryos-local sh
            ;;
        7)
            exit 0
            ;;
        *)
            error "Opzione non valida"
            show_menu
            ;;
    esac
}

# Main
main() {
    echo "🏠 PantryOS - Simulatore Ambiente Produzione HA"
    echo "=============================================="

    if [ $# -eq 0 ]; then
        show_menu
    else
        case $1 in
            "start")
                check_dependencies
                setup_directories
                create_ha_config
                start_production_simulation
                show_access_info
                ;;
            "stop")
                docker-compose down
                success "Simulazione fermata"
                ;;
            "logs")
                monitor_logs
                ;;
            "test")
                test_api
                ;;
            "shell")
                docker-compose exec pantryos-local sh
                ;;
            *)
                echo "Uso: $0 [start|stop|logs|test|shell]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
