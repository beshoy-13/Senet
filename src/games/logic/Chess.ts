import { IGameModel, Move } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class ChessModel implements IGameModel {
  public getInitialBoard(_size: number): (string | null)[][] {
    const b: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

    // Black pieces
    b[0] = ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'];
    b[1] = Array(8).fill('bp');

    // White pieces
    b[6] = Array(8).fill('wp');
    b[7] = ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'];

    return b;
  }

  // Check if a move is valid
  public isValidMove(
    board: (string | null)[][],
    targetX: number,
    targetY: number,
    currentPlayer: number,
    _moves: GameState['moves'],
    sourceX?: number,
    sourceY?: number
  ): boolean {
    if (sourceX === undefined || sourceY === undefined) return false;
    if (sourceX < 0 || sourceX >= 8 || sourceY < 0 || sourceY >= 8) return false;
    if (targetX < 0 || targetX >= 8 || targetY < 0 || targetY >= 8) return false;

    const piece = board[sourceX][sourceY];
    if (!piece) return false;

    // Check ownership: white is currentPlayer 1, black is currentPlayer 2
    const color = piece[0]; // 'w' or 'b'
    if (currentPlayer === 1 && color !== 'w') return false;
    if (currentPlayer === 2 && color !== 'b') return false;

    const targetPiece = board[targetX][targetY];
    if (targetPiece && targetPiece[0] === color) {
      return false; // Cannot capture own piece
    }

    // Check basic movement rules for the piece
    if (!this.isValidPieceMovement(board, piece, sourceX, sourceY, targetX, targetY)) {
      return false;
    }

    // Simulate the move to check if it puts or leaves own king in check
    const tempBoard = board.map(row => [...row]);
    tempBoard[targetX][targetY] = piece;
    tempBoard[sourceX][sourceY] = null;

    if (this.isKingInCheck(tempBoard, color)) {
      return false; // Cannot move into check
    }

    return true;
  }

  // Basic check win condition: King capture or opponent has no legal moves
  public checkWin(board: (string | null)[][], symbol: string): boolean {
    // currentPlayer index is represented by 'X' or 'O' symbol
    // Let's resolve the symbol to piece color: player 1 (symbol 'X') is 'w', player 2 (symbol 'O') is 'b'
    const color = symbol === 'X' ? 'w' : 'b';
    const opponentColor = color === 'w' ? 'b' : 'w';

    // Verify if opponent King exists. If captured, we won!
    let opponentKingExists = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === opponentColor + 'k') {
          opponentKingExists = true;
          break;
        }
      }
    }
    if (!opponentKingExists) return true;

    // Standard Checkmate check: Opponent is in check and has no legal moves
    const opponentPlayer = opponentColor === 'w' ? 1 : 2;
    if (this.isKingInCheck(board, opponentColor)) {
      const hasMoves = this.hasAnyLegalMoves(board, opponentPlayer);
      if (!hasMoves) return true;
    }

    return false;
  }

  public checkLose(board: (string | null)[][], symbol: string): boolean {
    const color = symbol === 'X' ? 'w' : 'b';
    const player = color === 'w' ? 1 : 2;
    // We lose if we are in check and have no legal moves
    return this.isKingInCheck(board, color) && !this.hasAnyLegalMoves(board, player);
  }

  public isDraw(board: (string | null)[][]): boolean {
    // Check for stalemate: current player is NOT in check but has no legal moves
    // Since isDraw doesn't get the currentPlayer, we can see if both players have moves
    const p1Moves = this.hasAnyLegalMoves(board, 1);
    const p2Moves = this.hasAnyLegalMoves(board, 2);
    if (!p1Moves || !p2Moves) {
      // If the player whose turn it is has no moves and is not in check, it is a draw.
      // We can check if either king is NOT in check but has no moves
      const p1InCheck = this.isKingInCheck(board, 'w');
      const p2InCheck = this.isKingInCheck(board, 'b');
      if ((!p1Moves && !p1InCheck) || (!p2Moves && !p2InCheck)) return true;
    }
    return false;
  }

  // Check if a specific piece movement is valid, ignoring own-king-check checks to prevent infinite recursion
  public isValidPieceMovement(
    board: (string | null)[][],
    piece: string,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
  ): boolean {
    const color = piece[0];
    const type = piece[1];
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    switch (type) {
      case 'p': { // Pawn
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 : 1;

        // Move 1 square forward
        if (dy === 0 && dx === dir) {
          return board[targetX][targetY] === null;
        }
        // Move 2 squares forward from start row
        if (dy === 0 && sourceX === startRow && dx === 2 * dir) {
          return board[sourceX + dir][sourceY] === null && board[targetX][targetY] === null;
        }
        // Capture diagonally
        if (dx === dir && ady === 1) {
          const targetPiece = board[targetX][targetY];
          return targetPiece !== null && targetPiece[0] !== color;
        }
        return false;
      }

      case 'r': { // Rook
        if (dx !== 0 && dy !== 0) return false;
        return this.isPathClear(board, sourceX, sourceY, targetX, targetY);
      }

      case 'n': { // Knight
        return (adx === 1 && ady === 2) || (adx === 2 && ady === 1);
      }

      case 'b': { // Bishop
        if (adx !== ady) return false;
        return this.isPathClear(board, sourceX, sourceY, targetX, targetY);
      }

      case 'q': { // Queen
        if (dx !== 0 && dy !== 0 && adx !== ady) return false;
        return this.isPathClear(board, sourceX, sourceY, targetX, targetY);
      }

      case 'k': { // King
        return adx <= 1 && ady <= 1;
      }

      default:
        return false;
    }
  }

  // Check if the path between source and target is clear (not including target itself)
  private isPathClear(
    board: (string | null)[][],
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
  ): boolean {
    const stepX = Math.sign(targetX - sourceX);
    const stepY = Math.sign(targetY - sourceY);
    let x = sourceX + stepX;
    let y = sourceY + stepY;

    while (x !== targetX || y !== targetY) {
      if (board[x][y] !== null) return false;
      x += stepX;
      y += stepY;
    }
    return true;
  }

  // Find King coordinate
  private findKing(board: (string | null)[][], color: string): { x: number; y: number } | null {
    const targetPiece = color + 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === targetPiece) {
          return { x: r, y: c };
        }
      }
    }
    return null;
  }

  // Check if a player's King is in check
  public isKingInCheck(board: (string | null)[][], color: string): boolean {
    const kingPos = this.findKing(board, color);
    if (!kingPos) return false;

    const opponentColor = color === 'w' ? 'b' : 'w';

    // Loop through board, see if any opponent piece can attack kingPos
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece[0] === opponentColor) {
          if (this.isValidPieceMovement(board, piece, r, c, kingPos.x, kingPos.y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Verify if a player has any legal moves
  public hasAnyLegalMoves(board: (string | null)[][], player: number): boolean {
    const color = player === 1 ? 'w' : 'b';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece[0] === color) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (this.isValidMove(board, tr, tc, player, [], r, c)) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  }
  public getBestMove(board: (string | null)[][], currentPlayer: number): Move | null {
    const color = currentPlayer === 1 ? 'w' : 'b';
    const opponentColor = color === 'w' ? 'b' : 'w';

    const moves: Move[] = [];
    // Gather all legal moves
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece[0] === color) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (this.isValidMove(board, tr, tc, currentPlayer, [], r, c)) {
                moves.push({ sourceX: r, sourceY: c, x: tr, y: tc });
              }
            }
          }
        }
      }
    }

    if (moves.length === 0) return null;

    // Simple move ordering: captures first
    moves.sort((a, b) => {
      const aTarget = board[a.x][a.y] ? 1 : 0;
      const bTarget = board[b.x][b.y] ? 1 : 0;
      return bTarget - aTarget;
    });

    let bestScore = color === 'w' ? -Infinity : Infinity;
    let bestMove = moves[0];

    const depth = 3;
    for (const move of moves) {
      // Simulate move
      const originalSource = board[move.sourceX!][move.sourceY!];
      const originalTarget = board[move.x][move.y];

      board[move.x][move.y] = originalSource;
      board[move.sourceX!][move.sourceY!] = null;

      const score = this.alphabeta(board, depth - 1, -Infinity, Infinity, color === 'b', color, opponentColor);

      // Backtrack
      board[move.sourceX!][move.sourceY!] = originalSource;
      board[move.x][move.y] = originalTarget;

      if (color === 'w') {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  private alphabeta(
    board: (string | null)[][],
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    color: string,
    opponentColor: string
  ): number {
    if (depth === 0) {
      return this.evaluateBoard(board);
    }

    // Check for game over
    const p1InCheck = this.isKingInCheck(board, 'w');
    const p2InCheck = this.isKingInCheck(board, 'b');
    const p1Moves = this.hasAnyLegalMoves(board, 1);
    const p2Moves = this.hasAnyLegalMoves(board, 2);

    if (p1InCheck && !p1Moves) return -10000 + (3 - depth); // Black won
    if (p2InCheck && !p2Moves) return 10000 - (3 - depth);  // White won
    if ((!p1Moves && !p1InCheck) || (!p2Moves && !p2InCheck)) return 0; // Draw

    const activeColor = isMaximizing ? 'w' : 'b';
    const playerNum = activeColor === 'w' ? 1 : 2;

    const moves: Move[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece[0] === activeColor) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (this.isValidMove(board, tr, tc, playerNum, [], r, c)) {
                moves.push({ sourceX: r, sourceY: c, x: tr, y: tc });
              }
            }
          }
        }
      }
    }

    if (moves.length === 0) return this.evaluateBoard(board);

    moves.sort((a, b) => {
      const aTarget = board[a.x][a.y] ? 1 : 0;
      const bTarget = board[b.x][b.y] ? 1 : 0;
      return bTarget - aTarget;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const originalSource = board[move.sourceX!][move.sourceY!];
        const originalTarget = board[move.x][move.y];

        board[move.x][move.y] = originalSource;
        board[move.sourceX!][move.sourceY!] = null;

        const evaluation = this.alphabeta(board, depth - 1, alpha, beta, false, color, opponentColor);

        board[move.sourceX!][move.sourceY!] = originalSource;
        board[move.x][move.y] = originalTarget;

        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const originalSource = board[move.sourceX!][move.sourceY!];
        const originalTarget = board[move.x][move.y];

        board[move.x][move.y] = originalSource;
        board[move.sourceX!][move.sourceY!] = null;

        const evaluation = this.alphabeta(board, depth - 1, alpha, beta, true, color, opponentColor);

        board[move.sourceX!][move.sourceY!] = originalSource;
        board[move.x][move.y] = originalTarget;

        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private evaluateBoard(board: (string | null)[][]): number {
    let score = 0;
    const values: Record<string, number> = {
      p: 10,
      n: 30,
      b: 30,
      r: 50,
      q: 90,
      k: 900
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          const color = piece[0];
          const type = piece[1];
          let val = values[type] || 0;

          if (type === 'p') {
            val += color === 'w' ? (6 - r) * 0.5 : (r - 1) * 0.5;
          } else if (type === 'n' || type === 'b') {
            if (r >= 2 && r <= 5 && c >= 2 && c <= 5) val += 1.5;
          }

          score += color === 'w' ? val : -val;
        }
      }
    }
    return score;
  }
}

export const ChessGameLogic = new ChessModel();
