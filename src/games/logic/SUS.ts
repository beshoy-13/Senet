import { GameLogic } from '../types';

export const SUSGameLogic: GameLogic = {
  checkWin: (_board, _symbol) => {
    return false; // Standard win check returns false as it's score-based
  },

  isDraw: (board) => {
    if (!board.every((row) => row.every((cell) => cell !== null))) return false;
    const scores = (SUSGameLogic as any).calculateScores(board);
    return scores.s === scores.u;
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

(SUSGameLogic as any).calculateScores = (board: (string | null)[][]) => {
  let s_score = 0;
  let u_score = 0;
  const b = board;

  const isSUS = (seq: (string | null)[]) => {
    return seq[0] === 'S' && seq[1] === 'U' && seq[2] === 'S';
  };

  // Rows
  for (let i = 0; i < 3; i++) {
    if (isSUS([b[i][0], b[i][1], b[i][2]])) s_score++;
  }
  // Cols
  for (let j = 0; j < 3; j++) {
    if (isSUS([b[0][j], b[1][j], b[2][j]])) s_score++;
  }
  // Diagonals
  if (isSUS([b[0][0], b[1][1], b[2][2]])) s_score++;
  if (isSUS([b[0][2], b[1][1], b[2][0]])) s_score++;

  return { s: s_score, u: u_score }; // S always gets the points for forming SUS in this C++ version
};
