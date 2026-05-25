CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    color TEXT NOT NULL,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    steps_taken INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    solved BOOLEAN NOT NULL DEFAULT 0,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL
);

-- Seed Data for default puzzles
INSERT INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_1', 'Main Terminal', 'hex_match', 0, 2, 1)
ON CONFLICT(id) DO NOTHING;

INSERT INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_2', 'Security Router', 'memory_matrix', 0, 0, 3)
ON CONFLICT(id) DO NOTHING;

INSERT INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_3', 'Reactor Core', 'hex_match', 0, 4, 2)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 1,
    uses_left INTEGER NOT NULL DEFAULT 1,
    location_type TEXT NOT NULL, -- 'grid', 'hand', 'bag', 'puzzle_reward'
    owner_name TEXT,             -- Null if on grid/reward, Player name if in hand/bag
    x INTEGER,                   -- Grid X if location_type = 'grid'
    y INTEGER                    -- Grid Y if location_type = 'grid'
);

-- Seed Data for default items
INSERT INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y)
VALUES ('item_flash', 'Flashlight', -1, -1, 'grid', NULL, 0, 1)
ON CONFLICT(id) DO NOTHING;

-- WD-40 is a puzzle reward, so it has no grid coordinates initially
INSERT INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y)
VALUES ('item_wd40', 'WD-40', 1, 1, 'puzzle_reward', NULL, NULL, NULL)
ON CONFLICT(id) DO NOTHING;

-- Key is a puzzle reward
INSERT INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y)
VALUES ('item_key', 'Exit Key', 1, 1, 'puzzle_reward', NULL, NULL, NULL)
ON CONFLICT(id) DO NOTHING;
