import { GameLogic } from '../types';

export const MemoryGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    // Hidden board logic is the same as normal XO
    const b = board;
    const sym = symbol;

    for (let i = 0; i < 3; i++) {
      if (b[i][0] === sym && b[i][1] === sym && b[i][2] === sym) return true;
      if (b[0][i] === sym && b[1][i] === sym && b[2][i] === sym) return true;
    }
    if (b[0][0] === sym && b[1][1] === sym && b[2][2] === sym) return true;
    if (b[0][2] === sym && b[1][1] === sym && b[2][0] === sym) return true;

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
};
