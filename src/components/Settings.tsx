import React, { useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import { AudioManager } from "../games/audio";
import { Difficulty } from "../types";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSoundChange?: (muted: boolean) => void;
}

function SegBtn({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`seg-btn ${active ? `seg-active-${color}` : ""}`}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  on,
  color = "yellow",
  onClick,
}: {
  on: boolean;
  color?: "yellow" | "pink" | "cyan";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`toggle-switch ${on ? `on-${color}` : "off"}`}
      aria-pressed={on}
      style={{ border: "none", outline: "none" }}
    >
      <div className="toggle-thumb" />
    </button>
  );
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onSoundChange,
}) => {
  const { difficulty, setDifficulty } = useGame();
  const [soundOn, setSoundOn] = useState(!AudioManager.isMuted);
  const [localDifficulty, setLocalDifficulty] = useState(difficulty);

  useEffect(() => {
    if (isOpen) {
      setLocalDifficulty(difficulty);
      setSoundOn(!AudioManager.isMuted);
    }
  }, [isOpen, difficulty]);

  if (!isOpen) return null;

  const apply = () => {
    if (localDifficulty !== difficulty) setDifficulty(localDifficulty);
    AudioManager.setMuted(!soundOn);
    if (onSoundChange) onSoundChange(!soundOn);
    try {
      localStorage.setItem(
        "boardGamesSettings",
        JSON.stringify({ difficulty: localDifficulty, sound: soundOn }),
      );
    } catch {}
    AudioManager.playClick();
    onClose();
  };

  const diffOpts: {
    value: Difficulty;
    label: string;
    color: string;
    icon: string;
  }[] = [
    { value: "easy", label: "EASY", color: "green", icon: "fa-circle-check" },
    {
      value: "medium",
      label: "MEDIUM",
      color: "yellow",
      icon: "fa-circle-half-stroke",
    },
    { value: "hard", label: "HARD", color: "red", icon: "fa-skull" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.76)", backdropFilter: "blur(7px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          AudioManager.playClick();
          onClose();
        }
      }}
    >
      <div
        className="relative w-full"
        style={{
          maxWidth: "380px",
          background: "#131722",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 40px rgba(200,80,240,0.12)",
          borderRadius: "0",
          padding: "40px 32px 32px",
        }}
      >
        <div className="corner-tag" style={{ background: "#f5c518" }}>
          CFG_SYS
        </div>

        <h2
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: "26px",
            color: "#e8eaf0",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <i
            className="fa-solid fa-sliders"
            style={{ marginRight: "12px", color: "#c850f0" }}
          />
          SETTINGS
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <SLabel>AI COMPLEXITY</SLabel>
            <div className="seg-group">
              {diffOpts.map((d) => (
                <SegBtn
                  key={d.value}
                  active={localDifficulty === d.value}
                  color={d.color}
                  onClick={() => setLocalDifficulty(d.value)}
                >
                  <i
                    className={`fa-solid ${d.icon}`}
                    style={{ marginRight: "5px" }}
                  />
                  {d.label}
                </SegBtn>
              ))}
            </div>
          </div>

          <div>
            <SLabel>SYSTEM_AUDIO</SLabel>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ToggleSwitch
                on={soundOn}
                color="yellow"
                onClick={() => setSoundOn(!soundOn)}
              />
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: soundOn ? "#f5c518" : "#7b8299",
                  transition: "color 0.2s",
                }}
              >
                <i
                  className={`fa-solid ${soundOn ? "fa-volume-high" : "fa-volume-xmark"}`}
                  style={{ marginRight: "8px" }}
                />
                {soundOn ? "ENABLED" : "DISABLED"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={apply}
          style={{
            marginTop: "32px",
            width: "100%",
            padding: "14px",
            background: "#c850f0",
            color: "#fff",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 0 20px rgba(200,80,240,0.3)",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 32px rgba(200,80,240,0.55)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 20px rgba(200,80,240,0.3)";
          }}
        >
          <i className="fa-solid fa-floppy-disk" />
          SAVE SYSTEM CHANGES
        </button>

        <button
          onClick={() => {
            AudioManager.playClick();
            onClose();
          }}
          style={{
            marginTop: "8px",
            width: "100%",
            padding: "10px",
            background: "transparent",
            color: "#7b8299",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = "#e8eaf0";
            b.style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.color = "#7b8299";
            b.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <i className="fa-solid fa-xmark" style={{ marginRight: "8px" }} />
          CANCEL
        </button>
      </div>
    </div>
  );
};

function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: "10px",
        color: "#e8eaf0",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

export default Settings;

