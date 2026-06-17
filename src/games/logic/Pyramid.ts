import { GameLogic, Move } from '../types';

const isValidPyramidSpot = (x: number, y: number): boolean => {
  if (x === 0) return y === 2;
  if (x === 1) return y >= 1 && y <= 3;
  return y >= 0 && y <= 4;
};

export const PyramidGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const b = board;
    const sym = symbol;

    if (b[0][2] === sym && b[1][2] === sym && b[2][2] === sym) return true;
    if (b[1][1] === sym && b[1][2] === sym && b[1][3] === sym) return true;
    if (b[2][0] === sym && b[2][1] === sym && b[2][2] === sym) return true;
    if (b[2][1] === sym && b[2][2] === sym && b[2][3] === sym) return true;
    if (b[2][2] === sym && b[2][3] === sym && b[2][4] === sym) return true;
    if (b[0][2] === sym && b[1][1] === sym && b[2][0] === sym) return true;
    if (b[0][2] === sym && b[1][3] === sym && b[2][4] === sym) return true;

    return false;
  },

  isDraw: (board) => {
    let moves = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (isValidPyramidSpot(i, j) && board[i][j] !== null) {
          moves++;
        }
      }
    }
    return moves === 9;
  },

  isValidMove: (board, x, y) => {
    return (
      x >= 0 &&
      x < 3 &&
      y >= 0 &&
      y < 5 &&
      isValidPyramidSpot(x, y) &&
      board[x][y] === null
    );
  },

  getInitialBoard: (_size) => {
    return Array(3)
      .fill(null)
      .map(() => Array(5).fill(null));
  },

  getRandomMove: (board) => {
    const availableMoves: Move[] = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (isValidPyramidSpot(i, j) && board[i][j] === null) {
          availableMoves.push({ x: i, y: j });
        }
      }
    }
    if (availableMoves.length === 0) return null;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  },

  getBestMove: (board, currentPlayer) => {
    const symbol = currentPlayer === 1 ? 'X' : 'O';
    const opponent = currentPlayer === 1 ? 'O' : 'X';

    let bestScore = -Infinity;
    let move: Move | null = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (isValidPyramidSpot(i, j) && board[i][j] === null) {
          board[i][j] = symbol;
          let score = minimax(board, 0, false, symbol, opponent);
          board[i][j] = null;
          if (score > bestScore) {
            bestScore = score;
            move = { x: i, y: j };
          }
        }
      }
    }
    return move;
  },
};

(PyramidGameLogic as any).isValidSpot = (x: number, y: number) => isValidPyramidSpot(x, y);

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string): number {
  if (PyramidGameLogic.checkWin(board, aiSymbol)) return 10 - depth;
  if (PyramidGameLogic.checkWin(board, huSymbol)) return depth - 10;
  if (PyramidGameLogic.isDraw(board)) return 0;
  
  if (depth >= 6) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (isValidPyramidSpot(i, j) && board[i][j] === null) {
          board[i][j] = aiSymbol;
          let score = minimax(board, depth + 1, false, aiSymbol, huSymbol);
          board[i][j] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        if (isValidPyramidSpot(i, j) && board[i][j] === null) {
          board[i][j] = huSymbol;
          let score = minimax(board, depth + 1, true, aiSymbol, huSymbol);
          board[i][j] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
    }
    return bestScore;
  }
}
