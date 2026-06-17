import { prisma } from "../prisma";

export interface Player {
  socketId: string;
  userId: string;
  username: string;
  avatar: string;
  symbol: string; // "1" or "2"
}

export interface GameRoom {
  roomId: string;
  gameType: string;
  status: "waiting" | "active" | "finished";
  players: Player[];
  board: any;
  moves: any[];
  currentPlayerId: string; // userId of player who has the turn
  winnerId: string | null;
}

class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  // Create a new room
  public createRoom(
    socketId: string,
    userId: string,
    username: string,
    avatar: string,
    gameType: string
  ): GameRoom {
    const roomId = Math.random().toString(36).substring(2, 9); // UUID-like 7 char code
    const hostPlayer: Player = {
      socketId,
      userId,
      username,
      avatar,
      symbol: "1", // Host is player 1
    };

    const room: GameRoom = {
      roomId,
      gameType,
      status: "waiting",
      players: [hostPlayer],
      board: null,
      moves: [],
      currentPlayerId: userId, // Host starts first
      winnerId: null,
    };

    this.rooms.set(roomId, room);
    console.log(`[RoomManager] Room created: ${roomId} by user: ${username} (${userId})`);
    return room;
  }

  // Join an existing room
  public joinRoom(
    socketId: string,
    userId: string,
    username: string,
    avatar: string,
    roomId: string
  ): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (room.status !== "waiting" || room.players.length >= 2) {
      return null;
    }

    // Check if player is already in room
    if (room.players.some((p) => p.userId === userId)) {
      return room;
    }

    const guestPlayer: Player = {
      socketId,
      userId,
      username,
      avatar,
      symbol: "2", // Guest is player 2
    };

    room.players.push(guestPlayer);
    room.status = "active";
    
    // Choose start player (host starts by default, but let's make it explicitly host)
    room.currentPlayerId = room.players[0].userId;

    this.rooms.set(roomId, room);
    console.log(`[RoomManager] User: ${username} joined Room: ${roomId}. Status: active.`);
    return room;
  }

  // Get active room by ID
  public getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  // Handle a play move
  public async makeMove(
    roomId: string,
    userId: string,
    board: any,
    moves: any[],
    nextPlayerId: string,
    isGameOver: boolean,
    winnerSymbol: string | null
  ): Promise<{ room: GameRoom; dbUpdated: boolean } | null> {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== "active") return null;

    // Verify it is this player's turn
    if (room.currentPlayerId !== userId) {
      console.warn(`[RoomManager] User ${userId} tried to move out of turn in Room ${roomId}`);
      return null;
    }

    room.board = board;
    room.moves = moves;
    room.currentPlayerId = nextPlayerId;

    let dbUpdated = false;

    if (isGameOver) {
      room.status = "finished";
      let winnerId: string | null = null;

      if (winnerSymbol) {
        const winnerPlayer = room.players.find((p) => p.symbol === winnerSymbol);
        if (winnerPlayer) {
          winnerId = winnerPlayer.userId;
          room.winnerId = winnerId;
        }
      }

      await this.saveMatchResult(room, winnerId);
      dbUpdated = true;
      
      // Clean up room after saving
      this.rooms.delete(roomId);
    }

    return { room, dbUpdated };
  }

  // Handle player disconnects
  public async handleDisconnect(socketId: string): Promise<{ room: GameRoom; remainingPlayerSocket: string } | null> {
    let affectedRoom: GameRoom | null = null;
    let disconnectedPlayer: Player | null = null;

    for (const [_, room] of this.rooms.entries()) {
      const idx = room.players.findIndex((p) => p.socketId === socketId);
      if (idx !== -1) {
        affectedRoom = room;
        disconnectedPlayer = room.players[idx];
        break;
      }
    }

    if (!affectedRoom || !disconnectedPlayer) return null;

    const roomId = affectedRoom.roomId;

    if (affectedRoom.status === "waiting") {
      // Lobby creator disconnected before anyone joined, discard room
      this.rooms.delete(roomId);
      console.log(`[RoomManager] Empty room ${roomId} deleted due to host disconnect.`);
      return null;
    }

    if (affectedRoom.status === "active") {
      // One player disconnected during gameplay, award victory to remaining player
      affectedRoom.status = "finished";
      const remainingPlayer = affectedRoom.players.find((p) => p.socketId !== socketId);
      
      if (remainingPlayer) {
        affectedRoom.winnerId = remainingPlayer.userId;
        console.log(`[RoomManager] User ${disconnectedPlayer.username} disconnected. User ${remainingPlayer.username} wins by forfeit.`);
        
        await this.saveMatchResult(affectedRoom, remainingPlayer.userId);
        
        this.rooms.delete(roomId);
        return {
          room: affectedRoom,
          remainingPlayerSocket: remainingPlayer.socketId,
        };
      }
    }

    return null;
  }

  // Save the match results to SQLite database
  private async saveMatchResult(room: GameRoom, winnerId: string | null): Promise<void> {
    try {
      const player1Id = room.players[0].userId;
      const player2Id = room.players[1].userId;

      console.log(`[RoomManager] Saving match: P1=${player1Id}, P2=${player2Id}, Winner=${winnerId}`);

      // 1. Create match record
      await prisma.match.create({
        data: {
          gameType: room.gameType,
          status: "COMPLETED",
          player1Id,
          player2Id,
          winnerId,
          startedAt: new Date(),
          endedAt: new Date(),
          movesJson: JSON.stringify(room.moves),
        },
      });

      // 2. Update stats and levels in SQLite for both players
      if (winnerId) {
        // Winner gets +150 XP, +1 Win
        await prisma.user.update({
          where: { id: winnerId },
          data: {
            xp: { increment: 150 },
            wins: { increment: 1 },
          },
        });

        // Loser gets +30 XP, +1 Loss
        const loserId = room.players.find((p) => p.userId !== winnerId)?.userId;
        if (loserId) {
          await prisma.user.update({
            where: { id: loserId },
            data: {
              xp: { increment: 30 },
              losses: { increment: 1 },
            },
          });
        }
      } else {
        // Draw: both get +50 XP, +1 Draw
        await prisma.user.updateMany({
          where: { id: { in: [player1Id, player2Id] } },
          data: {
            xp: { increment: 50 },
            draws: { increment: 1 },
          },
        });
      }

      // 3. Recalculate levels for both players based on new XP (level = Math.floor(xp / 500) + 1)
      const users = await prisma.user.findMany({
        where: { id: { in: [player1Id, player2Id] } },
      });

      for (const u of users) {
        const calculatedLevel = Math.floor(u.xp / 500) + 1;
        if (calculatedLevel !== u.level) {
          await prisma.user.update({
            where: { id: u.id },
            data: { level: calculatedLevel },
          });
        }
      }

      console.log(`[RoomManager] Database metrics successfully updated for game: ${room.roomId}`);
    } catch (err) {
      console.error("[RoomManager] Error saving match to DB:", err);
    }
  }
}

export const roomManager = new RoomManager();
