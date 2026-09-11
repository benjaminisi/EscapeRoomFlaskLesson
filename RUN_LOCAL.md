# Running Cyber Escape Room Locally

This guide explains how to launch and play the Cyber Escape Room web application on your local machine.

---

## ⚡ Quick Start (Recommended)

Run the automated launcher script from the root checkout directory:

```bash
./run-local.sh
```

Once started:
- **Web Game Interface**: Open your browser at [http://localhost:3000](http://localhost:3000)
- **Local LAN Multiplayer**: Teammates on the same local network / Wi-Fi can join at `http://<your-local-ip>:3000` (the script prints your detected LAN address)
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api) (Vite proxies all `/api` requests automatically)
- **Stopping**: Press `Ctrl+C` in your terminal anytime to shut down both servers cleanly.

---

## 🛠️ Launcher Options & Features

The `./run-local.sh` script does all the heavy lifting automatically:

| Command | Description |
|---|---|
| `./run-local.sh` | Default run. Preserves player progress, items, and puzzle states in `backend/escaperoom.db`. |
| `./run-local.sh --reset-db` | Wipes and re-seeds the SQLite database to factory state (fresh chamber, lantern at `(0, 1)`, all puzzles locked). |
| `./run-local.sh --docker` | Runs inside the containerized Docker/Podman monolithic lab environment. |
| `./run-local.sh --help` | Displays command line options. |

### What the script handles automatically:
1. **Prerequisite Verification**: Checks for `python3`, `node`, and `npm`.
2. **Virtual Environment Setup**: Automatically provisions `backend/venv` and installs Python dependencies (`Flask`, `Flask-Cors`) if missing.
3. **Frontend Packages**: Automatically runs `npm install` inside `frontend/` if `node_modules` is not yet installed.
4. **Port Management**: Checks for stale processes occupying ports `5001` or `3000` and frees them before starting.
5. **Dual Service Coordination**: Starts the Flask API in the background, waits for its health check (`/api/health`), and launches the Vite React dev server with Hot Module Replacement (HMR).
6. **Graceful Cleanup**: Traps `Ctrl+C` / `SIGINT` to ensure no orphan processes are left running on ports `5001` or `3000`.

### 💡 Note on SQLite Lifecycle (Why No Start/Stop Needed)
Unlike client-server database engines such as MySQL or PostgreSQL, **SQLite is an in-process, serverless database**:
- It does **not** run as a standalone background daemon or system service (there is no port or background process to start/stop).
- The entire database is a single local file: `backend/escaperoom.db`.
- **Connection Lifecycle**: Python's built-in `sqlite3` driver opens the file whenever Flask handles requests, and automatically closes all connections when Flask terminates on `Ctrl+C`.
- **Database Reset**: Using `./run-local.sh --reset-db` triggers `AdminService.init_database(force=True)` to wipe and re-seed the tables inside the existing file.

---

## 👥 Classroom & LAN Multiplayer Gameplay

When multiple players connect to the game from different laptops on the same Wi-Fi / local network:
1. Each player enters their operative name and chooses a chassis profile (avatar role & color).
2. **Field of Vision (FoV)**:
   - Each player initially has base ambient vision limited to adjacent grid cells (horizontally, vertically, and diagonally, Chebyshev radius 1).
   - The chamber has a **Lantern** (starting at coordinate `(0, 1)`).
   - An operative holding the lantern can equip it to their hand and click **TURN ON**.
   - When active (`activation_level = 1`), the lantern illuminates a radius of 2 around the holder.
   - **Shared Illumination**: All players on the network immediately see any grid area illuminated by an active lantern!
   - Other operatives inside illuminated cells are visible with their operative initials and colors.

---

## 🖥️ Alternative: Manual Startup (Two Terminal Windows)

If you prefer to run the backend and frontend separately without using `./run-local.sh`:

### Terminal 1: Backend (Flask API)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```
*API will run at `http://localhost:5001`.*

### Terminal 2: Frontend (Vite React)
```bash
cd frontend
npm install
npm run dev
```
*Web app will be available at `http://localhost:3000` (proxying `/api` requests to port `5001`).*

---

## 🔍 Troubleshooting & Logs

- **Backend Log File**: When running via `./run-local.sh`, Flask logs are written to `backend/flask.log`.
- **Database Reset**: If you ever want to completely reset the game state outside the script:
  ```bash
  curl -X POST "http://localhost:5001/api/admin/init-db?force=true"
  ```
- **Port In Use Error**: If you see `EADDRINUSE` or `Address already in use`, run:
  ```bash
  lsof -ti :5001 | xargs kill -9 2>/dev/null || true
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  ```
  *(The `./run-local.sh` script does this automatically on startup).*
