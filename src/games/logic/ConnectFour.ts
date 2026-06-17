import { GameLogic } from '../types';

export const ConnectFourGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const rows = board.length;
    const cols = board[0].length;

    // Horizontal
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (
          board[r][c] === symbol &&
          board[r][c + 1] === symbol &&
          board[r][c + 2] === symbol &&
          board[r][c + 3] === symbol
        )
          return true;
      }
    }

    // Vertical
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c < cols; c++) {
        if (
          board[r][c] === symbol &&
          board[r + 1][c] === symbol &&
          board[r + 2][c] === symbol &&
          board[r + 3][c] === symbol
        )
          return true;
      }
    }

    // Diagonal (down-right)
    for (let r = 0; r <= rows - 4; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (
          board[r][c] === symbol &&
          board[r + 1][c + 1] === symbol &&
          board[r + 2][c + 2] === symbol &&
          board[r + 3][c + 3] === symbol
        )
          return true;
      }
    }

    // Diagonal (up-right)
    for (let r = 3; r < rows; r++) {
      for (let c = 0; c <= cols - 4; c++) {
        if (
          board[r][c] === symbol &&
          board[r - 1][c + 1] === symbol &&
          board[r - 2][c + 2] === symbol &&
          board[r - 3][c + 3] === symbol
        )
          return true;
      }
    }

    return false;
  },

  isDraw: (board) => {
    return board[0].every((cell) => cell !== null);
  },

  isValidMove: (_board, _x, y) => {
    return y >= 0 && y < _board[0].length && _board[0][y] === null;
  },

  getInitialBoard: (_size) => {
    return Array(6)
      .fill(null)
      .map(() => Array(7).fill(null));
  },
};

// Helper for Connect Four gravity
(ConnectFourGameLogic as any).findLowestRow = (board: (string | null)[][], col: number) => {
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r][col] === null) return r;
  }
  return -1;
};
