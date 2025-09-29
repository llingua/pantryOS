#!/bin/bash
# PantryOS Codex Setup Script for Universal Image
# =============================================

echo "🚀 Configuring PantryOS environment on Universal image..."

# Navigate to project directory
cd /workspace/pantryOS

# Create data directory
mkdir -p data/pantryos

# Copy default data if not exists
if [ ! -f "data/pantryos/state.json" ]; then
    # Check if the file exists in the correct location
    if [ -f "pantryos/pantryos-addon/app/data/default-state.json" ]; then
        cp pantryos/pantryos-addon/app/data/default-state.json data/pantryos/state.json
        echo "✅ Default data copied from pantryos/pantryos-addon/app/data/default-state.json"
    elif [ -f "pantryos/pantryos-addon/app/data/pantryos/default-state.json" ]; then
        cp pantryos/pantryos-addon/app/data/pantryos/default-state.json data/pantryos/state.json
        echo "✅ Default data copied from pantryos/pantryos-addon/app/data/pantryos/default-state.json"
    else
        # Create a minimal default state if no file exists
        echo "⚠️  No default state file found, creating minimal state..."
        cat > data/pantryos/state.json << 'EOF'
{
  "items": [],
  "shoppingList": [],
  "tasks": []
}
EOF
        echo "✅ Minimal state file created"
    fi
fi

# Set permissions for scripts
chmod +x start.sh stop.sh restart.sh maintenance.sh 2>/dev/null || true

# Check Node.js version
echo "📋 Node.js version:"
node --version

# Check if we can start the server
echo "🔍 Testing server startup..."
if ./start.sh simple > /dev/null 2>&1 & then
    SERVER_PID=$!
    sleep 3

    # Test API
    if curl -s http://localhost:8080/api/health > /dev/null; then
        echo "✅ Server started successfully"
        echo "🌐 PantryOS available at: http://localhost:8080"

        # Test state endpoint
        if curl -s http://localhost:8080/api/state > /dev/null; then
            echo "✅ API endpoints working"
        else
            echo "⚠️  API endpoints may have issues"
        fi

        # Stop test server
        kill $SERVER_PID 2>/dev/null || true
        sleep 1
    else
        echo "❌ Server failed to start or respond"
        kill $SERVER_PID 2>/dev/null || true
    fi
else
    echo "❌ Failed to start server"
fi

echo "✅ PantryOS environment ready!"
echo "📋 Available commands:"
echo "  ./start.sh simple    - Start in simple mode"
echo "  ./start.sh complete  - Start in complete mode"
echo "  ./stop.sh           - Stop server"
echo "  ./restart.sh        - Restart server"
echo "  ./maintenance.sh    - Run maintenance"
echo "  curl http://localhost:8080/api/health - Test API"
