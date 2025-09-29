#!/bin/bash

# PantryOS Restart Script
# ======================
# Script to restart PantryOS server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restart PantryOS Server${NC}"
echo "========================"

# Function to show usage
show_usage() {
    echo -e "${BLUE}PantryOS Restart Script${NC}"
    echo "========================"
    echo ""
    echo "Usage: $0 [MODE]"
    echo ""
    echo "Modes:"
    echo "  simple    - Riavvia in modalità semplice (standalone, default)"
    echo "  complete  - Riavvia in modalità completa"
    echo "  help      - Mostra questo messaggio"
    echo ""
    echo "Examples:"
    echo "  $0              # Riavvia in modalità semplice"
    echo "  $0 simple        # Riavvia in modalità semplice"
    echo "  $0 complete      # Riavvia in modalità completa"
}

# Function to restart with mode
restart_with_mode() {
    local mode=$1
    
    echo -e "${YELLOW}🛑 Fermando PantryOS...${NC}"
    
    # Stop current server
    if [ -f "stop.sh" ]; then
        ./stop.sh
    else
        echo -e "${YELLOW}⚠️  Script stop.sh non trovato, tentativo di fermare manualmente...${NC}"
        
        # Manual stop logic
        if [ -f "server.pid" ]; then
            PID=$(cat server.pid)
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${BLUE}🛑 Terminazione processo PID: $PID${NC}"
                kill $PID
                sleep 2
                if ps -p $PID > /dev/null 2>&1; then
                    kill -9 $PID
                fi
            fi
            rm -f server.pid
        fi
        
        # Check for processes on port 8080
        PID=$(lsof -ti:8080 2>/dev/null)
        if [ -n "$PID" ]; then
            echo -e "${BLUE}🛑 Terminazione processo su porta 8080 (PID: $PID)${NC}"
            kill $PID
            sleep 2
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID
            fi
        fi
    fi
    
    echo -e "${GREEN}✅ PantryOS fermato${NC}"
    echo ""
    
    # Wait a moment
    echo -e "${YELLOW}⏳ Attesa 3 secondi...${NC}"
    sleep 3
    
    # Start with specified mode
    echo -e "${BLUE}🚀 Riavvio PantryOS in modalità: $mode${NC}"
    echo ""
    
    if [ -f "start.sh" ]; then
        ./start.sh $mode
    else
        echo -e "${RED}❌ Script start.sh non trovato${NC}"
        exit 1
    fi
}

# Main script logic
case "${1:-simple}" in
    "simple")
        restart_with_mode "simple"
        ;;
    "complete")
        restart_with_mode "complete"
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
