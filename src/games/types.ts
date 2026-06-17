import { GameState } from '../types';

export interface Move {
  x: number;
  y: number;
  symbol?: string;
  sourceX?: number; // For moving pieces games like 4x4
  sourceY?: number;
}

export interface GameLogic {
  checkWin: (board: (string | null)[][], symbol: string) => boolean;
  isDraw: (board: (string | null)[][]) => boolean;
  isValidMove: (board: (string | null)[][], x: number, y: number, currentPlayer: number, moves: GameState['moves']) => boolean;
  getInitialBoard: (size: number) => (string | null)[][];
  
  // AI Methods
  getBestMove?: (board: (string | null)[][], currentPlayer: number, moves: GameState['moves']) => Move | null;
  getRandomMove?: (board: (string | null)[][], currentPlayer: number, moves: GameState['moves']) => Move | null;

  // Rule specific helpers
  handleHistory?: (state: { board: (string | null)[][], moves: GameState['moves'] }) => { board: (string | null)[][], moves: GameState['moves'] };
  
  // Win/Score helpers for specific games
  checkLose?: (board: (string | null)[][], symbol: string) => boolean; // For Misere
  calculateScores?: (board: (string | null)[][]) => number | { p1: number, p2: number }; // For SUS/5x5
  
  // Special helper methods
  isValidSpot?: (x: number, y: number) => boolean; // For Pyramid/Diamond
  findLowestRow?: (board: (string | null)[][], col: number) => number; // For Connect Four
  addObstacles?: (board: (string | null)[][]) => (string | null)[][]; // For Obstacles
  getAvailableNumbers?: (board: (string | null)[][], player: number) => number[]; // For Numerical
  countThreeInARow?: (board: (string | null)[][], symbol: string) => number; // For 5x5
}
