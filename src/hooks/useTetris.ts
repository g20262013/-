import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Board, 
  Tetromino, 
  TetrominoType, 
  GameStatus, 
  GameStats, 
  Position, 
  Matrix,
  Particle
} from '../types';
import { audioSynth } from '../utils/audio';

const COLS = 10;
const ROWS = 20;

const SHAPES: Record<TetrominoType, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [2, 2],
    [2, 2]
  ],
  T: [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0]
  ],
  S: [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0]
  ],
  Z: [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0]
  ],
  J: [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0]
  ]
};

const createEmptyBoard = (): Board => 
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

export const useTetris = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [hasHeld, setHasHeld] = useState<boolean>(false);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    lines: 0,
    level: 1,
    highScore: 0
  });

  // Visual Feedbacks
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [clearingLines, setClearingLines] = useState<number[]>([]);

  // Sound Engine
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // References to keep track of bags and values for intervals
  const bagRef = useRef<TetrominoType[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const levelRef = useRef<number>(1);

  // Load high score and mute preferences
  useEffect(() => {
    const savedHighScore = localStorage.getItem('tetris_high_score');
    if (savedHighScore) {
      setStats(prev => ({ ...prev, highScore: parseInt(savedHighScore, 10) }));
    }
    setIsMuted(audioSynth.getMuted());
  }, []);

  // Standard Tetris 7-bag generator
  const getNextFromBag = useCallback((): TetrominoType => {
    if (bagRef.current.length === 0) {
      const newBag: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      // Fisher-Yates Shuffle
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }
      bagRef.current = newBag;
    }
    return bagRef.current.shift()!;
  }, []);

  // Spawn new piece
  const spawnPiece = useCallback((nextType: TetrominoType, incomingNextType: TetrominoType) => {
    const matrix = SHAPES[nextType];
    // Center the piece horizontally
    const x = Math.floor((COLS - matrix[0].length) / 2);
    // Position at top (y = -1 or -2 to make it enter smoothly)
    const y = nextType === 'I' ? -1 : 0;

    const newPiece: Tetromino = {
      type: nextType,
      matrix,
      position: { x, y }
    };

    setCurrentPiece(newPiece);
    setNextPiece(incomingNextType);
  }, []);

  // Check boundary collisions
  const checkCollision = useCallback((
    matrix: Matrix,
    position: Position,
    currentBoard: Board
  ): boolean => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = position.x + c;
          const boardY = position.y + r;

          // Out of horizontal bounds
          if (boardX < 0 || boardX >= COLS) {
            return true;
          }

          // Bottom bounds
          if (boardY >= ROWS) {
            return true;
          }

          // Top bounds (collision can only occur with existing locked blocks)
          if (boardY >= 0) {
            if (currentBoard[boardY][boardX] !== null) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }, []);

  // Calculate ghost piece position (where it will land)
  const getGhostY = useCallback((): number => {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.position.y;
    while (!checkCollision(currentPiece.matrix, { x: currentPiece.position.x, y: ghostY + 1 }, board)) {
      ghostY++;
    }
    return ghostY;
  }, [currentPiece, board, checkCollision]);

  // Generate particles on line clears
  const triggerParticles = useCallback((rows: number[]) => {
    const newParticles: Particle[] = [];
    rows.forEach(r => {
      for (let c = 0; c < COLS; c++) {
        const cellValue = board[r][c];
        if (cellValue !== null) {
          // Spawn 3 particles per cleared brick
          for (let i = 0; i < 3; i++) {
            newParticles.push({
              id: `${r}-${c}-${i}-${Math.random()}`,
              x: c * 10 + 5 + (Math.random() * 4 - 2), // Percentage-based positioning
              y: r * 5 + 2.5 + (Math.random() * 2 - 1),
              vx: (Math.random() * 40 - 20), // Speed
              vy: -(Math.random() * 30 + 10),
              size: Math.random() * 8 + 4,
              opacity: 1
            });
          }
        }
      }
    });

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles shortly after
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 600);
  }, [board]);

  // Handle locking piece to board and scoring
  const lockPiece = useCallback((piece: Tetromino) => {
    setBoard(prevBoard => {
      const nextBoard = prevBoard.map(row => [...row]);

      // Draw the piece matrix onto the board
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] !== 0) {
            const boardY = piece.position.y + r;
            const boardX = piece.position.x + c;

            if (boardY >= 0 && boardY < ROWS) {
              nextBoard[boardY][boardX] = piece.matrix[r][c];
            }
          }
        }
      }

      // Check for filled rows (clears)
      const rowsToClear: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (nextBoard[r].every(cell => cell !== null)) {
          rowsToClear.push(r);
        }
      }

      if (rowsToClear.length > 0) {
        setClearingLines(rowsToClear);
        triggerParticles(rowsToClear);
        audioSynth.playLineClear(rowsToClear.length);

        // Shake the board for Tetris clear
        if (rowsToClear.length === 4) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 200);
        }

        // Animate line clear, then clear and slide down
        setTimeout(() => {
          setBoard(currentBoard => {
            const filteredBoard = currentBoard.filter((_, idx) => !rowsToClear.includes(idx));
            const emptyRowsCount = ROWS - filteredBoard.length;
            const emptyRows = Array.from({ length: emptyRowsCount }, () => Array(COLS).fill(null));
            return [...emptyRows, ...filteredBoard];
          });

          // Calculate scores based on level and lines cleared
          const lineScores = [0, 100, 300, 500, 800];
          const linesCleared = rowsToClear.length;
          const scoreGained = lineScores[linesCleared] * levelRef.current;

          setStats(prev => {
            const newLines = prev.lines + linesCleared;
            const newLevel = Math.floor(newLines / 10) + 1;
            const newScore = prev.score + scoreGained;
            const isLevelUp = newLevel > prev.level;

            if (isLevelUp) {
              audioSynth.playLevelUp();
              levelRef.current = newLevel;
            }

            const newHighScore = Math.max(newScore, prev.highScore);
            if (newHighScore > prev.highScore) {
              localStorage.setItem('tetris_high_score', String(newHighScore));
            }

            return {
              score: newScore,
              lines: newLines,
              level: newLevel,
              highScore: newHighScore
            };
          });

          setClearingLines([]);
          
          // Spawn next piece
          const currentNext = nextPiece || getNextFromBag();
          const incomingNext = getNextFromBag();
          spawnPiece(currentNext, incomingNext);
          setHasHeld(false);
        }, 150);
      } else {
        // No lines cleared, just spawn next piece
        const currentNext = nextPiece || getNextFromBag();
        const incomingNext = getNextFromBag();
        spawnPiece(currentNext, incomingNext);
        setHasHeld(false);
      }

      return nextBoard;
    });
  }, [nextPiece, getNextFromBag, spawnPiece, triggerParticles]);

  // Drop current piece down by 1 row
  const moveDown = useCallback(() => {
    if (!currentPiece || status !== 'playing') return;

    const nextPos = { ...currentPiece.position, y: currentPiece.position.y + 1 };
    if (!checkCollision(currentPiece.matrix, nextPos, board)) {
      setCurrentPiece(prev => prev ? { ...prev, position: nextPos } : null);
    } else {
      // If it collides on spawning point, game over
      if (currentPiece.position.y <= 0) {
        setStatus('gameover');
        audioSynth.playGameOver();
      } else {
        lockPiece(currentPiece);
      }
    }
  }, [currentPiece, board, checkCollision, lockPiece, status]);

  // Soft drop (manual drop)
  const softDrop = useCallback(() => {
    if (status !== 'playing') return;
    moveDown();
    setStats(prev => ({ ...prev, score: prev.score + 1 }));
    audioSynth.playMove();
  }, [moveDown, status]);

  // Hard drop (instantly drop and lock)
  const hardDrop = useCallback(() => {
    if (!currentPiece || status !== 'playing') return;

    const ghostY = getGhostY();
    const dropDistance = ghostY - currentPiece.position.y;
    const finalPiece = {
      ...currentPiece,
      position: { ...currentPiece.position, y: ghostY }
    };

    audioSynth.playDrop();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 120);

    // Instant particles at bottom of piece
    const dropParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      dropParticles.push({
        id: `drop-${Math.random()}`,
        x: (currentPiece.position.x + Math.random() * currentPiece.matrix[0].length) * 10 + 5,
        y: ghostY * 5 + 5,
        vx: (Math.random() * 30 - 15),
        vy: -(Math.random() * 20 + 5),
        size: Math.random() * 6 + 3,
        opacity: 0.9
      });
    }
    setParticles(prev => [...prev, ...dropParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !dropParticles.find(dp => dp.id === p.id)));
    }, 400);

    setStats(prev => ({ ...prev, score: prev.score + (dropDistance * 2) }));
    lockPiece(finalPiece);
  }, [currentPiece, getGhostY, lockPiece, status]);

  // Move current piece left or right
  const moveLeftRight = useCallback((dir: -1 | 1) => {
    if (!currentPiece || status !== 'playing') return;

    const nextPos = { ...currentPiece.position, x: currentPiece.position.x + dir };
    if (!checkCollision(currentPiece.matrix, nextPos, board)) {
      setCurrentPiece(prev => prev ? { ...prev, position: nextPos } : null);
      audioSynth.playMove();
    }
  }, [currentPiece, board, checkCollision, status]);

  // Rotate piece (with basic wall kicks)
  const rotatePiece = useCallback(() => {
    if (!currentPiece || status !== 'playing') return;

    const matrix = currentPiece.matrix;
    const N = matrix.length;
    
    // Create rotated matrix (Clockwise)
    const rotated = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        rotated[c][N - 1 - r] = matrix[r][c];
      }
    }

    // Wall kick attempts
    const kickOffsets = [
      { x: 0, y: 0 },   // Standard rotation
      { x: -1, y: 0 },  // Shift left 1
      { x: 1, y: 0 },   // Shift right 1
      { x: 0, y: -1 },  // Shift up 1 (useful near bottom)
      { x: -2, y: 0 },  // Shift left 2 (specifically for I pieces)
      { x: 2, y: 0 }    // Shift right 2 (specifically for I pieces)
    ];

    for (const offset of kickOffsets) {
      const testPos = {
        x: currentPiece.position.x + offset.x,
        y: currentPiece.position.y + offset.y
      };

      if (!checkCollision(rotated, testPos, board)) {
        setCurrentPiece(prev => prev ? { ...prev, matrix: rotated, position: testPos } : null);
        audioSynth.playRotate();
        return;
      }
    }
  }, [currentPiece, board, checkCollision, status]);

  // Hold piece function
  const holdPieceAction = useCallback(() => {
    if (!currentPiece || status !== 'playing' || hasHeld) return;

    audioSynth.playHold();
    const type = currentPiece.type;

    if (holdPiece === null) {
      // First hold
      setHoldPiece(type);
      const nextType = nextPiece || getNextFromBag();
      const incomingNext = getNextFromBag();
      spawnPiece(nextType, incomingNext);
    } else {
      // Swap held with current
      const held = holdPiece;
      setHoldPiece(type);
      
      const matrix = SHAPES[held];
      const x = Math.floor((COLS - matrix[0].length) / 2);
      const y = held === 'I' ? -1 : 0;

      setCurrentPiece({
        type: held,
        matrix,
        position: { x, y }
      });
    }

    setHasHeld(true);
  }, [currentPiece, holdPiece, nextPiece, hasHeld, getNextFromBag, spawnPiece, status]);

  // Start / Restart Game
  const startGame = useCallback(() => {
    bagRef.current = [];
    levelRef.current = 1;
    const initialBoard = createEmptyBoard();
    setBoard(initialBoard);
    setHoldPiece(null);
    setHasHeld(false);
    setClearingLines([]);
    
    // Set statistics
    setStats(prev => ({
      ...prev,
      score: 0,
      lines: 0,
      level: 1
    }));

    const firstType = getNextFromBag();
    const nextType = getNextFromBag();
    
    // Spawn first piece
    const matrix = SHAPES[firstType];
    const x = Math.floor((COLS - matrix[0].length) / 2);
    const y = firstType === 'I' ? -1 : 0;

    setCurrentPiece({
      type: firstType,
      matrix,
      position: { x, y }
    });

    setNextPiece(nextType);
    setStatus('playing');
    audioSynth.playLevelUp(); // Starting chime
  }, [getNextFromBag]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    const muted = audioSynth.toggleMute();
    setIsMuted(muted);
  }, []);

  // Pause / Resume
  const togglePause = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('playing');
    }
  }, [status]);

  // Core Game Loop Speed Controller
  useEffect(() => {
    if (status !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Set drop rate speed based on level (faster with higher levels)
    const speed = Math.max(60, 1000 - (stats.level - 1) * 95);

    timerRef.current = setInterval(() => {
      moveDown();
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, stats.level, moveDown]);

  return {
    board,
    currentPiece,
    nextPiece,
    holdPiece,
    hasHeld,
    status,
    stats,
    particles,
    isShaking,
    clearingLines,
    isMuted,
    ghostY: getGhostY(),
    startGame,
    togglePause,
    moveLeft: () => moveLeftRight(-1),
    moveRight: () => moveLeftRight(1),
    rotate: rotatePiece,
    softDrop,
    hardDrop,
    hold: holdPieceAction,
    toggleMute,
    cols: COLS,
    rows: ROWS
  };
};
