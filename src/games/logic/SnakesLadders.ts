import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class SnakesLaddersModel implements IGameModel {
  // Map cell numbers for Snakes and Ladders (Exactly 6 snakes and 6 ladders)
  private ladders: Record<number, number> = {
    3: 38,
    8: 31,
    28: 84,
    36: 44,
    58: 77,
    75: 86
  };

  private snakes: Record<number, number> = {
    17: 7,
    52: 29,
    62: 22,
    88: 18,
    95: 75,
    97: 79
  };

  // Converts a cell number (1-100) to grid coordinates (row, col)
  public cellToCoords(cellNum: number): { r: number; c: number } {
    const bottomRow = Math.floor((cellNum - 1) / 10);
    const r = 9 - bottomRow;
    const c = bottomRow % 2 === 0 
      ? (cellNum - 1) % 10 
      : 9 - ((cellNum - 1) % 10);
    return { r, c };
  }

  // Converts grid coordinates (row, col) to cell number (1-100)
  public coordsToCell(r: number, c: number): number {
    const bottomRow = 9 - r;
    const isEvenRow = bottomRow % 2 === 0;
    return isEvenRow
      ? bottomRow * 10 + c + 1
      : bottomRow * 10 + (9 - c) + 1;
  }

  public getInitialBoard(_size: number): (string | null)[][] {
    const board: (string | null)[][] = Array(10).fill(null).map(() => Array(10).fill(null));
    // Place all possible players P1, P2, P3, P4 on cell 1 (row 9, col 0)
    board[9][0] = 'P1,P2,P3,P4';
    return board;
  }

  public isValidMove(
    _board: (string | null)[][],
    _x: number,
    _y: number,
    _currentPlayer: number,
    _moves: GameState['moves']
  ): boolean {
    return true; // Any roll trigger is always valid
  }

  public handleHistory(state: { board: (string | null)[][]; moves: GameState['moves'] }): { board: (string | null)[][]; moves: GameState['moves'] } {
    const board = state.board.map(row => [...row]);
    const lastMove = state.moves[state.moves.length - 1];
    const playerId = lastMove.player;
    const playerTag = `P${playerId}`;

    // Find current cell of this player
    let currentCell = 1;
    let foundR = -1;
    let foundC = -1;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const val = board[r][c];
        if (val && val.split(',').includes(playerTag)) {
          currentCell = this.coordsToCell(r, c);
          foundR = r;
          foundC = c;
          break;
        }
      }
      if (foundR !== -1) break;
    }

    // Roll 6-sided die
    const roll = Math.floor(Math.random() * 6) + 1;
    let nextCell = currentCell + roll;

    let targetCell = nextCell;

    if (nextCell > 100) {
      // Must land exactly on 100
      targetCell = currentCell;
    } else {
      if (this.ladders[nextCell]) {
        targetCell = this.ladders[nextCell];
      } else if (this.snakes[nextCell]) {
        targetCell = this.snakes[nextCell];
      }
    }

    // Update coordinates
    if (foundR !== -1 && foundC !== -1) {
      // Remove player from old cell
      const oldVals = board[foundR][foundC]!.split(',').filter(p => p !== playerTag);
      board[foundR][foundC] = oldVals.length > 0 ? oldVals.join(',') : null;
    }

    const { r: newR, c: newC } = this.cellToCoords(targetCell);
    const cellVal = board[newR][newC];
    const newVals = cellVal ? [...cellVal.split(','), playerTag] : [playerTag];
    board[newR][newC] = newVals.join(',');

    // Store roll and movement in move details
    // x: roll value
    // y: targetCell position
    // sourceX: currentCell (start position)
    // sourceY: nextCell (before snake/ladder, if applicable)
    lastMove.x = roll;
    lastMove.y = targetCell;
    lastMove.sourceX = currentCell;
    lastMove.sourceY = nextCell;

    return { board, moves: state.moves };
  }

  public checkWin(board: (string | null)[][], _symbol: string): boolean {
    // Win if a player reaches cell 100 (row 0, col 0)
    const val = board[0][0];
    if (val) {
      const playersOnLastCell = val.split(',');
      return playersOnLastCell.length > 0;
    }
    return false;
  }

  public isDraw(_board: (string | null)[][]): boolean {
    return false;
  }

  public getLadders(): Record<number, number> {
    return this.ladders;
  }

  public getSnakes(): Record<number, number> {
    return this.snakes;
  }
}

export const SnakesLaddersGameLogic = new SnakesLaddersModel();
