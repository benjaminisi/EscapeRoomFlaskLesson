#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " CYBER ESCAPE ROOM // MONOLITHIC LAB CONTAINER STARTING"
echo "=========================================================="

# Ensure frontend dependencies exist in the mounted node_modules volume
if [ ! -d "/app/frontend/node_modules" ] || [ -z "$(ls -A /app/frontend/node_modules 2>/dev/null)" ]; then
    echo "[SETUP] Populating frontend node_modules..."
    cd /app/frontend && npm install
fi

# Start Flask API server
echo "[BACKEND] Starting Flask API server on port 5001 (auto-reload active)..."
cd /app/backend
python run.py &
FLASK_PID=$!

# Brief pause to let Flask initialize MySQL database and bind ports
sleep 2

# Start Vite React dev server with proxy to Flask
echo "[FRONTEND] Starting Vite dev server on port 3000 (proxying /api -> :5001)..."
cd /app/frontend
npm run dev -- --host 0.0.0.0 --port 3000 &
VITE_PID=$!

# Graceful shutdown handler
shutdown() {
    echo ""
    echo "[CONTAINER] Received termination signal. Stopping services..."
    kill -TERM "$FLASK_PID" 2>/dev/null || true
    kill -TERM "$VITE_PID" 2>/dev/null || true
    wait "$FLASK_PID" 2>/dev/null || true
    wait "$VITE_PID" 2>/dev/null || true
    echo "[CONTAINER] All services stopped cleanly."
    exit 0
}

trap shutdown SIGINT SIGTERM

echo "=========================================================="
echo " CYBER ESCAPE ROOM LAB IS READY"
echo " - Web UI & API Proxy: http://<server-ip>:3000"
echo " - Direct API:         http://<server-ip>:5001/api"
echo "=========================================================="

# Monitor processes
wait -n "$FLASK_PID" "$VITE_PID"
EXIT_CODE=$?
echo "[CONTAINER] A core service exited with code $EXIT_CODE. Exiting."
shutdown
