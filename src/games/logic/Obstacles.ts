import { GameLogic } from '../types';

export const ObstaclesGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const size = 6;
    const b = board;
    const sym = symbol;

    // Rows
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= 2; j++) {
        if (
          b[i][j] === sym &&
          b[i][j + 1] === sym &&
          b[i][j + 2] === sym &&
          b[i][j + 3] === sym
        )
          return true;
      }
    }

    // Cols
    for (let j = 0; j < size; j++) {
      for (let i = 0; i <= 2; i++) {
        if (
          b[i][j] === sym &&
          b[i + 1][j] === sym &&
          b[i + 2][j] === sym &&
          b[i + 3][j] === sym
        )
          return true;
      }
    }

    // Main Diagonals
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++) {
        if (
          b[i][j] === sym &&
          b[i + 1][j + 1] === sym &&
          b[i + 2][j + 2] === sym &&
          b[i + 3][j + 3] === sym
        )
          return true;
      }
    }

    // Anti-Diagonals
    for (let i = 0; i <= 2; i++) {
      for (let j = 3; j < size; j++) {
        if (
          b[i][j] === sym &&
          b[i + 1][j - 1] === sym &&
          b[i + 2][j - 2] === sym &&
          b[i + 3][j - 3] === sym
        )
          return true;
      }
    }

    return false;
  },

  isDraw: (board) => {
    return board.every((row) => row.every((cell) => cell !== null));
  },

  isValidMove: (board, x, y) => {
    return x >= 0 && x < 6 && y >= 0 && y < 6 && board[x][y] === null;
  },

  getInitialBoard: (_size) => {
    return Array(6)
      .fill(null)
      .map(() => Array(6).fill(null));
  },

  getRandomMove: (board) => {
    const available = [];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (board[i][j] === null) available.push({ x: i, y: j });
      }
    }
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  },

  getBestMove: (board, currentPlayer) => {
    // Simple random AI as per C++ for this variant
    return ObstaclesGameLogic.getRandomMove!(board, currentPlayer, []);
  },
};

(ObstaclesGameLogic as any).addObstacles = (board: (string | null)[][]) => {
  const newBoard = board.map((row) => [...row]);
  let added = 0;
  let attempts = 0;
  while (added < 2 && attempts < 100) {
    const r = Math.floor(Math.random() * 6);
    const c = Math.floor(Math.random() * 6);
    if (newBoard[r][c] === null) {
      newBoard[r][c] = '#';
      added++;
    }
    attempts++;
  }
  return newBoard;
};
