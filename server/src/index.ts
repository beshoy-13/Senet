import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173"]
  : ["*"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: allowedOrigins.includes("*")
      ? "*"
      : (origin: string | undefined, cb: Function) => {
          if (!origin || allowedOrigins.includes(origin)) cb(null, true);
          else cb(new Error("Not allowed by CORS"));
        },
  })
);
app.use(express.json());

import authRoutes from "./routes/authRoutes";
import friendRoutes from "./routes/friendRoutes";
import gameRoutes from "./routes/gameRoutes";

app.use("/api/auth", authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/games", gameRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

import { roomManager } from "./game/roomManager";

const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  socket.on("user:online", ({ userId }) => {
    (socket as any).userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("users:online_list", Array.from(onlineUsers.keys()));
  });

  socket.on("room:create", ({ userId, username, avatar, gameType }) => {
    const room = roomManager.createRoom(socket.id, userId, username, avatar, gameType);
    socket.join(room.roomId);
    socket.emit("room:created", room);
  });

  socket.on("room:join", ({ userId, username, avatar, roomId }) => {
    const room = roomManager.joinRoom(socket.id, userId, username, avatar, roomId);
    if (!room) {
      socket.emit("room:error", { message: "Room not found, finished, or already full." });
      return;
    }
    socket.join(roomId);
    socket.emit("room:joined", room);
    io.to(roomId).emit("room:update", room);
    io.to(roomId).emit("game:start", room);
  });

  socket.on("game:move", async ({ roomId, userId, board, moves, nextPlayerId, isGameOver, winnerSymbol }) => {
    const result = await roomManager.makeMove(roomId, userId, board, moves, nextPlayerId, isGameOver, winnerSymbol);
    if (!result) return;
    io.to(roomId).emit("game:update", result.room);
    if (isGameOver) {
      io.to(roomId).emit("game:over", result.room);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
    const userId = (socket as any).userId;
    if (userId) {
      onlineUsers.delete(userId);
      io.emit("users:online_list", Array.from(onlineUsers.keys()));
    }
    const result = await roomManager.handleDisconnect(socket.id);
    if (result) {
      io.to(result.remainingPlayerSocket).emit("game:forfeit", result.room);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Cyber Gaming Arena Server running on port ${PORT}`);
  console.log(`===============================================`);
});
