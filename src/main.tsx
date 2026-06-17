import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GameProvider } from "./context/GameContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>,
);
