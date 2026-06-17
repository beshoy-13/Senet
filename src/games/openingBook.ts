interface OpeningMove {
  x: number;
  y: number;
  symbol?: string;
}

export function getOpeningMove(
  gameId: string,
  board: (string | null)[][],
  _currentPlayer: number,
  moves: number,
  aiSymbol: string,
): OpeningMove | null {
  if (gameId === 'xo' && moves < 3) {
    return getXOOpening(board, aiSymbol);
  }
  if (gameId === 'connectfour' && moves === 0) {
    return getConnectFourOpening(board);
  }
  return null;
}

/** Tic-Tac-Toe opening book (first 3 moves) */
function getXOOpening(board: (string | null)[][], aiSymbol: string): OpeningMove | null {
  const size = board.length;
  const center = Math.floor(size / 2);
  const corners: OpeningMove[] = [
    { x: 0, y: 0 }, { x: 0, y: size - 1 },
    { x: size - 1, y: 0 }, { x: size - 1, y: size - 1 },
  ];

  let placed = 0;
  let centerFree = board[center]?.[center] === null;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) placed++;
    }
  }

  // AI is X (first player) - take center
  if (placed === 0 && aiSymbol === 'X') {
    if (centerFree) return { x: center, y: center };
  }

  // AI is O (second player)
  if (placed === 1) {
    if (!centerFree) {
      const freeCorners = corners.filter((c) => board[c.x][c.y] === null);
      if (freeCorners.length > 0) return freeCorners[0];
    }
    if (centerFree) return { x: center, y: center };
    const freeCorners = corners.filter((c) => board[c.x][c.y] === null);
    if (freeCorners.length > 0) return freeCorners[0];
  }

  // AI is X, opponent took center -> take a corner
  if (placed === 2 && aiSymbol === 'X' && !centerFree) {
    const freeCorners = corners.filter((c) => board[c.x][c.y] === null);
    if (freeCorners.length > 0) return freeCorners[0];
  }

  return null;
}

/** Connect Four opening: play center column */
function getConnectFourOpening(board: (string | null)[][]): OpeningMove | null {
  const cols = board[0]?.length ?? 7;
  const centerCol = Math.floor(cols / 2);
  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r][centerCol] === null) {
      return { x: r, y: centerCol };
    }
  }
  return null;
}