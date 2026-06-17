import { IGameModel, Move } from '../../architecture/interfaces/IGameModel';

export class TicTacToeModel implements IGameModel {
  public checkWin(board: (string | null)[][], symbol: string): boolean {
    const size = board.length;
    for (let i = 0; i < size; i++) {
      if (board[i].every((cell) => cell === symbol)) return true;
      if (board.every((row) => row[i] === symbol)) return true;
    }
    if (board.every((row, i) => row[i] === symbol)) return true;
    if (board.every((row, i) => row[size - 1 - i] === symbol)) return true;
    return false;
  }

  public isDraw(board: (string | null)[][]): boolean {
    return board.every((row) => row.every((cell) => cell !== null));
  }

  public isValidMove(board: (string | null)[][], x: number, y: number): boolean {
    return x >= 0 && x < board.length && y >= 0 && y < board[0].length && board[x][y] === null;
  }

  public getInitialBoard(size: number): (string | null)[][] {
    return Array(size).fill(null).map(() => Array(size).fill(null));
  }

  // Backward compatibility for existing AI
  public getBestMove?(board: (string | null)[][], currentPlayer: number): Move | null {
    const symbol = currentPlayer === 1 ? 'X' : 'O';
    const opponent = currentPlayer === 1 ? 'O' : 'X';

    let bestScore = -Infinity;
    let move: Move | null = null;

    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === null) {
          board[i][j] = symbol;
          let score = this.minimax(board, 0, false, symbol, opponent);
          board[i][j] = null;
          if (score > bestScore) {
            bestScore = score;
            move = { x: i, y: j };
          }
        }
      }
    }
    return move;
  }

  private minimax(board: (string | null)[][], depth: number, isMaximizing: boolean, aiSymbol: string, huSymbol: string): number {
    if (this.checkWin(board, aiSymbol)) return 10 - depth;
    if (this.checkWin(board, huSymbol)) return depth - 10;
    if (this.isDraw(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] === null) {
            board[i][j] = aiSymbol;
            let score = this.minimax(board, depth + 1, false, aiSymbol, huSymbol);
            board[i][j] = null;
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (board[i][j] === null) {
            board[i][j] = huSymbol;
            let score = this.minimax(board, depth + 1, true, aiSymbol, huSymbol);
            board[i][j] = null;
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }
}

export const XOGameLogic = new TicTacToeModel();
