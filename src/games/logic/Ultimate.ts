import { GameLogic } from '../types';

export const UltimateGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const mainBoard = (UltimateGameLogic as any).getMainBoard(board);
    const sym = symbol;

    // Standard 3x3 win check on mainBoard
    for (let i = 0; i < 3; i++) {
      if (mainBoard[i].every((cell: string | null) => cell === sym)) return true;
      if (mainBoard.every((row: (string | null)[]) => row[i] === sym)) return true;
    }
    if (mainBoard.every((row: (string | null)[], i: number) => row[i] === sym)) return true;
    if (mainBoard.every((row: (string | null)[], i: number) => row[2 - i] === sym)) return true;

    return false;
  },

  isDraw: (board) => {
    return board.every((row) => row.every((cell) => cell !== null));
  },

  isValidMove: (board, x, y, _currentPlayer, moves) => {
    if (x < 0 || x >= 9 || y < 0 || y >= 9 || board[x][y] !== null) return false;
    
    if (!moves || moves.length === 0) return true;
    
    const lastMove = moves[moves.length - 1];
    const forcedSi = lastMove.x % 3;
    const forcedSj = lastMove.y % 3;
    
    const currentSi = Math.floor(x / 3);
    const currentSj = Math.floor(y / 3);
    
    if (currentSi === forcedSi && currentSj === forcedSj) return true;
    
    // If forced sector is won or full, any move is valid
    const mainBoard = (UltimateGameLogic as any).getMainBoard(board);
    if (mainBoard[forcedSi][forcedSj] !== null) return true;
    
    let full = true;
    for (let i = forcedSi * 3; i < forcedSi * 3 + 3; i++) {
      for (let j = forcedSj * 3; j < forcedSj * 3 + 3; j++) {
        if (board[i][j] === null) { full = false; break; }
      }
      if (!full) break;
    }
    return full;
  },

  getInitialBoard: (_size) => {
    return Array(9)
      .fill(null)
      .map(() => Array(9).fill(null));
  },
};

(UltimateGameLogic as any).getMainBoard = (board: (string | null)[][]) => {
  const mainBoard: (string | null)[][] = Array(3)
    .fill(null)
    .map(() => Array(3).fill(null));

  for (let si = 0; si < 3; si++) {
    for (let sj = 0; sj < 3; sj++) {
      mainBoard[si][sj] = (UltimateGameLogic as any).checkSubWinner(board, si, sj);
    }
  }
  return mainBoard;
};

(UltimateGameLogic as any).checkSubWinner = (board: (string | null)[][], si: number, sj: number) => {
  const startR = si * 3;
  const startC = sj * 3;

  const check = (cells: (string | null)[]) => {
    if (cells[0] && cells[0] === cells[1] && cells[1] === cells[2]) return cells[0];
    return null;
  };

  // Rows
  for (let i = 0; i < 3; i++) {
    const winner = check([board[startR + i][startC], board[startR + i][startC + 1], board[startR + i][startC + 2]]);
    if (winner) return winner;
  }
  // Cols
  for (let j = 0; j < 3; j++) {
    const winner = check([board[startR][startC + j], board[startR + 1][startC + j], board[startR + 2][startC + j]]);
    if (winner) return winner;
  }
  // Diagonals
  const d1 = check([board[startR][startC], board[startR + 1][startC + 1], board[startR + 2][startC + 2]]);
  if (d1) return d1;
  const d2 = check([board[startR][startC + 2], board[startR + 1][startC + 1], board[startR + 2][startC]]);
  if (d2) return d2;

  return null;
};
