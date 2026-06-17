import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class SudokuModel implements IGameModel {
  // We will store the full solution of the currently generated board here to facilitate hints
  private currentSolution: (string | null)[][] = [];

  public getInitialBoard(_size: number): (string | null)[][] {
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    try {
      const saved = localStorage.getItem('boardGamesSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.difficulty) difficulty = parsed.difficulty;
      }
    } catch {}

    return this.generatePuzzle(difficulty);
  }

  // A move is valid if the cell is not an initial clue (which starts with 'c')
  public isValidMove(
    board: (string | null)[][],
    x: number,
    y: number,
    _currentPlayer: number,
    _moves: GameState['moves']
  ): boolean {
    if (x < 0 || x >= 9 || y < 0 || y >= 9) return false;
    const cell = board[x][y];
    if (cell && cell.startsWith('c')) return false; // Initial clue cannot be changed
    return true;
  }

  // The game is won if the board is completely full and valid
  public checkWin(board: (string | null)[][], _symbol: string): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (!val) return false; // Empty cell
        
        // Strip clue prefix for validation
        const num = val.replace('c', '');
        if (!this.isValValidInBoard(board, r, c, num)) {
          return false;
        }
      }
    }
    return true;
  }

  public isDraw(_board: (string | null)[][]): boolean {
    return false; // Sudoku doesn't have draws in single-player
  }

  // Check if a number is valid at row, col in the board (ignores the cell itself)
  private isValValidInBoard(
    board: (string | null)[][],
    row: number,
    col: number,
    numStr: string
  ): boolean {
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] && board[row][c]!.replace('c', '') === numStr) {
        return false;
      }
    }
    // Check col
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] && board[r][col]!.replace('c', '') === numStr) {
        return false;
      }
    }
    // Check 3x3 box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] && board[r][c]!.replace('c', '') === numStr) {
          return false;
        }
      }
    }
    return true;
  }

  // Procedural puzzle generator
  public generatePuzzle(difficulty: 'easy' | 'medium' | 'hard'): (string | null)[][] {
    const board: (string | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // Fill the board with a valid solved Sudoku configuration
    this.fillSudokuGrid(board);

    // Save the full solution
    this.currentSolution = board.map(row => [...row]);

    // Carve out cells based on difficulty
    let removeCount = 30; // easy
    if (difficulty === 'medium') removeCount = 45;
    else if (difficulty === 'hard') removeCount = 55;

    const puzzle = board.map(row => [...row]);
    let removed = 0;
    while (removed < removeCount) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (puzzle[r][c] !== null) {
        puzzle[r][c] = null;
        removed++;
      }
    }

    // Convert remaining solved cells to Clues (prefix with 'c')
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== null) {
          puzzle[r][c] = 'c' + puzzle[r][c];
        }
      }
    }

    return puzzle;
  }

  // Backtracking grid filler
  private fillSudokuGrid(board: (string | null)[][]): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) {
          const numbers = this.shuffle(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
          for (const num of numbers) {
            if (this.isSafe(board, r, c, num)) {
              board[r][c] = num;
              if (this.fillSudokuGrid(board)) return true;
              board[r][c] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private isSafe(board: (string | null)[][], row: number, col: number, num: string): boolean {
    // Row
    for (let c = 0; c < 9; c++) {
      if (board[row][c] === num) return false;
    }
    // Col
    for (let r = 0; r < 9; r++) {
      if (board[r][col] === num) return false;
    }
    // Sub-grid
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (board[r + startRow][c + startCol] === num) return false;
      }
    }
    return true;
  }

  private shuffle(array: string[]): string[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Returns conflict cells to highlight them in red in the UI
  public getConflicts(board: (string | null)[][]): { x: number; y: number }[] {
    const conflicts: { x: number; y: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        if (val) {
          const num = val.replace('c', '');
          if (!this.isValValidInBoard(board, r, c, num)) {
            conflicts.push({ x: r, y: c });
          }
        }
      }
    }
    return conflicts;
  }

  // Returns the correct digit for the first empty or wrong cell
  public getHint(board: (string | null)[][]): { x: number; y: number; val: string } | null {
    // If the solution is not cached, let's solve the board
    if (this.currentSolution.length === 0) {
      const test = board.map(row => row.map(cell => cell ? cell.replace('c', '') : null));
      if (this.fillSudokuGrid(test)) {
        this.currentSolution = test;
      } else {
        return null; // Unsolvable state
      }
    }

    // Find first empty cell or wrong user cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const currentVal = board[r][c];
        if (!currentVal) {
          const correctVal = this.currentSolution[r][c];
          if (correctVal) return { x: r, y: c, val: correctVal };
        } else if (!currentVal.startsWith('c')) {
          // User digit: check if wrong
          const correctVal = this.currentSolution[r][c];
          if (correctVal && currentVal !== correctVal) {
            return { x: r, y: c, val: correctVal };
          }
        }
      }
    }
    return null;
  }
}

export const SudokuGameLogic = new SudokuModel();
