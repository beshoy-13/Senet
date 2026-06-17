import { IPlayer } from '../interfaces/IPlayer';
import { Move } from '../interfaces/IGameModel';
import { GameState, Difficulty } from '../../types';
import { getSmartMove } from '../../games/ai';
import { getOpeningMove } from '../../games/openingBook';
import { getGameLogic } from '../../games/logic';

export class OnlinePlayer implements IPlayer {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly symbol: string,
    public readonly avatar?: string
  ) {}

  public readonly type = 'ai';

  public async makeMove(
    board: (string | null)[][],
    gameId: string,
    gameState: GameState,
    difficulty: Difficulty = 'medium'
  ): Promise<Move | null> {
    return new Promise((resolve) => {
      // Simulate network delay / AI thinking time
      const delay = difficulty === 'easy' ? 400 : difficulty === 'medium' ? 700 : 1000;
      
      setTimeout(() => {
        if (gameId === 'snakesladders') {
          resolve({ x: 0, y: 0 });
          return;
        }

        let move: Move | null = null;
        const logic = getGameLogic(gameId);

        if (gameId === 'word' || gameId === 'numerical' || gameId === 'chess' || gameId === 'fourbyfour') {
          // Fallback for special games that require distinct best move logic
          move = (logic as any).getBestMove?.(board, gameState.currentPlayer) || null;
        } else {
          const bookMove = getOpeningMove(
            gameId,
            board,
            gameState.currentPlayer,
            gameState.moves.length,
            this.symbol
          );

          // Get Valid Moves Helper for the AI engine
          const getValidMovesHelper = (b: (string | null)[][], p: number) => {
            const moves: { x: number; y: number }[] = [];
            for (let i = 0; i < b.length; i++) {
              for (let j = 0; j < b[i].length; j++) {
                if (logic.isValidMove(b, i, j, p, gameState.moves)) {
                  if (gameId === 'connectfour') {
                    const lowest = logic.findLowestRow ? logic.findLowestRow(b, j) : i;
                    if (i === lowest) moves.push({ x: i, y: j });
                  } else {
                    moves.push({ x: i, y: j });
                  }
                }
              }
            }
            return moves;
          };

          move = bookMove || getSmartMove(
            board,
            gameState.currentPlayer,
            difficulty,
            (b, s) => logic.checkWin(b, s),
            (b) => logic.isDraw(b),
            getValidMovesHelper
          );
        }

        resolve(move);
      }, delay);
    });
  }
}
