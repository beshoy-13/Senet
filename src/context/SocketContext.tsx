import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SOCKET_SERVER_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000";

export interface SocketPlayer {
  socketId: string;
  userId: string;
  username: string;
  avatar: string;
  symbol: string; // "1" or "2"
}

export interface SocketRoom {
  roomId: string;
  gameType: string;
  status: "waiting" | "active" | "finished";
  players: SocketPlayer[];
  board: any;
  moves: any[];
  currentPlayerId: string;
  winnerId: string | null;
}

interface SocketContextType {
  socket: Socket | null;
  activeRoom: SocketRoom | null;
  opponent: SocketPlayer | null;
  connectionStatus: "disconnected" | "connecting" | "connected";
  mySymbol: string | null; // "1" (host) or "2" (guest)
  isMyTurn: boolean;
  connectionError: string | null;
  onlineUsers: string[];
  createRoom: (gameType: string) => void;
  joinRoom: (roomId: string) => void;
  sendMove: (board: any, moves: any[], nextPlayerId: string, isGameOver: boolean, winnerSymbol: string | null) => void;
  leaveRoom: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeRoom, setActiveRoom] = useState<SocketRoom | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (socket && connectionStatus === "connected" && user) {
      socket.emit("user:online", { userId: user.id });
    }
  }, [socket, connectionStatus, user]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });

    setSocket(newSocket);
    setConnectionStatus("connecting");

    newSocket.on("connect", () => {
      setConnectionStatus("connected");
      console.log("[Socket] Connected to server");
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
      console.log("[Socket] Disconnected from server");
    });

    newSocket.on("room:created", (room: SocketRoom) => {
      setActiveRoom(room);
      setConnectionError(null);
    });

    newSocket.on("room:joined", (room: SocketRoom) => {
      setActiveRoom(room);
      setConnectionError(null);
    });

    newSocket.on("room:update", (room: SocketRoom) => {
      setActiveRoom(room);
    });

    newSocket.on("game:start", (room: SocketRoom) => {
      setActiveRoom(room);
      setConnectionError(null);
    });

    newSocket.on("game:update", (room: SocketRoom) => {
      setActiveRoom(room);
    });

    newSocket.on("game:over", (room: SocketRoom) => {
      setActiveRoom(room);
    });

    newSocket.on("game:forfeit", (room: SocketRoom) => {
      setActiveRoom(room);
    });

    newSocket.on("room:error", (err: { message: string }) => {
      setConnectionError(err.message);
    });

    newSocket.on("users:online_list", (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createRoom = (gameType: string) => {
    if (!socket || !user) return;
    socket.emit("room:create", {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      gameType,
    });
  };

  const joinRoom = (roomId: string) => {
    if (!socket || !user) return;
    socket.emit("room:join", {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      roomId,
    });
  };

  const sendMove = (
    board: any,
    moves: any[],
    nextPlayerId: string,
    isGameOver: boolean,
    winnerSymbol: string | null
  ) => {
    if (!socket || !activeRoom || !user) return;
    socket.emit("game:move", {
      roomId: activeRoom.roomId,
      userId: user.id,
      board,
      moves,
      nextPlayerId,
      isGameOver,
      winnerSymbol,
    });
  };

  const leaveRoom = () => {
    setActiveRoom(null);
    setConnectionError(null);
    // Simple UI reset, socket disconnect/reconnect isn't required unless needed.
  };

  const clearError = () => {
    setConnectionError(null);
  };

  // Helper derivatives
  const myPlayerInfo = activeRoom?.players.find((p) => p.userId === user?.id) || null;
  const mySymbol = myPlayerInfo?.symbol || null;
  const opponent = activeRoom?.players.find((p) => p.userId !== user?.id) || null;
  const isMyTurn = activeRoom ? activeRoom.currentPlayerId === user?.id : false;

  return (
    <SocketContext.Provider
      value={{
        socket,
        activeRoom,
        opponent,
        connectionStatus,
        mySymbol,
        isMyTurn,
        connectionError,
        onlineUsers,
        createRoom,
        joinRoom,
        sendMove,
        leaveRoom,
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
