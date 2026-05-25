import React, { useState, useEffect } from 'react';

export interface PuzzleData {
  id: string;
  name: string;
  type: 'hex_match' | 'memory_matrix';
  solved: boolean;
  x: number;
  y: number;
}

interface PuzzleModalProps {
  puzzle: PuzzleData;
  onSolve: (puzzleId: string) => void;
  onClose: () => void;
  operativeColor: string;
}

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  puzzle,
  onSolve,
  onClose,
  operativeColor
}) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'success' | 'failure'>('intro');
  const [timer, setTimer] = useState(15); // 15 seconds to solve

  // Hex Match state
  const [targetHex, setTargetHex] = useState('');
  const [hexOptions, setHexOptions] = useState<string[]>([]);

  // Memory Matrix state
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && gameState === 'playing') {
      setGameState('failure');
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  // Hex Match Setup
  const setupHexMatch = () => {
    const generateHex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
    const target = `${generateHex()} ${generateHex()} ${generateHex()}`;
    setTargetHex(target);

    const options = [target];
    while (options.length < 4) {
      const dec = `${generateHex()} ${generateHex()} ${generateHex()}`;
      if (!options.includes(dec)) options.push(dec);
    }
    // Shuffle options
    setHexOptions(options.sort(() => Math.random() - 0.5));
    setTimer(12);
    setGameState('playing');
  };

  // Memory Matrix Setup
  const setupMemoryMatrix = () => {
    const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9));
    setSequence(seq);
    setPlayerSequence([]);
    setTimer(18);
    setGameState('playing');
    triggerFlashSequence(seq);
  };

  const triggerFlashSequence = (seq: number[]) => {
    setIsFlashing(true);
    let index = 0;
    const interval = setInterval(() => {
      if (index < seq.length) {
        setFlashIndex(seq[index]);
        index++;
      } else {
        clearInterval(interval);
        setFlashIndex(null);
        setIsFlashing(false);
      }
    }, 600);
  };

  const handleHexSelect = (selected: string) => {
    if (selected === targetHex) {
      setGameState('success');
      setTimeout(() => onSolve(puzzle.id), 1000);
    } else {
      setGameState('failure');
    }
  };

  const handleMatrixClick = (idx: number) => {
    if (isFlashing || gameState !== 'playing') return;

    const nextSeq = [...playerSequence, idx];
    setPlayerSequence(nextSeq);

    // Validate
    const step = nextSeq.length - 1;
    if (nextSeq[step] !== sequence[step]) {
      setGameState('failure');
      return;
    }

    if (nextSeq.length === sequence.length) {
      setGameState('success');
      setTimeout(() => onSolve(puzzle.id), 1000);
    }
  };

  const startPuzzle = () => {
    if (puzzle.type === 'hex_match') {
      setupHexMatch();
    } else {
      setupMemoryMatrix();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-scale-up" style={{ borderColor: operativeColor }}>
        <div className="modal-header">
          <h3 className="font-orbitron" style={{ color: operativeColor }}>
            SYS_ALERT: SECURITY LOCK - {puzzle.name.toUpperCase()}
          </h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body font-inter">
          {gameState === 'intro' && (
            <div className="text-center">
              <p className="puzzle-intro-desc">
                Decrypt the security node to proceed. Unauthorized access attempts will result in locking of the chamber.
              </p>
              <div className="puzzle-meta-info font-orbitron">
                <div>TYPE: {puzzle.type === 'hex_match' ? 'HEXADECIMAL MATCH' : 'MEMORY NEURAL MATRIX'}</div>
                <div>ESTIMATED TIME TO LOCKOUT: {puzzle.type === 'hex_match' ? '12s' : '18s'}</div>
              </div>
              <button
                className="btn-cyber font-orbitron"
                style={{ borderColor: operativeColor, boxShadow: `0 0 10px ${operativeColor}40` }}
                onClick={startPuzzle}
              >
                INITIALIZE BYPASS
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="puzzle-active">
              <div className="timer-container font-orbitron">
                TIME REMAINING: <span className="timer-val" style={{ color: timer < 5 ? '#ff0055' : operativeColor }}>{timer}s</span>
              </div>

              {puzzle.type === 'hex_match' ? (
                <div className="hex-puzzle">
                  <div className="hex-target font-orbitron">
                    TARGET SIGNATURE: <span className="hex-target-code">{targetHex}</span>
                  </div>
                  <div className="hex-options-grid">
                    {hexOptions.map((opt, i) => (
                      <button
                        key={i}
                        className="hex-option-btn glass-panel font-orbitron"
                        onClick={() => handleHexSelect(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="matrix-puzzle">
                  <div className="matrix-status font-orbitron text-center">
                    {isFlashing ? 'READING NEURAL PATTERN...' : 'REPLICATE GRID SIGNATURE'}
                  </div>
                  <div className="matrix-grid">
                    {Array.from({ length: 9 }).map((_, idx) => {
                      const isFlashed = flashIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`matrix-cell ${isFlashed ? 'flashed' : ''}`}
                          style={{
                            backgroundColor: isFlashed ? operativeColor : 'rgba(255, 255, 255, 0.03)',
                            borderColor: isFlashed ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                            boxShadow: isFlashed ? `0 0 15px ${operativeColor}` : 'none'
                          }}
                          onClick={() => handleMatrixClick(idx)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {gameState === 'success' && (
            <div className="text-center state-success">
              <div className="glowing-icon font-orbitron" style={{ color: '#00ff66' }}>
                ✓ BYPASS SUCCESSFUL
              </div>
              <p>Security lock override complete. Resuming environmental terminal control...</p>
            </div>
          )}

          {gameState === 'failure' && (
            <div className="text-center state-failure">
              <div className="glowing-icon font-orbitron" style={{ color: '#ff0055' }}>
                ☠ NODE LOCKOUT
              </div>
              <p>Buffer overflow. Grid terminal failed to authenticate signature.</p>
              <button
                className="btn-cyber font-orbitron"
                style={{ borderColor: '#ff0055', boxShadow: '0 0 10px rgba(255,0,85,0.4)' }}
                onClick={startPuzzle}
              >
                RE-ATTEMPT HACK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
