import { GameLogic, Move } from '../types';

export const FiveByFiveGameLogic: GameLogic = {
  checkWin: (_board, _symbol) => {
    return false;
  },

  isDraw: (board) => {
    let moves = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell !== null) moves++;
      }
    }
    return moves === 24;
  },

  isValidMove: (board, x, y) => {
    return x >= 0 && x < 5 && y >= 0 && y < 5 && board[x][y] === null;
  },

  getInitialBoard: (_size) => {
    return Array(5)
      .fill(null)
      .map(() => Array(5).fill(null));
  },

  getRandomMove: (board) => {
    const availableMoves: Move[] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (board[i][j] === null) availableMoves.push({ x: i, y: j });
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
    
    // Check if it's the last move (24th)
    let moveCount = 0;
    for(const row of board) for(const c of row) if(c) moveCount++;

    const available = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (board[i][j] === null) available.push({ x: i, y: j });
      }
    }

    // Minimax for 5x5 is too slow if too many moves left. Use limited depth.
    for (const m of available) {
      board[m.x][m.y] = symbol;
      let score = minimax(board, 0, false, symbol, opponent);
      board[m.x][m.y] = null;
      if (score > bestScore) {
        bestScore = score;
        move = m;
      }
    }
    return move;
  },
};

// Helper to count 3-in-a-row sequences
(FiveByFiveGameLogic as any).countThreeInARow = (board: (string | null)[][], symbol: string) => {
  let count = 0;
  const size = 5;

  // Rows
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= 2; j++) {
      if (board[i][j] === symbol && board[i][j + 1] === symbol && board[i][j + 2] === symbol) {
        count++;
      }
    }
  }

  // Columns
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === symbol && board[i + 1][j] === symbol && board[i + 2][j] === symbol) {
        count++;
      }
    }
  }

  // Diagonals (top-left to bottom-right)
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      if (
        board[i][j] === symbol &&
        board[i + 1][j + 1] === symbol &&
        board[i + 2][j + 2] === symbol
      ) {
        count++;
      }
    }
  }

  // Diagonals (top-right to bottom-left)
  for (let i = 0; i <= 2; i++) {
    for (let j = 2; j < 5; j++) {
      if (
        board[i][j] === symbol &&
        board[i + 1][j - 1] === symbol &&
        board[i + 2][j - 2] === symbol
      ) {
        count++;
      }
    }
  }

  return count;
};

function evaluate(board: (string | null)[][], aiSymbol: string, huSymbol: string): number {
  const aiScore = (FiveByFiveGameLogic as any).countThreeInARow(board, aiSymbol);
  const huScore = (FiveByFiveGameLogic as any).countThreeInARow(board, huSymbol);
  return aiScore - huScore;
}

function minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string): number {
  if (FiveByFiveGameLogic.isDraw(board) || depth >= 3) {
    return evaluate(board, aiSymbol, huSymbol);
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
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
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
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
