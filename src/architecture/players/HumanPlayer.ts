import { IPlayer } from '../interfaces/IPlayer';
import { Move } from '../interfaces/IGameModel';
import { GameState } from '../../types';

export class HumanPlayer implements IPlayer {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly symbol: string,
    public readonly avatar?: string
  ) {}

  public readonly type = 'human';

  public async makeMove(
    _board: (string | null)[][],
    _gameId: string,
    _gameState: GameState
  ): Promise<Move | null> {
    // For human players, the Presenter handles the move directly via UI click events.
    // So this returns null, meaning "wait for UI input".
    return null;
  }
}
