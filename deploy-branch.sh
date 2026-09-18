#!/usr/bin/env bash
set -e

# ==============================================================================
# Cyber Escape Room - Fast Feature Branch Deployment Tool
# ==============================================================================
# Usage:
#   ./deploy-branch.sh <branch-name> [--reset-db]
#
# Examples:
#   ./deploy-branch.sh feature/student-puzzle-1
#   ./deploy-branch.sh feature/new-keycard --reset-db
# ==============================================================================

# Terminal color helpers
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BRANCH="$1"
RESET_DB=false

if [ -z "$BRANCH" ]; then
    echo -e "${RED}Error: Missing branch name.${NC}"
    echo "Usage: ./deploy-branch.sh <branch-name> [--reset-db]"
    exit 1
fi

if [ "$2" == "--reset-db" ] || [ "$1" == "--reset-db" ]; then
    RESET_DB=true
    if [ "$1" == "--reset-db" ]; then
        echo -e "${RED}Error: Branch name must be the first argument.${NC}"
        echo "Usage: ./deploy-branch.sh <branch-name> [--reset-db]"
        exit 1
    fi
fi

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN} CYBER ESCAPE ROOM // INSTANT BRANCH DEPLOYMENT${NC}"
echo -e "${CYAN} Target Branch: ${YELLOW}${BRANCH}${NC}"
echo -e "${CYAN} Reset Database: ${YELLOW}${RESET_DB}${NC}"
echo -e "${CYAN}==========================================================${NC}"

# 1. Check for uncommitted local changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}[WARNING] You have uncommitted local changes.${NC}"
    read -p "Stash them before switching? (y/N): " CONFIRM
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        git stash
        echo -e "${GREEN}[GIT] Changes stashed.${NC}"
    else
        echo -e "${RED}[ABORTED] Please commit or stash your changes before switching branches.${NC}"
        exit 1
    fi
fi

# 2. Fetch and checkout branch
echo -e "${CYAN}[1/4] Fetching latest branches from origin...${NC}"
git fetch origin

echo -e "${CYAN}[2/4] Switching to branch '${BRANCH}'...${NC}"
git checkout "$BRANCH"
git pull origin "$BRANCH" || true

# 3. Check container status and sync dependencies
CONTAINER_NAME="escaperoom-lab"
CONTAINER_CLI="docker"
if command -v podman &>/dev/null && { ! command -v docker &>/dev/null || ( [ -f /usr/bin/docker ] && grep -q "podman" /usr/bin/docker 2>/dev/null ); }; then
    CONTAINER_CLI="podman"
fi

if $CONTAINER_CLI ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${CYAN}[3/4] Syncing dependencies in active container '${CONTAINER_NAME}' via ${CONTAINER_CLI}...${NC}"
    
    # Sync backend dependencies in case requirements.txt changed
    $CONTAINER_CLI exec "$CONTAINER_NAME" pip install -r /app/backend/requirements.txt --quiet
    
    # Sync frontend dependencies in case package.json changed
    $CONTAINER_CLI exec "$CONTAINER_NAME" bash -c "cd /app/frontend && npm install --silent"
    
    # Optional Database Reset
    if [ "$RESET_DB" = true ]; then
        echo -e "${YELLOW}[4/4] Resetting MySQL database to clean initial state...${NC}"
        $CONTAINER_CLI exec "$CONTAINER_NAME" curl -s -X POST "http://localhost:5001/api/admin/init-db?force=true" > /dev/null
        echo -e "${GREEN}[DATABASE] Database successfully reset and seeded.${NC}"
    else
        echo -e "${CYAN}[4/4] Database preserved.${NC}"
    fi

    echo -e "${GREEN}==========================================================${NC}"
    echo -e "${GREEN} SUCCESS: Branch '${BRANCH}' is now live!${NC}"
    echo -e "${GREEN} Vite HMR has pushed frontend changes to connected browsers.${NC}"
    echo -e "${GREEN} Flask auto-reloader has applied backend updates.${NC}"
    echo -e "${GREEN}==========================================================${NC}"
else
    echo -e "${YELLOW}[NOTICE] Container '${CONTAINER_NAME}' is not currently running.${NC}"
    echo "To launch the container with the newly checked out branch, run:"
    echo "  docker compose up -d"
fi
