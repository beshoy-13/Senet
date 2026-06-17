import { Move } from './IGameModel';
import { GameState, Difficulty } from '../../types';

export interface IPlayer {
  readonly id: number;
  readonly name: string;
  readonly symbol: string;
  readonly type: 'human' | 'ai';
  readonly avatar?: string;

  /**
   * Called by the Presenter when it's this player's turn.
   * If the player is a human, it might just return a Promise that resolves when the UI is clicked.
   * If the player is an AI, it calculates the move and returns it.
   */
  makeMove(
    board: (string | null)[][],
    gameId: string,
    gameState: GameState,
    difficulty?: Difficulty
  ): Promise<Move | null>;
}
