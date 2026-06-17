export type PlayerType = 'human' | 'ai' | 'random';
export type Theme = 'light' | 'dark';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: number;
  name: string;
  symbol: string;
  type: PlayerType;
  score: number;
  avatar?: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  rules: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'classic' | 'variant' | 'advanced' | 'party';
  boardSize: number;
  rows?: number;
  cols?: number;
  isSinglePlayer?: boolean;
}

export interface GameState {
  board: (string | null)[][];
  currentPlayer: number;
  gameStatus: 'active' | 'won' | 'draw';
  winner: number | null;
  moves: Array<{ x: number; y: number; player: number; sourceX?: number; sourceY?: number }>;
}

export interface LeaderboardEntry {
  gameId: string;
  gameName: string;
  winner: string;
  player1: string;
  player2: string;
  date: string;
  difficulty: Difficulty;
}

export interface GameContextType {
  currentGame: Game | null;
  setCurrentGame: (game: Game | null) => void;
  players: Player[] | null;
  setPlayers: (players: Player[] | null) => void;
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  scores: {
    player1: number;
    player2: number;
    [key: number]: number;
  };
  updateScore: (player: number) => void;
  resetGame: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
  leaderboard: LeaderboardEntry[];
  addLeaderboardEntry: (entry: LeaderboardEntry) => void;
  clearLeaderboard: () => void;
}
