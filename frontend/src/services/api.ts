const API_BASE = '/api';

export interface PlayerData {
  id: number;
  name: string;
  role: string;
  color: string;
  x: number;
  y: number;
  steps_taken: number;
  created_at: string;
}

export interface PuzzleData {
  id: string;
  name: string;
  type: 'hex_match' | 'memory_matrix';
  solved: boolean;
  x: number;
  y: number;
}

export interface ItemData {
  id: string;
  name: string;
  max_uses: number;
  uses_left: number;
  location_type: string;
  owner_name: string | null;
  x: number | null;
  y: number | null;
  activation_level?: number;
}

export interface InventoryData {
  hand: ItemData | null;
  bag: ItemData[];
}

export interface GameStateResponse {
  player: PlayerData;
  other_players?: PlayerData[];
  puzzles: PuzzleData[];
  grid_items: ItemData[];
  inventory: InventoryData;
  lantern?: ItemData | null;
}

export interface MoveSuccessResponse {
  status: 'success';
  player: PlayerData;
  message: string;
}

export interface MoveBlockedResponse {
  status: 'blocked';
  reason: 'boundary_collision' | 'wall_collision' | 'unsolved_puzzle' | 'exit_locked';
  puzzle?: PuzzleData;
  message: string;
}

export type MoveResponse = MoveSuccessResponse | MoveBlockedResponse;

async function parseJsonResponse<T>(res: Response, defaultErrorMessage: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let body: any = null;

  if (contentType.includes('application/json')) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  } else {
    try {
      const text = await res.text();
      body = text ? { error: text } : null;
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const message = body?.error || body?.message || defaultErrorMessage || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return (body ?? {}) as T;
}

export const api = {
  /**
   * Register a new player or fetch existing details.
   */
  async registerPlayer(name: string, role: string, color: string): Promise<{ message: string; player: PlayerData }> {
    const res = await fetch(`${API_BASE}/player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, color })
    });
    return parseJsonResponse(res, 'Failed to register operative');
  },

  /**
   * Fetch current game coordinates and puzzle statuses.
   */
  async getGameState(playerName: string): Promise<GameStateResponse> {
    const res = await fetch(`${API_BASE}/game-state/${encodeURIComponent(playerName)}`);
    return parseJsonResponse(res, 'Failed to fetch game state');
  },

  /**
   * Send coordinate deltas to backend for movement & validation.
   */
  async movePlayer(playerName: string, dx: number, dy: number): Promise<MoveResponse> {
    const res = await fetch(`${API_BASE}/player/${encodeURIComponent(playerName)}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx, dy })
    });
    return parseJsonResponse(res, 'Failed to register operative movement');
  },

  /**
   * Decrypt puzzle node.
   */
  async solvePuzzle(puzzleId: string): Promise<{ status: string; puzzle: PuzzleData; message: string }> {
    const res = await fetch(`${API_BASE}/puzzle/${encodeURIComponent(puzzleId)}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to solve puzzle');
  },

  /**
   * Reset chamber simulation.
   */
  async resetGame(playerName: string): Promise<{ status: string; player: PlayerData; puzzles: PuzzleData[]; message: string }> {
    const res = await fetch(`${API_BASE}/game-state/${encodeURIComponent(playerName)}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to reset simulation');
  },

  /**
   * Admin: Initialize or force reset the database schema.
   */
  async initDatabase(force: boolean = false): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/admin/init-db?force=${force}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to initialize database');
  },

  /**
   * Admin: Get all players.
   */
  async getPlayers(): Promise<{ status: string; players: PlayerData[] }> {
    const res = await fetch(`${API_BASE}/admin/players`);
    return parseJsonResponse(res, 'Failed to fetch players');
  },

  async pickupItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    const res = await fetch(`${API_BASE}/item/${encodeURIComponent(playerName)}/pickup/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to pick up item');
  },

  async dropItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    const res = await fetch(`${API_BASE}/item/${encodeURIComponent(playerName)}/drop/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to drop item');
  },

  async equipItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    const res = await fetch(`${API_BASE}/item/${encodeURIComponent(playerName)}/equip/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to equip item');
  },

  async useItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    const res = await fetch(`${API_BASE}/item/${encodeURIComponent(playerName)}/use/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return parseJsonResponse(res, 'Failed to use item');
  }
};
