#!/bin/bash

# PantryOS Stop Script
# ===================
# Script to stop PantryOS server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stop PantryOS Server${NC}"
echo "====================="

# Check if PID file exists
if [ ! -f "server.pid" ]; then
    echo -e "${YELLOW}⚠️  Nessun file PID trovato (server.pid)${NC}"
    echo -e "${BLUE}🔍 Controllo processi attivi...${NC}"
    
    # Check for running node processes on port 8080
    PID=$(lsof -ti:8080 2>/dev/null)
    if [ -n "$PID" ]; then
        echo -e "${YELLOW}⚠️  Trovato processo su porta 8080 (PID: $PID)${NC}"
        echo -e "${BLUE}🔍 Controllo se è PantryOS...${NC}"
        
        # Check if it's our PantryOS process
        if ps -p $PID -o command= | grep -q "pantryos-server\|server.js"; then
            echo -e "${GREEN}✅ Processo PantryOS trovato (PID: $PID)${NC}"
            echo -e "${YELLOW}🛑 Terminazione processo...${NC}"
            kill $PID
            sleep 2
            
            # Check if process is still running
            if ps -p $PID > /dev/null 2>&1; then
                echo -e "${RED}⚠️  Processo ancora attivo, forzando terminazione...${NC}"
                kill -9 $PID
                sleep 1
            fi
            
            if ! ps -p $PID > /dev/null 2>&1; then
                echo -e "${GREEN}✅ PantryOS fermato con successo${NC}"
            else
                echo -e "${RED}❌ Errore nella terminazione del processo${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️  Processo su porta 8080 non sembra essere PantryOS${NC}"
            echo -e "${BLUE}💡 Per fermare manualmente: kill $PID${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Nessun processo PantryOS attivo${NC}"
    fi
else
    # Read PID from file
    PID=$(cat server.pid)
    echo -e "${BLUE}🔍 PID letto da server.pid: $PID${NC}"
    
    # Check if process is still running
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Processo PantryOS trovato (PID: $PID)${NC}"
        echo -e "${YELLOW}🛑 Terminazione processo...${NC}"
        kill $PID
        sleep 2
        
        # Check if process is still running
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${RED}⚠️  Processo ancora attivo, forzando terminazione...${NC}"
            kill -9 $PID
            sleep 1
        fi
        
        if ! ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PantryOS fermato con successo${NC}"
            # Remove PID file
            rm -f server.pid
            echo -e "${GREEN}✅ File PID rimosso${NC}"
        else
            echo -e "${RED}❌ Errore nella terminazione del processo${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Processo con PID $PID non è più attivo${NC}"
        echo -e "${BLUE}🧹 Rimozione file PID obsoleto...${NC}"
        rm -f server.pid
        echo -e "${GREEN}✅ File PID rimosso${NC}"
    fi
fi

# Final check
echo -e "${BLUE}🔍 Verifica finale...${NC}"
if lsof -ti:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 8080 ancora in uso${NC}"
    echo -e "${BLUE}💡 Per controllare: lsof -i:8080${NC}"
else
    echo -e "${GREEN}✅ Porta 8080 libera - PantryOS completamente fermato${NC}"
fi
