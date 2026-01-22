#!/bin/bash

# Smart Home Platform - Start All Services
# This script kills any existing servers and starts all applications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smart Home Platform - Start All      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    else
        echo -e "${GREEN}Port $port is free${NC}"
    fi
}

# Kill existing processes
echo -e "${YELLOW}Stopping existing services...${NC}"
kill_port 4000  # Backend
kill_port 3000  # Frontend
kill_port 3001  # Reseller Hub
echo ""

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@15 2>/dev/null || echo "PostgreSQL may need manual start"
    sleep 2
fi

# Check if Redis is running
echo -e "${BLUE}Checking Redis...${NC}"
if redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo -e "${GREEN}Redis is running${NC}"
else
    echo -e "${YELLOW}Starting Redis...${NC}"
    brew services start redis 2>/dev/null || echo "Redis may need manual start"
    sleep 2
fi
echo ""

# Create log directory
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# Start Backend
echo -e "${BLUE}Starting Backend (port 4000)...${NC}"
cd "$PROJECT_ROOT/apps/backend"
npm run dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start. Check logs/backend.log${NC}"
    fi
done
echo ""

# Start Frontend
echo -e "${BLUE}Starting Frontend (port 3000)...${NC}"
cd "$PROJECT_ROOT/apps/frontend"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

# Start Reseller Hub
echo -e "${BLUE}Starting Reseller Hub (port 3001)...${NC}"
cd "$PROJECT_ROOT/apps/reseller-hub"
npm run dev > "$LOG_DIR/reseller-hub.log" 2>&1 &
RESELLER_PID=$!
echo -e "${GREEN}Reseller Hub started (PID: $RESELLER_PID)${NC}"
echo ""

# Wait for frontends to be ready
sleep 3

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}  All services started successfully!   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "  ${GREEN}Backend:${NC}       http://localhost:4000"
echo -e "  ${GREEN}Frontend:${NC}      http://localhost:3000"
echo -e "  ${GREEN}Reseller Hub:${NC}  http://localhost:3001"
echo ""
echo -e "  ${YELLOW}Logs:${NC}"
echo -e "    Backend:      $LOG_DIR/backend.log"
echo -e "    Frontend:     $LOG_DIR/frontend.log"
echo -e "    Reseller Hub: $LOG_DIR/reseller-hub.log"
echo ""
echo -e "  ${YELLOW}Demo Logins:${NC}"
echo -e "    ${GREEN}Household User (Frontend):${NC}"
echo -e "      Email:    demo@example.com"
echo -e "      Password: demo123"
echo -e "    ${GREEN}Reseller (Reseller Hub):${NC}"
echo -e "      Email:    demo@product.com"
echo -e "      Password: product123"
echo ""
echo -e "  ${YELLOW}To stop all services:${NC} $PROJECT_ROOT/scripts/stop-all.sh"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > "$LOG_DIR/backend.pid"
echo "$FRONTEND_PID" > "$LOG_DIR/frontend.pid"
echo "$RESELLER_PID" > "$LOG_DIR/reseller-hub.pid"
