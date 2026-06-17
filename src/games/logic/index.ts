import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { XOGameLogic } from './XO';
import { PyramidGameLogic } from './Pyramid';
import { FiveByFiveGameLogic } from './FiveByFive';
import { FourByFourGameLogic } from './FourByFour';
import { ConnectFourGameLogic } from './ConnectFour';
import { WordGameLogic } from './Word';
import { NumericalGameLogic } from './Numerical';
import { MisereGameLogic } from './Misere';
import { ObstaclesGameLogic } from './Obstacles';
import { UltimateGameLogic } from './Ultimate';
import { InfinityGameLogic } from './Infinity';
import { DiamondGameLogic } from './Diamond';
import { MemoryGameLogic } from './Memory';
import { SUSGameLogic } from './SUS';
import { ChessGameLogic } from './Chess';
import { SudokuGameLogic } from './Sudoku';
import { MinesweeperGameLogic } from './Minesweeper';
import { Neon2048GameLogic } from './Neon2048';
import { SolitaireGameLogic } from './Solitaire';
import { SnakesLaddersGameLogic } from './SnakesLadders';

export const GAME_LOGICS: Record<string, IGameModel> = {
  xo: XOGameLogic,
  pyramid: PyramidGameLogic as any,
  fivebyfive: FiveByFiveGameLogic as any,
  fourbyfour: FourByFourGameLogic as any,
  connectfour: ConnectFourGameLogic as any,
  word: WordGameLogic as any,
  numerical: NumericalGameLogic as any,
  misere: MisereGameLogic as any,
  obstacles: ObstaclesGameLogic as any,
  ultimate: UltimateGameLogic as any,
  infinity: InfinityGameLogic as any,
  diamond: DiamondGameLogic as any,
  memory: MemoryGameLogic as any,
  sus: SUSGameLogic as any,
  chess: ChessGameLogic as any,
  sudoku: SudokuGameLogic as any,
  minesweeper: MinesweeperGameLogic as any,
  2048: Neon2048GameLogic as any,
  solitaire: SolitaireGameLogic as any,
  snakesladders: SnakesLaddersGameLogic as any,
};

export const getGameLogic = (gameId: string): IGameModel => {
  return GAME_LOGICS[gameId] || XOGameLogic;
};
