import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE_URL = `${(import.meta.env.VITE_API_URL as string) || "http://localhost:5000"}/api`;

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MatchHistoryEntry {
  id: string;
  gameType: string;
  status: string;
  player1: { username: string; avatar: string };
  player2: { username: string; avatar: string };
  winner: string | null;
  startedAt: string;
  endedAt: string;
}

export interface RecordMatchPayload {
  gameType: string;
  opponent: string;        // opponent username or "AI"
  result: "win" | "loss" | "draw";
  xpEarned: number;
  duration: number;        // seconds
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  matchHistory: MatchHistoryEntry[];
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, username: string, password: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  recordMatch: (payload: RecordMatchPayload) => Promise<void>;
  updateProfile: (username: string, avatarSeed: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("cyber_arena_token"));
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and fetch profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setUser(data.user);
            setMatchHistory(data.matchHistory || []);
          } else {
            logout();
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
          // Load from localStorage fallback
          const local = localStorage.getItem("cyber_arena_match_history");
          if (local) {
            try { setMatchHistory(JSON.parse(local)); } catch {}
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("cyber_arena_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (err) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (email: string, username: string, password: string, avatar?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, avatar }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("cyber_arena_token", data.token);
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (err) {
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("cyber_arena_token");
    setToken(null);
    setUser(null);
    setMatchHistory([]);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        // Merge server history with any local-only entries
        const serverIds = new Set((data.matchHistory || []).map((e: MatchHistoryEntry) => e.id));
        const localOnly = matchHistory.filter((e) => !serverIds.has(e.id));
        setMatchHistory([...(data.matchHistory || []), ...localOnly]);
      }
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  /**
   * recordMatch — saves a completed game to the backend.
   * Falls back to an optimistic local update if the server call fails,
   * so history and stats always update in the UI even offline.
   */
  const recordMatch = async (payload: RecordMatchPayload) => {
    const now = new Date().toISOString();
    const startedAt = new Date(Date.now() - payload.duration * 1000).toISOString();

    // ── 1. Optimistic local update ──────────────────────────────────────────
    const localEntry: MatchHistoryEntry = {
      id: `local_${Date.now()}`,
      gameType: payload.gameType,
      status: payload.result === "draw" ? "draw" : "completed",
      player1: { username: user?.username || "You", avatar: user?.avatar || "" },
      player2: { username: payload.opponent, avatar: "" },
      winner: payload.result === "win" ? (user?.username || null) : payload.result === "loss" ? payload.opponent : null,
      startedAt,
      endedAt: now,
    };

    setMatchHistory((prev) => {
      const updated = [localEntry, ...prev];
      try { localStorage.setItem("cyber_arena_match_history", JSON.stringify(updated.slice(0, 100))); } catch {}
      return updated;
    });

    // Optimistically update user stats
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        xp: prev.xp + payload.xpEarned,
        level: Math.floor((prev.xp + payload.xpEarned) / 1000) + 1,
        wins: payload.result === "win" ? prev.wins + 1 : prev.wins,
        losses: payload.result === "loss" ? prev.losses + 1 : prev.losses,
        draws: payload.result === "draw" ? prev.draws + 1 : prev.draws,
      };
    });

    // ── 2. Persist to backend ───────────────────────────────────────────────
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/games/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Replace optimistic entry with the real one from server
        await refreshProfile();
      }
      // If 404 (endpoint not yet added to backend), local state is already updated above
    } catch (err) {
      console.error("Failed to record match on server:", err);
      // Local update already happened — user sees correct UI
    }
  };

  const updateProfile = async (username: string, avatarSeed: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const newAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${avatarSeed}&backgroundColor=070b13,0a0c14&radius=0`;
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username, avatar: newAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, username: data.user.username, avatar: data.user.avatar } : prev);
        return { success: true };
      }
      return { success: false, error: data.error || "Update failed" };
    } catch {
      // Optimistic update on network failure
      const newAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${avatarSeed}&backgroundColor=070b13,0a0c14&radius=0`;
      setUser((prev) => prev ? { ...prev, username, avatar: newAvatar } : prev);
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        matchHistory,
        login,
        register,
        logout,
        refreshProfile,
        recordMatch,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
