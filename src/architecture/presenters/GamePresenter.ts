import { IGameModel } from '../interfaces/IGameModel';
import { IGameView } from '../interfaces/IGameView';
import { IPresenter } from '../interfaces/IPresenter';
import { IPlayer } from '../interfaces/IPlayer';
import { GameState, Difficulty } from '../../types';

export class GamePresenter implements IPresenter {
  private gameState: GameState | null = null;
  private isAIThinking: boolean = false;
  private activePlayerIndex: number = 0;
  private stateHistory: GameState[] = [];

  constructor(
    private readonly gameId: string,
    private readonly model: IGameModel,
    private readonly view: IGameView,
    private readonly players: IPlayer[],
    private readonly difficulty: Difficulty,
    private readonly boardSize: number
  ) {}

  public startGame(): void {
    const initialBoard = this.model.getInitialBoard(this.boardSize);
    this.stateHistory = [];
    this.gameState = {
      board: initialBoard,
      currentPlayer: 1,
      gameStatus: 'active',
      winner: null,
      moves: []
    };
    this.activePlayerIndex = 0;
    this.view.updateGameState(this.gameState);
    this.view.updateBoard(this.gameState.board);
    
    this.checkTurn();
  }

  
  public undoMove(): void {
    if (!this.gameState || this.stateHistory.length === 0 || this.isAIThinking) return;

    // Check if we are playing against AI. If so, and we just played, we need to pop twice to undo both the AI's move and our move.
    // Wait, if it's the human's turn now, the AI already played, so we need to pop 2 states.
    // If it's a Local Multiplayer, we just pop 1 state.
    const hasAI = this.players.some(p => p.type === 'ai');
    let popCount = hasAI ? 2 : 1;

    if (this.gameState.gameStatus !== 'active' && hasAI) {
      // If game is over, maybe AI made the winning move, or human did. Just pop 1 by 1 until it's human turn.
      popCount = 1;
      while (this.stateHistory.length >= popCount) {
        const prevState = this.stateHistory[this.stateHistory.length - popCount];
        const prevPlayerType = this.players[prevState.currentPlayer - 1].type;
        if (prevPlayerType === 'human') break;
        popCount++;
      }
    } else if (hasAI && this.stateHistory.length < 2) {
      popCount = 1; // Fallback if we only have 1 move
    }

    if (this.stateHistory.length < popCount) return;

    for (let i = 0; i < popCount - 1; i++) {
      this.stateHistory.pop();
    }
    
    const previousState = this.stateHistory.pop();
    if (previousState) {
      this.gameState = previousState;
      const playerIndex = this.players.findIndex(p => p.id === this.gameState!.currentPlayer);
      this.activePlayerIndex = playerIndex !== -1 ? playerIndex : 0;
      this.view.updateGameState(this.gameState);
      this.view.updateBoard(this.gameState.board);
    }
  }

  public resetGame(): void {
    this.startGame();
  }

  public cleanup(): void {
    // Cleanup any timers if needed
  }

  public onCellClicked(x: number, y: number, symbol?: string, sourceX?: number, sourceY?: number): void {
    if (!this.gameState || this.gameState.gameStatus !== 'active' || this.isAIThinking) return;

    const currentPlayer = this.players[this.activePlayerIndex];
    if (currentPlayer.type === 'human') {
      this.handleMove(x, y, symbol, sourceX, sourceY);
    }
  }

  private handleMove(x: number, y: number, symbol?: string, sourceX?: number, sourceY?: number): void {
    if (!this.gameState) return;

    // Save current state to history
    this.stateHistory.push(JSON.parse(JSON.stringify(this.gameState)));

    let targetX = x;
    if (this.gameId === 'connectfour' && this.model.findLowestRow) {
      targetX = this.model.findLowestRow(this.gameState.board, y);
      if (targetX === -1) return;
    }

    if (!this.model.isValidMove(this.gameState.board, targetX, y, this.gameState.currentPlayer, this.gameState.moves, sourceX, sourceY)) {
      this.view.onInvalidMove();
      return;
    }

    let currentSymbol = symbol || this.players[this.activePlayerIndex].symbol;
    const newBoard = this.gameState.board.map(row => [...row]);
    
    // Move existing piece from source if coordinates are provided (e.g. fourbyfour, chess)
    if (sourceX !== undefined && sourceY !== undefined) {
      currentSymbol = newBoard[sourceX][sourceY] || currentSymbol;
      newBoard[sourceX][sourceY] = null;
    }

    newBoard[targetX][y] = currentSymbol;

    const newMoves = [...this.gameState.moves, { x: targetX, y, player: this.players[this.activePlayerIndex].id, sourceX, sourceY }];

    let newState = { board: newBoard, moves: newMoves };
    if (this.model.handleHistory) {
      newState = this.model.handleHistory(newState);
    }

    const checkWinFn = this.model.checkWin.bind(this.model);
    const hasWon = checkWinFn(newState.board, currentSymbol);
    const hasLost = this.model.checkLose ? this.model.checkLose(newState.board, currentSymbol) : false;
    const isDraw = this.model.isDraw(newState.board);

    if (hasWon || hasLost) {
      const winningPlayerIndex = hasLost ? (this.activePlayerIndex === 0 ? 1 : 0) : this.activePlayerIndex;
      this.gameState = {
        ...this.gameState,
        board: newState.board,
        moves: newState.moves,
        gameStatus: 'won',
        winner: this.players[winningPlayerIndex].id as 1 | 2
      };
      this.view.updateGameState(this.gameState);
      this.view.updateBoard(newState.board);
      this.view.showWinner(this.players[winningPlayerIndex].name);
      return;
    }

    if (isDraw) {
      this.gameState = {
        ...this.gameState,
        board: newState.board,
        moves: newState.moves,
        gameStatus: 'draw'
      };
      this.view.updateGameState(this.gameState);
      this.view.updateBoard(newState.board);
      this.view.showDraw();
      return;
    }

    // Next turn
    const isSinglePlayerGame = ['sudoku', '2048', 'minesweeper', 'solitaire'].includes(this.gameId);
    if (isSinglePlayerGame) {
      this.activePlayerIndex = 0;
    } else {
      this.activePlayerIndex = (this.activePlayerIndex + 1) % this.players.length;
    }

    this.gameState = {
      ...this.gameState,
      board: newState.board,
      moves: newState.moves,
      currentPlayer: this.players[this.activePlayerIndex].id
    };

    if (this.gameId === 'obstacles' && this.model.addObstacles && this.gameState.moves.length % 2 === 0) {
      this.gameState.board = this.model.addObstacles(this.gameState.board);
    }

    this.view.updateGameState(this.gameState as GameState);
    this.view.updateBoard((this.gameState as GameState).board);

    this.checkTurn();
  }

  private async checkTurn() {
    if (!this.gameState || this.gameState.gameStatus !== 'active') return;

    const currentPlayer = this.players[this.activePlayerIndex];
    if (currentPlayer.type === 'ai') {
      this.isAIThinking = true;
      this.view.setThinkingState(true);

      const move = await currentPlayer.makeMove(
        this.gameState.board,
        this.gameId,
        this.gameState,
        this.difficulty
      );

      this.isAIThinking = false;
      this.view.setThinkingState(false);

      if (move) {
        this.handleMove(move.x, move.y, move.symbol, move.sourceX, move.sourceY);
      }
    }
  }
}
