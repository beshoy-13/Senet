import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Game, Player, GameState, GameContextType, Theme, Difficulty, LeaderboardEntry } from '../types';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scores, setScores] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [theme, setTheme] = useState<Theme>('light');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('boardGamesLeaderboard');
      if (saved) setLeaderboard(JSON.parse(saved));
    } catch {}
  }, []);

  const updateScore = (player: number) => {
    setScores((prev) => ({
      ...prev,
      [player]: (prev[player] || 0) + 1,
    }));
  };

  const resetGame = () => {
    setCurrentGame(null);
    setPlayers(null);
    setGameState(null);
  };

  const addLeaderboardEntry = (entry: LeaderboardEntry) => {
    setLeaderboard((prev) => {
      const updated = [entry, ...prev].slice(0, 50);
      try { localStorage.setItem('boardGamesLeaderboard', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const clearLeaderboard = () => {
    setLeaderboard([]);
    try { localStorage.removeItem('boardGamesLeaderboard'); } catch {}
  };

  const contextScores = {
    player1: scores[1] || 0,
    player2: scores[2] || 0,
    ...scores
  };

  return (
    <GameContext.Provider
      value={{
        currentGame,
        setCurrentGame,
        players,
        setPlayers,
        gameState,
        setGameState,
        scores: contextScores,
        updateScore,
        resetGame,
        theme,
        setTheme,
        difficulty,
        setDifficulty,
        leaderboard,
        addLeaderboardEntry,
        clearLeaderboard,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};