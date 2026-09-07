# SETUP_CONTAINER_AGENT.md - AI Agent Setup & Maintenance Guide

This document contains precise instructions for an AI agent (or automation engineer) to configure, build, inspect, and maintain the monolithic container environment for the **Cyber Escape Room**.

---

## 1. Container Infrastructure Overview

| Component | Specification |
| :--- | :--- |
| **Image Base** | `python:3.11-slim-bookworm` + `Node.js 20.x LTS` (via NodeSource) |
| **Container Name** | `escaperoom-lab` |
| **Compose File** | `docker-compose.yml` |
| **Entrypoint** | `entrypoint.sh` (Supervises Flask & Vite concurrently) |
| **Exposed Ports** | `3000` (Vite UI + `/api` proxy), `5001` (Direct Flask API) |
| **Volume Mounts** | `.:/app` (Host repo mount), `/app/frontend/node_modules` (Anonymous volume) |
| **Database** | SQLite (`/app/backend/escaperoom.db`) |

---

## 2. Setup & Execution Commands

### Step 2.1: Verify Host Container Engine Prerequisites
Ensure Docker engine or Podman and Compose tools are accessible:
```bash
# When using Docker:
docker --version
docker compose version

# When using Podman:
podman --version
podman-compose --version
```

### Step 2.2: Ensure Script Permissions
Verify that execution bits are set on entrypoint and deploy helper scripts:
```bash
chmod +x entrypoint.sh deploy-branch.sh
```

### Step 2.3: Build the Monolithic Container
Build the dual Python/Node image without using cached layers if dependencies were altered:
```bash
# Docker:
docker compose build

# Podman:
podman-compose build
```

### Step 2.4: Launch the Container
Start the container in detached mode:
```bash
# Docker:
docker compose up -d

# Podman:
podman-compose up -d
```

### Step 2.5: Inspect Startup Logs
Check container logs to verify both backend and frontend booted cleanly:
```bash
# Docker:
docker compose logs -f

# Podman:
podman logs -f escaperoom-lab
# or: podman-compose logs
```
Expected output signature:
```text
[BACKEND] Starting Flask API server on port 5001...
[FRONTEND] Starting Vite dev server on port 3000 (proxying /api -> :5001)...
CYBER ESCAPE ROOM LAB IS READY
```

---

## 3. Automated Verification Checklist for Agents

Execute the following verification sequence after starting or modifying the container:

### Test 1: Container Status
```bash
# Docker:
docker ps --filter "name=escaperoom-lab" --format "{{.ID}} - {{.Status}} - {{.Ports}}"

# Podman:
podman ps --filter "name=escaperoom-lab" --format "{{.ID}} - {{.Status}} - {{.Ports}}"
```

### Test 2: Direct Backend API Health
```bash
curl -s http://localhost:5001/api/health | grep '"status":"online"'
```

### Test 3: Vite Dev Server HTTP Response
```bash
curl -I -s http://localhost:3000/ | grep -E "HTTP/1.1 200|HTTP/2 200"
```

### Test 4: Vite Reverse Proxy Forwarding
Verify that Vite correctly proxies `/api` calls to the Flask backend:
```bash
curl -s http://localhost:3000/api/health | grep '"status":"online"'
```

### Test 5: SQLite Database Initialization & Player Registration
```bash
curl -s -X POST http://localhost:3000/api/player \
  -H "Content-Type: application/json" \
  -d '{"name":"AgentTest","role":"Tester","color":"#00ffcc"}'
```

---

## 4. Troubleshooting & Recovery Recipes

### Issue: Port 3000 or 5001 Already in Use
Check what is holding the port on the host:
```bash
lsof -i :3000
lsof -i :5001
```
Kill the conflicting process or change host port mappings in `docker-compose.yml` (e.g. `"8080:3000"`).

### Issue: Node Modules Architecture Mismatch
If the host has an existing `frontend/node_modules` compiled for macOS (Darwin ARM64) and it leaks into the Linux container:
```bash
# Rebuild anonymous volume (Docker):
docker compose down -v
docker compose build --no-cache
docker compose up -d

# Rebuild anonymous volume (Podman):
podman-compose down -v
podman-compose build --no-cache
podman-compose up -d
```

### Issue: Vite Dev Server HMR Not Detecting File Edits
Ensure `frontend/vite.config.ts` includes `watch: { usePolling: true }`. On containerized Docker/Podman bind mounts, inotify events from the host OS may not propagate without polling.

### Issue: SQLite Database Lock or Corruption
To force-recreate the database using the built-in admin endpoint:
```bash
# Docker:
docker exec escaperoom-lab curl -s -X POST "http://localhost:5001/api/admin/init-db?force=true"

# Podman:
podman exec escaperoom-lab curl -s -X POST "http://localhost:5001/api/admin/init-db?force=true"
```
