CREATE TABLE IF NOT EXISTS players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    x INT NOT NULL DEFAULT 0,
    y INT NOT NULL DEFAULT 0,
    steps_taken INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS puzzles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    solved BOOLEAN NOT NULL DEFAULT 0,
    x INT NOT NULL,
    y INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data for default puzzles
INSERT IGNORE INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_1', 'Main Terminal', 'hex_match', 0, 2, 1);

INSERT IGNORE INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_2', 'Security Router', 'memory_matrix', 0, 0, 3);

INSERT IGNORE INTO puzzles (id, name, type, solved, x, y) 
VALUES ('puz_3', 'Reactor Core', 'hex_match', 0, 4, 2);

CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    max_uses INT NOT NULL DEFAULT 1,
    uses_left INT NOT NULL DEFAULT 1,
    location_type VARCHAR(50) NOT NULL, -- 'grid', 'hand', 'bag', 'puzzle_reward'
    owner_name VARCHAR(100),             -- Null if on grid/reward, Player name if in hand/bag
    x INT,                               -- Grid X if location_type = 'grid'
    y INT,                               -- Grid Y if location_type = 'grid'
    activation_level INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data for default items
INSERT IGNORE INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y, activation_level)
VALUES ('item_lantern', 'Lantern', -1, -1, 'grid', NULL, 0, 1, 0);

-- WD-40 is a puzzle reward, so it has no grid coordinates initially
INSERT IGNORE INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y)
VALUES ('item_wd40', 'WD-40', 1, 1, 'puzzle_reward', NULL, NULL, NULL);

-- Key is a puzzle reward
INSERT IGNORE INTO items (id, name, max_uses, uses_left, location_type, owner_name, x, y)
VALUES ('item_key', 'Exit Key', 1, 1, 'puzzle_reward', NULL, NULL, NULL);

