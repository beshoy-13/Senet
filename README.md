<div align="center">

# Senet — Multiplayer Browser Gaming Arena

**A full-stack real-time board game platform with AI opponents, online multiplayer, and a persistent competitive progression system**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

A cyberpunk-themed browser gaming platform hosting **20+ board games** — from Chess with a minimax AI engine to Minesweeper, Sudoku, Snakes & Ladders, Connect Four, and a full suite of Tic-Tac-Toe variants. Every session is tracked, every win recorded, and every XP point reflected instantly across your profile, match history, and the global leaderboard.

</div>

---

## About

Senet is a full-stack web application that turns classic board games into a competitive online experience. Players register, build a profile, and compete across a library of 20+ games either solo against an AI opponent, locally against a friend on the same screen, or online against other players in real time via Socket.IO rooms.

The platform is built around persistence — every completed game is recorded to the database, stats are updated atomically, and the match history log gives a full account of every session. The frontend is entirely React + TypeScript with a custom dark cyberpunk design system (no UI library), and the backend is a typed Express API with Prisma managing a SQLite database.

---

## Features

### Authentication & User Profiles

- JWT-based registration and login — tokens stored in `localStorage`, validated on every protected route
- Auto-generated robot avatars via DiceBear seeded from the username
- Persistent profile: XP, level, wins, losses, draws, and a full match history log
- Profile data refreshes after every game session

### Game Library — 20+ Games

#### Classic Solo Puzzles

| Game                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| **Chess Reborn**       | Full chess vs a minimax AI with an opening book and alpha-beta pruning |
| **Neon Sudoku**        | Procedurally generated 9×9 puzzles                                     |
| **DATA_CLEANER.SYS**   | Minesweeper — reveal cells, flag mines                                 |
| **NEON_OVERLOAD_2048** | Slide and merge tiles to reach 2048                                    |
| **STACK_PROTOCOLS**    | Solitaire — build foundations Ace to King                              |
| **SNAKES & LADDERS**   | Roll-the-die race to cell 100 (1–4 players)                            |

#### Classic Versus

| Game                | Description                          |
| ------------------- | ------------------------------------ |
| **Classic X-O**     | Standard 3×3 Tic-Tac-Toe             |
| **Four-in-a-Row**   | Drop pieces to connect 4 in a column |
| **5×5 Tic-Tac-Toe** | Extended grid, 3-in-a-row wins       |
| **4×4 Tic-Tac-Toe** | 4-in-a-row on a tighter board        |

#### Variant & Advanced

| Game                      | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| **Ultimate Tic-Tac-Toe**  | 9 mini-boards inside one meta-board                    |
| **Infinity Tic-Tac-Toe**  | Board expands dynamically as pieces are placed         |
| **Memory Tic-Tac-Toe**    | Positions hidden after placement — test your memory    |
| **Pyramid Tic-Tac-Toe**   | Played on a pyramid-shaped grid                        |
| **Diamond Tic-Tac-Toe**   | Diamond-shaped board layout                            |
| **Obstacles Tic-Tac-Toe** | Blocked cells force routing around barriers            |
| **Misère Tic-Tac-Toe**    | Reverse rules — whoever completes 3-in-a-row **loses** |
| **Word Tic-Tac-Toe**      | Place letters to form valid 3-letter words             |
| **Numerical Tic-Tac-Toe** | Players use odd/even numbers; sum of 3 wins            |
| **SUS Game**              | Score by completing S-U-S patterns on the board        |

### AI Engine

Every versus game ships with a dedicated AI opponent. Chess uses minimax with alpha-beta pruning, configurable depth, an evaluation heuristic based on material and position, and a built-in opening book for natural early-game play. Other games use game-specific strategies. All AI players have three selectable difficulty levels: **Easy**, **Medium**, and **Hard**.

### Real-Time Multiplayer

Online rooms powered by Socket.IO. Any versus game can be played online:

- A player creates a room and shares the Room ID
- The opponent joins via the Room ID
- Board state is synchronized in real time on every move
- If a player disconnects mid-game, the opponent receives an instant forfeit notification

### Progression & XP System

- Win vs human: **+150 XP** — Win vs AI: **+100–120 XP** — Draw: **+50 XP** — Loss: **+30 XP**
- XP accumulates into levels (1000 XP per level)
- Stats update **optimistically** in the UI immediately after each game, then sync with the backend
- Full match history shows every session: game type, opponent, result, and date

### Game Result Toast

A slide-in overlay appears after every session showing:

- Result label (VICTORY / DEFEAT / DRAW / SOLVED)
- XP earned
- Session duration
- Quick actions: **BACK TO MENU** or **PLAY AGAIN**

### Global Leaderboard

All registered players ranked by XP and wins. Updates after every recorded match.

### Friends System

Add and manage friends. Online presence indicator shows who is currently connected, powered by Socket.IO's user tracking.

### Dashboard

- Stat cards: total XP, level, wins, losses, draws
- Recent matches widget: last 4 games with result, opponent, and date
- Trending game cards
- Quick-launch buttons to jump into any game

---

## Tech Stack

| Layer              | Technology                                           |
| ------------------ | ---------------------------------------------------- |
| Frontend           | React 19, TypeScript, Vite 6                         |
| Styling            | Custom CSS design system — no UI library             |
| State management   | React Context API                                    |
| Real-time (client) | Socket.IO client                                     |
| Backend            | Node.js, Express, TypeScript                         |
| ORM                | Prisma                                               |
| Database           | SQLite (`dev.db`)                                    |
| Authentication     | JWT (`jsonwebtoken`) + password hashing (`bcryptjs`) |
| Real-time (server) | Socket.IO server                                     |
| Dev tooling        | `ts-node`, `nodemon`                                 |

---

## Architecture

### Frontend — Presenter / Model Pattern

Each game's board logic is isolated into its own model class. A shared `GamePresenter` drives move validation, AI turns, win detection, and state transitions. The React layer only handles rendering and user input — game logic is framework-agnostic.

```
src/
├── architecture/
│   ├── interfaces/          ← IGameModel, IGamePresenter
│   ├── players/             ← HumanPlayer, AIPlayer, OnlinePlayer
│   └── presenters/
│       └── GamePresenter.ts ← Drives all game state transitions
│
├── games/
│   ├── logic/               ← One model class per game
│   │   ├── Chess.ts         ← Minimax + alpha-beta + opening book
│   │   ├── ConnectFour.ts
│   │   ├── XO.ts
│   │   └── ...
│   ├── ai.ts                ← Shared AI utilities
│   ├── audio.ts             ← AudioManager (SFX + mute state)
│   ├── index.ts             ← GAMES registry
│   └── tutorial.ts          ← Per-game tutorial steps
│
├── components/
│   ├── GameBoard.tsx         ← Renders any game's board + game result toast
│   ├── GameMenu.tsx          ← Game selection grid
│   ├── PlayerSetup.tsx       ← Mode selection (local / vs AI / online)
│   ├── AuthForm.tsx          ← Login + register
│   ├── Leaderboard.tsx       ← Global rankings
│   ├── Settings.tsx          ← Theme, difficulty, audio
│   └── Tutorial.tsx          ← Step-by-step how-to-play overlay
│
├── context/
│   ├── AuthContext.tsx       ← User, token, matchHistory, recordMatch()
│   ├── GameContext.tsx       ← currentGame, players, gameState, scores
│   └── SocketContext.tsx     ← Socket.IO connection, room management
│
└── App.tsx                   ← View router: dashboard / arena / history / stats / friends
```

### Backend

```
server/src/
├── index.ts              ← Express app, Socket.IO server, room event handlers
├── prisma.ts             ← PrismaClient singleton
├── middleware/
│   └── authMiddleware.ts ← JWT verification, attaches userId to request
├── routes/
│   ├── authRoutes.ts     ← POST /register, POST /login, GET /profile, GET /leaderboard
│   ├── gameRoutes.ts     ← POST /games/record
│   └── friendRoutes.ts   ← GET /, POST /add, DELETE /remove
└── game/
    └── roomManager.ts    ← In-memory room state, move handling, disconnect logic
```

### Database Schema

```
User         (id, email, username, passwordHash, avatar, xp, level, wins, losses, draws)

Match        (id, gameType, status, player1Id, player2Id?, winnerId?, startedAt, endedAt, movesJson?)
             player2Id is nullable — solo/AI games have no opponent user row

Friendship   (id, userId, friendId, createdAt)
             @@unique([userId, friendId])
```

### Data Flow — Game Session

```
Player makes a move
       │
       ▼
GameBoard.tsx (React)
  → handleMove(x, y)
       │
       ▼
GamePresenter.ts
  → model.isValidMove(board, x, y, currentPlayer, moves)
  → model.makeMove(board, x, y, currentPlayer, symbol)
  → model.checkWin(board, symbol)
  → model.isDraw(board)
  → setGameState({ board, currentPlayer, gameStatus, winner })
       │
       ▼
  if online: SocketContext.sendMove(board, moves, nextPlayer, isOver, winner)
                    → socket.emit("game:move", ...) → server → opponent
       │
       ▼
  if gameStatus !== 'active':
    AuthContext.recordMatch({ gameType, opponent, result, xpEarned, duration })
      → optimistic UI update (matchHistory, user stats)
      → POST /api/games/record → prisma.match.create() + prisma.user.update()
      → refreshProfile() replaces optimistic data with server-confirmed data
```

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint       | Auth | Description                                                    |
| ------ | -------------- | ---- | -------------------------------------------------------------- |
| `POST` | `/register`    | No   | Create account. Body: `{ email, username, password, avatar? }` |
| `POST` | `/login`       | No   | Sign in. Body: `{ identifier, password }` (email or username)  |
| `GET`  | `/profile`     | Yes  | Returns `{ user, matchHistory[] }`                             |
| `GET`  | `/leaderboard` | No   | Top 20 players sorted by XP                                    |

### Games — `/api/games`

| Method | Endpoint  | Auth | Description                                                                         |
| ------ | --------- | ---- | ----------------------------------------------------------------------------------- |
| `POST` | `/record` | Yes  | Record a completed game. Body: `{ gameType, opponent, result, xpEarned, duration }` |

### Friends — `/api/friends`

| Method   | Endpoint  | Auth | Description                         |
| -------- | --------- | ---- | ----------------------------------- |
| `GET`    | `/`       | Yes  | List all friends with online status |
| `POST`   | `/add`    | Yes  | Add a friend by username            |
| `DELETE` | `/remove` | Yes  | Remove a friendship                 |

### Socket.IO Events

| Event               | Direction          | Payload                                                                    |
| ------------------- | ------------------ | -------------------------------------------------------------------------- |
| `user:online`       | Client → Server    | `{ userId }`                                                               |
| `room:create`       | Client → Server    | `{ userId, username, avatar, gameType }`                                   |
| `room:join`         | Client → Server    | `{ userId, username, avatar, roomId }`                                     |
| `game:move`         | Client → Server    | `{ roomId, userId, board, moves, nextPlayerId, isGameOver, winnerSymbol }` |
| `room:created`      | Server → Client    | `room`                                                                     |
| `room:joined`       | Server → Client    | `room`                                                                     |
| `game:start`        | Server → Both      | `room`                                                                     |
| `game:update`       | Server → Both      | `room`                                                                     |
| `game:over`         | Server → Both      | `room`                                                                     |
| `game:forfeit`      | Server → Remaining | `room`                                                                     |
| `users:online_list` | Server → All       | `userId[]`                                                                 |

---

## Project Structure

```
Senet/
│
├── src/                          ← React frontend
│   ├── App.tsx                   ← Main view router + header + sidebar
│   ├── main.tsx                  ← React entry point
│   ├── architecture/             ← Presenter/Model pattern interfaces and classes
│   ├── components/               ← All React components
│   ├── context/                  ← Auth, Game, Socket contexts
│   ├── games/                    ← Game registry, logic models, AI, audio
│   ├── styles/index.css          ← Full custom CSS design system
│   └── types/index.ts            ← Shared TypeScript types
│
├── server/                       ← Express backend
│   ├── src/
│   │   ├── index.ts              ← Server entry, Socket.IO setup
│   │   ├── prisma.ts             ← PrismaClient singleton
│   │   ├── middleware/           ← JWT auth middleware
│   │   ├── routes/               ← auth, games, friends
│   │   └── game/                 ← roomManager.ts
│   ├── prisma/
│   │   ├── schema.prisma         ← DB schema
│   │   ├── migrations/           ← Migration history
│   │   └── dev.db                ← SQLite database file
│   ├── package.json
│   └── tsconfig.json
│
├── index.html                    ← Vite HTML entry
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Installation & Running

### Prerequisites

| Tool    | Version |
| ------- | ------- |
| Node.js | 18+     |
| npm     | 9+      |

---

### Frontend

```bash
# Clone the repo
git clone https://github.com/beshoy-13/senet.git
cd senet

# Install dependencies
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000" > .env

# Start dev server
npm run dev
```

Runs on `http://localhost:5173`

---

### Backend

```bash
cd server

# Install dependencies
npm install

# Create .env
cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your_secret_key_here"
PORT=5000
EOF

# Run database migrations (creates tables)
npx prisma migrate dev --name init

# Start dev server
npm run dev
```

Runs on `http://localhost:5000`

---

### Production Build

```bash
# Frontend
npm run build        # outputs to dist/

# Backend — compile TypeScript
cd server
npx tsc
node dist/index.js
```

---

## Troubleshooting

| Error                                | Cause                                            | Fix                                                            |
| ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------- |
| `VITE_API_URL` not set               | Frontend can't reach backend                     | Add `VITE_API_URL=http://localhost:5000` to `.env`             |
| `DATABASE_URL` not set               | Prisma can't find the DB                         | Add `DATABASE_URL="file:./prisma/dev.db"` to `server/.env`     |
| `Cannot find module '../prisma'`     | Import style mismatch                            | Use `import { prisma } from "../prisma"` (named export)        |
| `player2Id not assignable to string` | Old Prisma client generated before schema change | Run `npx prisma migrate dev` to regenerate client              |
| Socket not connecting                | CORS mismatch                                    | Set `FRONTEND_URL` in server `.env` to match your frontend URL |
| `Login failed` after register        | Token not stored                                 | Check `localStorage` for `cyber_arena_token`                   |
| Match history not updating           | Backend `POST /api/games/record` missing         | Ensure `gameRoutes.ts` is registered in `index.ts`             |

---

## Team

| Name              | GitHub                                     |
| ----------------- | ------------------------------------------ |
| _Beshoy Fomail_   | [@beshoy-13](https://github.com/beshoy-13) |
| _Youssef Ibrahim_ | —                                          |

---

<div align="center">

_Senet — Named after the ancient Egyptian board game — one of the oldest games ever discovered_

</div>
