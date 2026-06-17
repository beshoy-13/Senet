import { Difficulty } from '../types';

export function getSmartMove(
  board: (string | null)[][], 
  currentPlayer: number, 
  difficulty: Difficulty,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[]
): { x: number; y: number; symbol?: string } | null {
  
  const symbol = currentPlayer === 1 ? 'X' : 'O';
  const opponent = currentPlayer === 1 ? 'O' : 'X';
  const size = board.length;

  if (difficulty === 'easy') {
    const available = getValidMoves(board, currentPlayer);
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  // Use MCTS for larger boards (5x5, 9x9) or complex games
  if (size > 4) {
    const iterations = difficulty === 'medium' ? 400 : 1000;
    return runMCTS(board, currentPlayer, iterations, checkWin, isDraw, getValidMoves);
  }

  if (difficulty === 'medium') {
    return minimaxDepthLimited(board, symbol, opponent, checkWin, isDraw, 3, getValidMoves, currentPlayer);
  }

  return alphabetaDepthLimited(board, symbol, opponent, checkWin, isDraw, 6, getValidMoves, currentPlayer);
}

// ==========================================
// Monte Carlo Tree Search (MCTS)
// ==========================================

class MCTSNode {
  state: (string | null)[][];
  player: number;
  parent: MCTSNode | null;
  children: MCTSNode[];
  wins: number;
  visits: number;
  move: { x: number; y: number } | null;

  constructor(state: (string | null)[][], player: number, parent: MCTSNode | null = null, move: { x: number; y: number } | null = null) {
    this.state = state;
    this.player = player;
    this.parent = parent;
    this.children = [];
    this.wins = 0;
    this.visits = 0;
    this.move = move;
  }

  isFullyExpanded(availableMoves: { x: number; y: number }[]): boolean {
    return this.children.length === availableMoves.length;
  }

  getBestChild(): MCTSNode {
    return this.children.reduce((best, current) => {
      const ucb1 = (node: MCTSNode) => {
        if (node.visits === 0) return Infinity;
        return node.wins / node.visits + 1.41 * Math.sqrt(Math.log(this.visits) / node.visits);
      };
      return ucb1(current) > ucb1(best) ? current : best;
    });
  }
}

function runMCTS(
  board: (string | null)[][],
  currentPlayer: number,
  iterations: number,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[]
): { x: number; y: number } | null {
  const root = new MCTSNode(board.map(row => [...row]), currentPlayer);
  const aiSymbol = currentPlayer === 1 ? 'X' : 'O';
  const opponentSymbol = currentPlayer === 1 ? 'O' : 'X';

  for (let i = 0; i < iterations; i++) {
    let node = root;
    let tempBoard = node.state.map(row => [...row]);
    let simPlayer = currentPlayer;

    // 1. Selection
    while (node.children.length > 0 && node.isFullyExpanded(getValidMoves(tempBoard, simPlayer))) {
      node = node.getBestChild();
      if (node.move) {
        tempBoard[node.move.x][node.move.y] = simPlayer === 1 ? 'X' : 'O';
      }
      simPlayer = simPlayer === 1 ? 2 : 1;
    }

    // 2. Expansion
    const availableMoves = getValidMoves(tempBoard, simPlayer);
    if (availableMoves.length > 0 && !checkWin(tempBoard, 'X') && !checkWin(tempBoard, 'O') && !isDraw(tempBoard)) {
      const untriedMoves = availableMoves.filter(m => !node.children.some(c => c.move?.x === m.x && c.move?.y === m.y));
      if (untriedMoves.length > 0) {
        const move = untriedMoves[Math.floor(Math.random() * untriedMoves.length)];
        const nextPlayer = simPlayer === 1 ? 2 : 1;
        const newNode = new MCTSNode(tempBoard.map(row => [...row]), nextPlayer, node, { x: move.x, y: move.y });
        node.children.push(newNode);
        node = newNode;
        tempBoard[move.x][move.y] = simPlayer === 1 ? 'X' : 'O';
        simPlayer = nextPlayer;
      }
    }

    // 3. Simulation (Rollout)
    let rolloutPlayer = simPlayer;
    while (!checkWin(tempBoard, 'X') && !checkWin(tempBoard, 'O') && !isDraw(tempBoard)) {
      const moves = getValidMoves(tempBoard, rolloutPlayer);
      if (moves.length === 0) break;
      const move = moves[Math.floor(Math.random() * moves.length)];
      tempBoard[move.x][move.y] = rolloutPlayer === 1 ? 'X' : 'O';
      rolloutPlayer = rolloutPlayer === 1 ? 2 : 1;
    }

    // 4. Backpropagation
    let winner = 0;
    if (checkWin(tempBoard, aiSymbol)) winner = currentPlayer;
    else if (checkWin(tempBoard, opponentSymbol)) winner = currentPlayer === 1 ? 2 : 1;

    let backNode: MCTSNode | null = node;
    while (backNode !== null) {
      backNode.visits++;
      const mover = backNode.parent ? backNode.parent.player : 0;
      if (winner === mover) backNode.wins++;
      else if (winner === 0) backNode.wins += 0.5;
      backNode = backNode.parent;
    }
  }

  if (root.children.length === 0) return null;
  const bestChild = root.children.reduce((best, curr) => curr.visits > best.visits ? curr : best);
  return bestChild.move;
}

function minimaxDepthLimited(
  board: (string | null)[][], 
  aiSymbol: string, 
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  depth: number,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[],
  currentPlayer: number
): { x: number; y: number } | null {
  const memo: Record<string, number> = {};
  let bestScore = -Infinity;
  let bestMove: { x: number; y: number } | null = null;
  const moves = getValidMoves(board, currentPlayer);

  for (const move of moves) {
    board[move.x][move.y] = aiSymbol;
    const score = minimaxFn(board, 0, false, aiSymbol, opponent, checkWin, isDraw, depth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1);
    board[move.x][move.y] = null;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = { x: move.x, y: move.y };
    }
  }
  return bestMove;
}

function minimaxFn(
  board: (string | null)[][], 
  depth: number, 
  isMaximizing: boolean, 
  aiSymbol: string, 
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  maxDepth: number,
  memo: Record<string, number>,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[],
  currentPlayer: number
): number {
  const key = JSON.stringify(board) + (isMaximizing ? 'M' : 'm');
  if (memo[key] !== undefined) return memo[key];

  if (checkWin(board, aiSymbol)) return 10 - depth;
  if (checkWin(board, opponent)) return depth - 10;
  if (isDraw(board)) return 0;
  if (depth >= maxDepth) return evaluatePosition(board, aiSymbol, opponent, checkWin);

  const moves = getValidMoves(board, currentPlayer);
  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of moves) {
      board[move.x][move.y] = aiSymbol;
      best = Math.max(best, minimaxFn(board, depth + 1, false, aiSymbol, opponent, checkWin, isDraw, maxDepth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1));
      board[move.x][move.y] = null;
    }
    memo[key] = best;
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      board[move.x][move.y] = opponent;
      best = Math.min(best, minimaxFn(board, depth + 1, true, aiSymbol, opponent, checkWin, isDraw, maxDepth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1));
      board[move.x][move.y] = null;
    }
    memo[key] = best;
    return best;
  }
}

function alphabetaDepthLimited(
  board: (string | null)[][], 
  aiSymbol: string, 
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  depth: number,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[],
  currentPlayer: number
): { x: number; y: number } | null {
  const memo: Record<string, number> = {};
  let bestScore = -Infinity;
  let bestMove: { x: number; y: number } | null = null;
  let alpha = -Infinity;
  let beta = Infinity;

  const moves = getValidMoves(board, currentPlayer);
  const sorted = sortMovesByHeuristic(board, moves, aiSymbol, opponent, checkWin);

  for (const move of sorted) {
    board[move.x][move.y] = aiSymbol;
    const score = alphaBetaFn(board, 0, false, aiSymbol, opponent, alpha, beta, checkWin, isDraw, depth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1);
    board[move.x][move.y] = null;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = { x: move.x, y: move.y };
    }
    alpha = Math.max(alpha, score);
  }
  return bestMove;
}

function alphaBetaFn(
  board: (string | null)[][], 
  depth: number, 
  isMaximizing: boolean, 
  aiSymbol: string, 
  opponent: string,
  alpha: number,
  beta: number,
  checkWin: (board: (string | null)[][], symbol: string) => boolean,
  isDraw: (board: (string | null)[][]) => boolean,
  maxDepth: number,
  memo: Record<string, number>,
  getValidMoves: (board: (string | null)[][], player: number) => { x: number; y: number }[],
  currentPlayer: number
): number {
  const key = JSON.stringify(board) + (isMaximizing ? 'M' : 'm');
  if (memo[key] !== undefined) return memo[key];

  if (checkWin(board, aiSymbol)) return 10 - depth;
  if (checkWin(board, opponent)) return depth - 10;
  if (isDraw(board)) return 0;
  if (depth >= maxDepth) return evaluatePosition(board, aiSymbol, opponent, checkWin);

  const moves = getValidMoves(board, currentPlayer);
  if (moves.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      board[move.x][move.y] = aiSymbol;
      const eval_ = alphaBetaFn(board, depth + 1, false, aiSymbol, opponent, alpha, beta, checkWin, isDraw, maxDepth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1);
      board[move.x][move.y] = null;
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) { memo[key] = maxEval; return maxEval; }
    }
    memo[key] = maxEval;
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      board[move.x][move.y] = opponent;
      const eval_ = alphaBetaFn(board, depth + 1, true, aiSymbol, opponent, alpha, beta, checkWin, isDraw, maxDepth, memo, getValidMoves, currentPlayer === 1 ? 2 : 1);
      board[move.x][move.y] = null;
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) { memo[key] = minEval; return minEval; }
    }
    memo[key] = minEval;
    return minEval;
  }
}

function sortMovesByHeuristic(
  board: (string | null)[][],
  moves: { x: number; y: number }[],
  aiSymbol: string,
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean
): { x: number; y: number }[] {
  return moves.sort((a, b) => {
    const scoreA = evaluateMove(board, [a.x, a.y], aiSymbol, opponent, checkWin);
    const scoreB = evaluateMove(board, [b.x, b.y], aiSymbol, opponent, checkWin);
    return scoreB - scoreA;
  });
}

function evaluateMove(
  board: (string | null)[][],
  [x, y]: [number, number],
  aiSymbol: string,
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean
): number {
  const testBoard = board.map(row => [...row]);
  testBoard[x][y] = aiSymbol;
  if (checkWin(testBoard, aiSymbol)) return 1000;
  testBoard[x][y] = opponent;
  if (checkWin(testBoard, opponent)) return 900;
  const center = Math.floor(board.length / 2);
  if (x === center && y === center) return 50;
  const size = board.length;
  if ((x === 0 || x === size - 1) && (y === 0 || y === size - 1)) return 25;
  return 0;
}

function evaluatePosition(
  board: (string | null)[][],
  aiSymbol: string,
  opponent: string,
  checkWin: (board: (string | null)[][], symbol: string) => boolean
): number {
  let score = 0;
  const size = board.length;
  const center = Math.floor(size / 2);
  const aiWinning = countWinningMoves(board, aiSymbol, checkWin);
  const oppWinning = countWinningMoves(board, opponent, checkWin);
  score += aiWinning * 10;
  score -= oppWinning * 12;
  if (board[center]?.[center] === aiSymbol) score += 3;
  else if (board[center]?.[center] === opponent) score -= 3;
  const corners: [number, number][] = [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]];
  for (const [cx, cy] of corners) {
    if (board[cx]?.[cy] === aiSymbol) score += 1;
    else if (board[cx]?.[cy] === opponent) score -= 1;
  }
  return score;
}

function countWinningMoves(board: (string | null)[][], symbol: string, checkWin: (board: (string | null)[][], symbol: string) => boolean): number {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j] === null) {
        board[i][j] = symbol;
        if (checkWin(board, symbol)) count++;
        board[i][j] = null;
      }
    }
  }
  return count;
}
