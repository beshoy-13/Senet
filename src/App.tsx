import React, { useEffect, useState } from "react";
import { useGame } from "./context/GameContext";
import { useAuth } from "./context/AuthContext";
import { useSocket } from "./context/SocketContext";
import AuthForm from "./components/AuthForm";
import GameMenu from "./components/GameMenu";
import PlayerSetup from "./components/PlayerSetup";
import GameBoard from "./components/GameBoard";
import Settings from "./components/Settings";
import { AudioManager } from "./games/audio";
import { Difficulty } from "./types";
import { GAMES } from "./games";

const App: React.FC = () => {
  const {
    currentGame,
    setCurrentGame,
    players,
    setPlayers,
    theme,
    setTheme,
    setDifficulty,
  } = useGame();
  const { user, token, loading, logout, matchHistory } = useAuth();
  const { activeRoom, joinRoom, onlineUsers } = useSocket();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(AudioManager.isMuted);
  const [activeView, setActiveView] = useState<
    "dashboard" | "arena" | "history" | "stats" | "friends" | "inventory"
  >("arena");
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  // Real Friends feature states
  const [friends, setFriends] = useState<any[]>([]);
  const [friendUsernameInput, setFriendUsernameInput] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [friendSuccess, setFriendSuccess] = useState<string | null>(null);

  // Auto-join room from URL query param or sessionStorage (set before login)
  useEffect(() => {
    if (user && !autoJoinAttempted) {
      const params = new URLSearchParams(window.location.search);
      const roomId =
        params.get("roomId") || sessionStorage.getItem("pendingRoomId");
      if (roomId) {
        setAutoJoinAttempted(true);
        setActiveView("arena");
        joinRoom(roomId);
        sessionStorage.removeItem("pendingRoomId");
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    }
  }, [user, autoJoinAttempted, joinRoom]);

  useEffect(() => {
    if (activeView === "stats") {
      fetch(
        `${(import.meta.env.VITE_API_URL as string) || "http://localhost:5000"}/api/leaderboard`,
      )
        .then((res) => res.json())
        .then((data) => setGlobalLeaderboard(data))
        .catch((err) => console.error("Error fetching leaderboard:", err));
    }
  }, [activeView]);

  const fetchFriends = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL as string) || "http://localhost:5000"}/api/friends`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFriends();
    } else {
      setFriends([]);
    }
  }, [token]);

  useEffect(() => {
    if (activeView === "friends" || activeView === "dashboard") {
      fetchFriends();
    }
  }, [activeView]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendUsernameInput.trim() || !token) return;
    setFriendError(null);
    setFriendSuccess(null);

    try {
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL as string) || "http://localhost:5000"}/api/friends/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: friendUsernameInput.trim() }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        setFriendSuccess(
          `Successfully connected with ${data.friend.username}!`,
        );
        setFriends((prev) => [...prev, data.friend]);
        setFriendUsernameInput("");
      } else {
        setFriendError(data.error || "Failed to add friend.");
      }
    } catch (err) {
      setFriendError("Network error. Please try again.");
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this direct-link?")) return;

    try {
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL as string) || "http://localhost:5000"}/api/friends/remove`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ friendId }),
        },
      );
      if (res.ok) {
        setFriends((prev) => prev.filter((f) => f.id !== friendId));
      }
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  // Synchronize activeRoom with GameContext for online multiplayer
  useEffect(() => {
    if (activeRoom && activeRoom.status === "active") {
      const roomGame = GAMES[activeRoom.gameType];
      if (roomGame && (!currentGame || currentGame.id !== roomGame.id)) {
        setCurrentGame(roomGame);
      }

      const host = activeRoom.players.find((p) => p.symbol === "1");
      const guest = activeRoom.players.find((p) => p.symbol === "2");

      if (host && guest) {
        const gamePlayers = [
          {
            id: 1,
            name: host.username,
            symbol: roomGame?.id === "snakesladders" ? "P1" : "X",
            type: "human" as const,
            score: 0,
            avatar: host.avatar,
          },
          {
            id: 2,
            name: guest.username,
            symbol: roomGame?.id === "snakesladders" ? "P2" : "O",
            type: "human" as const,
            score: 0,
            avatar: guest.avatar,
          },
        ];

        if (
          !players ||
          players.length !== 2 ||
          players[0].name !== host.username ||
          players[1].name !== guest.username
        ) {
          setPlayers(gamePlayers);
        }
      }
    }
  }, [activeRoom, currentGame, players, setCurrentGame, setPlayers]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // Sync settings and start procedural background music
  useEffect(() => {
    try {
      const saved = localStorage.getItem("boardGamesSettings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.difficulty) setDifficulty(parsed.difficulty as Difficulty);
        if (parsed.sound !== undefined) {
          AudioManager.setMuted(!parsed.sound);
          setIsMuted(!parsed.sound);
        }
      }
    } catch {}

    // Launch ambient synthesizer sequence
    AudioManager.startMusic();

    return () => {
      AudioManager.stopMusic();
    };
  }, []);

  const toggleTheme = () => {
    AudioManager.playClick();
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleMuteToggle = () => {
    const newMuted = AudioManager.toggle();
    setIsMuted(newMuted);
  };

  // If loading user profile, show premium loading screen
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b13",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              border: "3px solid #00e5ff",
              borderTop: "3px solid transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#00e5ff",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              textShadow: "0 0 12px rgba(0,229,255,0.7)",
            }}
          >
            ESTABLISHING SECURE CONNECTION LINK.SYS...
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // If not logged in, preserve ?roomId in sessionStorage and show Auth form
  if (!user) {
    const params = new URLSearchParams(window.location.search);
    const pendingRoom = params.get("roomId");
    if (pendingRoom) {
      sessionStorage.setItem("pendingRoomId", pendingRoom);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return <AuthForm />;
  }

  const currentUsername = user.username;

  // Calculate dynamic level & XP based on authenticated user data
  const totalXp = user.xp;
  const playerLevel = user.level;
  const currentXpInLevel = totalXp % 500;
  const xpPercentage = Math.min(
    100,
    Math.max(0, (currentXpInLevel / 500) * 100),
  );

  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return "BRONZE APPRENTICE";
    if (lvl === 2) return "SILVER RECRUIT";
    if (lvl === 3) return "GOLD INITIATE";
    if (lvl === 4) return "PLATINUM SPECIALIST";
    if (lvl === 5) return "DIAMOND ENFORCER";
    return "CYBER GRANDMASTER";
  };

  // Mock data for Dashboard
  const dailyQuests = [
    {
      id: 1,
      title: "DECRYPT CELL NODES",
      desc: "Scan 20 safety zones in Minesweeper",
      xp: "+150 XP",
      progress: 0.65,
      completed: false,
    },
    {
      id: 2,
      title: "TACTICAL MATE",
      desc: "Perform checkmate in Grandmaster Chess",
      xp: "+300 XP",
      progress: 0.0,
      completed: false,
    },
    {
      id: 3,
      title: "COMPRESS DATA",
      desc: "Slide grid to 1024 packet size in 2048",
      xp: "+200 XP",
      progress: 1.0,
      completed: true,
    },
    {
      id: 4,
      title: "NEURAL CLIMBER",
      desc: "Ascend 2 ladders in Snakes & Ladders",
      xp: "+100 XP",
      progress: 0.5,
      completed: false,
    },
  ];

  // Real friends list state is used instead of mock friendsList.

  const marketItems = [
    {
      id: 1,
      name: "Plasma Edge",
      type: "LEGENDARY",
      cost: "450 NP",
      desc: "Custom laser pointer cell highlight skin for Chess.",
      rarityColor: "#fbbf24",
      icon: "fa-chess-knight",
    },
    {
      id: 2,
      name: "Volt Reactor",
      type: "RARE",
      cost: "1200 NP",
      desc: "Animated background grid particle skin for 2048.",
      rarityColor: "#d946ef",
      icon: "fa-bolt",
    },
    {
      id: 3,
      name: "Grip Master",
      type: "UNCOMMON",
      cost: "300 NP",
      desc: "Anti-slip tactile cell styling pack for Sudoku.",
      rarityColor: "#00e5ff",
      icon: "fa-shield",
    },
    {
      id: 4,
      name: "Shard Core",
      type: "LEGENDARY",
      cost: "1500 NP",
      desc: "Crystalline skin set for Solitaire card stack decks.",
      rarityColor: "#fbbf24",
      icon: "fa-gem",
    },
  ];

  const getAvatarUrl = (seed: string) =>
    `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=070b13,0a0c14&radius=0`;

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div
            className="animate-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "28px" }}
          >
            {/* ── XP Banner ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d1527 0%, #121c38 100%)",
                border: "1px solid rgba(0,229,255,0.25)",
                boxShadow: "0 0 20px rgba(0,229,255,0.06)",
                borderRadius: "4px",
                padding: "32px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="corner-tag" style={{ background: "#00e5ff" }}>
                PLAYER_RANK
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "11px",
                  color: "#00e5ff",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "6px",
                }}
              >
                LEVEL {playerLevel} // {getLevelTitle(playerLevel)}
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "36px",
                  color: "#e8eaf0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {currentUsername}
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#7b8299",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "20px",
                }}
              >
                XP PROGRESSION: {currentXpInLevel} / 500 XP TO LEVEL UP
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: "180px",
                    background: "rgba(0,0,0,0.4)",
                    height: "6px",
                    borderRadius: "0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    className="pulse-neon-cyan"
                    style={{
                      width: `${xpPercentage}%`,
                      height: "100%",
                      background: "#00e5ff",
                      borderRadius: "0",
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    AudioManager.playClick();
                    setActiveView("arena");
                  }}
                  style={{
                    background: "#00e5ff",
                    color: "#000",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "10px 24px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 0 16px rgba(0,229,255,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "none";
                  }}
                >
                  ENGAGE PROTOCOL →
                </button>
              </div>
            </div>

            {/* ── Daily Quests + Friends ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Daily Quests */}
              <div
                style={{
                  background: "#131722",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "11px",
                      color: "#e8eaf0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    DAILY_QUESTS.SYS
                  </span>
                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      color: "#f5c518",
                      textTransform: "uppercase",
                    }}
                  >
                    RESET IN 14H
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {dailyQuests.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "3px",
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "6px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "9px",
                              color: q.completed ? "#00e676" : "#f5c518",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              marginRight: "8px",
                            }}
                          >
                            {q.completed ? "COMPLETED" : "IN_PROGRESS"}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "10px",
                              color: "#e8eaf0",
                              textTransform: "uppercase",
                            }}
                          >
                            {q.title}
                          </span>
                        </div>
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "10px",
                            color: "#00e5ff",
                            flexShrink: 0,
                            marginLeft: "8px",
                          }}
                        >
                          {q.xp}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "11px",
                          color: "#7b8299",
                          marginBottom: "8px",
                        }}
                      >
                        {q.desc}
                      </p>
                      <div
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          height: "3px",
                          borderRadius: "0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${q.progress * 100}%`,
                            height: "100%",
                            background: q.completed ? "#00e676" : "#f5c518",
                            borderRadius: "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Friends */}
              <div
                style={{
                  background: "#131722",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "11px",
                      color: "#e8eaf0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    ACTIVE_LOBBY.SYS
                  </span>
                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      color: "#00e5ff",
                      textTransform: "uppercase",
                    }}
                  >
                    {friends.filter((f) => onlineUsers.includes(f.id)).length}{" "}
                    ONLINE
                  </span>
                </div>
                {friends.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px 0",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      color: "#7b8299",
                      textTransform: "uppercase",
                    }}
                  >
                    No active connections.
                    <br />
                    Add friends in the Friends tab.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {friends.map((f) => {
                      const isOnline = onlineUsers.includes(f.id);
                      const dotColor = isOnline ? "#00e676" : "#3d4460";
                      const nameColor = isOnline ? "#e8eaf0" : "#7b8299";
                      const badgeColor = isOnline ? "#00e5ff" : "#7b8299";
                      return (
                        <div
                          key={f.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 0",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                border: `1px solid ${badgeColor}33`,
                                background: "rgba(0,0,0,0.3)",
                                overflow: "hidden",
                                position: "relative",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={
                                  f.avatar && f.avatar.startsWith("http")
                                    ? f.avatar
                                    : getAvatarUrl(f.username)
                                }
                                alt={f.username}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  bottom: "1px",
                                  right: "1px",
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: dotColor,
                                  border: "1px solid #131722",
                                }}
                              />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: "10px",
                                  color: nameColor,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {f.username}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: "9px",
                                  color: "#7b8299",
                                  textTransform: "uppercase",
                                  marginTop: "2px",
                                }}
                              >
                                LVL {f.level} // {f.xp} XP
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "8px",
                              color: badgeColor,
                              border: `1px solid ${badgeColor}33`,
                              padding: "2px 8px",
                              textTransform: "uppercase",
                              borderRadius: "2px",
                            }}
                          >
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Recent Matches ── */}
            {matchHistory.length > 0 && (
              <div
                style={{
                  background: "#131722",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "4px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#e8eaf0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    RECENT_MATCHES.LOG
                  </span>
                  <button
                    onClick={() => { AudioManager.playClick(); setActiveView("history"); }}
                    style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#00e5ff", textTransform: "uppercase", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
                  >
                    VIEW ALL →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {matchHistory.slice(0, 4).map((entry) => {
                    const isWin = entry.winner === currentUsername;
                    const isDraw = entry.winner === null;
                    const resultLabel = isDraw ? "DRAW" : isWin ? "WIN" : "LOSS";
                    const resultColor = isDraw ? "#f5c518" : isWin ? "#00e5ff" : "#ff3d3d";
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: "3px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: resultColor, border: `1px solid ${resultColor}33`, padding: "2px 8px", textTransform: "uppercase", borderRadius: "2px", flexShrink: 0 }}>
                            {resultLabel}
                          </span>
                          <div>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#e8eaf0", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {entry.gameType?.toUpperCase()}
                            </div>
                            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#7b8299", textTransform: "uppercase", marginTop: "2px" }}>
                              vs {entry.player1.username === currentUsername ? entry.player2.username : entry.player1.username}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "#3d4460", textTransform: "uppercase" }}>
                          {new Date(entry.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Trending Market ── */}
            <div
              style={{
                background: "#131722",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  paddingBottom: "12px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    color: "#e8eaf0",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  TRENDING_IN_MARKET.SYS
                </span>
                <span
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#c850f0",
                    textTransform: "uppercase",
                  }}
                >
                  REFRESHING_ITEMS
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "16px",
                }}
              >
                {marketItems.map((item) => (
                  <div
                    key={item.id}
                    className="cyber-card-interactive"
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "176px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            border: `1px solid ${item.rarityColor}33`,
                            background: `${item.rarityColor}0d`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i
                            className={`fa-solid ${item.icon}`}
                            style={{
                              fontSize: "14px",
                              color: item.rarityColor,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "8px",
                            color: item.rarityColor,
                            border: `1px solid ${item.rarityColor}33`,
                            padding: "2px 6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {item.type}
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#e8eaf0",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: "4px",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: "10px",
                          color: "#7b8299",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "12px",
                          color: "#00e5ff",
                        }}
                      >
                        {item.cost}
                      </span>
                      <button
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "8px",
                          color: "#000",
                          background: "#fff",
                          padding: "4px 10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          border: "none",
                          cursor: "pointer",
                          borderRadius: "2px",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#00e5ff";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#fff";
                        }}
                      >
                        ACQUIRE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "arena":
        return (
          <div className="animate-fade-in">
            {/* Joining via link — room joined but game not started yet */}
            {activeRoom && activeRoom.status === "waiting" && !players && (
              <div className="min-h-screen flex items-center justify-center">
                <div className="cyber-panel neon-glow-border-cyan max-w-md w-full p-10 text-center space-y-5 bg-[var(--card-bg)]">
                  <div className="w-12 h-12 border-4 border-[#d946ef] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-bold font-mono text-[#d946ef] uppercase tracking-widest">
                    JOINING ROOM...
                  </p>
                  <p className="text-[10px] font-mono text-[#94a3b8] uppercase">
                    Room: {activeRoom.roomId.substring(0, 8).toUpperCase()}...
                  </p>
                  <p className="text-[10px] font-mono text-white/40 uppercase">
                    Waiting for host to be ready
                  </p>
                </div>
              </div>
            )}
            {(!activeRoom || activeRoom.status !== "waiting" || players) &&
              (!currentGame ? (
                <GameMenu />
              ) : !players ? (
                <PlayerSetup />
              ) : (
                <GameBoard />
              ))}
          </div>
        );

      case "history":
        return (
          <div
            className="animate-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Page Title */}
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "40px",
                  color: "#e8eaf0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  lineHeight: 1,
                }}
              >
                MATCH HISTORY
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#7b8299",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginTop: "6px",
                }}
              >
                ARCHIVE OF RECENT DIGITAL CONQUESTS
              </div>
            </div>

            {matchHistory.length === 0 ? (
              <div
                style={{
                  background: "#131722",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "0",
                  padding: "64px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    margin: "0 auto 16px",
                    border: "1px solid rgba(0,229,255,0.2)",
                    background: "rgba(0,229,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-satellite-dish"
                    style={{ fontSize: "22px", color: "#00e5ff" }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "#e8eaf0",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  NO ARCHIVE RECORDS FOUND
                </div>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#7b8299",
                    textTransform: "uppercase",
                    marginBottom: "24px",
                  }}
                >
                  Initialize simulations in the Arena to record game files.
                </div>
                <button
                  onClick={() => {
                    AudioManager.playClick();
                    setActiveView("arena");
                  }}
                  style={{
                    background: "#00e5ff",
                    color: "#000",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "12px 28px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ENTER SIMULATION ARENA
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {matchHistory.map((entry, _i) => {
                  const isWin = entry.winner === currentUsername;
                  const isDraw = entry.winner === null;
                  const resultLabel = isDraw ? "DRAW" : isWin ? "WIN" : "LOSS";
                  const resultColor = isDraw
                    ? "#f5c518"
                    : isWin
                      ? "#00e5ff"
                      : "#f5c518";
                  const xpLabel = isDraw
                    ? "DRAW +50 XP"
                    : isWin
                      ? "WIN +150 XP"
                      : "LOSS +30 XP";
                  const xpColor = isDraw
                    ? "#f5c518"
                    : isWin
                      ? "#00e676"
                      : "#ff3d3d";
                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: "#131722",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "4px",
                        padding: "24px 28px",
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "24px",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Ghost result text behind */}
                      <span
                        style={{
                          position: "absolute",
                          right: "140px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontStyle: "italic",
                          fontSize: "80px",
                          color: resultColor,
                          opacity: 0.06,
                          userSelect: "none",
                          pointerEvents: "none",
                          letterSpacing: "-0.02em",
                          lineHeight: 1,
                        }}
                      >
                        {resultLabel}
                      </span>

                      {/* Left: mode badge, game name, stats */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "9px",
                              background: "rgba(255,255,255,0.08)",
                              color: "#e8eaf0",
                              padding: "3px 8px",
                              borderRadius: "2px",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {entry.gameType?.includes("ranked")
                              ? "RANKED"
                              : entry.gameType?.includes("tournament")
                                ? "TOURNAMENT"
                                : "CASUAL"}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: "12px",
                              color: "#7b8299",
                            }}
                          >
                            {new Date(entry.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3
                          style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            fontSize: "28px",
                            color: "#e8eaf0",
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
                            marginBottom: "12px",
                            lineHeight: 1,
                          }}
                        >
                          {entry.gameType?.toUpperCase()}
                        </h3>
                        <div style={{ display: "flex", gap: "28px" }}>
                          {[
                            {
                              label: "PLAYERS",
                              value: `${entry.player1.username} vs ${entry.player2.username}`,
                            },
                            {
                              label: "WINNER",
                              value: entry.winner
                                ? entry.winner.toUpperCase()
                                : "DRAW",
                            },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: "9px",
                                  color: "#7b8299",
                                  textTransform: "uppercase",
                                  marginBottom: "2px",
                                }}
                              >
                                {label}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Share Tech Mono', monospace",
                                  fontSize: "16px",
                                  color: "#00e5ff",
                                  letterSpacing: "0.02em",
                                }}
                              >
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: result + XP badge */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'Rajdhani', sans-serif",
                            fontWeight: 700,
                            fontStyle: "italic",
                            fontSize: "52px",
                            color: resultColor,
                            lineHeight: 1,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {resultLabel}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "10px",
                            color: xpColor,
                            background: `${xpColor}15`,
                            border: `1px solid ${xpColor}30`,
                            padding: "4px 10px",
                            borderRadius: "2px",
                            textTransform: "uppercase",
                          }}
                        >
                          {xpLabel}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "stats":
        return (
          <div
            className="animate-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              style={{
                background: "#131722",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="corner-tag" style={{ background: "#f5c518" }}>
                LEADERBOARD
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  color: "#e8eaf0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                SYSTEM_LEADERBOARD_RECORDS
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#7b8299",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "24px",
                }}
              >
                Cross-agent scores rank database
              </div>

              {globalLeaderboard.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      margin: "0 auto 16px",
                      border: "1px solid rgba(245,197,24,0.2)",
                      background: "rgba(245,197,24,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className="fa-solid fa-trophy"
                      style={{ fontSize: "22px", color: "#f5c518" }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700,
                      fontSize: "20px",
                      color: "#e8eaf0",
                      textTransform: "uppercase",
                      marginTop: "16px",
                    }}
                  >
                    LEADERBOARD IS VACANT
                  </div>
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      color: "#7b8299",
                      textTransform: "uppercase",
                      marginTop: "8px",
                    }}
                  >
                    Rank index updates will load when matches are saved.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontFamily: "'Share Tech Mono', monospace",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {["RANK", "AGENT", "LEVEL", "XP", "RECORD"].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: "10px 16px",
                              textAlign: "left",
                              fontSize: "10px",
                              color: "#7b8299",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontWeight: 400,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {globalLeaderboard.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = "rgba(255,255,255,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLTableRowElement
                            ).style.background = "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              color: idx === 0 ? "#f5c518" : "#7b8299",
                              fontSize: "12px",
                              fontWeight: idx === 0 ? 700 : 400,
                            }}
                          >
                            #{idx + 1}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <div style={{ width: "28px", height: "28px", border: "1px solid rgba(0,229,255,0.2)", overflow: "hidden", flexShrink: 0, background: "rgba(0,0,0,0.3)" }}>
                                <img
                                  src={entry.avatar && entry.avatar.startsWith("http") ? entry.avatar : getAvatarUrl(entry.username)}
                                  alt={entry.username}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                              <span
                                style={{
                                  color: "#e8eaf0",
                                  fontSize: "11px",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                  fontWeight: 600,
                                }}
                              >
                                {entry.username}
                              </span>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#c850f0",
                              fontSize: "11px",
                            }}
                          >
                            LVL {entry.level}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#00e5ff",
                              fontSize: "11px",
                            }}
                          >
                            {entry.xp} XP
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#7b8299",
                              fontSize: "11px",
                            }}
                          >
                            {entry.wins}W - {entry.losses}L - {entry.draws}D
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "friends":
        return (
          <div
            className="animate-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Add Connection */}
            <div
              style={{
                background: "#131722",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="corner-tag" style={{ background: "#c850f0" }}>
                CONNECT
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "22px",
                  color: "#e8eaf0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                ADD_NEW_CONNECTION
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#7b8299",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "16px",
                }}
              >
                Establish direct-link with another active agent
              </div>
              <form
                onSubmit={handleAddFriend}
                style={{ display: "flex", gap: "10px" }}
              >
                <input
                  type="text"
                  placeholder="ENTER AGENT CODENAME..."
                  value={friendUsernameInput}
                  onChange={(e) => setFriendUsernameInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "3px",
                    padding: "10px 14px",
                    color: "#e8eaf0",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    outline: "none",
                    textTransform: "uppercase",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      "#00e5ff";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      "rgba(255,255,255,0.1)";
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: "#c850f0",
                    color: "#fff",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "10px 20px",
                    borderRadius: "3px",
                    border: "none",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 0 16px rgba(200,80,240,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "none";
                  }}
                >
                  CONNECT_AGENT
                </button>
              </form>
              {friendError && (
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#ff3d3d",
                    textTransform: "uppercase",
                    marginTop: "10px",
                  }}
                >
                  ⚠ ERROR: {friendError}
                </div>
              )}
              {friendSuccess && (
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#00e676",
                    textTransform: "uppercase",
                    marginTop: "10px",
                  }}
                >
                  ✓ SUCCESS: {friendSuccess}
                </div>
              )}
            </div>

            {/* Friends List */}
            <div
              style={{
                background: "#131722",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  paddingBottom: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700,
                    fontSize: "22px",
                    color: "#e8eaf0",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  ALL_COMMUNICATIONS_LOG
                </div>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#7b8299",
                    textTransform: "uppercase",
                    marginTop: "4px",
                  }}
                >
                  Secure direct-link connections
                </div>
              </div>

              {friends.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#7b8299",
                    textTransform: "uppercase",
                  }}
                >
                  No active connections. Search and add agents above.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {friends.map((f) => {
                    const isOnline = onlineUsers.includes(f.id);
                    const badgeColor = isOnline ? "#00e5ff" : "#7b8299";
                    const dotColor = isOnline ? "#00e676" : "#3d4460";
                    return (
                      <div
                        key={f.id}
                        style={{
                          background: "rgba(0,0,0,0.2)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "0",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              border: `1px solid ${badgeColor}33`,
                              background: "rgba(0,0,0,0.4)",
                              overflow: "hidden",
                              flexShrink: 0,
                              position: "relative",
                            }}
                          >
                            <img
                              src={
                                f.avatar && f.avatar.startsWith("http")
                                  ? f.avatar
                                  : getAvatarUrl(f.username)
                              }
                              alt={f.username}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <span
                              style={{
                                position: "absolute",
                                bottom: "2px",
                                right: "2px",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: dotColor,
                                border: "1px solid #131722",
                              }}
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: "11px",
                                color: "#e8eaf0",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {f.username}
                            </div>
                            <div
                              style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: "9px",
                                color: "#7b8299",
                                textTransform: "uppercase",
                                marginTop: "2px",
                              }}
                            >
                              LVL {f.level} // {f.xp} XP
                            </div>
                            <div
                              style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: "8px",
                                color: "#3d4460",
                                textTransform: "uppercase",
                                marginTop: "1px",
                              }}
                            >
                              {f.wins}W - {f.losses}L - {f.draws}D
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "8px",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "8px",
                              color: badgeColor,
                              border: `1px solid ${badgeColor}33`,
                              padding: "2px 8px",
                              textTransform: "uppercase",
                              borderRadius: "2px",
                            }}
                          >
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </span>
                          <button
                            onClick={() => handleRemoveFriend(f.id)}
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "8px",
                              color: "#ff3d3d",
                              border: "1px solid rgba(255,61,61,0.25)",
                              background: "transparent",
                              padding: "3px 8px",
                              textTransform: "uppercase",
                              borderRadius: "2px",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "rgba(255,61,61,0.08)";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                            }}
                          >
                            TERMINATE LINK
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case "inventory":
        return (
          <div className="animate-fade-in">
            <div
              style={{
                background: "#131722",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "4px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="corner-tag" style={{ background: "#00e5ff" }}>
                INV_SYS
              </div>
              <div
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700,
                  fontSize: "28px",
                  color: "#e8eaf0",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "4px",
                }}
              >
                DIGITAL_INVENTORY_SYSTEM
              </div>
              <div
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#7b8299",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "24px",
                }}
              >
                Unlocked skins, card decks, and audio themes
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* Equipped items */}
                {[
                  {
                    faIcon: "fa-bolt",
                    name: "Volt Reactor Skin",
                    sub: "2048 SYSTEM TILE SKIN",
                    color: "#f5c518",
                  },
                  {
                    faIcon: "fa-cards-blank",
                    name: "Plasma Card Frame",
                    sub: "SOLITAIRE CARDS THEME",
                    color: "#c850f0",
                  },
                  {
                    faIcon: "fa-dice",
                    name: "Neon Dice Set",
                    sub: "SNAKES & LADDERS SKIN",
                    color: "#00e5ff",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    style={{
                      background: "rgba(0,230,118,0.04)",
                      border: "1px solid rgba(0,230,118,0.3)",
                      borderRadius: "0",
                      padding: "16px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="corner-tag"
                      style={{
                        background: "#00e676",
                        fontSize: "8px",
                        padding: "3px 8px",
                      }}
                    >
                      EQUIPPED
                    </div>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        border: `1px solid ${item.color}33`,
                        background: `${item.color}0d`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <i
                        className={`fa-solid ${item.faIcon}`}
                        style={{
                          fontSize: "16px",
                          color: item.color,
                          filter: `drop-shadow(0 0 6px ${item.color}80)`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#e8eaf0",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "4px",
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "9px",
                        color: "#7b8299",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.sub}
                    </div>
                  </div>
                ))}

                {/* Locked slots */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "0",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      opacity: 0.38,
                      minHeight: "120px",
                    }}
                  >
                    <i
                      className="fa-solid fa-lock"
                      style={{
                        fontSize: "18px",
                        color: "#3d4460",
                        marginBottom: "8px",
                      }}
                    />
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "9px",
                        color: "#7b8299",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "3px",
                      }}
                    >
                      LOCKED SLOT 0{i + 4}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "8px",
                        color: "#3d4460",
                        textTransform: "uppercase",
                      }}
                    >
                      LOCKED_IN_DATABASE
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  const navItems = [
    { view: "dashboard", label: "Dashboard", icon: "fa-gauge-high" },
    { view: "arena", label: "Arena", icon: "fa-gamepad" },
    { view: "history", label: "History", icon: "fa-clock-rotate-left" },
    { view: "stats", label: "Stats", icon: "fa-chart-bar" },
    { view: "friends", label: "Friends", icon: "fa-user-group" },
    { view: "inventory", label: "Inventory", icon: "fa-box-archive" },
  ] as const;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-deep)",
        color: "var(--text-primary)",
      }}
    >
      <aside
        style={{
          width: sidebarOpen ? "var(--sidebar-w)" : "0",
          minWidth: sidebarOpen ? "var(--sidebar-w)" : "0",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflow: "hidden",
          background: "#0a0c14",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          zIndex: 40,
          transition: "min-width 0.28s ease, width 0.28s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: sidebarOpen ? "0" : "0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 16px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  flexShrink: 0,
                  border: "1px solid rgba(0,229,255,0.4)",
                  boxShadow:
                    "0 0 12px rgba(0,229,255,0.25), inset 0 0 8px rgba(0,229,255,0.05)",
                  overflow: "hidden",
                  background: "#0d0f1a",
                }}
              >
                {user.avatar && user.avatar.startsWith("http") ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <img
                    src={getAvatarUrl(currentUsername)}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    color: "#e8eaf0",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textShadow: "0 0 8px rgba(255,255,255,0.15)",
                  }}
                >
                  {currentUsername}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "3px",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#00e676",
                      display: "inline-block",
                      boxShadow: "0 0 6px rgba(0,230,118,0.8)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "8px",
                      color: "#7b8299",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    LVL {playerLevel} // {getLevelTitle(playerLevel)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
            {navItems.map(({ view, label, icon }) => {
              const isActive = activeView === view;
              return (
                <button
                  key={view}
                  onClick={() => {
                    AudioManager.playClick();
                    setActiveView(view);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                    padding: "11px 18px",
                    border: "none",
                    borderLeft: isActive
                      ? "2px solid #00e5ff"
                      : "2px solid transparent",
                    background: isActive
                      ? "rgba(0,229,255,0.07)"
                      : "transparent",
                    color: isActive ? "#00e5ff" : "#7b8299",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    cursor: "pointer",
                    transition: "all 0.14s",
                    textAlign: "left",
                    textShadow: isActive
                      ? "0 0 8px rgba(0,229,255,0.6)"
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.color = "#c8d0e0";
                      b.style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const b = e.currentTarget as HTMLButtonElement;
                      b.style.color = "#7b8299";
                      b.style.background = "transparent";
                    }
                  }}
                >
                  <i
                    className={`fa-solid ${icon}`}
                    style={{
                      width: "14px",
                      fontSize: "11px",
                      flexShrink: 0,
                      filter: isActive
                        ? "drop-shadow(0 0 4px rgba(0,229,255,0.7))"
                        : "none",
                    }}
                  />
                  {label}
                </button>
              );
            })}
          </nav>

          <div
            style={{
              padding: "16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => {
                AudioManager.playClick();
                setActiveView("arena");
              }}
              style={{
                width: "100%",
                padding: "11px 0",
                background: "transparent",
                border: "1px solid #00e5ff",
                color: "#00e5ff",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                marginBottom: "10px",
                boxShadow: "0 0 10px rgba(0,229,255,0.12)",
                transition: "box-shadow 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "rgba(0,229,255,0.08)";
                b.style.boxShadow = "0 0 18px rgba(0,229,255,0.3)";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.background = "transparent";
                b.style.boxShadow = "0 0 10px rgba(0,229,255,0.12)";
              }}
            >
              <i className="fa-solid fa-play" style={{ marginRight: "8px" }} />
              START QUEUE
            </button>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "9px",
                color: "#3d4460",
              }}
            >
              <span
                style={{ cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#7b8299";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#3d4460";
                }}
              >
                SUPPORT
              </span>
              <span>•</span>
              <span
                onClick={() => {
                  AudioManager.playClick();
                  logout();
                }}
                style={{
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#ff3d3d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.color = "#3d4460";
                }}
              >
                <i
                  className="fa-solid fa-right-from-bracket"
                  style={{ marginRight: "4px" }}
                />
                LOGOUT
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            height: "52px",
            flexShrink: 0,
            background: "#0a0c14",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 2px 20px rgba(0,0,0,0.35)",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => {
                AudioManager.playClick();
                setSidebarOpen(!sidebarOpen);
              }}
              className="icon-btn"
              title="Toggle Sidebar"
            >
              <i className="fa-solid fa-bars" />
            </button>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "14px",
                color: "#00e5ff",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textShadow: "0 0 12px rgba(0,229,255,0.5)",
              }}
            >
              NEON_REALM
            </span>
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "9px",
                color: "#3d4460",
                letterSpacing: "0.08em",
              }}
            >
              <i
                className="fa-solid fa-angle-right"
                style={{ margin: "0 6px" }}
              />
              {activeView.toUpperCase()}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={handleMuteToggle}
              className={`icon-btn ${isMuted ? "active-mute" : "active-sound"}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              <i
                className={`fa-solid ${isMuted ? "fa-volume-xmark" : "fa-volume-high"}`}
              />
            </button>
            <button
              onClick={() => {
                AudioManager.playClick();
                setSettingsOpen(true);
              }}
              className="icon-btn"
              title="Settings"
            >
              <i className="fa-solid fa-sliders" />
            </button>
            <div style={{ position: "relative" }}>
              <button className="icon-btn" title="Notifications">
                <i className="fa-solid fa-bell" />
              </button>
              <span
                style={{
                  position: "absolute",
                  top: "7px",
                  right: "7px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#c850f0",
                  boxShadow: "0 0 6px rgba(200,80,240,0.8)",
                }}
              />
            </div>

            <button
              className="icon-btn"
              title="View Profile"
              onClick={() => { AudioManager.playClick(); setActiveView("dashboard"); }}
              style={{ overflow: "hidden", padding: 0 }}
            >
              {user.avatar && user.avatar.startsWith("http") ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={getAvatarUrl(currentUsername)}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px 40px" }}>
          {renderActiveView()}
        </main>
      </div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSoundChange={(muted) => setIsMuted(muted)}
      />
    </div>
  );
};

export default App;
