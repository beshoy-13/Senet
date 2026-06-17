import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class MinesweeperModel implements IGameModel {
  private mineGrid: boolean[][] = [];
  private firstClick: boolean = true;
  private numMines: number = 10;

  public getInitialBoard(size: number): (string | null)[][] {
    const s = size || 9;
    this.firstClick = true;
    this.mineGrid = Array(s).fill(false).map(() => Array(s).fill(false));
    return Array(s).fill(null).map(() => Array(s).fill(null));
  }

  public isValidMove(
    board: (string | null)[][],
    x: number,
    y: number,
    _currentPlayer: number,
    _moves: GameState['moves']
  ): boolean {
    const s = board.length;
    if (x < 0 || x >= s || y < 0 || y >= s) return false;
    
    // Can only interact with unrevealed cells or flagged cells
    const cell = board[x][y];
    return cell === null || cell === 'F';
  }

  public handleHistory(state: { board: (string | null)[][]; moves: GameState['moves'] }): { board: (string | null)[][]; moves: GameState['moves'] } {
    const lastMove = state.moves[state.moves.length - 1];
    const { x, y } = lastMove;
    const board = state.board.map(row => [...row]);
    const clickedSymbol = board[x][y];

    if (clickedSymbol === 'F') {
      // Toggle flag
      const cell = board[x][y];
      if (cell === 'F') {
        board[x][y] = null;
      } else if (cell === null) {
        board[x][y] = 'F';
      }
      return { board, moves: state.moves };
    }

    // Reveal action ('R')
    if (this.firstClick) {
      this.firstClick = false;
      this.generateMines(board.length, x, y);
    }

    if (this.mineGrid[x][y]) {
      // Clicked mine! Trigger explosion
      board[x][y] = 'M';
      // Reveal all other mines
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          if (this.mineGrid[r][c]) board[r][c] = 'M';
        }
      }
    } else {
      // Safe cell: reveal recursively
      this.revealCell(board, x, y);
    }

    return { board, moves: state.moves };
  }

  public checkWin(board: (string | null)[][], _symbol: string): boolean {
    const s = board.length;
    
    // Win if all safe cells are revealed
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (!this.mineGrid[r][c]) {
          // Safe cell: must be revealed (i.e. is a digit '0'-'8', and not null or 'F')
          const cell = board[r][c];
          if (cell === null || cell === 'F') {
            return false;
          }
        }
      }
    }
    return true;
  }

  public checkLose(board: (string | null)[][], _symbol: string): boolean {
    // Loss if any cell contains 'M' (mine)
    const s = board.length;
    for (let r = 0; r < s; r++) {
      for (let c = 0; c < s; c++) {
        if (board[r][c] === 'M') return true;
      }
    }
    return false;
  }

  public isDraw(_board: (string | null)[][]): boolean {
    return false;
  }

  private generateMines(size: number, startX: number, startY: number) {
    let placed = 0;
    while (placed < this.numMines) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      
      // Do not place mine on the first clicked cell or its 8 adjacent neighbors
      const isAdjacent = Math.abs(r - startX) <= 1 && Math.abs(c - startY) <= 1;
      if (!this.mineGrid[r][c] && !isAdjacent) {
        this.mineGrid[r][c] = true;
        placed++;
      }
    }
  }

  private revealCell(board: (string | null)[][], r: number, c: number) {
    if (r < 0 || r >= board.length || c < 0 || c >= board.length) return;
    if (board[r][c] !== null && board[r][c] !== 'F') return; // Already revealed

    const adjacentMines = this.countAdjacentMines(board.length, r, c);
    board[r][c] = adjacentMines.toString();

    // Recursive reveal for cells with 0 adjacent mines
    if (adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            this.revealCell(board, r + dr, c + dc);
          }
        }
      }
    }
  }

  private countAdjacentMines(size: number, r: number, c: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (this.mineGrid[nr][nc]) count++;
        }
      }
    }
    return count;
  }
}

export const MinesweeperGameLogic = new MinesweeperModel();
