#!/bin/bash

# Smart Home Platform - Stop All Services
# This script stops all running application servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smart Home Platform - Stop All       ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process on a port
kill_port() {
    local port=$1
    local name=$2
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Stopping $name on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        echo -e "${GREEN}$name stopped${NC}"
    else
        echo -e "${GREEN}$name already stopped (port $port free)${NC}"
    fi
}

# Kill by port
kill_port 4000 "Backend"
kill_port 3000 "Frontend"
kill_port 3001 "Reseller Hub"

# Clean up PID files
rm -f "$LOG_DIR/backend.pid" 2>/dev/null
rm -f "$LOG_DIR/frontend.pid" 2>/dev/null
rm -f "$LOG_DIR/reseller-hub.pid" 2>/dev/null

echo ""
echo -e "${GREEN}All services stopped.${NC}"
echo ""
