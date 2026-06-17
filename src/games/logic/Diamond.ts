import { GameLogic } from '../types';

export const DiamondGameLogic: GameLogic = {
  checkWin: (board, symbol) => {
    const sym = symbol;
    const b = board;
    const size = 5;

    const lines3: string[] = [];
    const lines4: string[] = [];

    const addLines = (l: number, dir: string, cells: { x: number; y: number }[]) => {
      if (cells.every((c) => b[c.x][c.y] === sym)) {
        if (l === 3) lines3.push(dir);
        if (l === 4) lines4.push(dir);
      }
    };

    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 3; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 3; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i, j + k)) {
            valid = false;
            break;
          }
          cells.push({ x: i, y: j + k });
        }
        if (valid) addLines(3, 'H', cells);
      }
      for (let j = 0; j <= size - 4; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 4; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i, j + k)) {
            valid = false;
            break;
          }
          cells.push({ x: i, y: j + k });
        }
        if (valid) addLines(4, 'H', cells);
      }
    }

    // Vertical
    for (let j = 0; j < size; j++) {
      for (let i = 0; i <= size - 3; i++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 3; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j });
        }
        if (valid) addLines(3, 'V', cells);
      }
      for (let i = 0; i <= size - 4; i++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 4; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j });
        }
        if (valid) addLines(4, 'V', cells);
      }
    }

    // Diagonal (\)
    for (let i = 0; i <= size - 3; i++) {
      for (let j = 0; j <= size - 3; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 3; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j + k)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j + k });
        }
        if (valid) addLines(3, 'D1', cells);
      }
    }
    for (let i = 0; i <= size - 4; i++) {
      for (let j = 0; j <= size - 4; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 4; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j + k)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j + k });
        }
        if (valid) addLines(4, 'D1', cells);
      }
    }

    // Diagonal (/)
    for (let i = 0; i <= size - 3; i++) {
      for (let j = 2; j < size; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 3; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j - k)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j - k });
        }
        if (valid) addLines(3, 'D2', cells);
      }
    }
    for (let i = 0; i <= size - 4; i++) {
      for (let j = 3; j < size; j++) {
        const cells = [];
        let valid = true;
        for (let k = 0; k < 4; k++) {
          if (!(DiamondGameLogic as any).isValidSpot(i + k, j - k)) {
            valid = false;
            break;
          }
          cells.push({ x: i + k, y: j - k });
        }
        if (valid) addLines(4, 'D2', cells);
      }
    }

    for (const d3 of lines3) {
      for (const d4 of lines4) {
        if (d3 !== d4) return true;
      }
    }

    return false;
  },

  isDraw: (board) => {
    let moves = 0;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if ((DiamondGameLogic as any).isValidSpot(i, j) && board[i][j] !== null) moves++;
      }
    }
    return moves === 13; // Total valid spots in diamond is 13
  },

  isValidMove: (board, x, y) => {
    return (
      x >= 0 &&
      x < 5 &&
      y >= 0 &&
      y < 5 &&
      (DiamondGameLogic as any).isValidSpot(x, y) &&
      board[x][y] === null
    );
  },

  getInitialBoard: (_size) => {
    return Array(5)
      .fill(null)
      .map(() => Array(5).fill(null));
  },
};

(DiamondGameLogic as any).isValidSpot = (x: number, y: number) => {
  if (x === 0 || x === 4) return y === 2;
  if (x === 1 || x === 3) return y >= 1 && y <= 3;
  return y >= 0 && y <= 4;
};
