import { Router, Response } from "express";
import { prisma } from "../prisma";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// GET /api/friends - List all friends
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { userId: req.userId },
      include: {
        friend: {
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
        },
      },
    });

    const friends = friendships.map((f) => f.friend);
    return res.status(200).json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return res.status(500).json({ error: "Server error fetching friends." });
  }
});

// POST /api/friends/add - Add friend by username
router.post("/add", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  try {
    // Find friend by username
    const friend = await prisma.user.findUnique({
      where: { username },
    });

    if (!friend) {
      return res.status(404).json({ error: "User not found." });
    }

    if (friend.id === req.userId) {
      return res.status(400).json({ error: "You cannot add yourself as a friend." });
    }

    // Check if already friends
    const existing = await prisma.friendship.findFirst({
      where: {
        userId: req.userId,
        friendId: friend.id,
      },
    });

    if (existing) {
      return res.status(400).json({ error: "You are already friends with this user." });
    }

    // Create bidirectional friendship
    await prisma.$transaction([
      prisma.friendship.create({
        data: {
          userId: req.userId!,
          friendId: friend.id,
        },
      }),
      prisma.friendship.create({
        data: {
          userId: friend.id,
          friendId: req.userId!,
        },
      }),
    ]);

    return res.status(200).json({
      message: "Friend added successfully.",
      friend: {
        id: friend.id,
        username: friend.username,
        avatar: friend.avatar,
        xp: friend.xp,
        level: friend.level,
        wins: friend.wins,
        losses: friend.losses,
        draws: friend.draws,
      },
    });
  } catch (error) {
    console.error("Error adding friend:", error);
    return res.status(500).json({ error: "Server error adding friend." });
  }
});

// POST /api/friends/remove - Remove friend by id
router.post("/remove", authMiddleware, async (req: AuthRequest, res: Response): Promise<any> => {
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: "Friend ID is required." });
  }

  try {
    // Delete bidirectional friendships
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: req.userId, friendId: friendId },
          { userId: friendId, friendId: req.userId },
        ],
      },
    });

    return res.status(200).json({ message: "Friend removed successfully." });
  } catch (error) {
    console.error("Error removing friend:", error);
    return res.status(500).json({ error: "Server error removing friend." });
  }
});

export default router;
