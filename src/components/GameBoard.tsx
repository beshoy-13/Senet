import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getGameLogic } from '../games/logic';
import { AudioManager } from '../games/audio';
import { TutorialManager } from '../games/tutorial';
import Tutorial from './Tutorial';
import { GamePresenter } from '../architecture/presenters/GamePresenter';
import { HumanPlayer } from '../architecture/players/HumanPlayer';
import { OnlinePlayer } from '../architecture/players/OnlinePlayer';
import { IGameView } from '../architecture/interfaces/IGameView';

const CHESS_PIECE_UNICODE: Record<string, string> = {
  wp: '♙', wr: '♖', wn: '♘', wb: '♗', wq: '♕', wk: '♔',
  bp: '♟', br: '♜', bn: '♞', bb: '♝', bq: '♛', bk: '♚'
};

// Styled chess piece renderer — white = cyan, black = magenta, matching site palette
const ChessPiece: React.FC<{ code: string }> = ({ code }) => {
  const isWhite = code.startsWith('w');
  const unicode = CHESS_PIECE_UNICODE[code] || code;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '1.6em',
      lineHeight: 1,
      color: isWhite ? '#00e5ff' : '#d946ef',
      filter: isWhite
        ? 'drop-shadow(0 0 6px rgba(0,229,255,0.8)) drop-shadow(0 0 12px rgba(0,229,255,0.4))'
        : 'drop-shadow(0 0 6px rgba(217,70,239,0.8)) drop-shadow(0 0 12px rgba(217,70,239,0.4))',
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      {unicode}
    </span>
  );
};

const DIE_UNICODE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

const GameBoard: React.FC = () => {
  const { currentGame, players, gameState, setGameState, scores, updateScore, resetGame, theme, difficulty, addLeaderboardEntry } = useGame();
  const { refreshProfile, recordMatch } = useAuth();
  const { activeRoom, isMyTurn, sendMove } = useSocket();
  const isOnlineGame = !!activeRoom;
  const [forfeitNotice, setForfeitNotice] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ x: number; y: number } | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<{ x: number; y: number } | null>(null);
  const [wordLetter, setWordLetter] = useState('A');
  const [numValue, setNumValue] = useState<number | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialData, setTutorialData] = useState<{ title: string; steps: { title: string; description: string; action: string }[] } | null>(null);
  const [minesweeperMode, setMinesweeperMode] = useState<'reveal' | 'flag'>('reveal');
  const [gameResultToast, setGameResultToast] = useState<{ result: 'win' | 'draw' | 'loss' | 'solved'; winner?: string; xp: number; duration: string } | null>(null);
  const gameStartTimeRef = useRef<number>(Date.now());

  const logic = currentGame ? getGameLogic(currentGame.id) : null;
  const presenterRef = useRef<GamePresenter | null>(null);

  // Keyboard controls listener for Sudoku / 2048 inputs
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'active') return;

    if (currentGame?.id === 'sudoku' && selectedPiece) {
      const handleSudokuKey = (e: KeyboardEvent) => {
        const key = e.key;
        if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
          presenterRef.current?.onCellClicked(selectedPiece.x, selectedPiece.y, key);
        } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
          presenterRef.current?.onCellClicked(selectedPiece.x, selectedPiece.y, null as any);
        }
      };
      window.addEventListener('keydown', handleSudokuKey);
      return () => window.removeEventListener('keydown', handleSudokuKey);
    }

    if (currentGame?.id === '2048') {
      const handle2048Key = (e: KeyboardEvent) => {
        let dir: string | null = null;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'UP';
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'DOWN';
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dir = 'LEFT';
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dir = 'RIGHT';

        if (dir && presenterRef.current) {
          e.preventDefault();
          presenterRef.current.onCellClicked(0, 0, dir);
        }
      };
      window.addEventListener('keydown', handle2048Key);
      return () => window.removeEventListener('keydown', handle2048Key);
    }
  }, [currentGame?.id, selectedPiece, gameState?.gameStatus]);

  const formatSolitaireCard = (cardStr: string): string => {
    if (!cardStr || cardStr.length < 2) return '';
    const suit = cardStr[0];
    const val = cardStr.substring(1, cardStr.length - 1);
    const suitSymbol = suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'S' ? '♠' : '♣';
    return `${suitSymbol}${val}`;
  };

  // Convert Snakes & Ladders cell number (1-100) to grid coordinates (row, col)
  const cellToCoordsSnakes = (cellNum: number): { r: number; c: number } => {
    const bottomRow = Math.floor((cellNum - 1) / 10);
    const r = 9 - bottomRow;
    const c = bottomRow % 2 === 0 
      ? (cellNum - 1) % 10 
      : 9 - ((cellNum - 1) % 10);
    return { r, c };
  };

  const getCellCenterPct = (cellNum: number) => {
    const { r, c } = cellToCoordsSnakes(cellNum);
    return {
      x: (c + 0.5) * 10,
      y: (r + 0.5) * 10
    };
  };

  const coordsToCellSnakes = (r: number, c: number): number => {
    const bottomRow = 9 - r;
    const isEvenRow = bottomRow % 2 === 0;
    return isEvenRow
      ? bottomRow * 10 + c + 1
      : bottomRow * 10 + (9 - c) + 1;
  };

  const getPlayerPositions = () => {
    const positions: Record<number, number> = {};
    if (!players || !gameState || !gameState.board) return positions;
    
    players.forEach(p => {
      positions[p.id] = 1;
    });
    
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const val = gameState.board[r][c];
        if (val) {
          const occupants = val.split(',');
          occupants.forEach(occ => {
            if (occ.startsWith('P')) {
              const pid = parseInt(occ.replace('P', ''));
              if (!isNaN(pid)) {
                positions[pid] = coordsToCellSnakes(r, c);
              }
            }
          });
        }
      }
    }
    return positions;
  };

  const boardCellStyle = (x: number, y: number, isSelected: boolean, cell: string | null): React.CSSProperties => {
    const isThemeLight = theme === 'light';

    if (currentGame?.id === 'snakesladders') {
      const cellNum = coordsToCellSnakes(x, y);
      const isEvenCell = cellNum % 2 === 0;
      return {
        backgroundColor: isEvenCell 
          ? (isThemeLight ? '#f1f5f9' : '#0e111a') 
          : (isThemeLight ? '#e2e8f0' : '#141926'),
        borderColor: isThemeLight ? '#cbd5e1' : '#1e2538',
        borderWidth: '1px',
        position: 'relative',
        cursor: 'default',
      };
    }

    if (currentGame?.id === 'chess') {
      const isLight = (x + y) % 2 === 0;

      const lastMoveObj = gameState?.moves && gameState.moves.length > 0 
        ? gameState.moves[gameState.moves.length - 1] 
        : null;
      const isLastMoveSource = lastMoveObj && lastMoveObj.sourceX === x && lastMoveObj.sourceY === y;
      const isLastMoveTarget = lastMoveObj && lastMoveObj.x === x && lastMoveObj.y === y;

      // Selected piece — cyan highlight
      if (isSelected) {
        return {
          backgroundColor: '#0e2a3a',
          borderColor: '#00e5ff',
          borderWidth: '3px',
          boxShadow: 'inset 0 0 12px rgba(0,229,255,0.35)',
        };
      }

      // Legal move target — purple tint
      const isLegalTarget = selectedPiece && logic && gameState && logic.isValidMove(
        gameState.board,
        x,
        y,
        gameState.currentPlayer,
        gameState.moves,
        selectedPiece.x,
        selectedPiece.y
      );

      if (isLegalTarget) {
        return {
          backgroundColor: isLight ? '#1a0a2e' : '#150827',
          borderColor: '#c850f0',
          borderWidth: '2px',
          boxShadow: 'inset 0 0 10px rgba(200,80,240,0.3)',
          cursor: 'pointer',
        };
      }

      // Last move highlight — amber/orange
      if (isLastMoveSource) {
        return {
          backgroundColor: '#1a1200',
          borderColor: '#f59e0b',
          borderWidth: '2px',
          boxShadow: 'inset 0 0 8px rgba(245,158,11,0.2)',
        };
      }

      if (isLastMoveTarget) {
        return {
          backgroundColor: '#1f1500',
          borderColor: '#fbbf24',
          borderWidth: '2px',
          boxShadow: 'inset 0 0 10px rgba(251,191,36,0.25)',
        };
      }

      // Default light/dark squares — navy palette
      return {
        backgroundColor: isLight ? '#0d1117' : '#111827',
        borderColor: isLight ? '#1e2d3d' : '#0a0e18',
        borderWidth: '1px',
      };
    }

    if (currentGame?.id === 'sudoku') {
      const conflicts = (logic as any).getConflicts?.(gameState?.board || []) || [];
      const isConflict = conflicts.some((c: any) => c.x === x && c.y === y);
      const isClue = cell && cell.startsWith('c');

      if (isConflict) {
        return {
          backgroundColor: '#ef4444',
          borderColor: '#000000',
          borderWidth: '2px',
          color: '#000000',
        };
      }

      if (isSelected) {
        return {
          backgroundColor: isThemeLight ? '#fed7aa' : '#1e1b4b',
          borderColor: '#00f0ff',
          borderWidth: '3px',
          color: isThemeLight ? '#000000' : '#fbbf24',
        };
      }

      return {
        backgroundColor: isClue 
          ? (isThemeLight ? '#d1d5db' : '#1f2937') 
          : (isThemeLight ? '#ffffff' : '#0f172a'),
        borderColor: '#000000',
        borderWidth: '1px',
        color: isClue 
          ? (isThemeLight ? '#000000' : '#ffffff') 
          : (isThemeLight ? '#000000' : '#fbbf24'),
      };
    }

    if (currentGame?.id === 'minesweeper') {
      if (cell === 'M') {
        return {
          backgroundColor: '#ef4444',
          borderColor: '#000000',
          borderWidth: '2px',
          color: '#000000',
          fontSize: '14px',
        };
      }
      if (cell === 'F') {
        return {
          backgroundColor: '#fbbf24',
          borderColor: '#000000',
          borderWidth: '2px',
          color: '#000000',
          fontSize: '14px',
        };
      }
      if (cell !== null) {
        const colors = ['#6b7280', '#00f0ff', '#10b981', '#ef4444', '#d946ef', '#fbbf24', '#3b82f6', '#ec4899', '#8b5cf6'];
        const val = parseInt(cell);
        return {
          backgroundColor: isThemeLight ? '#ffffff' : '#0f172a',
          borderColor: '#000000',
          borderWidth: '1px',
          color: colors[val] || 'var(--card-text)',
        };
      }
      return {
        backgroundColor: isThemeLight ? '#d1d5db' : '#1f2937',
        borderColor: '#000000',
        borderWidth: '1px',
        cursor: 'pointer',
      };
    }

    if (currentGame?.id === '2048') {
      if (cell === null) {
        return {
          backgroundColor: isThemeLight ? '#e5e7eb' : '#111827',
          borderColor: '#000000',
          borderWidth: '2px',
        };
      }
      
      const colorsMap: Record<string, { bg: string; fg: string }> = {
        '2': { bg: '#e2e8f0', fg: '#000000' },
        '4': { bg: '#cbd5e1', fg: '#000000' },
        '8': { bg: '#fbbf24', fg: '#000000' },
        '16': { bg: '#f97316', fg: '#ffffff' },
        '32': { bg: '#ef4444', fg: '#ffffff' },
        '64': { bg: '#dc2626', fg: '#ffffff' },
        '128': { bg: '#f472b6', fg: '#000000' },
        '256': { bg: '#d946ef', fg: '#000000' },
        '512': { bg: '#a21caf', fg: '#ffffff' },
        '1024': { bg: '#22d3ee', fg: '#000000' },
        '2048': { bg: '#00f0ff', fg: '#000000' },
      };
      
      if (!isThemeLight) {
        colorsMap['2'] = { bg: '#1e293b', fg: '#00f0ff' };
        colorsMap['4'] = { bg: '#0f172a', fg: '#10b981' };
      }

      const style = colorsMap[cell] || { bg: '#7c3aed', fg: '#ffffff' };
      return {
        backgroundColor: style.bg,
        color: style.fg,
        borderColor: '#000000',
        borderWidth: '3px',
        fontWeight: 'bold',
      };
    }

    if (currentGame?.id === 'solitaire') {
      if (cell === '#') {
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: '0px',
          pointerEvents: 'none',
        };
      }
      
      const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;

      if (x === 0) {
        if (y === 0) {
          return {
            backgroundColor: isThemeLight ? '#e2e8f0' : '#1e293b',
            color: 'var(--card-text)',
            fontSize: '10px',
            borderColor: '#000000',
            borderWidth: '2px',
            fontFamily: 'monospace',
          };
        }
        if (y === 1) {
          const cards = cell ? (cell.substring(2) ? cell.substring(2).split(',') : []) : [];
          const top = cards[cards.length - 1];
          const isRed = top ? (top[0] === 'H' || top[0] === 'D') : false;
          return {
            backgroundColor: isSelected ? 'var(--neon-pink)' : (isThemeLight ? '#ffffff' : '#0f172a'),
            color: isSelected ? '#000000' : (isRed ? '#ef4444' : 'var(--card-text)'),
            fontSize: '12px',
            borderColor: '#000000',
            borderWidth: '2px',
          };
        }
        const parts = cell ? cell.split(':') : [];
        const suit = parts[1] || '';
        const isRed = suit === 'H' || suit === 'D';
        return {
          backgroundColor: isThemeLight ? '#ffffff' : '#12151e',
          color: isRed ? '#ef4444' : 'var(--card-text)',
          fontSize: '14px',
          borderColor: '#000000',
          borderWidth: '2px',
        };
      }

      if (cell) {
        if (cell.endsWith('d')) {
          return {
            backgroundColor: isThemeLight ? '#cbd5e1' : '#1e293b',
            color: '#64748b',
            fontSize: '10px',
            borderColor: '#000000',
            borderWidth: '2px',
            fontFamily: 'monospace',
          };
        } else {
          const suit = cell[0];
          const isRed = suit === 'H' || suit === 'D';
          return {
            backgroundColor: isSelected ? 'var(--neon-pink)' : (isThemeLight ? '#ffffff' : '#0f172a'),
            color: isSelected ? '#000000' : (isRed ? '#ef4444' : 'var(--card-text)'),
            fontSize: '13px',
            borderColor: '#000000',
            borderWidth: '2px',
          };
        }
      }

      if (x === 2 && cell === null) {
        return {
          backgroundColor: isThemeLight ? '#f3f4f6' : '#131722',
          color: '#64748b',
          fontSize: '12px',
          borderColor: '#64748b',
          borderStyle: 'dashed',
          borderWidth: '2px',
          cursor: 'pointer',
        };
      }

      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: '0px',
        pointerEvents: 'none',
      };
    }

    // Default cell rendering
    if (isSelected) {
      return { 
        backgroundColor: 'var(--neon-pink)', 
        color: '#000000',
        borderColor: '#000000',
        borderWidth: '3px',
      };
    }
    if (cell === null) {
      return { 
        backgroundColor: 'var(--input-bg)', 
        borderColor: '#000000' 
      };
    }
    if (cell === '#') {
      return { 
        backgroundColor: 'var(--sidebar-bg)', 
        borderColor: '#000000',
        color: '#9ca3af',
        cursor: 'not-allowed' 
      };
    }
    return { 
      backgroundColor: 'var(--bg-gradient)', 
      borderColor: '#000000',
      color: cell === 'X' ? '#00f0ff' : '#d946ef',
    };
  };

  useEffect(() => {
    if (!gameState && currentGame && logic) {
      const initialBoard = logic.getInitialBoard(currentGame.boardSize);
      setGameState({
        board: initialBoard,
        currentPlayer: 1,
        gameStatus: 'active',
        winner: null,
        moves: [],
      });
      gameStartTimeRef.current = Date.now();
    }
  }, [currentGame, gameState, setGameState, logic]);

  // Push entry into leaderboard context on game win/draw
  useEffect(() => {
    if (!gameState || gameState.gameStatus === 'active' || !players || !currentGame) return;
    addLeaderboardEntry({
      gameId: currentGame.id,
      gameName: currentGame.name,
      winner: gameState.gameStatus === 'won'
        ? players[(gameState.winner as number) - 1]?.name || 'Unknown'
        : 'Draw',
      player1: players[0].name,
      player2: players[1]?.name || 'SOLO_ENGINE',
      date: new Date().toLocaleDateString(),
      difficulty,
    });

    // Calculate duration in seconds
    const elapsedMs = Date.now() - gameStartTimeRef.current;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const duration = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Determine result and opponent
    let result: 'win' | 'loss' | 'draw' = 'draw';
    let winner: string | undefined;
    let xpEarned = 50;

    // Check if any player is AI (covers chess vs AI, snakes vs AI, etc.)
    const hasAI = players.some(p => p.type === 'ai' || p.type === 'random');
    const isTrulySolo = currentGame.isSinglePlayer; // puzzle games: sudoku, 2048, etc.

    if (gameState.gameStatus === 'won') {
      const winnerIdx = (gameState.winner as number) - 1; // winner is player id (1 or 2)
      const winnerPlayer = players[winnerIdx];
      winner = winnerPlayer?.name;

      if (isTrulySolo) {
        // Solo puzzle — player always wins (there's no opponent)
        result = 'win';
        xpEarned = 100;
      } else if (winnerPlayer?.type === 'human') {
        // Human beat AI or another human
        result = 'win';
        xpEarned = hasAI ? 150 : 120;
      } else {
        // AI won — human lost
        result = 'loss';
        xpEarned = 30;
      }
    }

    const opponent = isTrulySolo
      ? 'AI'
      : (players.find(p => p.type === 'ai' || p.type === 'random')?.name || players[1]?.name || 'AI');

    // Record match — updates history + stats optimistically, then syncs with backend
    recordMatch({
      gameType: currentGame.id,
      opponent,
      result,
      xpEarned,
      duration: elapsedSec,
    });

    // Show toast — use 'solved' for pure puzzle games (no opponent)
    const toastResult = isTrulySolo && result === 'win' ? 'solved' : result;
    setGameResultToast({ result: toastResult, winner, xp: xpEarned, duration });
  }, [gameState?.gameStatus]);

  useEffect(() => {
    if (!currentGame || !gameState) return;
    const data = TutorialManager.getTutorial(currentGame.id);
    if (data && !TutorialManager.hasCompleted(currentGame.id)) {
      setTutorialData(data);
      setShowTutorial(true);
    }
  }, [currentGame?.id]);

  // Detect online forfeit — opponent disconnected
  useEffect(() => {
    if (activeRoom?.status === 'finished' && isOnlineGame) {
      setForfeitNotice(`OPPONENT FORFEITED — YOU WIN!`);
      AudioManager.playWin();
    }
  }, [activeRoom?.status]);


  const handleTutorialComplete = () => {
    if (currentGame) TutorialManager.markCompleted(currentGame.id);
    setShowTutorial(false);
    setTutorialData(null);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
    setTutorialData(null);
  };

  // --- MVP Presenter Integration ---
  useEffect(() => {
    if (!currentGame || !logic || !players || players.length < 1) return;

    const view: IGameView = {
      updateBoard: () => {},
      updateGameState: (state) => {
        if (state.moves && state.moves.length > 0) {
          const lastM = state.moves[state.moves.length - 1];
          setLastMove({ x: lastM.x, y: lastM.y });
        }
        
        if (state.gameStatus === 'won' && state.winner) {
          updateScore(state.winner);
          AudioManager.playWin();
        } else if (state.gameStatus === 'draw') {
          AudioManager.playDraw();
        } else if (state.moves.length > 0) {
          if (currentGame.id === 'snakesladders') {
            AudioManager.playDiceRoll();
          } else {
            AudioManager.playMove();
          }
        }

        setGameState(state);
      },
      showWinner: () => {},
      showDraw: () => {},
      setThinkingState: (isThinking) => setIsAIThinking(isThinking),
      onInvalidMove: () => AudioManager.playError()
    };

    const playerStrategies = players.map(p => 
      p.type === 'human' 
        ? new HumanPlayer(p.id, p.name, p.symbol, p.avatar)
        : new OnlinePlayer(p.id, p.name, p.symbol, p.avatar)
    );

    presenterRef.current = new GamePresenter(
      currentGame.id, 
      logic as any, 
      view, 
      playerStrategies, 
      difficulty, 
      currentGame.boardSize
    );

    if (!gameState) {
      presenterRef.current.startGame();
    }

    return () => {
      presenterRef.current?.cleanup();
    };
  }, [currentGame?.id, players]);

  if (!gameState || !players || !currentGame || !logic) return null;

  const handleMove = (x: number, y: number) => {
    if (!presenterRef.current || gameState.gameStatus !== 'active') return;
    // In online games, block moves when it's not your turn
    if (isOnlineGame && !isMyTurn) return;

    let symbol = undefined;
    let sourceX = undefined;
    let sourceY = undefined;

    if (currentGame.id === 'word') {
      symbol = wordLetter;
    } else if (currentGame.id === 'numerical') {
      if (numValue === null) return;
      symbol = numValue.toString();
    } else if (currentGame.id === 'sus') {
      symbol = gameState.currentPlayer === 1 ? 'S' : 'U';
    } else if (currentGame.id === 'minesweeper') {
      symbol = minesweeperMode === 'reveal' ? 'R' : 'F';
    } else if (currentGame.id === 'solitaire') {
      if (!selectedPiece) {
        const cellVal = gameState.board[x][y];
        if (cellVal) {
          if (x === 0 && y === 0) {
            presenterRef.current.onCellClicked(x, y);
            return;
          }
          if (y === 1 && x === 0 && cellVal.length <= 2) {
            return;
          }
          if (x >= 2 && cellVal.endsWith('d')) {
            return;
          }
          setSelectedPiece({ x, y });
        }
        return;
      } else {
        sourceX = selectedPiece.x;
        sourceY = selectedPiece.y;
        setSelectedPiece(null);
      }
    } else if (currentGame.id === 'fourbyfour') {
      if (!selectedPiece) {
        const p = players[gameState.currentPlayer - 1];
        if (gameState.board[x][y] === p.symbol) {
          setSelectedPiece({ x, y });
        }
        return;
      } else {
        sourceX = selectedPiece.x;
        sourceY = selectedPiece.y;
        setSelectedPiece(null);
      }
    } else if (currentGame.id === 'chess') {
      if (!selectedPiece) {
        const piece = gameState.board[x][y];
        if (piece) {
          const color = piece[0];
          const expectedColor = gameState.currentPlayer === 1 ? 'w' : 'b';
          if (color === expectedColor) {
            setSelectedPiece({ x, y });
          }
        }
        return;
      } else {
        const piece = gameState.board[x][y];
        if (piece) {
          const color = piece[0];
          const expectedColor = gameState.currentPlayer === 1 ? 'w' : 'b';
          if (color === expectedColor) {
            setSelectedPiece({ x, y });
            return;
          }
        }
        sourceX = selectedPiece.x;
        sourceY = selectedPiece.y;
        setSelectedPiece(null);
      }
    } else if (currentGame.id === 'sudoku') {
      const cell = gameState.board[x][y];
      if (cell && cell.startsWith('c')) return;
      setSelectedPiece({ x, y });
      return;
    }

    presenterRef.current.onCellClicked(x, y, symbol, sourceX, sourceY);
    setNumValue(null);
    // Sync move to online opponents
    if (isOnlineGame && gameState) {
      const newState = presenterRef.current ? (presenterRef.current as any).getGameState?.() : gameState;
      const state = newState || gameState;
      sendMove(state.board, state.moves, String(state.currentPlayer), state.gameStatus !== 'active', state.winner ? String(state.winner) : null);
    }
  };

  const handleRollSnakes = () => {
    if (!presenterRef.current || gameState.gameStatus !== 'active') return;
    // In online games, block rolling when it's not your turn
    if (isOnlineGame && !isMyTurn) return;
    // For Snakes & Ladders, click is simulated on cell 0,0
    presenterRef.current.onCellClicked(0, 0);
    // Sync to server
    if (isOnlineGame && gameState) {
      setTimeout(() => {
        if (presenterRef.current) {
          sendMove(gameState.board, gameState.moves, String(gameState.currentPlayer), gameState.gameStatus !== 'active', gameState.winner ? String(gameState.winner) : null);
        }
      }, 600);
    }
  };

  const handleUndo = () => {
    if (presenterRef.current) {
      AudioManager.playClick();
      presenterRef.current.undoMove();
      setSelectedPiece(null);
      setNumValue(null);
    }
  };

  const restartGame = () => {
    if (presenterRef.current) {
      presenterRef.current.resetGame();
      setSelectedPiece(null);
      setNumValue(null);
    }
  };

  const getHeaderStatusText = () => {
    if (currentGame.isSinglePlayer) {
      if (gameState.gameStatus === 'active') return 'PUZZLE_MODE // IN_PROGRESS';
      if (gameState.gameStatus === 'won') {
        if (currentGame.id === 'minesweeper') {
          const hasMineExploded = gameState.board.some(row => row.some(cell => cell === 'M'));
          if (hasMineExploded) return 'SYSTEM COMPROMISED // MALWARE DETECTED';
          return 'SYSTEM DECRYPTED // DECONTAMINATION COMPLETE';
        }
        return 'OPERATIONS COMPLETED: SOLVED';
      }
      return 'STALEMATE';
    } else {
      if (gameState.gameStatus === 'active') {
        const activeName = players[gameState.currentPlayer - 1]?.name || 'Agent';
        return `${activeName.toUpperCase()}'S TURN`;
      }
      if (gameState.gameStatus === 'won') {
        const winnerName = players[(gameState.winner as number) - 1]?.name || 'Agent';
        return `${winnerName.toUpperCase()} WINS!`;
      }
      return 'DUAL DRAW';
    }
  };

  // Get active die roll data for Snakes & Ladders HUD
  const getLastRollData = () => {
    if (currentGame.id !== 'snakesladders' || gameState.moves.length === 0) return null;
    const lastMoveObj = gameState.moves[gameState.moves.length - 1];
    return {
      roll: lastMoveObj.x,
      target: lastMoveObj.y,
      source: lastMoveObj.sourceX,
      player: players[lastMoveObj.player - 1]?.name || 'Agent'
    };
  };

  const lastRoll = getLastRollData();

  return (
    <div className="p-6 md:p-8 text-[var(--card-text)]" role="main" aria-label={`${currentGame.name} game`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Game Title Area */}
        <div className="cyber-panel p-6 text-center mb-10 relative overflow-hidden bg-[var(--card-bg)]">
          <div className="absolute top-0 right-0 bg-[#fbbf24] text-black font-mono px-3 py-0.5 text-xs border-b border-l border-white/10 font-bold uppercase tracking-widest">
            {currentGame.id.toUpperCase()} // PORT
          </div>
          <h1 className="text-2xl md:text-4xl font-black font-display text-[var(--card-text)] uppercase tracking-tight mb-1">
            {currentGame.name}
          </h1>
          <div className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest neon-flicker">
            {getHeaderStatusText()}
          </div>
        </div>

        {/* Online Game Status Banner */}
        {isOnlineGame && (
          <div className="mb-6 cyber-panel p-4 border border-[#d946ef]/30 bg-[#0a0d14] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-[#d946ef] text-black uppercase tracking-widest animate-pulse">
                ● LIVE
              </span>
              <span className="text-[10px] font-mono text-white/60 uppercase">
                Room: {activeRoom?.roomId?.substring(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-[#94a3b8] uppercase">
                vs {activeRoom?.players.find(p => p.userId !== activeRoom?.currentPlayerId)?.username || 'Opponent'}
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-3 py-1 brutal-border ${
              isMyTurn ? 'bg-[#10b981] text-black' : 'bg-[#161a23] text-[#94a3b8]'
            }`}>
              {isMyTurn ? '⚡ YOUR TURN' : '⏳ OPPONENT\'S TURN'}
            </span>
          </div>
        )}

        {/* Forfeit Notice */}
        {forfeitNotice && (
          <div className="mb-6 cyber-panel p-4 border border-[#fbbf24]/30 bg-[#1a1200] text-center">
            <p className="text-sm font-bold font-mono text-[#fbbf24] uppercase tracking-widest">{forfeitNotice}</p>
            <p className="text-[10px] text-[#94a3b8] font-mono mt-1 uppercase">Opponent disconnected</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Board Card */}
          <div className="lg:col-span-2 cyber-panel bg-[var(--card-bg)] p-6 md:p-8 flex flex-col items-center justify-center relative">
            
            {/* Minesweeper Reveal/Flag Toggle */}
            {currentGame.id === 'minesweeper' && gameState.gameStatus === 'active' && (
              <div className="mb-6 brutal-border bg-[var(--sidebar-bg)] p-4 flex gap-4 w-full justify-center">
                <span className="font-mono text-xs font-bold text-[var(--card-text)] self-center uppercase">MODE:</span>
                <button
                  onClick={() => setMinesweeperMode('reveal')}
                  className={`px-4 py-2 font-mono font-bold text-xs brutal-border transition ${
                    minesweeperMode === 'reveal' ? 'bg-[#00f0ff] text-black shadow-brutal-black' : 'bg-[var(--input-bg)] text-[var(--card-text)]'
                  }`}
                >
                  SCAN / REVEAL
                </button>
                <button
                  onClick={() => setMinesweeperMode('flag')}
                  className={`px-4 py-2 font-mono font-bold text-xs brutal-border transition ${
                    minesweeperMode === 'flag' ? 'bg-[#fbbf24] text-black shadow-brutal-black' : 'bg-[var(--input-bg)] text-[var(--card-text)]'
                  }`}
                >
                  ISOLATE (FLAG)
                </button>
              </div>
            )}

            {/* 2048 Controller Panel */}
            {currentGame.id === '2048' && gameState.gameStatus === 'active' && (
              <div className="mb-6 brutal-border bg-[var(--sidebar-bg)] p-4 flex flex-col items-center gap-2 w-full max-w-[260px] mx-auto">
                <div className="text-center font-mono text-[10px] text-[var(--card-desc)] uppercase mb-2">SLIDE CONTROLLER</div>
                <button
                  onClick={() => presenterRef.current?.onCellClicked(0, 0, 'UP')}
                  className="w-14 h-9 font-mono font-bold text-xs brutal-border bg-[#00f0ff] text-black shadow-brutal-black hover:scale-105 transition"
                >
                  UP
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => presenterRef.current?.onCellClicked(0, 0, 'LEFT')}
                    className="w-14 h-9 font-mono font-bold text-xs brutal-border bg-[#fbbf24] text-black shadow-brutal-black hover:scale-105 transition"
                  >
                    LEFT
                  </button>
                  <button
                    onClick={() => presenterRef.current?.onCellClicked(0, 0, 'RIGHT')}
                    className="w-14 h-9 font-mono font-bold text-xs brutal-border bg-[#fbbf24] text-black shadow-brutal-black hover:scale-105 transition"
                  >
                    RIGHT
                  </button>
                </div>
                <button
                  onClick={() => presenterRef.current?.onCellClicked(0, 0, 'DOWN')}
                  className="w-14 h-9 font-mono font-bold text-xs brutal-border bg-[#00f0ff] text-black shadow-brutal-black hover:scale-105 transition"
                >
                  DOWN
                </button>
              </div>
            )}

            {/* Snakes & Ladders Die Roller */}
            {currentGame.id === 'snakesladders' && gameState.gameStatus === 'active' && (
              <div className="mb-6 cyber-panel p-4 bg-black/35 w-full flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">DICE ROLLER PLATFORM</h4>
                  <p className="text-[10px] text-[#94a3b8] uppercase font-mono">Roll die to move active agent piece.</p>
                </div>
                <div className="flex gap-4 items-center">
                  {lastRoll && (
                    <div className="flex items-center gap-2 mr-2">
                      <span className="text-4xl animate-bounce shrink-0">{DIE_UNICODE[lastRoll.roll - 1]}</span>
                      <span className="font-mono text-[10px] text-[#fbbf24] uppercase max-w-[200px] leading-tight">
                        {lastRoll.player} rolled a {lastRoll.roll}! Moved to cell {lastRoll.target}.
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleRollSnakes}
                    className="cyber-btn bg-[#00f0ff] text-black px-6 py-2 text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition"
                  >
                    ROLL DIE
                  </button>
                </div>
              </div>
            )}

            {/* Word Letter Selector */}
            {currentGame.id === 'word' && gameState.gameStatus === 'active' && (
              <div className="mb-6 brutal-border bg-[var(--sidebar-bg)] p-4 flex gap-4 w-full justify-center">
                <span className="font-mono text-xs font-bold text-[var(--card-text)] self-center uppercase">Choose Letter:</span>
                <input
                  type="text"
                  maxLength={1}
                  value={wordLetter}
                  onChange={(e) => setWordLetter(e.target.value.toUpperCase())}
                  className="w-10 h-10 text-center brutal-border bg-[var(--input-bg)] text-[#00f0ff] text-xl font-bold font-mono focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            )}

            {/* Numerical Digit Selector */}
            {currentGame.id === 'numerical' && gameState.gameStatus === 'active' && (
              <div className="mb-6 brutal-border bg-[var(--sidebar-bg)] p-4 w-full">
                <div className="text-center font-mono text-xs font-bold text-[var(--card-text)] mb-2 uppercase">Pick Number:</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(logic as any).getAvailableNumbers(gameState.board, gameState.currentPlayer).map((n: number) => (
                    <button
                      key={n}
                      onClick={() => setNumValue(n)}
                      className={`w-10 h-10 brutal-border font-bold font-mono transition ${
                        numValue === n ? 'bg-[#d946ef] text-black shadow-brutal-black' : 'bg-[var(--input-bg)] text-[var(--card-text)] hover:bg-black/30'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sudoku Digit Selector */}
            {currentGame.id === 'sudoku' && selectedPiece && gameState.gameStatus === 'active' && (
              <div className="mb-6 brutal-border bg-[var(--sidebar-bg)] p-4 w-full max-w-[420px]">
                <div className="text-center font-mono text-xs font-bold text-[var(--card-text)] mb-2 uppercase tracking-wide">
                  INPUT DIGIT [{selectedPiece.x + 1}, {selectedPiece.y + 1}]
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        if (presenterRef.current && selectedPiece) {
                          presenterRef.current.onCellClicked(selectedPiece.x, selectedPiece.y, n);
                        }
                      }}
                      className="w-8 h-8 font-bold font-mono brutal-border bg-[#fbbf24] text-black shadow-brutal-black hover:bg-[#d946ef] transition"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      if (presenterRef.current && selectedPiece) {
                        presenterRef.current.onCellClicked(selectedPiece.x, selectedPiece.y, null as any);
                      }
                    }}
                    className="px-3 h-8 font-bold font-mono brutal-border bg-[#ef4444] text-black shadow-brutal-black hover:bg-red-700 transition uppercase text-[10px]"
                  >
                    CLEAR
                  </button>
                </div>
              </div>
            )}

            {/* Board Grid Container */}
            <div className="w-full relative" style={{ maxWidth: gameState.board[0].length > 7 ? (currentGame.id === 'solitaire' ? '650px' : '550px') : '420px' }}>
              
              {/* SVG Overlay for Snakes & Ladders */}
              {currentGame.id === 'snakesladders' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Glowing Ladders (exactly 6) */}
                  {Object.entries((logic as any).getLadders()).map(([start, end]) => {
                    const from = getCellCenterPct(parseInt(start));
                    const to = getCellCenterPct(end as number);
                    return (
                      <g key={`ladder-${start}`}>
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="ladder-svg-line" />
                        {/* Rungs along the ladder length */}
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const t = (idx + 1) / 6;
                          const rx = from.x + (to.x - from.x) * t;
                          const ry = from.y + (to.y - from.y) * t;
                          const dx = to.x - from.x;
                          const dy = to.y - from.y;
                          const len = Math.sqrt(dx*dx + dy*dy);
                          const nx = -dy / len * 2;
                          const ny = dx / len * 2;
                          return (
                            <line 
                              key={idx}
                              x1={rx - nx} y1={ry - ny} 
                              x2={rx + nx} y2={ry + ny} 
                              className="ladder-svg-rung" 
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                  
                  {/* Glowing Snakes (exactly 6) */}
                  {Object.entries((logic as any).getSnakes()).map(([start, end]) => {
                    const from = getCellCenterPct(parseInt(start));
                    const to = getCellCenterPct(end as number);
                    // Draw curved bezier body
                    const mx = (from.x + to.x) / 2;
                    const my = (from.y + to.y) / 2;
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const len = Math.sqrt(dx*dx + dy*dy);
                    const offsetDist = 6;
                    const px = -dy / len * offsetDist;
                    const py = dx / len * offsetDist;
                    const ctrlX = mx + px;
                    const ctrlY = my + py;
                    const dPath = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
                    return (
                      <g key={`snake-${start}`}>
                        <path d={dPath} className="snake-svg-body" />
                        <circle cx={from.x} cy={from.y} r="2.5" className="snake-svg-head" />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Grid cell renderer */}
              {currentGame.id === 'chess' ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  {/* File labels (a-h) top */}
                  <div style={{ display: 'grid', gridTemplateColumns: '16px repeat(8, minmax(0,1fr))', marginBottom: '2px', paddingLeft: '2px' }}>
                    <div />
                    {['a','b','c','d','e','f','g','h'].map(f => (
                      <div key={f} style={{ textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: '#3d4460', textTransform: 'uppercase' }}>{f}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {/* Rank labels (8-1) */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', width: '14px', flexShrink: 0 }}>
                      {[8,7,6,5,4,3,2,1].map(r => (
                        <div key={r} style={{ textAlign: 'center', fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: '#3d4460' }}>{r}</div>
                      ))}
                    </div>
                    <div
                      role="grid"
                      aria-label="Chess game board"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
                        gap: '2px',
                        flex: 1,
                        border: '1px solid #1e2538',
                      }}
                      className="touch-manipulation text-center"
                    >
                      {gameState.board.map((row, x) =>
                        row.map((cell, y) => {
                          const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
                          const displayCell = cell ? <ChessPiece code={cell} /> : null;
                          const isCellDisabled = gameState.gameStatus !== 'active';
                          return (
                            <button
                              key={`${x}-${y}`}
                              onClick={() => handleMove(x, y)}
                              disabled={isCellDisabled}
                              style={{
                                aspectRatio: '1 / 1',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.1s ease-out',
                                ...boardCellStyle(x, y, isSelected, cell),
                              }}
                            >
                              {displayCell}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
              <div
                role="grid"
                aria-label={`${currentGame.name} game board`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gameState.board[0].length}, minmax(0, 1fr))`,
                  gap: (currentGame.id === 'sudoku' || currentGame.id === 'solitaire') ? '1px' : (gameState.board[0].length > 5 ? '3px' : '6px'),
                  width: '100%',
                  margin: '0 auto',
                  border: (currentGame.id === 'sudoku' || currentGame.id === 'solitaire') ? '3px solid #000000' : 'none',
                }}
                className="touch-manipulation text-center"
              >
                {gameState.board.map((row, x) =>
                  row.map((cell, y) => {
                    const isPyramid = currentGame.id === 'pyramid';
                    const isValidPyramid = isPyramid ? (logic as any).isValidSpot(x, y) : true;
                    const isDiamond = currentGame.id === 'diamond';
                    const isValidDiamond = isDiamond ? (logic as any).isValidSpot(x, y) : true;
                    
                    if (!isValidPyramid || !isValidDiamond) return <div key={`${x}-${y}`} style={{ aspectRatio: '1/1', width: '100%' }} />;

                    const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
                    const isMemory = currentGame.id === 'memory';
                    
                    // Display value mapper
                    let displayCell: React.ReactNode = cell;
                    if (currentGame.id === 'snakesladders') {
                      const cellNum = coordsToCellSnakes(x, y);
                      displayCell = (
                        <div className="w-full h-full flex flex-col justify-between p-1.5 absolute inset-0">
                          {/* Recognition: Always show cell numbers 1-100 */}
                          <span className="text-[8px] font-mono text-[#94a3b8]/60 self-start font-bold">
                            {cellNum}
                          </span>
                        </div>
                      );
                    } else if (isMemory && gameState.gameStatus === 'active') {
                      displayCell = '';
                    } else if (currentGame.id === 'chess' && cell) {
                      displayCell = <ChessPiece code={cell} />;
                    } else if (currentGame.id === 'sudoku' && cell) {
                      displayCell = cell.replace('c', '');
                    } else if (currentGame.id === 'minesweeper') {
                      if (cell === 'M') displayCell = 'MAL';
                      else if (cell === 'F') displayCell = 'FLG';
                      else if (cell === '0') displayCell = '';
                      else displayCell = cell;
                    } else if (currentGame.id === 'solitaire') {
                      if (x === 0 && y === 0) {
                        const count = cell ? (cell.substring(2) ? cell.substring(2).split(',').length : 0) : 0;
                        displayCell = count > 0 ? `[DECK] ${count}` : '[RECYCLE]';
                      } else if (x === 0 && y === 1) {
                        const cards = cell ? (cell.substring(2) ? cell.substring(2).split(',') : []) : [];
                        displayCell = cards.length > 0 ? formatSolitaireCard(cards[cards.length - 1]) : '[WST]';
                      } else if (x === 0 && y >= 3 && y <= 6) {
                        const parts = cell ? cell.split(':') : [];
                        const suit = parts[1] || '';
                        const topVal = parts[2] || '';
                        const suitSymbol = suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'S' ? '♠' : '♣';
                        displayCell = topVal ? `${suitSymbol}${topVal}` : `${suitSymbol}_`;
                      } else if (cell === '#') {
                        displayCell = '';
                      } else if (cell) {
                        displayCell = cell.endsWith('d') ? '[SYS]' : formatSolitaireCard(cell);
                      } else if (x === 2 && cell === null) {
                        displayCell = '[_]';
                      }
                    }

                    // Border groupings for Sudoku/Ultimate/Solitaire
                    const borderClasses = currentGame.id === 'sudoku'
                      ? `${y % 3 === 2 && y !== 8 ? 'sudoku-border-r' : ''} ${x % 3 === 2 && x !== 8 ? 'sudoku-border-b' : ''}`
                      : currentGame.id === 'ultimate'
                        ? `${y % 3 === 2 && y !== 8 ? 'border-r-4 border-r-[#d946ef]' : ''} ${x % 3 === 2 && x !== 8 ? 'border-b-4 border-b-[#d946ef]' : ''}`
                        : currentGame.id === 'solitaire'
                          ? `${x === 0 || x === 1 ? 'border-b-4 border-b-black' : ''}`
                          : '';

                    const isNewMove = lastMove?.x === x && lastMove?.y === y;
                    const cellClasses = [
                      borderClasses,
                      isNewMove ? 'animate-pop-in' : '',
                      cell === null && gameState.gameStatus === 'active' ? 'animate-board-entry' : '',
                      currentGame.id === 'sudoku' ? 'sudoku-cell' : '',
                    ].filter(Boolean).join(' ');

                    const isCellDisabled = gameState.gameStatus !== 'active' || 
                      (cell !== null && currentGame.id !== 'fourbyfour' && currentGame.id !== 'chess' && currentGame.id !== 'sudoku' && currentGame.id !== 'minesweeper' && currentGame.id !== 'solitaire' && cell !== '#') ||
                      currentGame.id === 'snakesladders'; // Cannot click board in Snakes & Ladders

                    return (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => handleMove(x, y)}
                        disabled={isCellDisabled}
                        role="gridcell"
                        aria-label={`Cell ${x + 1}, ${y + 1}${cell ? `, ${cell}` : ', empty'}`}
                        aria-pressed={!!cell}
                        style={{
                          aspectRatio: '1 / 1',
                          width: '100%',
                          fontWeight: 'bold',
                          fontSize: gameState.board[0].length > 7 ? 'clamp(0.7rem, 2vw, 1.4rem)' : 'clamp(1.4rem, 5vw, 2.5rem)',
                          transition: 'all 0.15s ease-out',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          ...boardCellStyle(x, y, isSelected, cell),
                          animationDelay: cell === null ? `${(x * gameState.board[0].length + y) * 12}ms` : undefined,
                        }}
                        className={cellClasses}
                      >
                        {displayCell}
                      </button>
                    );
                  })
                )}
              </div>
              )} {/* end non-chess board ternary */}

              {/* Dynamic Animated Tokens for Snakes & Ladders */}
              {currentGame.id === 'snakesladders' && (() => {
                const positions = getPlayerPositions();
                return Object.entries(positions).map(([pidStr, cellNum]) => {
                  const pid = parseInt(pidStr);
                  const pIdx = pid - 1;
                  if (pIdx < 0 || pIdx >= (players || []).length) return null;
                  const pct = getCellCenterPct(cellNum);
                  
                  // Compute offsets if multiple players land on the same cell
                  const occupantsOnThisCell = Object.entries(positions).filter(([_, c]) => c === cellNum);
                  const myIndexInOccupants = occupantsOnThisCell.findIndex(([id, _]) => parseInt(id) === pid);
                  const offsetAmount = 2.0; // percent offset
                  let offsetX = 0;
                  let offsetY = 0;
                  if (occupantsOnThisCell.length > 1) {
                    const angle = (myIndexInOccupants / occupantsOnThisCell.length) * Math.PI * 2;
                    offsetX = Math.cos(angle) * offsetAmount;
                    offsetY = Math.sin(angle) * offsetAmount;
                  }

                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24'];
                  const borderColors = ['#f87171', '#60a5fa', '#34d399', '#ffe066'];

                  return (
                    <div
                      key={`token-${pid}`}
                      className="absolute w-5 h-5 rounded-full border-2 shadow-lg z-20 flex items-center justify-center font-mono text-[9px] font-bold text-black select-none"
                      style={{
                        left: `${pct.x + offsetX}%`,
                        top: `${pct.y + offsetY}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: colors[pIdx % colors.length],
                        borderColor: borderColors[pIdx % borderColors.length],
                        boxShadow: `0 0 10px ${colors[pIdx % colors.length]}`,
                        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' // beautiful bouncy transition!
                      }}
                      title={(players || [])[pIdx]?.name}
                    >
                      P{pid}
                    </div>
                  );
                });
              })()}
            </div>

            {gameState.gameStatus !== 'active' && (
              <button
                onClick={restartGame}
                className="w-full max-w-[420px] cyber-btn bg-[#fbbf24] text-black py-3 text-sm font-bold uppercase tracking-wider mt-6 hover:scale-102 transition"
              >
                ACTIVATE REBOOT
              </button>
            )}
          </div>

          {/* Right Action/HUD Column */}
          <div className="space-y-6">
            
            {/* Dynamic Players list (supports up to 4 players) */}
            <div className="space-y-4">
              {players.map((player, idx) => {
                const isActive = gameState.gameStatus === 'active' && gameState.currentPlayer === player.id;
                const scoreVal = idx === 0 
                  ? scores.player1 
                  : idx === 1 
                    ? scores.player2 
                    : (scores[player.id] !== undefined ? scores[player.id] : 0);

                // Glow colors matching player identifiers
                const colors = ['#00f0ff', '#d946ef', '#10b981', '#fbbf24'];
                
                return (
                  <div 
                    key={player.id} 
                    className="cyber-panel p-4 bg-[var(--card-bg)] transition duration-200"
                    style={{
                      borderLeft: `6px solid ${colors[idx]}`,
                      borderColor: isActive ? colors[idx] : undefined,
                      boxShadow: isActive ? `0 0 15px ${colors[idx]}25` : undefined
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="font-mono text-[9px] px-2 py-0.5 font-bold uppercase text-black"
                        style={{ backgroundColor: colors[idx] }}
                      >
                        AGENT_0{player.id}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono animate-pulse uppercase font-bold" style={{ color: colors[idx] }}>
                          {isAIThinking ? 'COMPUTING...' : 'ACTIVE_TURN'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2.5">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-10 h-10 border border-white/10 object-cover" />
                      ) : (
                        <div className="text-xl font-mono font-bold" style={{ color: colors[idx] }}>
                          P{player.id}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold uppercase text-[var(--card-text)] font-mono">{player.name}</h3>
                        <p className="text-[10px] text-[#94a3b8] font-mono uppercase">
                          {currentGame.id === 'numerical' 
                            ? (player.id === 1 ? 'ODD NUMBERS' : 'EVEN NUMBERS')
                            : currentGame.id === 'sus'
                              ? (player.id === 1 ? 'SYMBOL S' : 'SYMBOL U')
                              : `SYMBOL: ${player.symbol}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                      <span className="font-mono text-[#94a3b8] uppercase text-[10px]">Protocol Score:</span>
                      <span className="text-base font-black font-display" style={{ color: colors[idx] }}>
                        {scoreVal}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sudoku AI solver / Hint block */}
            {currentGame.id === 'sudoku' && gameState.gameStatus === 'active' && (
              <div className="cyber-panel p-5 bg-[var(--card-bg)] border border-white/5">
                <span className="font-mono text-[10px] bg-[#fbbf24] text-black px-2 py-0.5 font-bold uppercase">
                  SOLVER_ASSISTANT
                </span>
                <p className="text-[10px] text-[#94a3b8] mt-2 mb-4 leading-relaxed uppercase">
                  Generate a hint for the empty grid using constraints backtracking solver.
                </p>
                <button
                  onClick={() => {
                    AudioManager.playClick();
                    const hint = (logic as any).getHint(gameState.board);
                    if (hint && presenterRef.current) {
                      presenterRef.current.onCellClicked(hint.x, hint.y, hint.val);
                      setSelectedPiece({ x: hint.x, y: hint.y });
                    }
                  }}
                  className="w-full text-black font-bold py-2.5 uppercase font-mono bg-[#fbbf24] hover:bg-[#d946ef] transition text-xs"
                >
                  AI_SOLVER_HINT
                </button>
              </div>
            )}

            {/* Rules Card */}
            <div className="cyber-panel p-5 bg-[var(--card-bg)] border border-white/5">
              <h4 className="font-bold font-display text-xs text-[var(--card-text)] mb-1.5 uppercase">RULES_PROTOCOL</h4>
              <p className="text-[10px] font-mono text-[#94a3b8] leading-relaxed uppercase">{currentGame.rules}</p>
            </div>

            {/* AI Difficulty HUD */}
            {players.some(p => p.type === 'ai') && (
              <div className="cyber-panel p-4 flex justify-between items-center bg-[var(--card-bg)] border border-white/5">
                <h4 className="font-bold font-display text-[10px] text-[var(--card-text)] uppercase">AI DIFFICULTY</h4>
                <span className="px-2.5 py-0.5 font-mono text-[9px] font-bold text-black bg-[#fbbf24] uppercase">
                  {typeof difficulty === 'string' ? difficulty : 'Medium'}
                </span>
              </div>
            )}

            {/* Action buttons (Undo, Help, Leave) */}
            <div className="space-y-3 pt-2">
              {gameState.gameStatus === 'active' && gameState.moves.length > 0 && currentGame.id !== 'snakesladders' && (
                <button
                  onClick={handleUndo}
                  disabled={isAIThinking}
                  className="w-full cyber-btn bg-white/5 border border-white/10 text-white py-2 text-xs font-bold hover:bg-white/10 transition uppercase disabled:opacity-50"
                >
                  UNDO LAST MOVE
                </button>
              )}

              <button
                onClick={() => {
                  AudioManager.playClick();
                  const data = TutorialManager.getTutorial(currentGame.id);
                  if (data) {
                    setTutorialData(data);
                    setShowTutorial(true);
                  }
                }}
                className="w-full cyber-btn bg-[#d946ef] text-black py-2.5 text-xs font-bold uppercase hover:scale-[1.01] transition"
              >
                HOW_TO_PLAY.SYS
              </button>

              <button
                onClick={resetGame}
                className="w-full cyber-btn bg-[#ef4444] text-white py-2.5 text-xs font-bold uppercase hover:scale-[1.01] transition"
              >
                LEAVE_SESSION
              </button>
            </div>

          </div>
        </div>
      </div>
      
      {showTutorial && tutorialData && (
        <Tutorial
          tutorial={tutorialData}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Game Result Toast */}
      {gameResultToast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '28px',
            zIndex: 9999,
            width: '340px',
            background: '#0a0c14',
            border: `1px solid ${gameResultToast.result === 'win' || gameResultToast.result === 'solved' ? '#00e5ff' : gameResultToast.result === 'draw' ? '#f5c518' : '#ff3d3d'}`,
            boxShadow: `0 0 32px ${gameResultToast.result === 'win' || gameResultToast.result === 'solved' ? 'rgba(0,229,255,0.25)' : gameResultToast.result === 'draw' ? 'rgba(245,197,24,0.25)' : 'rgba(255,61,61,0.25)'}`,
            borderRadius: '4px',
            padding: '24px',
            animation: 'slideInRight 0.35s cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                color: gameResultToast.result === 'win' || gameResultToast.result === 'solved' ? '#00e5ff' : gameResultToast.result === 'draw' ? '#f5c518' : '#ff3d3d',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '6px',
              }}>
                {gameResultToast.result === 'solved' ? '// PUZZLE SOLVED' : gameResultToast.result === 'win' ? '// VICTORY ACHIEVED' : gameResultToast.result === 'draw' ? '// DRAW RECORDED' : '// DEFEAT LOGGED'}
              </div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: '28px',
                color: '#e8eaf0',
                textTransform: 'uppercase',
                lineHeight: 1,
                letterSpacing: '0.02em',
              }}>
                {gameResultToast.result === 'solved' ? 'SOLVED!' : gameResultToast.result === 'win' ? (gameResultToast.winner ? `${gameResultToast.winner.toUpperCase()} WINS` : 'WINNER!') : gameResultToast.result === 'draw' ? 'DRAW' : 'DEFEATED'}
              </div>
            </div>
            <button
              onClick={() => setGameResultToast(null)}
              style={{ background: 'transparent', border: 'none', color: '#3d4460', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px', lineHeight: 1 }}
            >✕</button>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: '#7b8299', textTransform: 'uppercase', marginBottom: '3px' }}>XP EARNED</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '18px', color: '#00e676' }}>+{gameResultToast.xp} XP</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: '#7b8299', textTransform: 'uppercase', marginBottom: '3px' }}>DURATION</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '18px', color: '#e8eaf0' }}>{gameResultToast.duration}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', color: '#7b8299', textTransform: 'uppercase', marginBottom: '3px' }}>GAME</div>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '18px', color: '#c850f0', textTransform: 'uppercase' }}>{currentGame?.id?.toUpperCase()}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setGameResultToast(null); resetGame(); }}
              style={{
                flex: 1,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '9px',
                border: '1px solid rgba(0,229,255,0.3)',
                color: '#00e5ff',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,229,255,0.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              BACK TO MENU
            </button>
            <button
              onClick={() => { setGameResultToast(null); }}
              style={{
                flex: 1,
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '9px',
                border: 'none',
                color: '#000',
                background: '#00e5ff',
                cursor: 'pointer',
                borderRadius: '2px',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 14px rgba(0,229,255,0.4)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
