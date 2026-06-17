import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// POST /api/games/record
router.post(
  "/record",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<any> => {
    const { gameType, opponent, result, xpEarned, duration } = req.body;

    if (!gameType || !result) {
      return res
        .status(400)
        .json({ error: "Missing required fields: gameType, result" });
    }

    if (!["win", "loss", "draw"].includes(result)) {
      return res
        .status(400)
        .json({ error: "result must be 'win', 'loss', or 'draw'" });
    }

    try {
      const userId = req.userId!;
      const xp = typeof xpEarned === "number" ? xpEarned : 0;
      const durationSec = typeof duration === "number" ? duration : 0;

      // If opponent is a real username (not "AI"), resolve their userId
      let player2Id: string | null = null;
      if (opponent && opponent !== "AI") {
        const opponentUser = await prisma.user.findUnique({
          where: { username: opponent },
          select: { id: true },
        });
        if (opponentUser) player2Id = opponentUser.id;
      }

      // Determine winnerId
      let winnerId: string | null = null;
      if (result === "win") {
        winnerId = userId;
      } else if (result === "loss" && player2Id) {
        winnerId = player2Id;
      }

      // Build data object — only include optional fields if they have a value
      const matchData: any = {
        gameType,
        status: "COMPLETED",
        player1Id: userId,
        startedAt: new Date(Date.now() - durationSec * 1000),
        endedAt: new Date(),
      };
      if (player2Id) matchData.player2Id = player2Id;
      if (winnerId) matchData.winnerId = winnerId;

      await prisma.match.create({ data: matchData });

      // Fetch current XP to recalculate level
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true },
      });

      const newXp = (currentUser?.xp ?? 0) + xp;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xp },
          level: newLevel,
          ...(result === "win" && { wins: { increment: 1 } }),
          ...(result === "loss" && { losses: { increment: 1 } }),
          ...(result === "draw" && { draws: { increment: 1 } }),
        },
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
      });

      return res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Record match error:", error);
      return res.status(500).json({ error: "Failed to record match" });
    }
  },
);

export default router;
