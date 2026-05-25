import React, { useState, useEffect, useCallback } from 'react';
import { Avatar } from './AvatarSelector';
import { PuzzleModal, PuzzleData } from './PuzzleModal';
import { api } from '../services/api';

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
  const [activePuzzle, setActivePuzzle] = useState<PuzzleData | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read-only reference of walls for frontend map rendering
  const [walls] = useState<Wall[]>([
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 1, y: 4 },
  ]);

  // Add message to terminal log
  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 14)]);
  }, []);

  // Fetch current database session state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const state = await api.getGameState(playerName);
        setPlayerPos({ x: state.player.x, y: state.player.y });
        setMoves(state.player.steps_taken);
        setPuzzles(state.puzzles);
        
        addLog(`Operative '${playerName.toUpperCase()}' connected using chassis '${avatar.role}'.`);
        addLog(`Synchronized with coordinate database: player at (${state.player.x}, ${state.player.y}).`);
        
        const solvedCount = state.puzzles.filter(p => p.solved).length;
        addLog(`Objective status: ${solvedCount}/${state.puzzles.length} firewall nodes bypassed.`);
        
        // Check if game is already completed
        if (state.player.x === EXIT_POS.x && state.player.y === EXIT_POS.y && solvedCount === state.puzzles.length) {
          setGameCompleted(true);
        }
      } catch (err: any) {
        addLog(`SYS_ERROR: Failed to establish database sync: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadState();
  }, [playerName, avatar, addLog]);

  // Check if position is a wall
  const isWall = (x: number, y: number) => {
    return walls.some((wall) => wall.x === x && wall.y === y);
  };

  // Get puzzle at coordinate
  const getPuzzleAt = (x: number, y: number) => {
    return puzzles.find((p) => p.x === x && p.y === y);
  };

  // Logic to move the player via backend query
  const movePlayer = useCallback(async (dx: number, dy: number) => {
    if (gameCompleted || activePuzzle || loading) return;

    try {
      const response = await api.movePlayer(playerName, dx, dy);
      
      if (response.status === 'success') {
        // Move succeeded, update coordinates and steps from backend
        setPlayerPos({ x: response.player.x, y: response.player.y });
        setMoves(response.player.steps_taken);
        addLog(response.message);

        // Check if operative reached exit
        if (response.player.x === EXIT_POS.x && response.player.y === EXIT_POS.y) {
          const allSolved = puzzles.every((p) => p.solved);
          if (allSolved) {
            setGameCompleted(true);
            addLog(`CHAMBER BREACH SUCCESSFUL! Operative '${playerName}' escaped in ${response.player.steps_taken} steps.`);
          }
        }
      } else if (response.status === 'blocked') {
        // Move was blocked by backend validation rules
        addLog(`COLLISION DETECTED: ${response.message}`);
        
        if (response.reason === 'unsolved_puzzle' && response.puzzle) {
          setActivePuzzle(response.puzzle);
        }
      }
    } catch (err: any) {
      addLog(`SYS_ERROR: Terminal interface drop: ${err.message}`);
    }
  }, [gameCompleted, activePuzzle, loading, playerName, puzzles, addLog, EXIT_POS.x, EXIT_POS.y]);

  // Keyboard navigation
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

  // Handle cell click
  const handleCellClick = (x: number, y: number) => {
    if (gameCompleted || loading) return;

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

  // Called when a puzzle is successfully solved in the modal
  const handleSolvePuzzle = async (puzzleId: string) => {
    try {
      const result = await api.solvePuzzle(puzzleId);
      
      // Update local puzzles state
      setPuzzles((prev) =>
        prev.map((p) => (p.id === puzzleId ? { ...p, solved: true } : p))
      );
      
      addLog(`OVERRIDE SECURED: ${result.message}`);
      
      // Re-evaluate game states
      const nextPuzzles = puzzles.map((p) => (p.id === puzzleId ? { ...p, solved: true } : p));
      const remaining = nextPuzzles.filter((p) => !p.solved).length;
      if (remaining === 0) {
        addLog(`ALERT: All firewall modules disabled. Chamber exit portal unlocked at (${EXIT_POS.x}, ${EXIT_POS.y}).`);
      } else {
        addLog(`ALERT: ${remaining} puzzle nodes remain online.`);
      }
    } catch (err: any) {
      addLog(`SYS_ERROR: Solve signature failed to commit: ${err.message}`);
    } finally {
      setActivePuzzle(null);
    }
  };

  // Reset the database state
  const handleResetSimulation = async () => {
    setLoading(true);
    try {
      const state = await api.resetGame(playerName);
      setPlayerPos({ x: state.player.x, y: state.player.y });
      setMoves(state.player.steps_taken);
      setPuzzles(state.puzzles);
      setGameCompleted(false);
      setActivePuzzle(null);
      addLog(`RE-INITIALIZED SIMULATION: ${state.message}`);
    } catch (err: any) {
      addLog(`SYS_ERROR: Chamber reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="moves-counter">
            <span className="font-orbitron label">STEPS:</span>
            <span className="font-inter val">{moves}</span>
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
                  const allSolved = puzzles.every(p => p.solved);

                  let cellClass = '';
                  let cellStyle: React.CSSProperties = {};

                  if (cellWall) cellClass = 'cell-wall';
                  if (puzzle) {
                    cellClass = `cell-puzzle ${puzzle.solved ? 'solved' : 'locked'}`;
                    if (!puzzle.solved) cellStyle.borderColor = '#ffaa00';
                  }
                  if (isExit) cellClass = `cell-exit ${allSolved ? 'unlocked' : 'locked'}`;

                  return (
                    <div
                      key={x}
                      className={`grid-cell ${cellClass} ${isPlayer ? 'has-player' : ''}`}
                      style={cellStyle}
                      onClick={() => handleCellClick(x, y)}
                      title={`Coordinate: (${x}, ${y})`}
                    >
                      {isPlayer && (
                        <div className="player-indicator" style={{ backgroundColor: avatar.color, boxShadow: `0 0 15px ${avatar.color}` }}>
                          <svg viewBox="0 0 100 100" className="player-icon" dangerouslySetInnerHTML={{ __html: avatar.svgPath }} />
                        </div>
                      )}
                      
                      {!isPlayer && puzzle && (
                        <div className="cell-overlay-icon font-orbitron" style={{ color: puzzle.solved ? '#00ff66' : '#ffaa00' }}>
                          {puzzle.solved ? '✓' : '🔒'}
                        </div>
                      )}

                      {!isPlayer && isExit && (
                        <div className="cell-overlay-icon font-orbitron exit-icon" style={{ color: allSolved ? '#00ff66' : '#ff0055' }}>
                          🚪
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Navigation Helper Panel */}
          <div className="navigation-controls glass-panel">
            <h4 className="font-orbitron text-center" style={{ color: avatar.color, margin: '0 0 15px 0' }}>NAV_MANUAL</h4>
            <div className="nav-info text-center font-inter">
              <p>Move via keyboard using <strong>W A S D</strong> or <strong>Arrow Keys</strong>.</p>
              <p>Alternatively, click adjacent cells directly on the screen.</p>
            </div>
            <div className="legend-grid font-inter">
              <div className="legend-item"><span className="legend-dot dot-player" style={{ backgroundColor: avatar.color }} />Operative</div>
              <div className="legend-item"><span className="legend-dot dot-wall" />Titanium Obstacle</div>
              <div className="legend-item"><span className="legend-dot dot-puzzle-locked" />Active Firewall</div>
              <div className="legend-item"><span className="legend-dot dot-puzzle-solved" />Bypassed Node</div>
              <div className="legend-item"><span className="legend-dot dot-exit-locked" />Exit Door (Locked)</div>
              <div className="legend-item"><span className="legend-dot dot-exit-unlocked" />Exit Door (Unlocked)</div>
            </div>
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
