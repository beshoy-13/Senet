import { IGameModel } from '../../architecture/interfaces/IGameModel';
import { GameState } from '../../types';

export class SolitaireModel implements IGameModel {
  // Suits: H (Hearts), D (Diamonds) -> Red; S (Spades), C (Clubs) -> Black
  // Values: A (1), 2-10, J (11), Q (12), K (13)
  
  public getInitialBoard(_size: number): (string | null)[][] {
    const board: (string | null)[][] = Array(16).fill(null).map(() => Array(7).fill(null));
    
    // Row 0 layout:
    // Col 0: Stock [S:card1,card2...]
    // Col 1: Waste [W:card1,card2...]
    // Col 2: Spacer [#]
    // Col 3: Foundation H [F:H]
    // Col 4: Foundation D [F:D]
    // Col 5: Foundation S [F:S]
    // Col 6: Foundation C [F:C]
    board[0][2] = '#';
    board[0][3] = 'F:H';
    board[0][4] = 'F:D';
    board[0][5] = 'F:S';
    board[0][6] = 'F:C';

    // Row 1: Spacer row
    for (let c = 0; c < 7; c++) {
      board[1][c] = '#';
    }

    // Generate deck
    const suits = ['H', 'D', 'S', 'C'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: string[] = [];
    for (const suit of suits) {
      for (const val of values) {
        deck.push(`${suit}${val}`);
      }
    }

    // Shuffle deck
    this.shuffle(deck);

    // Deal to Tableaus (Columns 0 to 6, Rows 2 onwards)
    // Col c gets c face-down cards and 1 face-up card on top
    let deckIndex = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row < col; row++) {
        board[2 + row][col] = deck[deckIndex++] + 'd'; // face down
      }
      board[2 + col][col] = deck[deckIndex++] + 'u'; // face up
    }

    // Remaining 24 cards go to Stock pile
    const stockCards: string[] = [];
    while (deckIndex < deck.length) {
      stockCards.push(deck[deckIndex++] + 'd');
    }
    board[0][0] = 'S:' + stockCards.join(',');
    board[0][1] = 'W:'; // Empty waste pile

    return board;
  }

  public isValidMove(
    board: (string | null)[][],
    x: number,
    y: number,
    _currentPlayer: number,
    _moves: GameState['moves'],
    sourceX?: number,
    sourceY?: number
  ): boolean {
    // 1. Stock click is always valid (draws card / recycles)
    if (x === 0 && y === 0) return true;

    // If no source is selected, we are selecting a card
    if (sourceX === undefined || sourceY === undefined) {
      const cell = board[x][y];
      if (!cell) return false;

      // Can select face-up cards in waste pile or tableau
      if (x === 0 && y === 1) {
        // Waste pile: can select if it has cards
        return cell.startsWith('W:') && cell.length > 2;
      }
      // Tableau selection: must be face-up (ends with 'u')
      if (x >= 2) {
        return cell.endsWith('u');
      }
      return false;
    }

    // 2. We are moving a card from source (sourceX, sourceY) to target (x, y)
    const sourceCell = board[sourceX][sourceY];
    if (!sourceCell) return false;

    // Get the card info being moved
    const movingCards = this.getMovingCards(board, sourceX, sourceY);
    if (movingCards.length === 0) return false;
    const baseCard = movingCards[0]; // The bottom-most card in the moving stack

    // Case A: Moving to Foundation pile (Row 0, Col 3 to 6)
    if (x === 0 && y >= 3 && y <= 6) {
      // Foundations can only receive 1 card at a time
      if (movingCards.length > 1) return false;

      const fCell = board[x][y]!; // e.g. "F:H" or "F:H:A"
      const parts = fCell.split(':');
      const expectedSuit = parts[1]; // 'H', 'D', 'S', or 'C'
      
      const cardSuit = baseCard[0];
      if (cardSuit !== expectedSuit) return false;

      const cardVal = baseCard.substring(1, baseCard.length - 1);
      const currentTopVal = parts[2] || null;

      if (!currentTopVal) {
        // Must be Ace to start foundation
        return cardVal === 'A';
      } else {
        // Must be exactly 1 rank higher
        return this.getCardRank(cardVal) === this.getCardRank(currentTopVal) + 1;
      }
    }

    // Case B: Moving to Tableau columns (Rows 2-15, Col 0-6)
    if (x >= 2) {
      const targetCol = y;
      
      // Get the current top card of the target column
      const targetTopRow = this.getTableauTopRow(board, targetCol);
      
      if (targetTopRow === -1) {
        // Empty tableau column: can only place a King ('K')
        const baseCardVal = baseCard.substring(1, baseCard.length - 1);
        return baseCardVal === 'K';
      } else {
        // Must place on the last card in the column
        if (x !== targetTopRow) return false;

        const targetCard = board[targetTopRow][targetCol]!;
        const targetVal = targetCard.substring(1, targetCard.length - 1);
        const targetSuit = targetCard[0];
        
        const baseCardVal = baseCard.substring(1, baseCard.length - 1);
        const baseCardSuit = baseCard[0];

        // Alternating color check
        const isTargetRed = targetSuit === 'H' || targetSuit === 'D';
        const isBaseRed = baseCardSuit === 'H' || baseCardSuit === 'D';
        if (isTargetRed === isBaseRed) return false;

        // Sequence check: baseCard rank must be exactly 1 lower than targetCard rank
        return this.getCardRank(baseCardVal) === this.getCardRank(targetVal) - 1;
      }
    }

    return false;
  }

  public handleHistory(state: { board: (string | null)[][]; moves: GameState['moves'] }): { board: (string | null)[][]; moves: GameState['moves'] } {
    const board = state.board.map(row => [...row]);
    const lastMove = state.moves[state.moves.length - 1];
    
    // Clear the dummy symbol placed by presenter
    board[lastMove.x][lastMove.y] = state.moves.length > 1 
      ? JSON.parse(JSON.stringify(state.board))[lastMove.x][lastMove.y] // Dummy restore
      : null;

    const { x, y, sourceX, sourceY } = lastMove;

    // 1. Stock pile click (draw or recycle)
    if (x === 0 && y === 0) {
      const stockCell = board[0][0]!;
      const wasteCell = board[0][1]!;
      
      const stockCards = stockCell.substring(2) ? stockCell.substring(2).split(',') : [];
      const wasteCards = wasteCell.substring(2) ? wasteCell.substring(2).split(',') : [];

      if (stockCards.length > 0) {
        // Draw 1 card
        const card = stockCards.pop()!;
        // Flip to face-up
        const faceUpCard = card.substring(0, card.length - 1) + 'u';
        wasteCards.push(faceUpCard);
        
        board[0][0] = 'S:' + stockCards.join(',');
        board[0][1] = 'W:' + wasteCards.join(',');
      } else {
        // Recycle waste back to stock (reverse face-up back to face-down)
        const recycled = wasteCards.map(c => c.substring(0, c.length - 1) + 'd').reverse();
        board[0][0] = 'S:' + recycled.join(',');
        board[0][1] = 'W:';
      }
      return { board, moves: state.moves };
    }

    // 2. Card drag/click movement
    if (sourceX !== undefined && sourceY !== undefined) {
      const movingCards = this.getMovingCards(board, sourceX, sourceY);
      
      // Remove moving cards from source
      if (sourceX === 0 && sourceY === 1) {
        // Moving from waste pile: pop top card
        const wasteCell = board[0][1]!;
        const wasteCards = wasteCell.substring(2).split(',');
        wasteCards.pop();
        board[0][1] = 'W:' + wasteCards.join(',');
      } else {
        // Moving from tableau: clear those rows
        for (let r = sourceX; r < 16; r++) {
          board[r][sourceY] = null;
        }

        // Auto-reveal the card that is now at the top of the source column
        const newTopRow = this.getTableauTopRow(board, sourceY);
        if (newTopRow !== -1) {
          const card = board[newTopRow][sourceY]!;
          if (card.endsWith('d')) {
            board[newTopRow][sourceY] = card.substring(0, card.length - 1) + 'u'; // flip up
          }
        }
      }

      // Add moving cards to target
      if (x === 0 && y >= 3 && y <= 6) {
        // Move to foundation
        const card = movingCards[0];
        const suit = card[0];
        const val = card.substring(1, card.length - 1);
        board[x][y] = `F:${suit}:${val}`;
      } else if (x >= 2) {
        // Move to Tableau column
        const targetCol = y;
        const targetStartRow = board[x][y] === null ? 2 : this.getTableauTopRow(board, targetCol) + 1;
        
        for (let i = 0; i < movingCards.length; i++) {
          board[targetStartRow + i][targetCol] = movingCards[i];
        }
      }
    }

    return { board, moves: state.moves };
  }

  public checkWin(board: (string | null)[][], _symbol: string): boolean {
    // Win if all 4 foundations have King on top
    for (let c = 3; c <= 6; c++) {
      const fCell = board[0][c];
      if (!fCell || !fCell.endsWith(':K')) {
        return false;
      }
    }
    return true;
  }

  public isDraw(_board: (string | null)[][]): boolean {
    return false; // Solitaire has no draws
  }

  private shuffle(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Returns array of cards that will move together starting from row, col
  private getMovingCards(board: (string | null)[][], r: number, c: number): string[] {
    if (r === 0 && c === 1) {
      const wasteCell = board[0][1]!;
      const wasteCards = wasteCell.substring(2).split(',');
      const top = wasteCards[wasteCards.length - 1];
      return top ? [top] : [];
    }
    
    const cards: string[] = [];
    for (let row = r; row < 16; row++) {
      const card = board[row][c];
      if (card) cards.push(card);
    }
    return cards;
  }

  private getTableauTopRow(board: (string | null)[][], col: number): number {
    for (let r = 15; r >= 2; r--) {
      if (board[r][col] !== null) return r;
    }
    return -1;
  }

  private getCardRank(val: string): number {
    if (val === 'A') return 1;
    if (val === 'J') return 11;
    if (val === 'Q') return 12;
    if (val === 'K') return 13;
    return parseInt(val);
  }
}

export const SolitaireGameLogic = new SolitaireModel();
