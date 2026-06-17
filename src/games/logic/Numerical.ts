import { GameLogic, Move } from '../types';

export const NumericalGameLogic: GameLogic = {
  checkWin: (board, _symbol) => {
    const b = board.map((row) => row.map((cell) => (cell ? parseInt(cell) : 0)));

    const checkSum = (sum: number) => sum === 15;

    // Rows
    for (let i = 0; i < 3; i++) {
      if (b[i][0] !== 0 && b[i][1] !== 0 && b[i][2] !== 0) {
        if (checkSum(b[i][0] + b[i][1] + b[i][2])) return true;
      }
    }
    // Cols
    for (let j = 0; j < 3; j++) {
      if (b[0][j] !== 0 && b[1][j] !== 0 && b[2][j] !== 0) {
        if (checkSum(b[0][j] + b[1][j] + b[2][j])) return true;
      }
    }
    // Diagonals
    if (b[0][0] !== 0 && b[1][1] !== 0 && b[2][2] !== 0) {
      if (checkSum(b[0][0] + b[1][1] + b[2][2])) return true;
    }
    if (b[0][2] !== 0 && b[1][1] !== 0 && b[2][0] !== 0) {
      if (checkSum(b[0][2] + b[1][1] + b[2][0])) return true;
    }

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

  getRandomMove: (board, _currentPlayer) => {
    const available = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[i][j] === null) available.push({ x: i, y: j });
    if (available.length === 0) return null;
    
    const nums = (NumericalGameLogic as any).getAvailableNumbers(board, 1);
    const move = available[Math.floor(Math.random() * available.length)];
    const num = nums[Math.floor(Math.random() * nums.length)];
    return { ...move, symbol: num.toString() };
  },

  getBestMove: (board, currentPlayer) => {
    const nums = (NumericalGameLogic as any).getAvailableNumbers(board, currentPlayer as 1 | 2);
    const oppNums = (NumericalGameLogic as any).getAvailableNumbers(board, currentPlayer === 1 ? 2 : 1);
    
    let bestScore = -Infinity;
    let bestMove: Move | null = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          for (const n of nums) {
            board[i][j] = n.toString();
            let score = minimax(board, 0, false, currentPlayer, nums.filter((x: number) => x !== n), oppNums);
            board[i][j] = null;
            if (score > bestScore) {
              bestScore = score;
              bestMove = { x: i, y: j, symbol: n.toString() };
            }
          }
        }
      }
    }
    return bestMove;
  },
};

(NumericalGameLogic as any).getAvailableNumbers = (board: (string | null)[][], player: 1 | 2) => {
  const used = new Set(
    board.flat().filter((cell) => cell !== null).map((cell) => parseInt(cell!))
  );
  const all = player === 1 ? [1, 3, 5, 7, 9] : [2, 4, 6, 8];
  return all.filter((n) => !used.has(n));
};

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiPlayer: number, aiNums: number[], huNums: number[]): number {
  if (NumericalGameLogic.checkWin(board, "")) return isMaximizing ? depth - 10 : 10 - depth;
  if (NumericalGameLogic.isDraw(board) || depth >= 4) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          for (const n of aiNums) {
            board[i][j] = n.toString();
            best = Math.max(best, minimax(board, depth + 1, false, aiPlayer, aiNums.filter(x => x !== n), huNums));
            board[i][j] = null;
          }
        }
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          for (const n of huNums) {
            board[i][j] = n.toString();
            best = Math.min(best, minimax(board, depth + 1, true, aiPlayer, aiNums, huNums.filter(x => x !== n)));
            board[i][j] = null;
          }
        }
      }
    }
    return best;
  }
}
