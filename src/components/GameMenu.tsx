import React from "react";
import { useGame } from "../context/GameContext";
import { GAMES } from "../games";

const getGameIcon = (id: string): string => {
  const map: Record<string, string> = {
    chess: "fa-chess",
    sudoku: "fa-table-cells",
    minesweeper: "fa-bomb",
    "2048": "fa-layer-group",
    solitaire: "fa-cards",
    xo: "fa-xmark",
    connect4: "fa-circle-dot",
    snakesladders: "fa-dice",
    checkers: "fa-circle-half-stroke",
    go: "fa-circle",
  };
  return map[id] || "fa-gamepad";
};

const GameMenu: React.FC = () => {
  const { setCurrentGame } = useGame();
  const gameList = Object.values(GAMES);
  const soloGames = gameList.filter((g) => g.isSinglePlayer);
  const partyGames = gameList.filter((g) => g.category === "party");
  const multiGames = gameList.filter(
    (g) => !g.isSinglePlayer && g.category !== "party",
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        height: "100%",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(135deg, #0d1527 0%, #121c38 55%, #1a0d2e 100%)",
          border: "1px solid rgba(0,229,255,0.22)",
          borderRadius: "0",
          padding: "36px 36px 32px",
          marginBottom: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(0,229,255,0.07)",
        }}
      >
        <div className="corner-tag" style={{ background: "#00e5ff" }}>
          SYS // ACTIVE_ARENA
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          {["NEW SEASON", "MULTI_PLAYER"].map((t) => (
            <span
              key={t}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "10px",
                color: "#e8eaf0",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "3px 10px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        <h1
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(32px,4.5vw,52px)",
            color: "#e8eaf0",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1,
            marginBottom: "10px",
          }}
        >
          ENTER THE{" "}
          <span className="text-glow-cyan" style={{ color: "#00e5ff" }}>
            ARENA
          </span>
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            color: "#7b8299",
            maxWidth: "480px",
            lineHeight: 1.5,
            marginBottom: "24px",
          }}
        >
          Choose your game module and initiate the simulation protocol.
          Challenge AI or real agents.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => {}}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "11px",
              color: "#00e5ff",
              border: "1px solid #00e5ff",
              padding: "11px 22px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(0,229,255,0.08)",
              cursor: "pointer",
              boxShadow: "0 0 14px rgba(0,229,255,0.2)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 24px rgba(0,229,255,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 14px rgba(0,229,255,0.2)";
            }}
          >
            <i className="fa-solid fa-bolt" style={{ marginRight: "8px" }} />
            BATTLE NOW
          </button>
          <button
            onClick={() => {}}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "11px",
              color: "#e8eaf0",
              border: "1px solid rgba(255,255,255,0.14)",
              padding: "11px 22px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.04)";
            }}
          >
            <i
              className="fa-solid fa-book-open"
              style={{ marginRight: "8px" }}
            />
            LEARN RULES
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {soloGames.length > 0 && (
          <GameSection
            title="SOLO_MISSIONS.SYS"
            subtitle="Single player diagnostics and challenge modes"
            accentColor="#f5c518"
            badgeLabel="SOLO"
            badgeIcon="fa-user"
            games={soloGames}
            onSelect={setCurrentGame}
          />
        )}
        {partyGames.length > 0 && (
          <GameSection
            title="PARTY_PROTOCOL.SYS"
            subtitle="Multiplayer local party simulations"
            accentColor="#c850f0"
            badgeLabel="PARTY"
            badgeIcon="fa-users"
            games={partyGames}
            onSelect={setCurrentGame}
          />
        )}
        {multiGames.length > 0 && (
          <GameSection
            title="ARENA_DUAL_PROTOCOL.SYS"
            subtitle="Challenge human agents or AI tactical algorithms"
            accentColor="#00e5ff"
            badgeLabel="DUAL"
            badgeIcon="fa-swords"
            games={multiGames}
            onSelect={setCurrentGame}
          />
        )}
      </div>
    </div>
  );
};

function GameSection({
  title,
  subtitle,
  accentColor,
  badgeLabel,
  badgeIcon,
  games,
  onSelect,
}: {
  title: string;
  subtitle: string;
  accentColor: string;
  badgeLabel: string;
  badgeIcon: string;
  games: any[];
  onSelect: (g: any) => void;
}) {
  return (
    <div>
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          marginBottom: "20px",
          paddingBottom: "10px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "20px",
            color: accentColor,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            textShadow: `0 0 12px ${accentColor}80`,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            color: "#7b8299",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginTop: "3px",
          }}
        >
          {subtitle}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
          gap: "16px",
        }}
      >
        {games.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            accentColor={accentColor}
            badgeLabel={badgeLabel}
            badgeIcon={badgeIcon}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  game,
  accentColor,
  badgeLabel,
  badgeIcon,
  onSelect,
}: {
  game: any;
  accentColor: string;
  badgeLabel: string;
  badgeIcon: string;
  onSelect: (g: any) => void;
}) {
  const diffColor =
    game.difficulty === "easy"
      ? "#00e676"
      : game.difficulty === "medium"
        ? "#f5c518"
        : "#ff3d3d";

  const diffIcon =
    game.difficulty === "easy"
      ? "fa-circle-check"
      : game.difficulty === "medium"
        ? "fa-circle-half-stroke"
        : "fa-skull";

  return (
    <button
      onClick={() => onSelect(game)}
      className="cyber-card-interactive"
      style={{
        background: "#131722",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "0",
        padding: "22px",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minHeight: "200px",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "7px",
          left: "7px",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "8px",
          color: "#f5c518",
          background: "rgba(0,0,0,0.55)",
          padding: "2px 6px",
          opacity: 0.65,
        }}
      >
        isSinglePlayer: {String(!!game.isSinglePlayer)}
      </div>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
            marginTop: "14px",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              border: `1px solid ${accentColor}33`,
              background: `${accentColor}0d`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i
              className={`fa-solid ${getGameIcon(game.id)}`}
              style={{
                fontSize: "18px",
                color: accentColor,
                filter: `drop-shadow(0 0 6px ${accentColor}80)`,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "9px",
              color: accentColor,
              border: `1px solid ${accentColor}33`,
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <i
              className={`fa-solid ${badgeIcon}`}
              style={{ marginRight: "5px" }}
            />
            {badgeLabel}
          </span>
        </div>

        <h3
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "19px",
            color: "#e8eaf0",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
            marginBottom: "7px",
            lineHeight: 1.1,
          }}
        >
          {game.name}
        </h3>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "11px",
            color: "#7b8299",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {game.description}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "14px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            background: diffColor,
            color: "#000",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            padding: "3px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          <i
            className={`fa-solid ${diffIcon}`}
            style={{ marginRight: "5px" }}
          />
          {game.difficulty?.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "10px",
            color: accentColor,
            letterSpacing: "0.06em",
            filter: `drop-shadow(0 0 6px ${accentColor}80)`,
          }}
        >
          LOAD_SIM
          <i
            className="fa-solid fa-arrow-right"
            style={{ marginLeft: "6px" }}
          />
        </span>
      </div>
    </button>
  );
}

export default GameMenu;
