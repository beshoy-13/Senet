import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { PlayerType, Player } from "../types";

const PLAYER_COLORS = ["#00e5ff", "#c850f0", "#00e676", "#f5c518"];
const PLAYER_ICONS = ["fa-1", "fa-2", "fa-3", "fa-4"];

const PlayerSetup: React.FC = () => {
  const { currentGame, setPlayers, difficulty, setDifficulty } = useGame();
  const {
    createRoom,
    activeRoom,
    connectionStatus,
    connectionError,
    clearError,
  } = useSocket();
  const { user } = useAuth();

  const [player1Name, setPlayer1Name] = useState(
    user?.username || "Agent Alpha",
  );
  const [player2Name, setPlayer2Name] = useState("Cyber Bot");
  const [player2Type, setPlayer2Type] = useState<PlayerType>("ai");
  const [player1Avatar, setPlayer1Avatar] = useState<string | undefined>(
    undefined,
  );
  const [player2Avatar, setPlayer2Avatar] = useState<string | undefined>(
    undefined,
  );

  const [snakesPlayerCount, setSnakesPlayerCount] = useState<number>(2);
  const [snakesNames, setSnakesNames] = useState<string[]>([
    user?.username || "Agent Alpha",
    "Agent Beta",
    "Agent Gamma",
    "Agent Delta",
  ]);
  const [snakesGameMode, setSnakesGameMode] = useState<"friends" | "computer">(
    "friends",
  );

  const [onlineTab, setOnlineTab] = useState<"local" | "online">("local");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setPlayer2Name(player2Type === "ai" ? "Cyber Bot" : "Player 2");
  }, [player2Type]);

  useEffect(() => {
    if (activeRoom && isCreatingRoom) {
      setShareUrl(
        `${window.location.origin}${window.location.pathname}?roomId=${activeRoom.roomId}`,
      );
      setIsCreatingRoom(false);
    }
  }, [activeRoom, isCreatingRoom]);

  const handleCreateOnlineRoom = () => {
    if (!currentGame) return;
    setIsCreatingRoom(true);
    createRoom(currentGame.id);
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      });
    }
  };

  const handleImageUpload = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (id === 1) setPlayer1Avatar(reader.result as string);
        else setPlayer2Avatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStart = () => {
    if (currentGame?.id === "snakesladders") {
      const playerSymbols = ["X", "O", "A", "B"];
      const defaultNames = [
        "Agent Alpha",
        "Cyber Bot Beta",
        "Cyber Bot Gamma",
        "Cyber Bot Delta",
      ];
      const snakesPlayers: Player[] = [];
      for (let i = 0; i < snakesPlayerCount; i++) {
        const isAI = snakesGameMode === "computer" && i > 0;
        snakesPlayers.push({
          id: i + 1,
          name: isAI
            ? defaultNames[i]
            : snakesNames[i]?.trim() || `Agent ${String.fromCharCode(65 + i)}`,
          symbol: playerSymbols[i],
          type: isAI ? "ai" : "human",
          score: 0,
          avatar: i === 0 ? player1Avatar : undefined,
        });
      }
      setPlayers(snakesPlayers);
    } else if (currentGame?.isSinglePlayer) {
      setPlayers([
        {
          id: 1,
          name: player1Name.trim() || "Agent Alpha",
          symbol: "X",
          type: "human",
          score: 0,
          avatar: player1Avatar,
        },
        { id: 2, name: "SOLO_ENGINE", symbol: "O", type: "ai", score: 0 },
      ]);
    } else {
      if (player1Name.trim() && player2Name.trim()) {
        setPlayers([
          {
            id: 1,
            name: player1Name.trim(),
            symbol: "X",
            type: "human",
            score: 0,
            avatar: player1Avatar,
          },
          {
            id: 2,
            name: player2Name.trim(),
            symbol: "O",
            type: player2Type,
            score: 0,
            avatar: player2Avatar,
          },
        ]);
      }
    }
  };

  const updateSnakesName = (index: number, val: string) => {
    setSnakesNames((prev) => {
      const n = [...prev];
      n[index] = val;
      return n;
    });
  };

  const isStartDisabled = () => {
    if (currentGame?.id === "snakesladders") {
      if (snakesGameMode === "computer") return !snakesNames[0]?.trim();
      for (let i = 0; i < snakesPlayerCount; i++) {
        if (!snakesNames[i]?.trim()) return true;
      }
      return false;
    }
    if (currentGame?.isSinglePlayer) return !player1Name.trim();
    return !player1Name.trim() || !player2Name.trim();
  };

  const P: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--bg-deep)",
  };

  const card: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "480px",
    background: "#131722",
    border: "1px solid rgba(0,229,255,0.25)",
    boxShadow: "0 0 40px rgba(0,229,255,0.08)",
    borderRadius: "0",
    padding: "44px 32px 32px",
  };

  const panelInner: React.CSSProperties = {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "16px",
    marginBottom: "16px",
    position: "relative",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "9px 12px",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e8eaf0",
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "11px",
    textTransform: "uppercase",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const monoLabel: React.CSSProperties = {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "9px",
    color: "#7b8299",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    display: "block",
    marginBottom: "8px",
    marginTop: "4px",
  };

  return (
    <div style={P}>
      <div style={card}>
        <div className="corner-tag" style={{ background: "#c850f0" }}>
          INIT_SYSTEM
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "28px",
            paddingBottom: "20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              margin: "0 auto 14px",
              border: "1px solid rgba(0,229,255,0.3)",
              background: "rgba(0,229,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className="fa-solid fa-gamepad"
              style={{
                fontSize: "22px",
                color: "#00e5ff",
                filter: "drop-shadow(0 0 8px rgba(0,229,255,0.7))",
              }}
            />
          </div>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "26px",
              color: "#e8eaf0",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "4px",
            }}
          >
            ENTER THE ARENA
          </h1>
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#7b8299",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            INITIALIZATION PROTOCOL 01-{currentGame?.id.toUpperCase()}
          </p>
        </div>

        {!currentGame?.isSinglePlayer && (
          <div className="seg-group" style={{ marginBottom: "20px" }}>
            <button
              onClick={() => {
                setOnlineTab("local");
                clearError();
              }}
              className={`seg-btn ${onlineTab === "local" ? "seg-active-cyan" : ""}`}
            >
              <i
                className="fa-solid fa-display"
                style={{ marginRight: "7px" }}
              />
              LOCAL PLAY
            </button>
            <button
              onClick={() => {
                setOnlineTab("online");
                clearError();
              }}
              className={`seg-btn ${onlineTab === "online" ? "seg-active-pink" : ""}`}
            >
              <i className="fa-solid fa-globe" style={{ marginRight: "7px" }} />
              ONLINE FRIEND
            </button>
          </div>
        )}

        {onlineTab === "online" && !currentGame?.isSinglePlayer && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {connectionError && (
              <div
                style={{
                  background: "rgba(255,61,61,0.08)",
                  border: "1px solid rgba(255,61,61,0.3)",
                  padding: "10px 14px",
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  color: "#ff3d3d",
                  textTransform: "uppercase",
                }}
              >
                <i
                  className="fa-solid fa-triangle-exclamation"
                  style={{ marginRight: "8px" }}
                />
                {connectionError}
              </div>
            )}

            {!activeRoom && (
              <div style={{ ...panelInner, textAlign: "center" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    margin: "0 auto 14px",
                    border: "1px solid rgba(0,229,255,0.3)",
                    background: "rgba(0,229,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-link"
                    style={{ fontSize: "18px", color: "#00e5ff" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#7b8299",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                    lineHeight: 1.5,
                  }}
                >
                  Host a private room and share the link with your friend.
                </p>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "9px",
                    color: "#3d4460",
                    textTransform: "uppercase",
                    marginBottom: "12px",
                  }}
                >
                  SERVER:{" "}
                  <span
                    style={{
                      color:
                        connectionStatus === "connected"
                          ? "#00e676"
                          : "#f5c518",
                    }}
                  >
                    {connectionStatus.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleCreateOnlineRoom}
                  disabled={isCreatingRoom || connectionStatus !== "connected"}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "#c850f0",
                    color: "#000",
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    border: "none",
                    cursor: isCreatingRoom ? "not-allowed" : "pointer",
                    opacity:
                      isCreatingRoom || connectionStatus !== "connected"
                        ? 0.5
                        : 1,
                    boxShadow: "0 0 16px rgba(200,80,240,0.3)",
                  }}
                >
                  <i
                    className={`fa-solid ${isCreatingRoom ? "fa-spinner fa-spin" : "fa-bolt"}`}
                    style={{ marginRight: "8px" }}
                  />
                  {isCreatingRoom ? "CREATING ROOM..." : "CREATE PRIVATE ROOM"}
                </button>
              </div>
            )}

            {activeRoom && activeRoom.status === "waiting" && shareUrl && (
              <div
                style={{
                  ...panelInner,
                  border: "1px solid rgba(200,80,240,0.3)",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "3px solid #c850f0",
                      borderTop: "3px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      margin: "0 auto 10px",
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      color: "#c850f0",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    WAITING FOR OPPONENT...
                  </p>
                  <p
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "9px",
                      color: "#3d4460",
                      marginTop: "4px",
                    }}
                  >
                    ROOM: {activeRoom.roomId.substring(0, 8).toUpperCase()}...
                  </p>
                </div>
                <label style={monoLabel}>
                  SHARE THIS LINK WITH YOUR FRIEND:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    readOnly
                    value={shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      color: "#00e5ff",
                      cursor: "text",
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: "9px 14px",
                      background: linkCopied ? "#00e676" : "#00e5ff",
                      color: "#000",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={`fa-solid ${linkCopied ? "fa-check" : "fa-copy"}`}
                      style={{ marginRight: "5px" }}
                    />
                    {linkCopied ? "COPIED" : "COPY"}
                  </button>
                </div>
              </div>
            )}

            {activeRoom && activeRoom.status === "active" && (
              <div
                style={{
                  ...panelInner,
                  border: "1px solid rgba(0,230,118,0.3)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    margin: "0 auto 12px",
                    border: "1px solid rgba(0,230,118,0.3)",
                    background: "rgba(0,230,118,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className="fa-solid fa-gamepad"
                    style={{ fontSize: "18px", color: "#00e676" }}
                  />
                </div>
                <p
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "10px",
                    color: "#00e676",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    animation: "pulse 1.5s infinite",
                  }}
                >
                  <i
                    className="fa-solid fa-check"
                    style={{ marginRight: "8px" }}
                  />
                  OPPONENT JOINED — LAUNCHING GAME...
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    marginTop: "10px",
                  }}
                >
                  {activeRoom.players.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "10px",
                        color: PLAYER_COLORS[i],
                        textTransform: "uppercase",
                      }}
                    >
                      <i
                        className="fa-solid fa-user"
                        style={{ marginRight: "6px" }}
                      />
                      {p.username}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(onlineTab === "local" || currentGame?.isSinglePlayer) && (
          <div>
            {currentGame?.id === "snakesladders" ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={panelInner}>
                  <label style={monoLabel}>MATCH PROTOCOL</label>
                  <div className="seg-group">
                    <button
                      className={`seg-btn ${snakesGameMode === "friends" ? "seg-active-pink" : ""}`}
                      onClick={() => setSnakesGameMode("friends")}
                    >
                      <i
                        className="fa-solid fa-users"
                        style={{ marginRight: "7px" }}
                      />
                      LOCAL FRIENDS
                    </button>
                    <button
                      className={`seg-btn ${snakesGameMode === "computer" ? "seg-active-yellow" : ""}`}
                      onClick={() => setSnakesGameMode("computer")}
                    >
                      <i
                        className="fa-solid fa-robot"
                        style={{ marginRight: "7px" }}
                      />
                      VS COMPUTER
                    </button>
                  </div>
                </div>

                <div style={panelInner}>
                  <label style={monoLabel}>PLAYER COUNT</label>
                  <div className="seg-group">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        className={`seg-btn ${snakesPlayerCount === count ? "seg-active-cyan" : ""}`}
                        onClick={() => setSnakesPlayerCount(count)}
                      >
                        {count} PLAYERS
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {Array.from({ length: snakesPlayerCount }).map((_, i) => {
                    const isAI = snakesGameMode === "computer" && i > 0;
                    const aiNames = [
                      "Agent Alpha",
                      "Cyber Bot Beta",
                      "Cyber Bot Gamma",
                      "Cyber Bot Delta",
                    ];
                    const color = PLAYER_COLORS[i];
                    return (
                      <div key={i} style={{ ...panelInner, marginBottom: 0 }}>
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            background: color,
                            padding: "3px 10px",
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: "8px",
                            color: "#000",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {isAI ? `COMPUTER_0${i + 1}` : `AGENT_0${i + 1}`}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            marginTop: "18px",
                          }}
                        >
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              border: `1px solid ${color}33`,
                              background: `${color}0d`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <i
                              className={`fa-solid ${PLAYER_ICONS[i]}`}
                              style={{ fontSize: "14px", color }}
                            />
                          </div>
                          {isAI ? (
                            <div
                              style={{
                                ...inputStyle,
                                flex: 1,
                                color: "rgba(255,255,255,0.3)",
                                userSelect: "none",
                              }}
                            >
                              {aiNames[i]} (AUTO_BOT)
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={snakesNames[i] || ""}
                              onChange={(e) =>
                                updateSnakesName(i, e.target.value)
                              }
                              placeholder={
                                i === 0
                                  ? "ENTER YOUR NAME"
                                  : `PLAYER ${i + 1} NAME`
                              }
                              style={inputStyle}
                              onFocus={(e) => {
                                (
                                  e.currentTarget as HTMLInputElement
                                ).style.borderColor = color;
                              }}
                              onBlur={(e) => {
                                (
                                  e.currentTarget as HTMLInputElement
                                ).style.borderColor = "rgba(255,255,255,0.1)";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div style={panelInner}>
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      background: "#00e5ff",
                      padding: "3px 10px",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "8px",
                      color: "#000",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    AGENT_01_CREDENTIALS
                  </div>
                  <label style={{ ...monoLabel, marginTop: "20px" }}>
                    YOUR IDENTIFIER
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "44px",
                        height: "44px",
                        flexShrink: 0,
                        border: "1px solid rgba(0,229,255,0.3)",
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {player1Avatar ? (
                        <img
                          src={player1Avatar}
                          alt="avatar"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <i
                          className="fa-solid fa-camera"
                          style={{ fontSize: "14px", color: "#7b8299" }}
                        />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(1, e)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          opacity: 0,
                          cursor: "pointer",
                        }}
                        title="Upload Avatar"
                      />
                    </div>
                    <input
                      type="text"
                      value={player1Name}
                      onChange={(e) => setPlayer1Name(e.target.value)}
                      placeholder="ENTER IDENTIFIER"
                      style={inputStyle}
                      onFocus={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = "#00e5ff";
                      }}
                      onBlur={(e) => {
                        (
                          e.currentTarget as HTMLInputElement
                        ).style.borderColor = "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>
                </div>

                {!currentGame?.isSinglePlayer && (
                  <div style={panelInner}>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        background: "#c850f0",
                        padding: "3px 10px",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "8px",
                        color: "#000",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      AGENT_02_SETTINGS
                    </div>
                    <div
                      className="seg-group"
                      style={{ marginBottom: "12px", marginTop: "20px" }}
                    >
                      {(["ai", "human"] as const).map((type) => (
                        <button
                          key={type}
                          className={`seg-btn ${player2Type === type ? "seg-active-pink" : ""}`}
                          onClick={() => setPlayer2Type(type)}
                        >
                          <i
                            className={`fa-solid ${type === "ai" ? "fa-robot" : "fa-user"}`}
                            style={{ marginRight: "6px" }}
                          />
                          {type === "ai" ? "CYBER AI" : "LOCAL MATE"}
                        </button>
                      ))}
                    </div>
                    <label style={monoLabel}>OPPONENT NAME</label>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "44px",
                          height: "44px",
                          flexShrink: 0,
                          border: "1px solid rgba(200,80,240,0.3)",
                          background: "rgba(0,0,0,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor:
                            player2Type === "human" ? "pointer" : "default",
                        }}
                      >
                        {player2Avatar ? (
                          <img
                            src={player2Avatar}
                            alt="avatar"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <i
                            className={`fa-solid ${player2Type === "ai" ? "fa-robot" : "fa-camera"}`}
                            style={{ fontSize: "14px", color: "#7b8299" }}
                          />
                        )}
                        {player2Type === "human" && (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(2, e)}
                            style={{
                              position: "absolute",
                              inset: 0,
                              opacity: 0,
                              cursor: "pointer",
                            }}
                            title="Upload Avatar"
                          />
                        )}
                      </div>
                      <input
                        type="text"
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)}
                        placeholder={
                          player2Type === "human"
                            ? "PLAYER 2 NAME"
                            : "COMPUTER NAME"
                        }
                        style={inputStyle}
                        onFocus={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = "#c850f0";
                        }}
                        onBlur={(e) => {
                          (
                            e.currentTarget as HTMLInputElement
                          ).style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                      />
                    </div>
                  </div>
                )}

                {(player2Type === "ai" || currentGame?.isSinglePlayer) && (
                  <div style={panelInner}>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        background: "#f5c518",
                        padding: "3px 10px",
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "8px",
                        color: "#000",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      SECTOR_DIFFICULTY
                    </div>
                    <label style={{ ...monoLabel, marginTop: "20px" }}>
                      GRID COMPLEXITY
                    </label>
                    <div className="seg-group">
                      {(["easy", "medium", "hard"] as const).map((level) => (
                        <button
                          key={level}
                          className={`seg-btn ${difficulty === level ? (level === "easy" ? "seg-active-green" : level === "medium" ? "seg-active-yellow" : "seg-active-red") : ""}`}
                          onClick={() => setDifficulty(level)}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={isStartDisabled()}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "8px",
                background: "#00e5ff",
                color: "#000",
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                border: "none",
                cursor: isStartDisabled() ? "not-allowed" : "pointer",
                opacity: isStartDisabled() ? 0.5 : 1,
                boxShadow: "0 0 20px rgba(0,229,255,0.3)",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isStartDisabled())
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 32px rgba(0,229,255,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 0 20px rgba(0,229,255,0.3)";
              }}
            >
              <i className="fa-solid fa-play" style={{ marginRight: "10px" }} />
              INITIALIZE SIMULATION
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PlayerSetup;
