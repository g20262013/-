export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type Matrix = number[][];

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  matrix: Matrix;
  position: Position;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export type Board = (number | null)[][];

export interface GameStats {
  score: number;
  lines: number;
  level: number;
  highScore: number;
}

export interface ClearedLineEffect {
  id: string;
  row: number;
  timestamp: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}
