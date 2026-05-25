const API_BASE = 'http://localhost:5001/api';

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

export interface GameStateResponse {
  player: PlayerData;
  puzzles: PuzzleData[];
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
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register operative');
    }
    return res.json();
  },

  /**
   * Fetch current game coordinates and puzzle statuses.
   */
  async getGameState(playerName: string): Promise<GameStateResponse> {
    const res = await fetch(`${API_BASE}/game-state/${encodeURIComponent(playerName)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch game state');
    }
    return res.json();
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
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register operative movement');
    }
    return res.json();
  },

  /**
   * Decrypt puzzle node.
   */
  async solvePuzzle(puzzleId: string): Promise<{ status: string; puzzle: PuzzleData; message: string }> {
    const res = await fetch(`${API_BASE}/puzzle/${encodeURIComponent(puzzleId)}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to solve puzzle');
    }
    return res.json();
  },

  /**
   * Reset chamber simulation.
   */
  async resetGame(playerName: string): Promise<{ status: string; player: PlayerData; puzzles: PuzzleData[]; message: string }> {
    const res = await fetch(`${API_BASE}/game-state/${encodeURIComponent(playerName)}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset simulation');
    }
    return res.json();
  },

  /**
   * Admin: Initialize or force reset the database schema.
   */
  async initDatabase(force: boolean = false): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/admin/init-db?force=${force}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize database');
    }
    return res.json();
  },

  /**
   * Admin: Get all players.
   */
  async getPlayers(): Promise<{ status: string; players: PlayerData[] }> {
    const res = await fetch(`${API_BASE}/admin/players`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch players');
    }
    return res.json();
  }
};
