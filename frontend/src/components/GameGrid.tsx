import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './AvatarSelector';
import { PuzzleModal, PuzzleData } from './PuzzleModal';
import { api, ItemData, InventoryData, PlayerData } from '../services/api';
import { InventoryPanel } from './InventoryPanel';

interface GameGridProps {
  playerName: string;
  avatar: Avatar;
  onReset: () => void;
}

interface Wall {
  x: number;
  y: number;
}

export const GameGrid: React.FC<GameGridProps> = ({ playerName, avatar, onReset }) => {
  const GRID_SIZE = 5;
  const START_POS = { x: 0, y: 0 };
  const EXIT_POS = { x: 4, y: 4 };

  const [playerPos, setPlayerPos] = useState(START_POS);
  const [moves, setMoves] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [gridItems, setGridItems] = useState<ItemData[]>([]);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [otherPlayers, setOtherPlayers] = useState<PlayerData[]>([]);
  const [lanternItem, setLanternItem] = useState<ItemData | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<PuzzleData | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [walls] = useState<Wall[]>([
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 1, y: 4 },
  ]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 14)]);
  }, []);

  const fetchGameState = useCallback(async () => {
    try {
      const state = await api.getGameState(playerName);
      setPlayerPos({ x: state.player.x, y: state.player.y });
      setMoves(state.player.steps_taken);
      setPuzzles(state.puzzles || []);
      setGridItems(state.grid_items || []);
      setInventory(state.inventory || null);
      setOtherPlayers(state.other_players || []);
      setLanternItem(state.lantern || null);
      
      const solvedCount = (state.puzzles || []).filter(p => p.solved).length;
      if (state.player.x === EXIT_POS.x && state.player.y === EXIT_POS.y && solvedCount === (state.puzzles || []).length) {
        setGameCompleted(true);
      }
      return state;
    } catch (err: any) {
      addLog(`SYS_ERROR: Failed to establish database sync: ${err.message}`);
      throw err;
    }
  }, [playerName, addLog, EXIT_POS.x, EXIT_POS.y]);

  useEffect(() => {
    const init = async () => {
      try {
        const state = await fetchGameState();
        addLog(`Operative '${playerName.toUpperCase()}' connected using chassis '${avatar.role}'.`);
        addLog(`Synchronized with coordinate database: player at (${state.player.x}, ${state.player.y}).`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchGameState, playerName, avatar, addLog]);

  // Polling to reflect other operatives' actions and shared lantern activation
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameCompleted && !activePuzzle && !loading) {
        fetchGameState().catch(() => {});
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchGameState, gameCompleted, activePuzzle, loading]);

  const isCellVisible = useCallback((x: number, y: number) => {
    // 1. Current player's personal base field of vision:
    // Horizontally, vertically, and diagonally adjacent cells plus current tile (Chebyshev radius 1)
    const inBaseVision = Math.max(Math.abs(x - playerPos.x), Math.abs(y - playerPos.y)) <= 1;
    if (inBaseVision) return true;

    // 2. Active lantern illumination:
    // When lantern activation_level > 0, it expands visual range by its activation level.
    // For activation level 1, illumination radius is 1 + 1 = 2 around the lantern's coordinates.
    // All players see the area illuminated by the lantern.
    if (lanternItem && (lanternItem.activation_level ?? 0) > 0) {
      const illuminationRadius = 1 + (lanternItem.activation_level ?? 0);
      let lanternPos: { x: number; y: number } | null = null;

      if (lanternItem.owner_name === playerName) {
        lanternPos = playerPos;
      } else if (lanternItem.owner_name) {
        const owner = otherPlayers.find(p => p.name === lanternItem.owner_name);
        if (owner) {
          lanternPos = { x: owner.x, y: owner.y };
        }
      } else if (lanternItem.location_type === 'grid' && lanternItem.x !== null && lanternItem.y !== null) {
        lanternPos = { x: lanternItem.x, y: lanternItem.y };
      }

      if (lanternPos) {
        const dist = Math.max(Math.abs(x - lanternPos.x), Math.abs(y - lanternPos.y));
        if (dist <= illuminationRadius) {
          return true;
        }
      }
    }

    return false;
  }, [playerPos, lanternItem, playerName, otherPlayers]);

  const isWall = (x: number, y: number) => {
    return walls.some((wall) => wall.x === x && wall.y === y);
  };

  const getPuzzleAt = (x: number, y: number) => {
    return puzzles.find((p) => p.x === x && p.y === y);
  };

  const movePlayer = useCallback(async (dx: number, dy: number) => {
    if (gameCompleted || activePuzzle || loading) return;

    try {
      const response = await api.movePlayer(playerName, dx, dy);
      
      if (response.status === 'success') {
        await fetchGameState();
        addLog(response.message);

        if (response.player.x === EXIT_POS.x && response.player.y === EXIT_POS.y) {
          const allSolved = puzzles.every((p) => p.solved);
          if (allSolved) {
            setGameCompleted(true);
            addLog(`CHAMBER BREACH SUCCESSFUL! Operative '${playerName}' escaped in ${response.player.steps_taken} steps.`);
          }
        }
      } else if (response.status === 'blocked') {
        addLog(`COLLISION DETECTED: ${response.message}`);
        if (response.reason === 'unsolved_puzzle' && response.puzzle) {
          setActivePuzzle(response.puzzle);
        }
      }
    } catch (err: any) {
      addLog(`SYS_ERROR: Terminal interface drop: ${err.message}`);
    }
  }, [gameCompleted, activePuzzle, loading, playerName, puzzles, addLog, EXIT_POS.x, EXIT_POS.y, fetchGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePlayer(1, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  const handleCellClick = (x: number, y: number) => {
    if (gameCompleted || loading) return;

    if (!isCellVisible(x, y)) {
      addLog(`TARGET RANGE UNSEEN: Sector at (${x}, ${y}) is shrouded in darkness.`);
      return;
    }

    const dx = x - playerPos.x;
    const dy = y - playerPos.y;
    const distance = Math.abs(dx) + Math.abs(dy);

    if (distance === 1) {
      movePlayer(dx, dy);
    } else if (distance === 0) {
      addLog(`Operative already at (${x}, ${y}).`);
    } else {
      const puzzle = getPuzzleAt(x, y);
      if (puzzle && !puzzle.solved) {
        setActivePuzzle(puzzle);
        addLog(`Remote connection request to Puzzle Node '${puzzle.name}' at (${x}, ${y}).`);
      } else {
        addLog(`TARGET RANGE TOO DISTANT: operative can only step to adjacent cells.`);
      }
    }
  };

  const handleSolvePuzzle = async (puzzleId: string) => {
    const targetPuzzle = activePuzzle;
    setActivePuzzle(null);
    try {
      const result = await api.solvePuzzle(playerName, puzzleId);
      addLog(`OVERRIDE SECURED: ${result.message}`);

      // If the solved puzzle was adjacent to the operative (e.g. stepping into it triggered the puzzle),
      // auto-advance operative position into the newly unlocked sector
      if (targetPuzzle && targetPuzzle.id === puzzleId) {
        const dx = targetPuzzle.x - playerPos.x;
        const dy = targetPuzzle.y - playerPos.y;
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          const moveRes = await api.movePlayer(playerName, dx, dy);
          if (moveRes.status === 'success') {
            addLog(moveRes.message);
          }
        }
      }
      await fetchGameState();
    } catch (err: any) {
      addLog(`SYS_ERROR: Solve signature failed to commit: ${err.message}`);
    }
  };

  const handleResetSimulation = async () => {
    setLoading(true);
    try {
      const state = await api.resetGame(playerName);
      addLog(`RE-INITIALIZED SIMULATION: ${state.message}`);
      await fetchGameState();
      setGameCompleted(false);
      setActivePuzzle(null);
    } catch (err: any) {
      addLog(`SYS_ERROR: Chamber reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (itemId: string) => {
    try {
      const res = await api.pickupItem(playerName, itemId);
      addLog(res.message);
      await fetchGameState();
    } catch (err: any) {
      addLog(`ITEM ERROR: ${err.message}`);
    }
  };

  const handleDrop = async (itemId: string) => {
    try {
      const res = await api.dropItem(playerName, itemId);
      addLog(res.message);
      await fetchGameState();
    } catch (err: any) {
      addLog(`ITEM ERROR: ${err.message}`);
    }
  };

  const handleEquip = async (itemId: string) => {
    try {
      const res = await api.equipItem(playerName, itemId);
      addLog(res.message);
      await fetchGameState();
    } catch (err: any) {
      addLog(`ITEM ERROR: ${err.message}`);
    }
  };

  const handleUse = async (itemId: string) => {
    try {
      const res = await api.useItem(playerName, itemId);
      addLog(res.message);
      await fetchGameState();
    } catch (err: any) {
      addLog(`ITEM ERROR: ${err.message}`);
    }
  };

  const itemAtPlayerPos = gridItems.find(i => i.x === playerPos.x && i.y === playerPos.y);
  
  const playerHoldsLantern = inventory?.hand?.id === 'item_lantern' || inventory?.hand?.id === 'item_flash' || inventory?.bag.some(i => i.id === 'item_lantern' || i.id === 'item_flash');
  const isLanternActive = (lanternItem?.activation_level ?? 0) > 0;

  return (
    <div className="game-container">
      {loading && (
        <div className="glass-panel text-center animate-scale-up font-orbitron" style={{ borderColor: avatar.color, padding: '15px', color: avatar.color, marginBottom: '15px' }}>
          QUERYING DATABASE CLOUD ACCESS...
        </div>
      )}

      <div className="game-main-content">
        
        {/* Header Bar */}
        <div className="game-header-bar glass-panel">
          <div className="oper-details">
            <span className="font-orbitron label" style={{ color: avatar.color }}>OPERATIVE:</span>
            <span className="font-inter val">{playerName}</span>
            <span className="font-orbitron role-badge" style={{ backgroundColor: `${avatar.color}20`, borderColor: avatar.color, color: avatar.color }}>
              {avatar.role}
            </span>
          </div>
          <div className="moves-counter flex items-center gap-4">
            <div>
              <span className="font-orbitron label">STEPS:</span>
              <span className="font-inter val">{moves}</span>
            </div>
            <button 
              onClick={fetchGameState}
              className="text-xs bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-500 rounded px-2 py-1 transition-colors font-orbitron"
              title="Pull latest state from database"
            >
              SYNC_STATE
            </button>
          </div>
          <button className="btn-reset font-orbitron" onClick={onReset}>ABORT_MISSION</button>
        </div>

        <div className="game-grid-section">
          {/* 5x5 Grid Board */}
          <div className="grid-board glass-panel">
            {Array.from({ length: GRID_SIZE }).map((_, y) => (
              <div key={y} className="grid-row">
                {Array.from({ length: GRID_SIZE }).map((_, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const cellWall = isWall(x, y);
                  const puzzle = getPuzzleAt(x, y);
                  const isExit = EXIT_POS.x === x && EXIT_POS.y === y;
                  const itemOnTile = gridItems.find(i => i.x === x && i.y === y);
                  const allSolved = puzzles.every(p => p.solved);
                  
                  const isVisible = isCellVisible(x, y);
                  const isDark = !isVisible;
                  const otherPlayersOnTile = isVisible ? otherPlayers.filter(p => p.x === x && p.y === y) : [];

                  let cellClass = '';
                  let cellStyle: React.CSSProperties = {};

                  if (isDark) {
                    cellClass += ' cell-dark';
                  } else {
                    if (cellWall) cellClass += ' cell-wall';
                    if (puzzle) {
                      cellClass += ` cell-puzzle ${puzzle.solved ? 'solved' : 'locked'}`;
                      if (!puzzle.solved) cellStyle.borderColor = '#ffaa00';
                    }
                    if (isExit) cellClass += ` cell-exit ${allSolved ? 'unlocked' : 'locked'}`;
                  }

                  return (
                    <div
                      key={x}
                      className={`grid-cell ${cellClass} ${isPlayer ? 'has-player' : ''}`}
                      style={cellStyle}
                      onClick={() => handleCellClick(x, y)}
                      title={isDark ? "Sector obscured by darkness" : `Coordinate: (${x}, ${y})`}
                    >
                      {/* Player (Self) */}
                      {isPlayer && (
                        <div className="player-indicator" style={{ backgroundColor: avatar.color, boxShadow: `0 0 15px ${avatar.color}` }}>
                          <svg viewBox="0 0 100 100" className="player-icon" dangerouslySetInnerHTML={{ __html: avatar.svgPath }} />
                          {otherPlayersOnTile.length > 0 && (
                            <span className="co-player-badge font-orbitron" title={`Co-located: ${otherPlayersOnTile.map(p => p.name).join(', ')}`}>
                              +{otherPlayersOnTile.length}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Other Operatives (in visible cells) */}
                      {!isPlayer && isVisible && otherPlayersOnTile.length > 0 && (
                        <div 
                          className="player-indicator other-player-indicator" 
                          style={{ backgroundColor: otherPlayersOnTile[0].color, boxShadow: `0 0 12px ${otherPlayersOnTile[0].color}` }}
                          title={otherPlayersOnTile.map(p => `Operative ${p.name} (${p.role})`).join(' | ')}
                        >
                          <span className="text-[10px] font-orbitron font-bold text-black select-none">
                            {otherPlayersOnTile[0].name.slice(0, 2).toUpperCase()}
                          </span>
                          {otherPlayersOnTile.length > 1 && (
                            <span className="co-player-badge font-orbitron">
                              +{otherPlayersOnTile.length - 1}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Puzzle Icon */}
                      {!isPlayer && otherPlayersOnTile.length === 0 && puzzle && isVisible && (
                        <div className="cell-overlay-icon font-orbitron" style={{ color: puzzle.solved ? '#00ff66' : '#ffaa00' }}>
                          {puzzle.solved ? '✓' : '🔒'}
                        </div>
                      )}

                      {/* Exit Icon */}
                      {!isPlayer && otherPlayersOnTile.length === 0 && isExit && isVisible && (
                        <div className="cell-overlay-icon font-orbitron exit-icon" style={{ color: allSolved ? '#00ff66' : '#ff0055' }}>
                          🚪
                        </div>
                      )}

                      {/* Item Icon */}
                      {!isPlayer && otherPlayersOnTile.length === 0 && !cellWall && !puzzle && !isExit && itemOnTile && isVisible && (
                        <div className="cell-overlay-icon font-orbitron" style={{ color: '#00ccff', fontSize: '1.2rem' }} title={`Item: ${itemOnTile.name}`}>
                          {(itemOnTile.id === 'item_lantern' || itemOnTile.id === 'item_flash') ? '🏮' : '📦'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Context Actions (Pick up) */}
          {itemAtPlayerPos && (
             <div className="mt-4 p-4 border border-blue-500 bg-blue-900/20 rounded text-center animate-scale-up">
                <p className="text-blue-300 font-orbitron mb-2">
                  Item detected: <strong>{itemAtPlayerPos.name}</strong> {(itemAtPlayerPos.id === 'item_lantern' || itemAtPlayerPos.id === 'item_flash') ? '🏮' : ''}
                </p>
                <button 
                  onClick={() => handlePickup(itemAtPlayerPos.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold transition-colors font-orbitron"
                >
                  Pick Up
                </button>
             </div>
          )}

          {/* Inventory Panel */}
          {inventory && (
            <InventoryPanel 
              inventory={inventory} 
              onDrop={handleDrop} 
              onEquip={handleEquip} 
              onUse={handleUse}
            />
          )}
          
          {/* Navigation Helper Panel */}
          <div className="navigation-controls glass-panel mt-4">
            <h4 className="font-orbitron text-center" style={{ color: avatar.color, margin: '0 0 15px 0' }}>NAV_MANUAL</h4>
            <div className="legend-grid font-inter text-xs">
              <div className="legend-item"><span className="legend-dot dot-player" style={{ backgroundColor: avatar.color }} />Operative</div>
              <div className="legend-item"><span className="legend-dot dot-wall" />Titanium Obstacle</div>
              <div className="legend-item"><span className="legend-dot dot-puzzle-locked" />Active Firewall</div>
              <div className="legend-item"><span className="legend-dot dot-puzzle-solved" />Bypassed Node</div>
              <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#00ccff' }} />🏮 Lantern / Item</div>
              <div className="legend-item"><span className="legend-dot dot-exit-locked" />Exit Door</div>
              <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#07090e', border: '1px solid #333' }} />Obscured Sector</div>
            </div>
            {isLanternActive ? (
              <p className="text-green-400 mt-2 text-center text-xs font-orbitron">
                LANTERN ACTIVE: Illuminating radius {1 + (lanternItem?.activation_level ?? 0)} for all operatives.
              </p>
            ) : (
              <p className="text-amber-400 mt-2 text-center text-xs font-orbitron">
                LIMITED AMBIENT LIGHT: Field of vision restricted to adjacent coordinates. {playerHoldsLantern ? 'Activate equipped lantern to expand vision.' : 'Locate and activate the lantern to expand vision.'}
              </p>
            )}
          </div>
        </div>

        {/* Real-time System console logs */}
        <div className="console-panel glass-panel">
          <div className="console-header font-orbitron">
            SYSTEM_CONSOLE logs
            {!loading && (
              <button 
                onClick={handleResetSimulation} 
                style={{ float: 'right', background: 'none', border: 'none', color: '#ffaa00', cursor: 'pointer', fontSize: '0.65rem', padding: '0', textDecoration: 'underline' }}
                className="font-orbitron"
              >
                RESET_SIMULATION
              </button>
            )}
          </div>
          <div className="console-body font-mono">
            {logs.length === 0 ? (
              <div className="console-empty">No signal logs in buffer.</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="console-line">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Success Completion Overlay */}
      {gameCompleted && (
        <div className="success-overlay">
          <div className="success-card glass-panel text-center animate-scale-up">
            <h1 className="font-orbitron title-glow" style={{ color: '#00ff66' }}>CHAMBER CLEARED</h1>
            <p className="font-inter">
              Congratulations operative <strong>{playerName}</strong>. All system protocols bypassed successfully. 
              Escape route secure.
            </p>
            <div className="stats-box font-orbitron">
              <div>CHASSIS: {avatar.role}</div>
              <div>STEPS RECORDED: {moves}</div>
            </div>
            <button 
              className="btn-cyber font-orbitron" 
              style={{ borderColor: '#00ff66', boxShadow: '0 0 15px rgba(0,255,102,0.4)', color: '#fff' }} 
              onClick={handleResetSimulation}
            >
              RELOAD SIMULATION
            </button>
          </div>
        </div>
      )}

      {/* Interactive Hack Modal */}
      {activePuzzle && (
        <PuzzleModal
          puzzle={activePuzzle}
          operativeColor={avatar.color}
          onSolve={handleSolvePuzzle}
          onClose={() => {
            addLog(`Bypass interface closed for '${activePuzzle.name}'.`);
            setActivePuzzle(null);
          }}
        />
      )}
    </div>
  );
};
