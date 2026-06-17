import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class Neon2048Model implements IGameModel {
  public getInitialBoard(size: number): (string | null)[][] {
    const s = size || 4;
    const board: (string | null)[][] = Array(s).fill(null).map(() => Array(s).fill(null));
    
    // Spawn two initial tiles
    this.spawnTile(board);
    this.spawnTile(board);
    
    return board;
  }

  // Valid move if sliding in the given direction modifies the grid
  public isValidMove(
    board: (string | null)[][],
    _x: number,
    _y: number,
    _currentPlayer: number,
    _moves: GameState['moves'],
    _sourceX?: number,
    _sourceY?: number,
    symbol?: string
  ): boolean {
    if (!symbol || !['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(symbol)) return false;
    
    // Simulate slide
    const simulated = this.slideBoard(board, symbol);
    return !this.boardsEqual(board, simulated);
  }

  public handleHistory(state: { board: (string | null)[][]; moves: GameState['moves'] }): { board: (string | null)[][]; moves: GameState['moves'] } {
    const lastMove = state.moves[state.moves.length - 1];
    const direction = state.board[lastMove.x][lastMove.y];

    if (!direction || !['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(direction)) {
      return state;
    }

    // Perform the actual slide on the board
    // First, restore the original board without the dummy placed symbol
    const originalBoard = state.board.map(row => [...row]);
    // Clear dummy symbol placed by GamePresenter at lastMove.x, lastMove.y
    originalBoard[lastMove.x][lastMove.y] = null;

    const slidBoard = this.slideBoard(originalBoard, direction);
    
    // Spawn a new tile if slide caused changes
    this.spawnTile(slidBoard);

    return { board: slidBoard, moves: state.moves };
  }

  public checkWin(board: (string | null)[][], _symbol: string): boolean {
    // Win if 2048 tile is reached
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === '2048') return true;
      }
    }
    return false;
  }

  public isDraw(board: (string | null)[][]): boolean {
    // Game is over (Draw) if no slides are possible in any of the 4 directions
    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    for (const dir of directions) {
      const simulated = this.slideBoard(board, dir);
      if (!this.boardsEqual(board, simulated)) {
        return false; // Valid move exists
      }
    }
    return true; // No moves left
  }

  private boardsEqual(b1: (string | null)[][], b2: (string | null)[][]): boolean {
    for (let r = 0; r < b1.length; r++) {
      for (let c = 0; c < b1[r].length; c++) {
        if (b1[r][c] !== b2[r][c]) return false;
      }
    }
    return true;
  }

  private spawnTile(board: (string | null)[][]) {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] === null) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      board[rand.r][rand.c] = Math.random() < 0.9 ? '2' : '4';
    }
  }

  private slideBoard(board: (string | null)[][], direction: string): (string | null)[][] {
    const size = board.length;
    let result = board.map(row => [...row]);

    if (direction === 'LEFT') {
      for (let r = 0; r < size; r++) {
        result[r] = this.slideRowLeft(result[r]);
      }
    } else if (direction === 'RIGHT') {
      for (let r = 0; r < size; r++) {
        result[r] = this.slideRowLeft(result[r].reverse()).reverse();
      }
    } else if (direction === 'UP') {
      result = this.transpose(result);
      for (let r = 0; r < size; r++) {
        result[r] = this.slideRowLeft(result[r]);
      }
      result = this.transpose(result);
    } else if (direction === 'DOWN') {
      result = this.transpose(result);
      for (let r = 0; r < size; r++) {
        result[r] = this.slideRowLeft(result[r].reverse()).reverse();
      }
      result = this.transpose(result);
    }

    return result;
  }

  private slideRowLeft(row: (string | null)[]): (string | null)[] {
    const size = row.length;
    const filtered: (string | null)[] = row.filter(cell => cell !== null);
    
    // Merge adjacent equal numbers
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] !== null && filtered[i] === filtered[i + 1]) {
        filtered[i] = (parseInt(filtered[i]!) * 2).toString();
        filtered[i + 1] = null;
      }
    }
    
    // Filter nulls again and fill with nulls to original size
    const finalFiltered: (string | null)[] = filtered.filter(cell => cell !== null);
    while (finalFiltered.length < size) {
      finalFiltered.push(null);
    }
    return finalFiltered;
  }

  private transpose(matrix: (string | null)[][]): (string | null)[][] {
    const size = matrix.length;
    const result = Array(size).fill(null).map(() => Array(size).fill(null));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[c][r] = matrix[r][c];
      }
    }
    return result;
  }
}

export const Neon2048GameLogic = new Neon2048Model();
