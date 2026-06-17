import { GameState } from '../../types';

export interface IGameView {
  updateBoard(board: (string | null)[][]): void;
  updateGameState(gameState: GameState): void;
  showWinner(winnerName: string): void;
  showDraw(): void;
  setThinkingState(isThinking: boolean): void;
  onInvalidMove(message?: string): void;
}
