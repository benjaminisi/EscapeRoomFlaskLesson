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

export interface DiagnosticFailure {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  status: number;
  message: string;
  diagnostic?: string;
  promptSnippet: string;
}

type DiagnosticListener = (failure: DiagnosticFailure) => void;
const diagnosticListeners: DiagnosticListener[] = [];

export function subscribeToDiagnostics(listener: DiagnosticListener): () => void {
  diagnosticListeners.push(listener);
  return () => {
    const idx = diagnosticListeners.indexOf(listener);
    if (idx !== -1) diagnosticListeners.splice(idx, 1);
  };
}

export function reportDiagnosticFailure(failure: Omit<DiagnosticFailure, 'id' | 'timestamp' | 'promptSnippet'>) {
  const timestamp = new Date().toISOString();
  const id = Math.random().toString(36).substring(2, 9);
  const promptSnippet = 
`[GAME DIAGNOSTIC ERROR REPORT]
Time: ${timestamp}
Failed Request: ${failure.method} ${failure.url}
HTTP Status: ${failure.status}
Error Message: ${failure.message}
${failure.diagnostic ? `Server Diagnostic:\n${failure.diagnostic}\n` : ''}Context: The game UI detected a request failure or unexpected outcome. Please locate and fix the underlying bug.`;

  const record: DiagnosticFailure = {
    ...failure,
    id,
    timestamp,
    promptSnippet
  };

  console.error('[DIAGNOSTIC FAILURE DETECTED]', record);
  diagnosticListeners.forEach(listener => {
    try {
      listener(record);
    } catch (err) {
      console.error('Error in diagnostic listener:', err);
    }
  });
}

async function requestJson<T>(url: string, options: RequestInit = {}, defaultErrorMessage: string = 'Request failed'): Promise<T> {
  const method = options.method || 'GET';
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (networkErr: any) {
    const message = networkErr.message || 'Network unreachable';
    reportDiagnosticFailure({
      url,
      method,
      status: 0,
      message: `Connection dropped: ${message}`
    });
    throw networkErr;
  }

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
    reportDiagnosticFailure({
      url,
      method,
      status: res.status,
      message,
      diagnostic: body?.diagnostic
    });
    throw new Error(message);
  }

  return (body ?? {}) as T;
}

export const api = {
  /**
   * Register a new player or fetch existing details.
   */
  async registerPlayer(name: string, role: string, color: string): Promise<{ message: string; player: PlayerData }> {
    return requestJson(`${API_BASE}/player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, color })
    }, 'Failed to register operative');
  },

  /**
   * Fetch current game coordinates and puzzle statuses.
   */
  async getGameState(playerName: string): Promise<GameStateResponse> {
    return requestJson(`${API_BASE}/game-state/${encodeURIComponent(playerName)}`, {}, 'Failed to fetch game state');
  },

  /**
   * Send coordinate deltas to backend for movement & validation.
   */
  async movePlayer(playerName: string, dx: number, dy: number): Promise<MoveResponse> {
    return requestJson(`${API_BASE}/player/${encodeURIComponent(playerName)}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx, dy })
    }, 'Failed to register operative movement');
  },

  /**
   * Decrypt puzzle node.
   */
  async solvePuzzle(playerName: string, puzzleId: string): Promise<{ status: string; puzzle: PuzzleData; message: string }> {
    return requestJson(`${API_BASE}/puzzle/${encodeURIComponent(playerName)}/${encodeURIComponent(puzzleId)}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to solve puzzle');
  },

  /**
   * Reset chamber simulation.
   */
  async resetGame(playerName: string): Promise<{ status: string; player: PlayerData; puzzles: PuzzleData[]; message: string }> {
    return requestJson(`${API_BASE}/game-state/${encodeURIComponent(playerName)}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to reset simulation');
  },

  /**
   * Admin: Initialize or force reset the database schema.
   */
  async initDatabase(force: boolean = false): Promise<{ status: string; message: string }> {
    return requestJson(`${API_BASE}/admin/init-db?force=${force}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to initialize database');
  },

  /**
   * Admin: Get all players.
   */
  async getPlayers(): Promise<{ status: string; players: PlayerData[] }> {
    return requestJson(`${API_BASE}/admin/players`, {}, 'Failed to fetch players');
  },

  async pickupItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    return requestJson(`${API_BASE}/item/${encodeURIComponent(playerName)}/pickup/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to pick up item');
  },

  async dropItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    return requestJson(`${API_BASE}/item/${encodeURIComponent(playerName)}/drop/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to drop item');
  },

  async equipItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    return requestJson(`${API_BASE}/item/${encodeURIComponent(playerName)}/equip/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to equip item');
  },

  async useItem(playerName: string, itemId: string): Promise<{ status: string; message: string; inventory: InventoryData }> {
    return requestJson(`${API_BASE}/item/${encodeURIComponent(playerName)}/use/${encodeURIComponent(itemId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, 'Failed to use item');
  }
};
