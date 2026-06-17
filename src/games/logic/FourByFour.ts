import { GameLogic, Move } from '../types';

export const FourByFourGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const sym = symbol;
    const b = board;
    const size = 4;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= 1; j++) {
        if (b[i][j] === sym && b[i][j + 1] === sym && b[i][j + 2] === sym) return true;
        if (b[j][i] === sym && b[j + 1][i] === sym && b[j + 2][i] === sym) return true;
      }
    }

    for (let i = 0; i <= 1; i++) {
      for (let j = 0; j <= 1; j++) {
        if (b[i][j] === sym && b[i + 1][j + 1] === sym && b[i + 2][j + 2] === sym) return true;
      }
    }

    for (let i = 0; i <= 1; i++) {
      for (let j = 2; j <= 3; j++) {
        if (b[i][j] === sym && b[i + 1][j - 1] === sym && b[i + 2][j - 2] === sym) return true;
      }
    }

    return false;
  },

  isDraw: (_board) => {
    return false;
  },

  isValidMove: (board, x, y) => {
    return x >= 0 && x < 4 && y >= 0 && y < 4 && board[x][y] === null;
  },

  getInitialBoard: (_size) => {
    const b: (string | null)[][] = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));

    for (let j = 0; j < 4; j++) {
      if (j % 2 === 0) {
        b[0][j] = 'X';
        b[3][j] = 'O';
      } else {
        b[0][j] = 'O';
        b[3][j] = 'X';
      }
    }
    return b;
  },

  getRandomMove: (board, currentPlayer) => {
    const sym = currentPlayer === 1 ? 'X' : 'O';
    const moves: Move[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === sym) {
          const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && board[nr][nc] === null) {
              moves.push({ sourceX: r, sourceY: c, x: nr, y: nc });
            }
          }
        }
      }
    }
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  },

  getBestMove: (board, currentPlayer) => {
    const symbol = currentPlayer === 1 ? 'X' : 'O';
    const opponent = currentPlayer === 1 ? 'O' : 'X';

    let bestScore = -Infinity;
    let bestMove: Move | null = null;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === symbol) {
          const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && board[nr][nc] === null) {
              board[nr][nc] = symbol; board[r][c] = null;
              let score = minimax(board, 0, false, symbol, opponent, -Infinity, Infinity);
              board[r][c] = symbol; board[nr][nc] = null;
              if (score > bestScore) {
                bestScore = score;
                bestMove = { sourceX: r, sourceY: c, x: nr, y: nc };
              }
            }
          }
        }
      }
    }
    return bestMove;
  },
};

(FourByFourGameLogic as any).isValidStep = (
  board: (string | null)[][],
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  symbol: string
) => {
  if (fromX < 0 || fromX > 3 || fromY < 0 || fromY > 3 || toX < 0 || toX > 3 || toY < 0 || toY > 3)
    return false;
  if (board[fromX][fromY] !== symbol) return false;
  if (board[toX][toY] !== null) return false;
  return Math.abs(fromX - toX) + Math.abs(fromY - toY) === 1;
};

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string, alpha: number, beta: number): number {
  if (FourByFourGameLogic.checkWin(board, aiSymbol)) return 1000 - depth;
  if (FourByFourGameLogic.checkWin(board, huSymbol)) return -1000 + depth;
  if (depth >= 4) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === aiSymbol) {
          const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && board[nr][nc] === null) {
              board[nr][nc] = aiSymbol; board[r][c] = null;
              let evalRes = minimax(board, depth + 1, false, aiSymbol, huSymbol, alpha, beta);
              board[r][c] = aiSymbol; board[nr][nc] = null;
              maxEval = Math.max(maxEval, evalRes);
              alpha = Math.max(alpha, evalRes);
              if (beta <= alpha) break;
            }
          }
        }
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === huSymbol) {
          const dr = [-1, 1, 0, 0], dc = [0, 0, -1, 1];
          for (let k = 0; k < 4; k++) {
            const nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && board[nr][nc] === null) {
              board[nr][nc] = huSymbol; board[r][c] = null;
              let evalRes = minimax(board, depth + 1, true, aiSymbol, huSymbol, alpha, beta);
              board[r][c] = huSymbol; board[nr][nc] = null;
              minEval = Math.min(minEval, evalRes);
              beta = Math.min(beta, evalRes);
              if (beta <= alpha) break;
            }
          }
        }
      }
    }
    return minEval;
  }
}
