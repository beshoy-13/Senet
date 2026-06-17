import { GameState } from '../../types';

export interface Move {
  x: number;
  y: number;
  symbol?: string;
  sourceX?: number;
  sourceY?: number;
}

export interface IGameModel {
  checkWin(board: (string | null)[][], symbol: string): boolean;
  isDraw(board: (string | null)[][]): boolean;
  getInitialBoard(size: number): (string | null)[][];
  isValidMove(board: (string | null)[][], x: number, y: number, currentPlayer: number, moves: GameState['moves'], sourceX?: number, sourceY?: number): boolean;
  
  // Game-specific rules (Liskov Substitution allows extending the model behavior)
  handleHistory?: (state: { board: (string | null)[][], moves: GameState['moves'] }) => { board: (string | null)[][], moves: GameState['moves'] };
  checkLose?: (board: (string | null)[][], symbol: string) => boolean;
  calculateScores?: (board: (string | null)[][]) => number | { p1: number, p2: number };
  isValidSpot?: (x: number, y: number) => boolean;
  findLowestRow?: (board: (string | null)[][], col: number) => number;
  addObstacles?: (board: (string | null)[][]) => (string | null)[][];
  getAvailableNumbers?: (board: (string | null)[][], player: number) => number[];
  countThreeInARow?: (board: (string | null)[][], symbol: string) => number;
}
