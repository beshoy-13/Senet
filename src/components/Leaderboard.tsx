import React from 'react';
import { useGame } from '../context/GameContext';
import { AudioManager } from '../games/audio';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const { leaderboard, clearLeaderboard } = useGame();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-6">
      <div
        className="brutal-card shadow-brutal-yellow p-8 w-full max-w-lg relative bg-[#131722] max-h-[80vh] flex flex-col"
      >
        <div className="absolute top-0 right-0 bg-[#fbbf24] text-black font-mono px-3 py-0.5 text-xs border-b-2 border-l-2 border-black font-bold uppercase">
          SCORES_SYS
        </div>

        <h2 className="text-2xl font-black font-display mb-6 text-center text-white tracking-wide uppercase">
          LEADERBOARD
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-center font-mono text-[#94a3b8] py-12 uppercase text-xs">No records registered in database.</p>
        ) : (
          <div className="overflow-y-auto flex-1 space-y-3 pr-2 mb-4">
            {leaderboard.map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 brutal-border bg-[#090a0f] text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#fbbf24]">#{i + 1}</span>
                  <div>
                    <div className="font-bold text-white uppercase font-mono">{entry.gameName}</div>
                    <div className="text-xs text-[#94a3b8] font-mono mt-0.5 uppercase">
                      {entry.player1} VS {entry.player2}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black font-mono" style={{ color: entry.winner === 'Draw' ? '#fbbf24' : '#00f0ff' }}>
                    {entry.winner === 'Draw' ? 'DRAW' : entry.winner.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5 uppercase">{entry.date} // {entry.difficulty}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-black/40">
          {leaderboard.length > 0 && (
            <button
              onClick={() => { AudioManager.playClick(); clearLeaderboard(); }}
              className="brutal-btn bg-[#ef4444] text-white py-2 text-xs font-bold font-mono uppercase"
            >
              CLEAR_ALL
            </button>
          )}
          <button
            onClick={() => { AudioManager.playClick(); onClose(); }}
            className="flex-1 brutal-btn bg-[#00f0ff] text-black py-2 text-xs font-bold font-mono uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;