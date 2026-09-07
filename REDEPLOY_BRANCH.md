# REDEPLOY_BRANCH.md - Instant Feature Branch Redeployment Playbook

This playbook explains how to instantly test and deploy student feature branches on the classroom Linux server without rebuilding images or taking down the server.

---

## 1. How Instant Redeployment Works

Our monolithic container runs in **live development mode**:
- The repository on your Linux server is directly mounted into the active container.
- When you switch branches, **Flask automatically reloads Python code** and **Vite immediately pushes UI updates via Hot Module Replacement (HMR)** to every connected student's browser.
- Switching branches takes **under 2 seconds**.

---

## 2. Redeploying from a Student Feature Branch

When a student or team pushes a branch to GitHub (e.g. `feature/matrix-puzzle`):

### Command
On the Linux server terminal, run:
```bash
./deploy-branch.sh <branch-name>
```

### Examples
```bash
# Test Sarah's new puzzle feature
./deploy-branch.sh feature/sarah-puzzle

# Test Team Alpha's inventory changes
./deploy-branch.sh feature/team-alpha-items

# Return to standard classroom lesson baseline
./deploy-branch.sh main
```

---

## 3. Preserving vs. Resetting the Game Database

### Option A: Preserve Existing Game State (Default)
Running:
```bash
./deploy-branch.sh feature/student-puzzle
```
Keeps all current player accounts, coordinates, and solved puzzle statuses intact in `backend/escaperoom.db`.

### Option B: Reset to a Clean State for a Fresh Round
If you want a fresh game board (reset all puzzles to unsolved, clear inventory, and clear old player positions):
```bash
./deploy-branch.sh feature/student-puzzle --reset-db
```
This triggers the database seeder to re-initialize the puzzle matrix from scratch.

---

## 4. What Happens During `./deploy-branch.sh`

The script handles the following steps automatically:
1. **Safety Check**: Warns if you have uncommitted edits on the server and offers to stash them.
2. **Git Fetch & Checkout**: Pulls the latest commits from GitHub and switches the working tree to the named branch.
3. **Dependency Sync**: Checks if the student added new Python libraries (`requirements.txt`) or npm packages (`package.json`) and installs them inside the running container.
4. **Live Hot Reload**: Vite and Flask detect the updated files immediately. Connected web browsers refresh or update state on the fly.

---

## 5. Classroom Troubleshooting & Recovery

### What if a student's code contains a syntax error?
If a student's Python code has an error, Flask's console debugger will capture it.
To see what went wrong:
```bash
docker compose logs -f
```
The error traceback will be clearly displayed in the logs.

### What if the student branch crashes the frontend?
The Vite browser console or terminal logs will show the TypeScript/JSX compilation error.
To immediately recover the classroom to the working baseline:
```bash
./deploy-branch.sh main
```

### What if `deploy-branch.sh` reports uncommitted changes?
If local files were accidentally modified on the server:
```bash
git stash
./deploy-branch.sh <branch-name>
```
To discard all local accidental edits:
```bash
git checkout -- .
./deploy-branch.sh <branch-name>
```
