import React, { useState, useEffect } from 'react';
import { useTetris } from './hooks/useTetris';
import { TetrisBlock } from './components/TetrisBlock';
import { GameControls } from './components/GameControls';
import { 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  RotateCcw, 
  Play, 
  Pause, 
  HelpCircle, 
  X,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TetrominoType, Matrix } from './types';

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

export default function App() {
  const {
    board,
    currentPiece,
    nextPiece,
    holdPiece,
    status,
    stats,
    particles,
    isShaking,
    clearingLines,
    isMuted,
    ghostY,
    startGame,
    togglePause,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
    hold,
    toggleMute,
    cols,
    rows
  } = useTetris();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Sync / Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('tetris_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('tetris_theme', nextTheme);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow general utility keys
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        handleThemeToggle();
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowHelp(prev => !prev);
        return;
      }

      if (status === 'idle' || status === 'gameover') {
        if (e.key === 'Enter') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (status === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          togglePause();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          softDrop();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          hold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    status,
    moveLeft,
    moveRight,
    softDrop,
    rotate,
    hardDrop,
    hold,
    togglePause,
    startGame,
    toggleMute,
    theme
  ]);

  // Construct composite grid of board + current piece + ghost projection
  const renderGrid = board.map(row => [...row]);

  if (currentPiece && status === 'playing') {
    // 1. Draw ghost piece projection
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const boardY = ghostY + r;
          const boardX = currentPiece.position.x + c;
          if (boardY >= 0 && boardY < rows) {
            if (renderGrid[boardY][boardX] === null) {
              renderGrid[boardY][boardX] = -1; // -1 represents ghost block
            }
          }
        }
      }
    }

    // 2. Draw current active piece
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const boardY = currentPiece.position.y + r;
          const boardX = currentPiece.position.x + c;
          if (boardY >= 0 && boardY < rows) {
            renderGrid[boardY][boardX] = currentPiece.matrix[r][c];
          }
        }
      }
    }
  }

  // Centered preview renderer (4x4)
  const renderPreview = (type: TetrominoType | null) => {
    if (!type) {
      return (
        <div className="grid grid-cols-4 gap-1 w-16 h-16 opacity-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <div 
              key={i} 
              className={`border border-dashed aspect-square rounded-[3px] ${
                theme === 'light' ? 'border-black' : 'border-white'
              }`} 
            />
          ))}
        </div>
      );
    }

    const matrix = SHAPES[type];
    const grid = Array.from({ length: 4 }, () => Array(4).fill(null));

    // Center the matrix inside the 4x4 box
    const startRow = Math.floor((4 - matrix.length) / 2);
    const startCol = Math.floor((4 - matrix[0].length) / 2);

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          grid[startRow + r][startCol + c] = matrix[r][c];
        }
      }
    }

    return (
      <div className="grid grid-cols-4 gap-1 w-16 h-16">
        {grid.flat().map((cell, idx) => (
          <div key={idx} className="aspect-square">
            <TetrisBlock value={cell} theme={theme} />
          </div>
        ))}
      </div>
    );
  };

  const isLight = theme === 'light';

  // Dynamic Theme Colors
  const bgClass = isLight ? 'bg-[#fafafa] text-black' : 'bg-[#0d0d0d] text-white';
  const containerBorderClass = isLight ? 'border-black' : 'border-white';
  const panelBgClass = isLight ? 'bg-white' : 'bg-[#121212]';
  const cardBorderClass = isLight ? 'border-zinc-200' : 'border-zinc-800';
  const textMutedClass = isLight ? 'text-zinc-500' : 'text-zinc-400';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300 flex flex-col font-sans select-none overflow-x-hidden relative`}>
      
      {/* Scanline overlay for CRT vintage style */}
      <div className={`fixed inset-0 pointer-events-none z-50 ${isLight ? 'scanlines-light opacity-30' : 'scanlines opacity-25'}`} />

      {/* Retro aesthetic decorative lines */}
      <div className={`h-1 w-full ${isLight ? 'bg-black' : 'bg-white'}`} />

      {/* Top Header Panel with Bold Typography */}
      <header className={`w-full max-w-5xl mx-auto px-6 py-6 border-b-4 ${containerBorderClass} flex flex-col md:flex-row justify-between items-start md:items-end gap-6 z-10`}>
        <div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none uppercase">
            Tetris
          </h1>
          <p className="text-xs font-mono tracking-widest mt-2 opacity-60">
            SYSTEM: STARK_MONO_V1.0 // GITHUB_READY
          </p>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <p className="text-xs font-bold uppercase opacity-50">High Score</p>
            <p className="text-2xl md:text-4xl font-black leading-none">{stats.highScore.toLocaleString()}</p>
          </div>
          
          <div className={`text-right border-l-2 ${containerBorderClass} pl-6 flex items-center gap-4`}>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Status</p>
              <p className="text-2xl md:text-4xl font-black leading-none underline decoration-4 underline-offset-8">
                {status === 'playing' ? 'ACTIVE' : status === 'paused' ? 'PAUSED' : 'ONLINE'}
              </p>
            </div>

            {/* Global Toolbar */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleMute}
                className={`p-1.5 border-2 ${containerBorderClass} active:scale-95 transition-all bg-transparent`}
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                id="toolbar-mute"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              <button
                onClick={handleThemeToggle}
                className={`p-1.5 border-2 ${containerBorderClass} active:scale-95 transition-all bg-transparent`}
                title={isLight ? "Dark Mode" : "Light Mode"}
                id="toolbar-theme"
              >
                {isLight ? <Moon size={14} /> : <Sun size={14} />}
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className={`p-1.5 border-2 ${containerBorderClass} active:scale-95 transition-all bg-transparent`}
                title="How to Play"
                id="toolbar-help"
              >
                <HelpCircle size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Play Arena */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-2 max-w-5xl w-full mx-auto z-10">
        
        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl items-stretch">
          
          {/* COLUMN 1: LEFT SIDEBAR (HOLD PIECE + STATS) - HIDDEN OR COMPACTED ON MOBILE */}
          <div className={`hidden md:flex flex-col gap-6 col-span-1 justify-between border-r-4 ${containerBorderClass} pr-6 py-6 bg-transparent`}>
            {/* Hold Piece Card */}
            <div className="flex flex-col items-start gap-2">
              <span className="text-xs font-black tracking-widest uppercase opacity-60">HOLDING ZONE</span>
              <div className={`my-2 flex items-center justify-center h-28 w-28 border-4 ${containerBorderClass} ${panelBgClass} rounded-none`}>
                {renderPreview(holdPiece)}
              </div>
            </div>

            {/* Controls Info Card */}
            <div className="space-y-4">
              <span className="text-xs font-black tracking-widest uppercase opacity-60 block">KEYBOARD HUD</span>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span>MOVE</span>
                  <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none bg-transparent font-bold`}>← →</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>ROTATE</span>
                  <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none bg-transparent font-bold`}>↑ / W</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SOFT DROP</span>
                  <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none bg-transparent font-bold`}>↓ / S</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>HARD DROP</span>
                  <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none bg-transparent font-bold`}>SPACE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SWAP HOLD</span>
                  <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none bg-transparent font-bold`}>SHIFT</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t-2 border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-center">
                MUTE: [M] | THEME: [T]
              </div>
            </div>
          </div>

          {/* MOBILE ONLY CAP CAPSULES (HOLD + NEXT PREVIEWS SIDE BY SIDE) */}
          <div className="flex md:hidden items-center justify-between gap-2 w-full px-2 mb-2">
            <div className={`flex items-center gap-3 p-2.5 border-4 ${containerBorderClass} ${panelBgClass} rounded-none flex-1`}>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-60">HOLD</span>
              <div className="scale-75 origin-center">{renderPreview(holdPiece)}</div>
            </div>
            
            <div className={`flex items-center justify-end gap-3 p-2.5 border-4 ${containerBorderClass} ${panelBgClass} rounded-none flex-1`}>
              <div className="scale-75 origin-center">{renderPreview(nextPiece)}</div>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-60">NEXT</span>
            </div>
          </div>

          {/* COLUMN 2 & 3: MAIN TETRIS BOARD */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center">
            
            <div className="relative w-full max-w-[340px] md:max-w-[350px] aspect-[1/2] select-none">
              
              {/* Outer border wrapper, triggers shake animation */}
              <div 
                id="tetris-grid-wrapper"
                className={`
                  w-full h-full border-4 ${containerBorderClass} rounded-none overflow-hidden shadow-2xl relative
                  transition-transform duration-75 p-[3px]
                  ${isShaking ? 'animate-shake' : ''}
                  ${isLight ? 'bg-zinc-100' : 'bg-zinc-950'}
                `}
              >
                {/* 10 x 20 Grid Board */}
                <div className="w-full h-full grid grid-cols-10 grid-rows-20 gap-[1px]">
                  {renderGrid.map((row, rIdx) => 
                    row.map((cell, cIdx) => {
                      const isClearing = clearingLines.includes(rIdx);
                      return (
                        <div 
                          key={`${rIdx}-${cIdx}`} 
                          className={`
                            relative aspect-square overflow-hidden transition-all duration-150
                            ${isClearing ? 'scale-90 opacity-40 blur-[1px] rotate-2' : ''}
                          `}
                        >
                          <TetrisBlock value={cell} theme={theme} />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Particle Overlay for explosions and hard-drops */}
                <div className="absolute inset-0 pointer-events-none z-20">
                  {particles.map(p => (
                    <div
                      key={p.id}
                      className={`absolute rounded-[1px] ${isLight ? 'bg-black' : 'bg-white'}`}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        transform: 'translate(-50%, -50%)',
                        '--x': `${p.vx}px`,
                        '--y': `${p.vy}px`
                      } as React.CSSProperties}
                    />
                  ))}
                </div>

                {/* GAME STATE SCREENS OVERLAYS */}
                <AnimatePresence>
                  
                  {/* IDLE/START GAME SCREEN OVERLAY */}
                  {status === 'idle' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/90 dark:bg-black/90 text-white z-30 flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                      <div className="space-y-6">
                        <div className="border-2 border-white p-4 inline-block rounded-xl">
                          <h2 className="text-xl font-bold tracking-widest uppercase font-mono">
                            MONOCHROME
                          </h2>
                          <div className="h-[2px] bg-white my-1" />
                          <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-300">
                            TETRIS SYSTEM
                          </p>
                        </div>

                        <p className="text-xs font-mono opacity-70 max-w-[220px] mx-auto leading-relaxed">
                          Clean geometric visuals, tactile haptic response, and synth 8-bit soundscapes.
                        </p>

                        <button
                          onClick={startGame}
                          className="px-6 py-3 border-2 border-white text-black bg-white hover:bg-black hover:text-white font-mono font-bold tracking-widest uppercase transition-all rounded-lg text-xs"
                          id="overlay-start-game"
                        >
                          START GAME
                        </button>

                        <p className="text-[10px] font-mono opacity-40 animate-pulse">
                          OR PRESS [ENTER] ON KEYBOARD
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* PAUSED STATE OVERLAY */}
                  {status === 'paused' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/85 text-white z-30 flex flex-col items-center justify-center text-center"
                    >
                      <div className="space-y-4">
                        <div className="animate-pulse flex flex-col items-center gap-1">
                          <Pause size={32} />
                          <h3 className="text-lg font-mono font-bold tracking-widest uppercase">PAUSED</h3>
                        </div>
                        
                        <p className="text-[10px] font-mono opacity-50">
                          PRESS ESC OR P TO RESUME
                        </p>
                        
                        <button
                          onClick={togglePause}
                          className="px-4 py-2 border border-white hover:bg-white hover:text-black font-mono text-xs tracking-wider transition-all rounded-md"
                          id="overlay-resume"
                        >
                          RESUME
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* GAME OVER STATE OVERLAY */}
                  {status === 'gameover' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/95 text-white z-30 flex flex-col items-center justify-center p-6 text-center"
                    >
                      <div className="space-y-5">
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold tracking-widest uppercase text-red-500 font-mono">
                            GAME OVER
                          </h2>
                          <p className="text-[9px] font-mono tracking-widest uppercase opacity-40">
                            System shut down
                          </p>
                        </div>

                        {/* Final Stats */}
                        <div className="border border-zinc-800 p-4 rounded-xl space-y-2 bg-zinc-950/80 font-mono text-xs w-[180px] mx-auto">
                          <div className="flex justify-between opacity-60">
                            <span>LEVEL</span>
                            <span>{stats.level}</span>
                          </div>
                          <div className="flex justify-between opacity-60">
                            <span>LINES</span>
                            <span>{stats.lines}</span>
                          </div>
                          <div className="h-[1px] bg-zinc-800" />
                          <div className="flex justify-between text-zinc-200">
                            <span>SCORE</span>
                            <span className="font-bold">{stats.score}</span>
                          </div>

                          {stats.score === stats.highScore && stats.score > 0 && (
                            <div className="text-[9px] text-green-400 mt-2 flex items-center justify-center gap-1 tracking-wider uppercase">
                              <Trophy size={10} /> NEW HIGH SCORE!
                            </div>
                          )}
                        </div>

                        <button
                          onClick={startGame}
                          className="px-5 py-2.5 border-2 border-white text-black bg-white hover:bg-black hover:text-white font-mono font-bold tracking-wider uppercase transition-all rounded-lg text-xs"
                          id="overlay-retry"
                        >
                          RETRY GAME
                        </button>

                        <p className="text-[10px] font-mono opacity-40">
                          OR PRESS [ENTER]
                        </p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>
            </div>

          </div>

          {/* COLUMN 4: RIGHT SIDEBAR (NEXT PIECE + STATS DISPLAY) */}
          <div className="flex flex-col justify-between gap-4 col-span-1">
            
            {/* NEXT PIECE CARD - HIDDEN ON MOBILE (HANDLED IN MOBILE ROW) */}
            <div className={`hidden md:flex p-4 border-4 ${containerBorderClass} ${panelBgClass} rounded-none flex-col items-center gap-2`}>
              <span className="text-xs font-black tracking-widest uppercase opacity-60">NEXT PHASE</span>
              <div className="my-2 flex items-center justify-center h-20 w-20">
                {renderPreview(nextPiece)}
              </div>
            </div>

            {/* STATISTICS CARD */}
            <div className={`p-4 border-4 ${containerBorderClass} ${panelBgClass} rounded-none flex-1 flex flex-col justify-between gap-4 md:gap-0`}>
              
              {/* Score / Level Grid */}
              <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-4 font-mono">
                {/* Score */}
                <div className="flex flex-col border-r md:border-r-0 border-zinc-200 dark:border-zinc-800 pr-2 md:pr-0">
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase opacity-50 block mb-1">SCORE</span>
                  <span className="text-sm md:text-xl font-black font-mono tracking-wider">{stats.score.toLocaleString()}</span>
                </div>

                {/* Level */}
                <div className="flex flex-col border-r md:border-r-0 border-zinc-200 dark:border-zinc-800 px-2 md:px-0">
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase opacity-50 block mb-1">LEVEL</span>
                  <span className="text-sm md:text-xl font-black font-mono tracking-wider">{stats.level}</span>
                </div>

                {/* Lines */}
                <div className="flex flex-col pl-2 md:pl-0">
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase opacity-50 block mb-1">LINES</span>
                  <span className="text-sm md:text-xl font-black font-mono tracking-wider">{stats.lines}</span>
                </div>
              </div>

              {/* Best Score (High Score) */}
              <div className="pt-2 md:pt-4 border-t-2 border-zinc-200 dark:border-zinc-800 font-mono">
                <span className="text-[10px] md:text-xs font-black tracking-widest uppercase opacity-50 block mb-1 font-sans">HIGH SCORE</span>
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="opacity-70" />
                  <span className="text-xs md:text-md font-black">{stats.highScore.toLocaleString()}</span>
                </div>
              </div>

              {/* In-Game Action Controls (Desktop Pause / Play / Restart) */}
              <div className="flex items-center gap-2 pt-2 border-t-2 border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={startGame}
                  className={`flex-1 py-2 text-[10px] font-black tracking-widest uppercase border-2 ${containerBorderClass} flex items-center justify-center gap-1 transition-all rounded-none bg-transparent`}
                  title="Restart Game"
                  id="action-restart"
                >
                  <RotateCcw size={10} strokeWidth={2.5} />
                  <span>RESTART</span>
                </button>

                {status === 'playing' || status === 'paused' ? (
                  <button
                    onClick={togglePause}
                    className={`p-2 border-2 ${containerBorderClass} flex items-center justify-center transition-all rounded-none bg-transparent`}
                    title={status === 'playing' ? "Pause Game" : "Resume Game"}
                    id="action-pause"
                  >
                    {status === 'playing' ? <Pause size={12} strokeWidth={2.5} /> : <Play size={12} strokeWidth={2.5} />}
                  </button>
                ) : null}
              </div>

            </div>
          </div>

        </div>

        {/* MOBILE CONTROLLERPAD GROUP (Rendered only on touch-screens) */}
        <GameControls
          onMoveLeft={moveLeft}
          onMoveRight={moveRight}
          onRotate={rotate}
          onSoftDrop={softDrop}
          onHardDrop={hardDrop}
          onHold={hold}
          disabled={status !== 'playing'}
          theme={theme}
        />

      </main>

      {/* Footer System Info */}
      <footer className={`w-full max-w-5xl mx-auto px-6 py-4 border-t-4 ${containerBorderClass} flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono opacity-50 uppercase tracking-[0.2em] gap-4 mt-auto z-10`}>
        <span>Terminal_Session: 0xFF-772A // GH_DEVOPS_CONNECTED</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-black' : 'bg-white'}`}></span>
          <span>Input: {status === 'playing' ? 'Active_Keypad' : 'Waiting...'}</span>
        </div>
      </footer>

      {/* DETAILED HELP MODAL/DRAWER */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none text-white"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`max-w-md w-full border-4 ${isLight ? 'border-black bg-white text-black' : 'border-white bg-[#0f0f0f] text-white'} p-6 rounded-none shadow-2xl relative font-sans`}
            >
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-4 right-4 opacity-50 hover:opacity-100 active:scale-95 transition-all"
                id="close-help-modal"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-black uppercase tracking-wider font-mono">
                    HOW TO PLAY
                  </h3>
                  <p className="text-xs opacity-60 mt-1 font-mono">
                    Complete rows of blocks to clear them. Clear 4 lines at once for a Tetris!
                  </p>
                </div>

                <div className="h-[2px] bg-zinc-200 dark:bg-zinc-800" />

                {/* Keyboard Layout */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono mb-2">
                    Keyboard Controls
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Move Left</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>A / ←</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Move Right</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>D / →</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Rotate</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>W / ↑</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Soft Drop</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>S / ↓</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Hard Drop</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>SPACE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="opacity-60">Swap Hold</span>
                      <span className={`px-1.5 py-0.5 border-2 ${containerBorderClass} rounded-none text-[10px] bg-zinc-100 dark:bg-zinc-900 font-bold`}>SHIFT</span>
                    </div>
                  </div>
                </div>

                <div className="h-[2px] bg-zinc-200 dark:bg-zinc-800" />

                {/* Score rules */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono mb-2">
                    Scoring System
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-xs opacity-75 font-mono">
                    <li>1 Line: 100 × Level pts</li>
                    <li>2 Lines: 300 × Level pts</li>
                    <li>3 Lines: 500 × Level pts</li>
                    <li>4 Lines (Tetris): 800 × Level pts</li>
                    <li>Soft Drop: +1 pt / row</li>
                    <li>Hard Drop: +2 pts / row</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowHelp(false)}
                  className={`w-full py-2.5 mt-2 border-2 ${containerBorderClass} font-mono text-xs tracking-wider uppercase font-black hover:bg-current hover:text-black dark:hover:text-black transition-all rounded-none bg-transparent`}
                  id="close-help-modal-btn"
                >
                  UNDERSTOOD
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
