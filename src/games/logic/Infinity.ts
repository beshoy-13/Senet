import { GameLogic, Move } from '../types';

export const InfinityGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const b = board;
    const sym = symbol;

    for (let i = 0; i < 3; i++) {
      if (b[i][0] === sym && b[i][1] === sym && b[i][2] === sym) return true;
    }
    for (let j = 0; j < 3; j++) {
      if (b[0][j] === sym && b[1][j] === sym && b[2][j] === sym) return true;
    }
    if (b[0][0] === sym && b[1][1] === sym && b[2][2] === sym) return true;
    if (b[0][2] === sym && b[1][1] === sym && b[2][0] === sym) return true;

    return false;
  },

  isDraw: (_board) => {
    return false;
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

  getBestMove: (board, currentPlayer, _moves) => {
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

  handleHistory: (gameState: any) => {
    const { board, moves } = gameState;
    if (moves.length > 0 && moves.length % 3 === 0) {
      const oldest = moves[0];
      const newBoard = board.map((row: any) => [...row]);
      newBoard[oldest.x][oldest.y] = null;
      return {
        board: newBoard,
        moves: moves.slice(1),
      };
    }
    return { board, moves };
  }
};

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string): number {
  if (InfinityGameLogic.checkWin(board, aiSymbol)) return 10 - depth;
  if (InfinityGameLogic.checkWin(board, huSymbol)) return depth - 10;
  if (depth >= 4) return 0;

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
