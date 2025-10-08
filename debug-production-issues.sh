#!/bin/bash

# Script per identificare e risolvere problemi comuni tra locale e produzione HA
# Questo script diagnostica le differenze e suggerisce soluzioni

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funzioni di logging
log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
debug() { echo -e "${CYAN}[DEBUG]${NC} $1"; }

echo "🔍 PantryOS - Diagnostica Problemi Produzione HA"
echo "=============================================="

# 1. Verifica configurazione Docker
check_docker_config() {
    log "Verifico configurazione Docker..."

    if ! docker info > /dev/null 2>&1; then
        error "Docker non è in esecuzione"
        return 1
    fi

    # Verifica architettura
    ARCH=$(docker version --format '{{.Server.Arch}}')
    log "Architettura Docker: $ARCH"

    # Verifica limitazioni risorse
    MEMORY_LIMIT=$(docker system info --format '{{.MemTotal}}')
    log "Memoria disponibile: $MEMORY_LIMIT"

    success "Docker configurato correttamente"
}

# 2. Verifica variabili d'ambiente
check_environment_variables() {
    log "Verifico variabili d'ambiente..."

    local issues=()

    # Variabili critiche per HA
    local required_vars=(
        "APP_HOST"
        "APP_PORT"
        "APP_DATA_FILE"
        "APP_PUBLIC_DIR"
        "APP_BASE_PATH"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            issues+=("Variabile $var non impostata")
        fi
    done

    # Verifica valori specifici
    if [ "${APP_PORT:-}" != "8099" ]; then
        issues+=("APP_PORT dovrebbe essere 8099 per HA, attuale: ${APP_PORT:-'non impostata'}")
    fi

    if [ "${APP_HOST:-}" != "0.0.0.0" ]; then
        issues+=("APP_HOST dovrebbe essere 0.0.0.0 per HA, attuale: ${APP_HOST:-'non impostata'}")
    fi

    if [ ${#issues[@]} -eq 0 ]; then
        success "Variabili d'ambiente corrette"
    else
        warning "Problemi trovati nelle variabili d'ambiente:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
}

# 3. Verifica percorsi file
check_file_paths() {
    log "Verifico percorsi file..."

    local issues=()

    # Verifica file di stato
    if [ ! -f "${APP_DATA_FILE:-./data/pantryos/state.json}" ]; then
        issues+=("File di stato non trovato: ${APP_DATA_FILE:-./data/pantryos/state.json}")
    fi

    # Verifica directory pubblica
    if [ ! -d "${APP_PUBLIC_DIR:-./pantryos/pantryos/app/public}" ]; then
        issues+=("Directory pubblica non trovata: ${APP_PUBLIC_DIR:-./pantryos/pantryos/app/public}")
    fi

    # Verifica permessi
    if [ -f "${APP_DATA_FILE:-./data/pantryos/state.json}" ]; then
        if [ ! -w "${APP_DATA_FILE:-./data/pantryos/state.json}" ]; then
            issues+=("File di stato non scrivibile: ${APP_DATA_FILE:-./data/pantryos/state.json}")
        fi
    fi

    if [ ${#issues[@]} -eq 0 ]; then
        success "Percorsi file corretti"
    else
        warning "Problemi nei percorsi file:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
}

# 4. Verifica configurazione di rete
check_network_config() {
    log "Verifico configurazione di rete..."

    # Verifica se la porta è in uso
    if lsof -i :8099 > /dev/null 2>&1; then
        warning "Porta 8099 già in uso"
        lsof -i :8099
    else
        success "Porta 8099 disponibile"
    fi

    # Verifica connessione di rete
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        success "Connessione di rete OK"
    else
        error "Problemi di connessione di rete"
    fi
}

# 5. Verifica configurazione HA specifica
check_ha_config() {
    log "Verifico configurazione HA specifica..."

    local issues=()

    # Verifica file config.yaml
    if [ ! -f "./pantryos/pantryos/config.yaml" ]; then
        issues+=("File config.yaml non trovato")
    else
        # Verifica contenuto config.yaml
        if ! grep -q "ingress: true" "./pantryos/pantryos/config.yaml"; then
            issues+=("Ingress non abilitato in config.yaml")
        fi

        if ! grep -q "ingress_port: 8099" "./pantryos/pantryos/config.yaml"; then
            issues+=("Porta ingress non configurata correttamente")
        fi
    fi

    # Verifica Dockerfile
    if [ ! -f "./pantryos/pantryos/Dockerfile" ]; then
        issues+=("Dockerfile non trovato")
    else
        if ! grep -q "APP_DATA_FILE" "./pantryos/pantryos/Dockerfile"; then
            issues+=("APP_DATA_FILE non configurata nel Dockerfile")
        fi
    fi

    if [ ${#issues[@]} -eq 0 ]; then
        success "Configurazione HA corretta"
    else
        warning "Problemi nella configurazione HA:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
    fi
}

# 6. Test di compatibilità
test_compatibility() {
    log "Test di compatibilità..."

    # Test Node.js version
    NODE_VERSION=$(node --version 2>/dev/null || echo "non trovato")
    log "Versione Node.js: $NODE_VERSION"

    # Test architettura
    ARCH=$(uname -m)
    log "Architettura sistema: $ARCH"

    # Verifica se l'architettura è supportata da HA
    case $ARCH in
        x86_64|amd64)
            success "Architettura supportata da HA"
            ;;
        arm64|aarch64)
            success "Architettura ARM supportata da HA"
            ;;
        armv7l)
            success "Architettura ARMv7 supportata da HA"
            ;;
        *)
            warning "Architettura $ARCH potrebbe non essere supportata da HA"
            ;;
    esac
}

# 7. Simulazione problemi comuni
simulate_common_issues() {
    log "Simulo problemi comuni..."

    echo ""
    echo "🔧 Problemi comuni tra locale e produzione HA:"
    echo "=============================================="
    echo ""
    echo "1. 📁 PERCORSI FILE:"
    echo "   - Locale: ./data/state.json"
    echo "   - HA: /data/pantryos/state.json"
    echo "   - Soluzione: Usa APP_DATA_FILE=/data/pantryos/state.json"
    echo ""
    echo "2. 🌐 PORTA:"
    echo "   - Locale: 8080"
    echo "   - HA: 8099 (ingress)"
    echo "   - Soluzione: Usa APP_PORT=8099"
    echo ""
    echo "3. 🔧 VARIABILI AMBIENTE:"
    echo "   - Locale: NODE_ENV=development"
    echo "   - HA: NODE_ENV=production"
    echo "   - Soluzione: Usa NODE_ENV=production"
    echo ""
    echo "4. 🐳 DOCKER:"
    echo "   - Locale: build normale"
    echo "   - HA: s6-overlay, ingress, limitazioni risorse"
    echo "   - Soluzione: Usa Dockerfile HA con s6"
    echo ""
    echo "5. 📊 LOGS:"
    echo "   - Locale: console.log"
    echo "   - HA: /var/log, gestione s6"
    echo "   - Soluzione: Usa sistema di logging strutturato"
    echo ""
}

# 8. Genera report diagnostico
generate_diagnostic_report() {
    log "Genero report diagnostico..."

    local report_file="./diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "PantryOS - Report Diagnostico"
        echo "============================"
        echo "Data: $(date)"
        echo "Sistema: $(uname -a)"
        echo ""

        echo "Docker Info:"
        docker info 2>/dev/null || echo "Docker non disponibile"
        echo ""

        echo "Variabili d'ambiente:"
        env | grep -E "^(APP_|NODE_|PANTRYOS_)" | sort
        echo ""

        echo "File di configurazione:"
        echo "- config.yaml: $(ls -la ./pantryos/pantryos/config.yaml 2>/dev/null || echo 'Non trovato')"
        echo "- Dockerfile: $(ls -la ./pantryos/pantryos/Dockerfile 2>/dev/null || echo 'Non trovato')"
        echo "- docker-compose.yml: $(ls -la ./docker-compose.yml 2>/dev/null || echo 'Non trovato')"
        echo ""

        echo "Container in esecuzione:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Nessun container"

    } > "$report_file"

    success "Report salvato in: $report_file"
}

# 9. Suggerimenti per risoluzione
suggest_solutions() {
    log "Suggerimenti per risoluzione problemi..."

    echo ""
    echo "💡 SOLUZIONI RACCOMANDATE:"
    echo "========================="
    echo ""
    echo "1. 🚀 AVVIA SIMULAZIONE PRODUZIONE:"
    echo "   ./simulate-production.sh start"
    echo ""
    echo "2. 🔧 USA VARIABILI AMBIENTE CORRETTE:"
    echo "   export APP_HOST=0.0.0.0"
    echo "   export APP_PORT=8099"
    echo "   export APP_DATA_FILE=/data/pantryos/state.json"
    echo "   export NODE_ENV=production"
    echo ""
    echo "3. 🐳 USA DOCKER COMPOSE PRODUZIONE:"
    echo "   docker-compose -f docker-compose-production.yml up"
    echo ""
    echo "4. 📊 MONITORA LOGS:"
    echo "   docker-compose logs -f pantryos-local"
    echo ""
    echo "5. 🔍 DEBUG AVANZATO:"
    echo "   docker-compose exec pantryos-local sh"
    echo "   # Dentro il container:"
    echo "   ps aux | grep node"
    echo "   netstat -tlnp | grep 8099"
    echo ""
}

# Menu principale
show_menu() {
    echo ""
    echo "🔍 Menu Diagnostica"
    echo "==================="
    echo "1) Diagnostica completa"
    echo "2) Verifica solo configurazione"
    echo "3) Simula problemi comuni"
    echo "4) Genera report"
    echo "5) Suggerimenti"
    echo "6) Esci"
    echo ""
    read -p "Scegli opzione (1-6): " choice

    case $choice in
        1)
            check_docker_config
            check_environment_variables
            check_file_paths
            check_network_config
            check_ha_config
            test_compatibility
            generate_diagnostic_report
            suggest_solutions
            ;;
        2)
            check_environment_variables
            check_file_paths
            check_ha_config
            ;;
        3)
            simulate_common_issues
            ;;
        4)
            generate_diagnostic_report
            ;;
        5)
            suggest_solutions
            ;;
        6)
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
    if [ $# -eq 0 ]; then
        show_menu
    else
        case $1 in
            "full")
                check_docker_config
                check_environment_variables
                check_file_paths
                check_network_config
                check_ha_config
                test_compatibility
                generate_diagnostic_report
                suggest_solutions
                ;;
            "config")
                check_environment_variables
                check_file_paths
                check_ha_config
                ;;
            "issues")
                simulate_common_issues
                ;;
            "report")
                generate_diagnostic_report
                ;;
            "suggestions")
                suggest_solutions
                ;;
            *)
                echo "Uso: $0 [full|config|issues|report|suggestions]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
