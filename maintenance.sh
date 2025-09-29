#!/bin/bash

# PantryOS Maintenance Script
# ===========================
# Script di manutenzione per PantryOS su Codex

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 PantryOS Maintenance Script${NC}"
echo "=================================="

# Function to check if server is running
check_server() {
    if lsof -i:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running on port 8080${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Server is not running${NC}"
        return 1
    fi
}

# Function to check data integrity
check_data() {
    echo -e "${BLUE}🔍 Checking data integrity...${NC}"
    
    if [ ! -f "data/pantryos/state.json" ]; then
        echo -e "${YELLOW}⚠️  State file missing, creating default...${NC}"
        mkdir -p data/pantryos
        cp pantryos/pantryos-addon/app/data/default-state.json data/pantryos/state.json
    fi
    
    # Validate JSON
    if python3 -m json.tool data/pantryos/state.json > /dev/null 2>&1; then
        echo -e "${GREEN}✅ State file is valid JSON${NC}"
    else
        echo -e "${RED}❌ State file is corrupted, restoring backup...${NC}"
        cp pantryos/pantryos-addon/app/data/default-state.json data/pantryos/state.json
    fi
}

# Function to check file permissions
check_permissions() {
    echo -e "${BLUE}🔍 Checking file permissions...${NC}"
    
    # Make scripts executable
    chmod +x start.sh stop.sh restart.sh 2>/dev/null || true
    
    # Check if scripts are executable
    if [ -x "start.sh" ] && [ -x "stop.sh" ] && [ -x "restart.sh" ]; then
        echo -e "${GREEN}✅ All scripts are executable${NC}"
    else
        echo -e "${RED}❌ Some scripts are not executable${NC}"
        chmod +x start.sh stop.sh restart.sh
    fi
}

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    # Check Node.js
    if command -v node > /dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
    else
        echo -e "${RED}❌ Node.js not found${NC}"
        return 1
    fi
    
    # Check curl
    if command -v curl > /dev/null 2>&1; then
        echo -e "${GREEN}✅ curl available${NC}"
    else
        echo -e "${RED}❌ curl not found${NC}"
        return 1
    fi
}

# Function to test API endpoints
test_api() {
    echo -e "${BLUE}🔍 Testing API endpoints...${NC}"
    
    # Test health endpoint
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
        return 1
    fi
    
    # Test state endpoint
    if curl -s http://localhost:8080/api/state > /dev/null; then
        echo -e "${GREEN}✅ State endpoint working${NC}"
    else
        echo -e "${RED}❌ State endpoint failed${NC}"
        return 1
    fi
}

# Function to clean up
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    
    # Remove old PID files
    rm -f server.pid 2>/dev/null || true
    
    # Clean up any zombie processes
    pkill -f "node.*server" 2>/dev/null || true
    
    # Clean up temporary files
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name "*.log" -delete 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to backup data
backup_data() {
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "data/pantryos/state.json" ]; then
        cp data/pantryos/state.json "$BACKUP_DIR/state.json"
        echo -e "${GREEN}✅ Backup created in $BACKUP_DIR${NC}"
    else
        echo -e "${YELLOW}⚠️  No data to backup${NC}"
    fi
}

# Function to show system status
show_status() {
    echo -e "${BLUE}📊 System Status${NC}"
    echo "==============="
    
    # Server status
    if check_server; then
        echo -e "${GREEN}🟢 Server: Running${NC}"
    else
        echo -e "${RED}🔴 Server: Stopped${NC}"
    fi
    
    # Data status
    if [ -f "data/pantryos/state.json" ]; then
        ITEMS=$(python3 -c "import json; data=json.load(open('data/pantryos/state.json')); print(len(data.get('items', [])))" 2>/dev/null || echo "0")
        SHOPPING=$(python3 -c "import json; data=json.load(open('data/pantryos/state.json')); print(len(data.get('shoppingList', [])))" 2>/dev/null || echo "0")
        TASKS=$(python3 -c "import json; data=json.load(open('data/pantryos/state.json')); print(len(data.get('tasks', [])))" 2>/dev/null || echo "0")
        echo -e "${GREEN}📦 Items: $ITEMS${NC}"
        echo -e "${GREEN}🛒 Shopping: $SHOPPING${NC}"
        echo -e "${GREEN}✅ Tasks: $TASKS${NC}"
    else
        echo -e "${RED}❌ No data file${NC}"
    fi
    
    # Port status
    if lsof -i:8080 > /dev/null 2>&1; then
        PID=$(lsof -ti:8080)
        echo -e "${GREEN}🔌 Port 8080: In use (PID: $PID)${NC}"
    else
        echo -e "${GREEN}🔌 Port 8080: Available${NC}"
    fi
}

# Main maintenance routine
main() {
    echo -e "${BLUE}🚀 Starting PantryOS maintenance...${NC}"
    
    # Check if we're in the right directory
    if [ ! -f "start.sh" ] || [ ! -f "stop.sh" ] || [ ! -f "restart.sh" ]; then
        echo -e "${RED}❌ Not in PantryOS directory${NC}"
        echo -e "${YELLOW}💡 Run: cd /workspace/pantryOS${NC}"
        exit 1
    fi
    
    # Run maintenance checks
    check_dependencies
    check_permissions
    check_data
    cleanup
    
    # Show status
    show_status
    
    # Test if server is running
    if check_server; then
        test_api
    else
        echo -e "${YELLOW}💡 To start server: ./start.sh simple${NC}"
    fi
    
    echo -e "${GREEN}✅ Maintenance completed${NC}"
}

# Run maintenance
main "$@"
