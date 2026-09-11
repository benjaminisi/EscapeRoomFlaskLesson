#!/usr/bin/env bash
set -e

# ==============================================================================
# Cyber Escape Room // Local Run Automation Script
# ==============================================================================
# Starts both the Flask API server and Vite React frontend on your local system,
# automatically setting up virtual environments and dependencies if needed.
#
# Usage:
#   ./run-local.sh            # Run natively on your machine (recommended for dev)
#   ./run-local.sh --reset-db # Wipe and re-seed SQLite database, then run
#   ./run-local.sh --docker   # Run inside monolithic Docker container
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

RESET_DB=false
USE_DOCKER=false
FLASK_PID=""
VITE_PID=""

# Parse arguments
for arg in "$@"; do
    case "$arg" in
        --reset-db)
            RESET_DB=true
            ;;
        --docker|--container)
            USE_DOCKER=true
            ;;
        --help|-h)
            echo -e "${BOLD}Cyber Escape Room - Local Runner${NC}"
            echo ""
            echo "Usage: ./run-local.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --reset-db    Wipe and re-seed SQLite database to factory state"
            echo "  --docker      Run using Docker/Podman container instead of host"
            echo "  --help, -h    Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $arg${NC}"
            echo "Run './run-local.sh --help' for usage."
            exit 1
            ;;
    esac
done

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN} CYBER ESCAPE ROOM // LOCAL ENVIRONMENT LAUNCHER${NC}"
echo -e "${CYAN}==========================================================${NC}"

# ------------------------------------------------------------------------------
# 1. DOCKER / PODMAN CONTAINER MODE (Optional)
# ------------------------------------------------------------------------------
if [ "$USE_DOCKER" = true ]; then
    echo -e "${CYAN}[CONTAINER] Preparing containerized deployment...${NC}"
    COMPOSE_CMD=""
    if docker compose version &>/dev/null; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    elif command -v podman-compose &>/dev/null; then
        COMPOSE_CMD="podman-compose"
    else
        echo -e "${RED}[ERROR] Neither 'docker compose' nor 'podman-compose' was found.${NC}"
        echo "Install Docker Desktop/Engine or run natively: ./run-local.sh"
        exit 1
    fi

    echo -e "${GREEN}[CONTAINER] Launching services with ${COMPOSE_CMD}...${NC}"
    if [ "$RESET_DB" = true ]; then
        $COMPOSE_CMD up -d --build
        echo -e "${YELLOW}[DATABASE] Resetting database inside container...${NC}"
        sleep 3
        curl -s -X POST "http://localhost:5001/api/admin/init-db?force=true" > /dev/null || true
        echo -e "${GREEN}[DATABASE] Database reset and seeded.${NC}"
        $COMPOSE_CMD logs -f
    else
        $COMPOSE_CMD up --build
    fi
    exit 0
fi

# ------------------------------------------------------------------------------
# 2. PREREQUISITE CHECKS (Host Native Mode)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[1/5] Checking system prerequisites...${NC}"

if ! command -v python3 &>/dev/null; then
    echo -e "${RED}[ERROR] python3 is required but not installed or not in PATH.${NC}"
    exit 1
fi

if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
    echo -e "${RED}[ERROR] Node.js and npm are required but not installed or not in PATH.${NC}"
    exit 1
fi

PYTHON_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
NODE_VER=$(node -v)
echo -e "      Python: ${GREEN}${PYTHON_VER}${NC} | Node.js: ${GREEN}${NODE_VER}${NC}"

# ------------------------------------------------------------------------------
# 3. BACKEND SETUP (Python Virtual Environment & Dependencies)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[2/5] Preparing backend environment...${NC}"
VENV_DIR="${BACKEND_DIR}/venv"

if [ ! -d "$VENV_DIR" ]; then
    echo -e "      Creating Python virtual environment in ${YELLOW}backend/venv${NC}..."
    python3 -m venv "$VENV_DIR"
fi

VENV_PYTHON="${VENV_DIR}/bin/python3"
VENV_PIP="${VENV_DIR}/bin/pip"

# Ensure pip & dependencies are installed
if ! "$VENV_PYTHON" -c "import flask, flask_cors" &>/dev/null; then
    echo -e "      Installing Python requirements from ${YELLOW}backend/requirements.txt${NC}..."
    "$VENV_PIP" install -r "${BACKEND_DIR}/requirements.txt" --quiet
else
    echo -e "      Backend Python dependencies are already satisfied."
fi

# ------------------------------------------------------------------------------
# 4. FRONTEND SETUP (Node.js & npm packages)
# ------------------------------------------------------------------------------
echo -e "${CYAN}[3/5] Preparing frontend environment...${NC}"
if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
    echo -e "      Installing npm packages in ${YELLOW}frontend/node_modules${NC}..."
    (cd "$FRONTEND_DIR" && npm install --silent)
else
    echo -e "      Frontend node_modules are present."
fi

# ------------------------------------------------------------------------------
# 5. PORT & CONFLICT MANAGEMENT
# ------------------------------------------------------------------------------
echo -e "${CYAN}[4/5] Checking port availability (5001 for Flask, 3000 for Vite)...${NC}"

kill_port_occupant() {
    local port="$1"
    local pid
    pid=$(lsof -n -P -ti :"$port" 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "      ${YELLOW}[WARN] Port $port is in use by PID $pid. Terminating previous instance...${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

kill_port_occupant 5001
kill_port_occupant 3000

# ------------------------------------------------------------------------------
# 6. DATABASE RESET (Optional Flag)
# ------------------------------------------------------------------------------
if [ "$RESET_DB" = true ]; then
    echo -e "${YELLOW}[DATABASE] Resetting database (--reset-db flag specified)...${NC}"
    (cd "$BACKEND_DIR" && "$VENV_PYTHON" -c "
from app import create_app
from app.services.admin_service import AdminService
app = create_app()
with app.app_context():
    AdminService.init_database(force=True)
print('Database wiped and re-seeded cleanly.')
")
fi

# ------------------------------------------------------------------------------
# 7. SERVICE ORCHESTRATION & PROCESS MONITORING
# ------------------------------------------------------------------------------
echo -e "${CYAN}[5/5] Launching servers...${NC}"

# Get local IP for LAN display
LOCAL_IP="localhost"
if command -v ipconfig &>/dev/null; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
elif command -v hostname &>/dev/null; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
fi

# Start Flask Backend
echo -e "      Starting ${BOLD}Flask API${NC} on ${GREEN}http://localhost:5001${NC}..."
(cd "$BACKEND_DIR" && exec "$VENV_PYTHON" run.py) > "${BACKEND_DIR}/flask.log" 2>&1 &
FLASK_PID=$!

# Pause briefly for Flask database initialization and listener binding
sleep 1.5

# Ensure Flask process is alive
if ! kill -0 "$FLASK_PID" 2>/dev/null; then
    echo -e "${RED}[ERROR] Flask API exited unexpectedly. Logs:${NC}"
    cat "${BACKEND_DIR}/flask.log"
    exit 1
fi
echo -e "      ${GREEN}✔ Flask API server is active.${NC}"

# Start Vite Frontend
echo -e "      Starting ${BOLD}Vite React server${NC} on ${GREEN}http://localhost:3000${NC}..."
(cd "$FRONTEND_DIR" && exec npm run dev -- --host 0.0.0.0 --port 3000) &
VITE_PID=$!

# Clean shutdown handler
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down Cyber Escape Room services...${NC}"
    if [ -n "$FLASK_PID" ]; then
        kill -TERM "$FLASK_PID" 2>/dev/null || true
    fi
    if [ -n "$VITE_PID" ]; then
        kill -TERM "$VITE_PID" 2>/dev/null || true
    fi
    wait "$FLASK_PID" 2>/dev/null || true
    wait "$VITE_PID" 2>/dev/null || true
    echo -e "${GREEN}All local services stopped cleanly. Goodbye!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}==========================================================${NC}"
echo -e "${BOLD}${GREEN} CYBER ESCAPE ROOM IS RUNNING LOCALLY!${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "  💻 ${BOLD}Local Web UI:${NC}    ${CYAN}http://localhost:3000${NC}"
echo -e "  🌐 ${BOLD}LAN Multi-player:${NC} ${CYAN}http://${LOCAL_IP}:3000${NC}"
echo -e "  🔌 ${BOLD}Direct API:${NC}      ${CYAN}http://localhost:5001/api${NC}"
echo -e "  📜 ${BOLD}Backend Logs:${NC}    ${YELLOW}backend/flask.log${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "Press ${BOLD}Ctrl+C${NC} anytime to stop both servers."
echo ""

# Wait on foreground processes
wait "$VITE_PID"
