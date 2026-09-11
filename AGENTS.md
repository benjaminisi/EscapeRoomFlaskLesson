# AGENTS.md - Persistent Agent Context & Operational Directives

> **Notice for all AI Agents**: Read this document before proposing changes, editing code, or altering container configurations in this repository.

---

## 1. Project Context & Environment

- **Domain**: Cyber Escape Room interactive educational game (Flask backend + React/Vite/TypeScript frontend + SQLite database).
- **Deployment Model**: **Classroom Local-Area-Network (LAN) ONLY. NO CLOUD DEPLOYMENT.**
- **Topology**:
  - **Server**: Single local Linux machine on the classroom network segment.
  - **Clients**: Teacher and student laptops connecting over local Wi-Fi / Ethernet to the server's local IP address (e.g. `http://<server-ip>:3000`).
  - No external cloud services, external databases, or internet access during active gameplay sessions.

---

## 2. Container Architecture: Monolithic Dev Lab

We use **Alternative B: Monolithic Container with Live Bind-Mount & Hot-Reloading**.

- **Image & Compose**:
  - Defined in `Dockerfile` (Python 3.11 + Node.js 20 LTS).
  - Orchestrated via `docker-compose.yml` (`container_name: escaperoom-lab`), compatible with both `docker compose` and `podman-compose`.
  - Supervisor: `entrypoint.sh` runs both Flask API (port `5001`, debug auto-reload) and Vite dev server (port `3000`, host `0.0.0.0`, watch polling).
- **Volume Mounts**:
  - Host directory is mounted into `/app` (`.:/app`).
  - Node modules are stored in an anonymous volume (`/app/frontend/node_modules`) to avoid cross-platform binary conflicts between host and Linux container.
- **Networking & Routing**:
  - **Vite Proxy**: Port `3000` is exposed to the local network. Vite's dev server proxies all `/api` requests to Flask at `http://localhost:5001`.
  - **Single Origin**: Frontend code MUST use relative API paths (`const API_BASE = '/api'`). **Never hardcode `http://localhost:5001`** in frontend code, as this breaks on student client machines.

---

## 3. Classroom Feature Branch Workflow

Students build features on dedicated git feature branches and push them to GitHub. The teacher deploys them immediately during class.

- **Instant Deployment Tool**:
  `./deploy-branch.sh <branch-name> [--reset-db]`
- **Live Reload Mechanism**:
  - Because `.:/app` is bind-mounted, checking out a git branch on the Linux host immediately updates the container filesystem.
  - Vite HMR updates student browser screens in real-time.
  - Flask's debug reloader picks up backend changes automatically.
  - `deploy-branch.sh` syncs `pip` and `npm` dependencies inside the active container if needed.
- **Database Management**:
  - SQLite database is located at `backend/escaperoom.db`.
  - By default, player progress and puzzle state persist across branch checkouts.
  - Passing `--reset-db` triggers `POST /api/admin/init-db?force=true` to wipe and re-seed the puzzle room cleanly for new student runs.

---

## 4. Documentation Maintenance Responsibilities

Whenever making architectural changes, agents **must maintain and keep synchronized** the following documentation files at the root of the repository:
1. `AGENTS.md` (this file): Agent operational directives and architecture baseline.
2. `SETUP_CONTAINER_AGENT.md`: AI agent technical instructions for building, running, and modifying the container environment.
3. `SETUP_SERVER_TEACHER.md`: Step-by-step instructions for the teacher setting up the Linux server.
4. `REDEPLOY_BRANCH.md`: Fast branch switching and redeployment playbook for the classroom.

---

## 5. Agent Coding Rules
- **Clarification & Low Confidence Protocol**: Whenever you have doubt or low confidence, or when the user's prompt is incomplete, inconsistent, or unclear, you **MUST ask the user for clarification** before making assumptions or proceeding with ambiguous changes.
- **Do not split into multi-container setups** unless explicitly instructed by the user (the user chose the monolithic container for simplicity and instant dev hot-reloads).
- **Never revert `API_BASE`** to an absolute `http://localhost:...` URL.
- **Maintain backward compatibility** with the SQLite schema and seed endpoints (`schema.sql` and `AdminService.init_database`).
- **Items & Field of Vision Architecture**:
  - The term **"lantern"** (ID: `item_lantern`) replaces "flashlight". Do not use "flashlight" in any app code, database models, or documentation.
  - The `items` table includes an integer column `activation_level` (default `0`).
  - For the lantern: `activation_level = 0` means OFF. `activation_level = 1` means ON.
  - Base field of vision for a player is restricted to horizontally, vertically, and diagonally adjacent cells (Chebyshev radius 1).
  - An active lantern expands vision radius by its `activation_level` (radius = $1 + \text{activation\_level}$, so radius 2 when activation level is 1).
  - All players on the network see any area illuminated by an active lantern.

