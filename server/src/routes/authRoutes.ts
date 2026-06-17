import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "cyberpunk_gaming_secret_key_2026";

// POST /api/auth/register
router.post("/register", async (req, res): Promise<any> => {
  const { email, username, password, avatar } = req.body;

  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "Missing required fields (email, username, password)" });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or username already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        avatar: avatar || "👾",
        xp: 0,
        level: 1,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Server error during registration." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res): Promise<any> => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ error: "Missing identifier (email/username) or password" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error during login." });
  }
});

// GET /api/auth/profile
router.get(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          matchesAsPlayer1: {
            include: { player1: true, player2: true, winner: true },
            take: 10,
            orderBy: { startedAt: "desc" },
          },
          matchesAsPlayer2: {
            include: { player1: true, player2: true, winner: true },
            take: 10,
            orderBy: { startedAt: "desc" },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const allMatches = [...user.matchesAsPlayer1, ...user.matchesAsPlayer2]
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, 20)
        .map((m) => ({
          id: m.id,
          gameType: m.gameType,
          status: m.status,
          player1: { username: m.player1.username, avatar: m.player1.avatar },
          // player2 is nullable (solo/AI games have no player2 row)
          player2: m.player2
            ? { username: m.player2.username, avatar: m.player2.avatar }
            : { username: "AI", avatar: "" },
          winner: m.winner ? m.winner.username : null,
          startedAt: m.startedAt,
          endedAt: m.endedAt,
        }));

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          xp: user.xp,
          level: user.level,
          wins: user.wins,
          losses: user.losses,
          draws: user.draws,
        },
        matchHistory: allMatches,
      });
    } catch (error) {
      console.error("Profile error:", error);
      return res.status(500).json({ error: "Server error fetching profile." });
    }
  },
);

// GET /api/auth/leaderboard (Public)
router.get("/leaderboard", async (req, res): Promise<any> => {
  try {
    const players = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        xp: true,
        level: true,
        wins: true,
        losses: true,
        draws: true,
      },
      orderBy: [{ xp: "desc" }, { wins: "desc" }],
      take: 20,
    });

    return res.status(200).json(players);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res
      .status(500)
      .json({ error: "Server error fetching leaderboard." });
  }
});

export default router;
