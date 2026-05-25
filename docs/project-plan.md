# Project Plan: Cyber Escape Room

This document outlines the technical design, roadmap, and REST API specification for integrating the React frontend game with the Flask backend.

---

## 1. System Architecture

The game uses a **Monorepo** structure, separating the client UI from the persistent database server.

```
EscapeRoom/
├── frontend/             # React + Vite + TypeScript (Single Page App)
│   ├── src/
│   │   ├── components/   # AvatarSelector, GameGrid, PuzzleModal
│   │   └── index.css     # Visual styles & themes (Glassmorphism)
│   └── package.json
│
├── backend/              # Python Flask Web Service
│   ├── app.py            # SQLite configuration, SQLAlchemy Models, & REST APIs
│   ├── requirements.txt  # Python package specifications
│   └── escaperoom.db     # Local SQLite persistent database
│
└── docs/
    └── project-plan.md   # Current Development Roadmap
```

---

## 2. Database Schema Design (SQLAlchemy)

The database layer tracks the operative status across two primary entities:

### `Player` Entity
Stores registration data, grid coordinates, and cumulative action count.
- `id` (INT, Primary Key)
- `name` (VARCHAR, Unique Operative Codename)
- `role` (VARCHAR, Operative Class)
- `color` (VARCHAR, Primary CSS Hex/HSL color code)
- `x` (INT, X-coordinate [0-4], Default: 0)
- `y` (INT, Y-coordinate [0-4], Default: 0)
- `steps_taken` (INT, Step Counter, Default: 0)
- `created_at` (TIMESTAMP)

### `Puzzle` Entity
Stores location data and decryption status of the interactive barriers on the map.
- `id` (VARCHAR, Primary Key)
- `name` (VARCHAR, Terminal Label)
- `type` (VARCHAR, puzzle style: `hex_match` or `memory_matrix`)
- `solved` (BOOLEAN, Solved status, Default: False)
- `x` (INT, X-coordinate [0-4])
- `y` (INT, Y-coordinate [0-4])

---

## 3. REST API Specifications

The following endpoints will govern player positioning, navigation validation, and hacking mechanics.

### 3.1 operative Registration
* **URL**: `/api/player`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "name": "Ghost",
    "role": "Cryptographer",
    "color": "#00f0ff"
  }
  ```
* **Success Response (201 Created or 200 OK)**:
  ```json
  {
    "message": "Operative registered successfully.",
    "player": {
      "id": 1,
      "name": "Ghost",
      "role": "Cryptographer",
      "color": "#00f0ff",
      "x": 0,
      "y": 0,
      "steps_taken": 0,
      "created_at": "2026-05-23T14:20:00"
    }
  }
  ```

### 3.2 Fetch Game State
* **URL**: `/api/game-state/<player_name>`
* **Method**: `GET`
* **Success Response (200 OK)**:
  ```json
  {
    "player": {
      "name": "Ghost",
      "role": "Cryptographer",
      "color": "#00f0ff",
      "x": 1,
      "y": 2,
      "steps_taken": 12
    },
    "puzzles": [
      { "id": "puz_1", "name": "Main Terminal", "type": "hex_match", "solved": true, "x": 2, "y": 1 },
      { "id": "puz_2", "name": "Security Router", "type": "memory_matrix", "solved": false, "x": 0, "y": 3 },
      { "id": "puz_3", "name": "Reactor Core", "type": "hex_match", "solved": false, "x": 4, "y": 2 }
    ]
  }
  ```

### 3.3 Player Movement & Position Validation
* **URL**: `/api/player/<player_name>/move`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "dx": 0, // Delta X: -1, 0, or 1
    "dy": 1  // Delta Y: -1, 0, or 1
  }
  ```
* **Validation Logic (Backend)**:
  1. Calculate target coordinates: `target_x = current_x + dx`, `target_y = current_y + dy`.
  2. **Grid boundaries check**: Verify `0 <= target_x < 5` and `0 <= target_y < 5`. Reject if invalid.
  3. **Barrier Check**: Verify `(target_x, target_y)` does not match any hardcoded Wall coordinates:
     - `[(1,0), (1,1), (3,2), (3,3), (1,4)]`.
  4. **Active Firewall check**: Check if target coordinate contains an unsolved puzzle in the database.
     - If yes, block movement and return: `{"status": "blocked", "reason": "active_firewall", "puzzle_id": "..."}`.
  5. **Exit Door check**: If target is `(4, 4)`, verify if all database puzzles have `solved = True`.
     - If unsolved, block and prompt: `{"status": "blocked", "reason": "exit_locked"}`.
  6. **Commit movement**: If all pass, increment `steps_taken` by 1, update coordinates in SQLite, and return updated player status.
* **Response (200 OK - Success)**:
  ```json
  {
    "status": "success",
    "player": {
      "name": "Ghost",
      "x": 0,
      "y": 1,
      "steps_taken": 1
    }
  }
  ```

### 3.4 Decrypt Puzzle Node
* **URL**: `/api/puzzle/<puzzle_id>/solve`
* **Method**: `POST`
* **Content-Type**: `application/json`
* **Request Body**:
  ```json
  {
    "operative_name": "Ghost"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Security firewall bypassed.",
    "puzzle": {
      "id": "puz_1",
      "name": "Main Terminal",
      "solved": true
    }
  }
  ```

---

## 4. Integration Roadmap

### Phase 1: Local Simulation & Scaffolding [DONE]
- Set up monorepo layout.
- Initialized React/TS client with fully playable, CSS-styled simulation (local keyboard validation, grid mechanics, 2 interactive hacking minigames, visual feedback terminal console).
- Initialized Flask/SQLAlchemy structure with model classes and SQLite seeding script.

### Phase 2: Implement Backend API Endpoint Handlers
- Implement endpoint routing in `backend/app.py` for `/api/player/<name>/move` and `/api/puzzle/<puzzle_id>/solve` containing boundary/wall/solved database validation logic.
- Conduct local automated HTTP client requests testing (e.g. using `curl` or python `requests`) to verify correct DB update cycles.

### Phase 3: Connect Frontend via Client Fetch Controllers
- Create an API client service in `frontend/src/services/api.ts` to coordinate HTTP requests.
- Replace local state updates inside `GameGrid.tsx` and `PuzzleModal.tsx` with async `fetch` queries hitting the Flask `/api` backend.
- Synchronize movements and puzzle successes dynamically with database records.

### Phase 4: Production Packing & Deployment
- Set up a build workflow.
- Create container configurations or multi-stage Dockerfiles if deploying to a cloud runtime environment.
