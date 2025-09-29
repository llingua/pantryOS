# PantryOS - ChatGPT Context

# =========================

## Project Overview

PantryOS is a pantry management system built with Node.js and React. It provides a web interface for managing household inventory, shopping lists, and tasks.

## Architecture

- **Backend**: Node.js with vanilla HTTP server (no Express)
- **Frontend**: React (vanilla JS, no build process)
- **Storage**: JSON file-based persistence
- **Security**: CSP headers, input sanitization

## Project Structure

```
pantryOS/
├── start.sh          # Unified startup script (simple/complete modes)
├── stop.sh           # Server stop script
├── restart.sh        # Server restart script
├── pantryos/
│   └── pantryos-addon/
│       ├── app/
│       │   ├── public/     # Frontend assets (React, CSS, JS)
│       │   ├── server/     # Backend server code
│       │   └── data/       # Default data and schema
│       └── rootfs/         # Docker/container configs
└── ha-config/        # Home Assistant integration
```

## Key Files

- `pantryos/pantryos-addon/app/server/server.js` - Main backend logic (607 lines)
- `pantryos/pantryos-addon/app/public/app.js` - React frontend (1000+ lines)
- `pantryos/pantryos-addon/app/public/index.html` - HTML entry point
- `start.sh`, `stop.sh`, `restart.sh` - Management scripts

## API Endpoints

- `/api/health` - Health check
- `/api/state` - Get full application state
- `/api/items` - CRUD operations for inventory
- `/api/shopping-list` - CRUD operations for shopping list
- `/api/tasks` - CRUD operations for tasks

## Security Features

- Content Security Policy (CSP) headers
- Input sanitization and validation
- File-based storage with proper permissions
- CORS configuration for API endpoints

## Development Workflow

1. **Start**: `./start.sh simple` or `./start.sh complete`
2. **Stop**: `./stop.sh`
3. **Restart**: `./restart.sh [mode]`
4. **Access**: http://localhost:8080

## Technologies Used

- Node.js (vanilla HTTP server)
- React (vanilla JS, no build process)
- JSON file storage
- HTML/CSS/JavaScript
- Shell scripts for management

## Current Issues

- Frontend loading issues (fixed)
- MIME type configuration for JS files
- Server startup in background
