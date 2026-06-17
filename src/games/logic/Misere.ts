import { GameLogic, Move } from '../types';

export const MisereGameLogic: GameLogic = {
  checkWin: (_board, _symbol) => {
    return false;
  },

  isDraw: (board) => {
    return board.every((row) => row.every((cell) => cell !== null));
  },

  isValidMove: (board, x, y) => {
    return x >= 0 && x < 3 && y >= 0 && y < 3 && board[x][y] === null;
  },

  getInitialBoard: (_size) => {
    return Array(3)
      .fill(null)
      .map(() => Array(3).fill(null));
  },

  getRandomMove: (board) => {
    const available = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[i][j] === null) available.push({ x: i, y: j });
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  },

  getBestMove: (board, currentPlayer) => {
    const symbol = currentPlayer === 1 ? 'X' : 'O';
    const opponent = currentPlayer === 1 ? 'O' : 'X';

    let bestScore = -Infinity;
    let move: Move | null = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
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

(MisereGameLogic as any).checkLose = (board: (string | null)[][], symbol: string) => {
  const b = board;
  const sym = symbol;

  // Rows
  for (let i = 0; i < 3; i++) {
    if (b[i][0] === sym && b[i][1] === sym && b[i][2] === sym) return true;
  }
  // Cols
  for (let j = 0; j < 3; j++) {
    if (b[0][j] === sym && b[1][j] === sym && b[2][j] === sym) return true;
  }
  // Diagonals
  if (b[0][0] === sym && b[1][1] === sym && b[2][2] === sym) return true;
  if (b[0][2] === sym && b[1][1] === sym && b[2][0] === sym) return true;

  return false;
};

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string): number {
  if ((MisereGameLogic as any).checkLose(board, aiSymbol)) return depth - 10;
  if ((MisereGameLogic as any).checkLose(board, huSymbol)) return 10 - depth;
  if (MisereGameLogic.isDraw(board)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
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
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
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
