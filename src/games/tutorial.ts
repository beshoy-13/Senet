export interface TutorialStep {
  title: string;
  description: string;
  action: string;
}

export interface TutorialData {
  title: string;
  steps: TutorialStep[];
}

const tutorials: Record<string, TutorialData> = {
  xo: {
    title: 'Classic X-O',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play Tic-Tac-Toe (X-O).', action: 'Next' },
      { title: 'The Board', description: 'This is a 3x3 grid. You and your opponent take turns placing marks.', action: 'Next' },
      { title: 'Your Mark', description: 'You are X. Click any empty cell to place your mark.', action: 'Next' },
      { title: 'Goal', description: 'Get 3 of your marks in a row — horizontal, vertical, or diagonal — to win!', action: 'Next' },
      { title: 'Ready!', description: 'You now know how to play. Good luck!', action: 'Start Playing' },
    ],
  },
  connectfour: {
    title: 'Connect Four',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play Connect Four.', action: 'Next' },
      { title: 'Gravity', description: 'Pieces fall to the bottom. Click a column to drop your piece.', action: 'Next' },
      { title: 'Your Mark', description: 'You are X (red). Click any column to drop your piece.', action: 'Next' },
      { title: 'Goal', description: 'Connect 4 of your pieces in a row — horizontal, vertical, or diagonal!', action: 'Next' },
      { title: 'Ready!', description: 'Drop your first piece and have fun!', action: 'Start Playing' },
    ],
  },
  fourbyfour: {
    title: '4x4 Moving Pieces',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play 4x4 with moving pieces.', action: 'Next' },
      { title: 'Select', description: 'First, click one of your pieces to select it (it will highlight).', action: 'Next' },
      { title: 'Move', description: 'Then click an empty adjacent cell to move your piece there.', action: 'Next' },
      { title: 'Goal', description: 'Get 4 of your pieces in a row to win!', action: 'Next' },
      { title: 'Ready!', description: 'Select a piece and start moving!', action: 'Start Playing' },
    ],
  },
  pyramid: {
    title: 'Pyramid Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the Pyramid game.', action: 'Next' },
      { title: 'The Board', description: 'The board is shaped like a pyramid. Not all cells are playable.', action: 'Next' },
      { title: 'Your Mark', description: 'Click any valid (highlighted) cell to place your mark.', action: 'Next' },
      { title: 'Goal', description: 'Get 3 of your marks in a row to win!', action: 'Next' },
      { title: 'Ready!', description: 'Make your first move!', action: 'Start Playing' },
    ],
  },
  diamond: {
    title: 'Diamond Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the Diamond game.', action: 'Next' },
      { title: 'The Board', description: 'The board is shaped like a diamond. Only certain cells are playable.', action: 'Next' },
      { title: 'Your Mark', description: 'Click any valid cell to place your mark.', action: 'Next' },
      { title: 'Goal', description: 'Get 3 of your marks in a row to win!', action: 'Next' },
      { title: 'Ready!', description: 'Place your first mark!', action: 'Start Playing' },
    ],
  },
  fivebyfive: {
    title: '5x5 Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play on a 5x5 grid.', action: 'Next' },
      { title: 'The Board', description: 'This is a larger 5x5 grid for more strategic gameplay.', action: 'Next' },
      { title: 'Your Mark', description: 'Click any empty cell to place your mark.', action: 'Next' },
      { title: 'Goal', description: 'Get 4 of your marks in a row to win!', action: 'Next' },
      { title: 'Ready!', description: 'Start playing on the bigger board!', action: 'Start Playing' },
    ],
  },
  misere: {
    title: 'Misere X-O',
    steps: [
      { title: 'Welcome!', description: 'Learn Misere Tic-Tac-Toe — a twist on the classic!', action: 'Next' },
      { title: 'The Twist', description: 'In Misere, the player who gets 3 in a row LOSES!', action: 'Next' },
      { title: 'Strategy', description: 'Avoid making 3 in a row while forcing your opponent to do so.', action: 'Next' },
      { title: 'Goal', description: 'Make your opponent complete a line of 3!', action: 'Next' },
      { title: 'Ready!', description: 'Think carefully — this is backwards!', action: 'Start Playing' },
    ],
  },
  sus: {
    title: 'SUS Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the SUS game.', action: 'Next' },
      { title: 'The Board', description: 'A 3x3 grid where players place S or U marks.', action: 'Next' },
      { title: 'Your Mark', description: 'Player 1 places S, Player 2 places U. Click to place.', action: 'Next' },
      { title: 'Goal', description: 'Complete a winning pattern to win!', action: 'Next' },
      { title: 'Ready!', description: 'Place your mark!', action: 'Start Playing' },
    ],
  },
  word: {
    title: 'Word Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the Word game.', action: 'Next' },
      { title: 'Pick a Letter', description: 'Choose any letter to place on the board.', action: 'Next' },
      { title: 'Place It', description: 'Click an empty cell to place your chosen letter.', action: 'Next' },
      { title: 'Goal', description: 'Complete a winning pattern with your letters!', action: 'Next' },
      { title: 'Ready!', description: 'Pick a letter and start!', action: 'Start Playing' },
    ],
  },
  numerical: {
    title: 'Numerical Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the Numerical game.', action: 'Next' },
      { title: 'Pick a Number', description: 'Choose a number from the available options above the board.', action: 'Next' },
      { title: 'Place It', description: 'Click an empty cell to place your chosen number.', action: 'Next' },
      { title: 'Goal', description: 'Complete a winning pattern with your numbers!', action: 'Next' },
      { title: 'Ready!', description: 'Pick a number and start!', action: 'Start Playing' },
    ],
  },
  obstacles: {
    title: 'Obstacles Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play with obstacles!', action: 'Next' },
      { title: 'The Twist', description: 'After every 2 moves, new obstacles (#) appear on the board.', action: 'Next' },
      { title: 'Your Mark', description: 'Click any empty cell to place your mark. Avoid obstacles!', action: 'Next' },
      { title: 'Goal', description: 'Get 3 in a row before the board fills up!', action: 'Next' },
      { title: 'Ready!', description: 'Place your first mark!', action: 'Start Playing' },
    ],
  },
  memory: {
    title: 'Memory Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play the Memory game.', action: 'Next' },
      { title: 'How It Works', description: 'Pairs of symbols are hidden. Flip two cells at a time to find matches.', action: 'Next' },
      { title: 'Your Turn', description: 'Click a cell to reveal it. Click another to try to find its pair.', action: 'Next' },
      { title: 'Goal', description: 'Find all matching pairs to win!', action: 'Next' },
      { title: 'Ready!', description: 'Flip your first card!', action: 'Start Playing' },
    ],
  },
  infinity: {
    title: 'Infinity Game',
    steps: [
      { title: 'Welcome!', description: 'Learn how to play Infinity Tic-Tac-Toe!', action: 'Next' },
      { title: 'The Twist', description: 'Your oldest mark disappears after each move. The board never fills up!', action: 'Next' },
      { title: 'Your Mark', description: 'Click any empty cell to place your mark. Watch your oldest one vanish.', action: 'Next' },
      { title: 'Goal', description: 'Get 3 in a row while managing your limited marks!', action: 'Next' },
      { title: 'Ready!', description: 'Place your first mark!', action: 'Start Playing' },
    ],
  },
  ultimate: {
    title: 'Ultimate Tic-Tac-Toe',
    steps: [
      { title: 'Welcome!', description: 'Learn Ultimate Tic-Tac-Toe — a game within a game!', action: 'Next' },
      { title: 'The Board', description: '9 small 3x3 boards arranged in a 3x3 grid. Win a small board to claim it.', action: 'Next' },
      { title: 'Your Move', description: 'Click any cell in the active small board. Your move determines where your opponent plays next.', action: 'Next' },
      { title: 'Goal', description: 'Win 3 small boards in a row to win the ultimate game!', action: 'Next' },
      { title: 'Ready!', description: 'Think strategically — every move matters!', action: 'Start Playing' },
    ],
  },
  minesweeper: {
    title: 'DATA_CLEANER (Minesweeper)',
    steps: [
      { title: 'Welcome, Agent!', description: 'Welcome to the system decryption node. Learn how to clean malware clusters.', action: 'Next' },
      { title: 'Scan Mode', description: 'In SCAN mode, click hidden cells to decrypt them. They will reveal numbers of adjacent malware nodes.', action: 'Next' },
      { title: 'Isolate Mode', description: 'If you suspect a cell contains malware, toggle ISOLATE mode and click it to place a warning FLAG.', action: 'Next' },
      { title: 'Avoid Explosions', description: 'Do not click a malware cell in Scan mode! Doing so will compromise the system and trigger an immediate loss.', action: 'Next' },
      { title: 'Clear Sector', description: 'Decrypt all safe sectors to fully clean the node and secure your victory!', action: 'Start Decrypting' },
    ],
  },
  2048: {
    title: 'NEON OVERLOAD (2048)',
    steps: [
      { title: 'System Diagnostics', description: 'Learn how to compress memory data in NEON_OVERLOAD_2048.', action: 'Next' },
      { title: 'Slide Command', description: 'Slide the data packets UP, DOWN, LEFT, or RIGHT using the on-screen panel or arrow keys/WASD.', action: 'Next' },
      { title: 'Data Merging', description: 'When two packets with identical memory values collide, they merge to form a single double-capacity packet.', action: 'Next' },
      { title: 'System Growth', description: 'A new 2 or 4 data packet spawns in an empty sector after every slide.', action: 'Next' },
      { title: 'Main Core Goal', description: 'Merge packets until you reach the legendary 2048 core block without running out of sliding space!', action: 'Boot Memory' },
    ],
  },
  solitaire: {
    title: 'STACK PROTOCOLS (Solitaire)',
    steps: [
      { title: 'Sort Stream', description: 'Learn how to re-order the system data stacks in Solitaire.', action: 'Next' },
      { title: 'Stock & Waste', description: 'Click the top-left [DECK] to draw a card to [WST]. Click it again to recycle when empty.', action: 'Next' },
      { title: 'Tableau Columns', description: 'Click a face-up card and click another column to stack cards in descending values with alternating colors.', action: 'Next' },
      { title: 'Foundation Stacks', description: 'Build foundations top-right (♥, ♦, ♠, ♣) in ascending order starting with Ace (A) up to King (K).', action: 'Next' },
      { title: 'Decrypt Stream', description: 'Reorganize all 52 cards into the 4 foundations to successfully complete sorting.', action: 'Start Sorting' },
    ],
  },
  snakesladders: {
    title: 'SNAKES & LADDERS',
    steps: [
      { title: 'Lobby Protocol', description: 'Select between 2 and 4 players. Enter names, and prepare for the neural race!', action: 'Next' },
      { title: 'Roll Mechanism', description: 'Click the "ROLL DIE" button to roll a standard 1-6 virtual die for your active turn.', action: 'Next' },
      { title: 'Grid Movement', description: 'Your piece will navigate cells 1 to 100 in a zig-zag (Boustrophedon) path.', action: 'Next' },
      { title: 'Snake and Ladders', description: 'Landing on a LADDER climbs you up to advance. Landing on a SNAKE slides you down.', action: 'Next' },
      { title: 'Winning Node', description: 'First player to reach cell 100 wins! You must land EXACTLY on 100 or you bounce back.', action: 'Start Simulation' },
    ],
  },
};

export const TutorialManager = {
  hasCompleted(gameId: string): boolean {
    try {
      return localStorage.getItem(`tutorial_${gameId}`) === 'completed';
    } catch {
      return false;
    }
  },

  markCompleted(gameId: string): void {
    try {
      localStorage.setItem(`tutorial_${gameId}`, 'completed');
    } catch {}
  },

  getTutorial(gameId: string): TutorialData | null {
    return tutorials[gameId] || null;
  },

  getAllGameIds(): string[] {
    return Object.keys(tutorials);
  },
};
