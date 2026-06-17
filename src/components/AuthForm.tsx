import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AudioManager } from "../games/audio";

const AVATAR_SEEDS = [
  "CyberKnight",
  "VoidWalker",
  "NeonHunter",
  "ShadowByte",
  "GlitchMaster",
  "PhantomCore",
  "DataViper",
  "NullVector",
  "IronProtocol",
  "CryptoGhost",
  "BitCrusher",
  "LvlUpGhost",
];

const getAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}&backgroundColor=070b13,0a0c14&radius=0`;

const AuthForm: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_SEEDS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    AudioManager.playClick();
    if (isLogin) {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Login failed");
        setLoading(false);
      }
    } else {
      if (!email) {
        setError("Email is required");
        setLoading(false);
        return;
      }
      const result = await register(
        email,
        username,
        password,
        getAvatarUrl(avatar),
      );
      if (!result.success) {
        setError(result.error || "Registration failed");
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    AudioManager.playClick();
    setIsLogin(!isLogin);
    setError(null);
  };

  const S: Record<string, React.CSSProperties> = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      background:
        "radial-gradient(ellipse at center, #0f1931 0%, #070b13 55%, #030509 100%)",
    },
    card: {
      position: "relative",
      width: "100%",
      maxWidth: "420px",
      background: "#0d1527",
      border: "1px solid rgba(0,229,255,0.3)",
      boxShadow: "0 0 40px rgba(0,229,255,0.1), inset 0 0 60px rgba(0,0,0,0.3)",
      borderRadius: "0",
      padding: "44px 36px 36px",
      zIndex: 1,
    },
    label: {
      display: "block",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "10px",
      color: "#00e5ff",
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      marginBottom: "6px",
    },
    labelPink: {
      display: "block",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: "10px",
      color: "#c850f0",
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      marginBottom: "6px",
    },
  };

  return (
    <div style={S.page}>
      <div className="scanlines" />

      <div style={S.card}>
        <div className="corner-tag" style={{ background: "#00e5ff" }}>
          SYSTEM_ACCESS
        </div>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700,
              fontSize: "34px",
              color: "#e8eaf0",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            CYBER_ARENA
            <span className="text-glow-cyan" style={{ color: "#00e5ff" }}>
              .SYS
            </span>
          </h1>
          <p
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#7b8299",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            {isLogin ? "INITIALIZE NEURAL CONNECT" : "REGISTER NEW AGENT ID"}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(255,61,61,0.08)",
              border: "1px solid rgba(255,61,61,0.3)",
              padding: "10px 14px",
              marginBottom: "20px",
              textAlign: "center",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#ff3d3d",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ marginRight: "8px" }}
            />
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          {!isLogin && (
            <div>
              <label style={S.label}>EMAIL_ADDRESS</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@nexus.net"
                className="cyber-input"
              />
            </div>
          )}

          <div>
            <label style={S.label}>
              {isLogin ? "USERNAME_OR_EMAIL" : "CHOOSE_CODENAME"}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. AGENT_ALPHA"
              className="cyber-input"
            />
          </div>

          <div>
            <label style={S.label}>ACCESS_KEYPASSWORD</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="cyber-input"
            />
          </div>

          {!isLogin && (
            <div>
              <label style={S.labelPink}>SELECT_AVATAR_MODULE</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "6px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "10px",
                }}
              >
                {AVATAR_SEEDS.map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      AudioManager.playClick();
                      setAvatar(seed);
                    }}
                    title={seed}
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      border:
                        avatar === seed
                          ? "1px solid #c850f0"
                          : "1px solid rgba(255,255,255,0.08)",
                      background:
                        avatar === seed
                          ? "rgba(200,80,240,0.15)"
                          : "rgba(0,0,0,0.3)",
                      cursor: "pointer",
                      padding: "3px",
                      boxShadow:
                        avatar === seed
                          ? "0 0 10px rgba(200,80,240,0.3)"
                          : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <img
                      src={getAvatarUrl(seed)}
                      alt={seed}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cyber-btn"
            style={{
              width: "100%",
              padding: "14px",
              background: isLogin ? "#00e5ff" : "#c850f0",
              color: "#000",
              fontSize: "11px",
              letterSpacing: "0.12em",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: isLogin
                ? "0 0 20px rgba(0,229,255,0.25)"
                : "0 0 20px rgba(200,80,240,0.25)",
              transition: "box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading)
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isLogin
                  ? "0 0 30px rgba(0,229,255,0.5)"
                  : "0 0 30px rgba(200,80,240,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = isLogin
                ? "0 0 20px rgba(0,229,255,0.25)"
                : "0 0 20px rgba(200,80,240,0.25)";
            }}
          >
            {loading
              ? "INITIALIZING SECURE LINK..."
              : isLogin
                ? "AUTHORIZE ACCESS"
                : "REGISTER AGENT"}
            {!loading && (
              <i
                className="fa-solid fa-arrow-right"
                style={{ marginLeft: "10px" }}
              />
            )}
          </button>
        </form>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: "16px",
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <button
            onClick={toggleMode}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              color: "#7b8299",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#e8eaf0";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#7b8299";
            }}
          >
            {isLogin
              ? "CREATE NEW AGENT CREDENTIALS"
              : "EXISTING AGENT? LOG IN"}
            <span style={{ color: "#c850f0", marginLeft: "6px" }}>
              [{isLogin ? "SIGN UP" : "LOG IN"}]
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
