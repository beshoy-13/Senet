import { GameLogic, Move } from '../types';

const DICTIONARY = new Set([
  'AAH', 'AAL', 'AAS', 'ABA', 'ABO', 'ABS', 'ABY', 'ACE', 'ACT', 'ADD', 'ADO', 'ADS', 'ADZ', 'AFF', 'AFT', 'AGA', 'AGE', 'AGO', 'AHA', 'AID', 'AIL', 'AIM', 'AIN', 'AIR', 'AIS', 'AIT', 'ALA', 'ALB', 'ALE', 'ALL', 'ALP', 'ALS', 'ALT', 'AMA', 'AMI', 'AMP', 'AMU', 'ANA', 'AND', 'ANE', 'ANI', 'ANT', 'ANY', 'APE', 'APT', 'ARB', 'ARC', 'ARE', 'ARF', 'ARK', 'ARM', 'ARS', 'ART', 'ASH', 'ASK', 'ASP', 'ASS', 'ATE', 'ATT', 'AUK', 'AVA', 'AVE', 'AVO', 'AWA', 'AWE', 'AWL', 'AWN', 'AXE', 'AYE', 'AYS', 'AZO', 'BAA', 'BAD', 'BAG', 'BAH', 'BAL', 'BAM', 'BAN', 'BAP', 'BAR', 'BAS', 'BAT', 'BAY', 'BED', 'BEE', 'BEG', 'BEL', 'BEN', 'BET', 'BEY', 'BIB', 'BID', 'BIG', 'BIN', 'BIO', 'BIS', 'BIT', 'BIZ', 'BOA', 'BOB', 'BOD', 'BOG', 'BOO', 'BOP', 'BOS', 'BOT', 'BOW', 'BOX', 'BOY', 'BRA', 'BRO', 'BRR', 'BUB', 'BUD', 'BUG', 'BUM', 'BUN', 'BUR', 'BUS', 'BUT', 'BUY', 'BYE', 'BYS', 'CAB', 'CAD', 'CAM', 'CAN', 'CAP', 'CAR', 'CAT', 'CAW', 'CAY', 'CEE', 'CEL', 'CEP', 'CHI', 'CIS', 'COB', 'COD', 'COG', 'COL', 'CON', 'COO', 'COP', 'COR', 'COS', 'COT', 'COW', 'COX', 'COY', 'COZ', 'CRY', 'CUB', 'CUD', 'CUE', 'CUM', 'CUP', 'CUR', 'CUT', 'CWM', 'DAB', 'DAD', 'DAG', 'DAH', 'DAK', 'DAL', 'DAM', 'DAP', 'DAW', 'DAY', 'DEB', 'DEE', 'DEL', 'DEN', 'DEV', 'DEW', 'DEX', 'DEY', 'DIB', 'DID', 'DIE', 'DIG', 'DIM', 'DIN', 'DIP', 'DIS', 'DIT', 'DOC', 'DOE', 'DOG', 'DOL', 'DOM', 'DON', 'DOR', 'DOS', 'DOT', 'DOW', 'DRY', 'DUB', 'DUD', 'DUE', 'DUG', 'DUI', 'DUN', 'DUO', 'DUP', 'DYE', 'EAR', 'EAT', 'EAU', 'EBB', 'ECU', 'EDH', 'EEL', 'EFF', 'EFS', 'EFT', 'EGG', 'EGO', 'EKE', 'ELD', 'ELF', 'ELK', 'ELL', 'ELM', 'ELS', 'EME', 'EMF', 'EMS', 'EMU', 'END', 'ENG', 'ENS', 'EON', 'ERA', 'ERE', 'ERG', 'ERN', 'ERR', 'ERS', 'ESS', 'ETA', 'ETH', 'EVE', 'EWE', 'EYE', 'FAD', 'FAG', 'FAN', 'FAR', 'FAS', 'FAT', 'FAX', 'FAY', 'FED', 'FEE', 'FEH', 'FEM', 'FEN', 'FER', 'FET', 'FEU', 'FEW', 'FEY', 'FEZ', 'FIB', 'FID', 'FIE', 'FIG', 'FIL', 'FIN', 'FIR', 'FIT', 'FIX', 'FIZ', 'FLU', 'FLY', 'FOB', 'FOE', 'FOG', 'FOH', 'FON', 'FOP', 'FOR', 'FOU', 'FOW', 'FOX', 'FRY', 'FUB', 'FUD', 'FUG', 'FUN', 'FUR', 'GAB', 'GAD', 'GAG', 'GAL', 'GAP', 'GAS', 'GAY', 'GEM', 'GET', 'GIG', 'GIN', 'GNU', 'GOB', 'GOD', 'GOO', 'GOT', 'GOW', 'GOY', 'GUM', 'GUN', 'GUT', 'GUY', 'GYM', 'GYP', 'HAD', 'HAE', 'HAG', 'HAH', 'HAY', 'HEM', 'HEN', 'HER', 'HEW', 'HEX', 'HID', 'HIM', 'HIP', 'HIS', 'HIT', 'HOB', 'HOD', 'HOG', 'HOP', 'HOT', 'HOW', 'HOY', 'HUB', 'HUE', 'HUG', 'HUH', 'HUM', 'HUT', 'ICE', 'ICY', 'ILL', 'IMP', 'INK', 'INN', 'ION', 'IRE', 'IRK', 'ITS', 'IVY', 'JAB', 'JAG', 'JAM', 'JAR', 'JAW', 'JAY', 'JET', 'JIG', 'JOB', 'JOG', 'JOT', 'JOY', 'JUG', 'JUT', 'KAY', 'KEG', 'KEN', 'KEY', 'KID', 'KIN', 'KIT', 'LAB', 'LAC', 'LAD', 'LAG', 'LAP', 'LAW', 'LAX', 'LAY', 'LEA', 'LED', 'LEE', 'LEG', 'LET', 'LID', 'LIE', 'LIP', 'LIT', 'LOG', 'LOT', 'LOW', 'LUG', 'MAD', 'MAN', 'MAO', 'MAP', 'MAR', 'MAT', 'MAW', 'MAY', 'MEN', 'MET', 'MEW', 'MID', 'MIX', 'MOB', 'MOD', 'MOM', 'MOP', 'MOW', 'MUD', 'MUG', 'MUM', 'NAB', 'NAG', 'NAP', 'NAY', 'NET', 'NEW', 'NIL', 'NIP', 'NIT', 'NOB', 'NOD', 'NOR', 'NOT', 'NOW', 'NUB', 'NUN', 'NUT', 'OAK', 'OAR', 'OAT', 'ODD', 'ODE', 'OFF', 'OFT', 'OHM', 'OIL', 'OLD', 'ONE', 'OPT', 'ORB', 'ORE', 'OUR', 'OUT', 'OWE', 'OWL', 'OWN', 'PAD', 'PAL', 'PAN', 'PAP', 'PAR', 'PAT', 'PAW', 'PAY', 'PEA', 'PEG', 'PEN', 'PEP', 'PER', 'PET', 'PEW', 'PIE', 'PIG', 'PIN', 'PIT', 'PLY', 'POD', 'POP', 'POT', 'POW', 'PRO', 'PRY', 'PUB', 'PUG', 'PUN', 'PUP', 'PUS', 'PUT', 'RAG', 'RAM', 'RAN', 'RAP', 'RAT', 'RAW', 'RAY', 'RED', 'REF', 'REP', 'RIB', 'RID', 'RIG', 'RIM', 'RIP', 'ROB', 'ROD', 'ROE', 'ROT', 'ROW', 'RUB', 'RUG', 'RUM', 'RUN', 'RUT', 'RYE', 'SAB', 'SAD', 'SAG', 'SAP', 'SAT', 'SAW', 'SAY', 'SEA', 'SET', 'SEW', 'SHE', 'SHY', 'SIN', 'SIP', 'SIR', 'SIS', 'SIT', 'SIX', 'SKI', 'SKY', 'SLY', 'SOB', 'SOD', 'SON', 'SOP', 'SOT', 'SOW', 'SOY', 'SPA', 'SPY', 'STY', 'SUB', 'SUE', 'SUM', 'SUN', 'SUP', 'TAB', 'TAD', 'TAG', 'TAN', 'TAP', 'TAR', 'TAT', 'TAX', 'TEA', 'TEE', 'TEN', 'THE', 'THY', 'TIC', 'TIE', 'TIN', 'TIP', 'TOE', 'TON', 'TOO', 'TOP', 'TOT', 'TOW', 'TOY', 'TRY', 'TUB', 'TUG', 'TWO', 'URN', 'USE', 'VAN', 'VAT', 'VET', 'VIA', 'VIE', 'VOW', 'WAD', 'WAG', 'WAR', 'WAS', 'WAX', 'WAY', 'WEB', 'WED', 'WEE', 'WET', 'WHO', 'WHY', 'WIG', 'WIN', 'WIT', 'WOE', 'WOK', 'WON', 'WOO', 'WOW', 'YAK', 'YAM', 'YAP', 'YAW', 'YEA', 'YES', 'YET', 'YEW', 'YIN', 'YOU', 'ZAP', 'ZEN', 'ZIP', 'ZIT', 'ZOO',
]);

export const WordGameLogic: GameLogic = {
  checkWin: (board, _symbol) => {
    const check = (w: string) => DICTIONARY.has(w.toUpperCase());
    const b = board;
    // Rows
    for (let i = 0; i < 3; i++) {
      if (b[i][0] && b[i][1] && b[i][2]) if (check(b[i][0]! + b[i][1]! + b[i][2]!)) return true;
    }
    // Cols
    for (let j = 0; j < 3; j++) {
      if (b[0][j] && b[1][j] && b[2][j]) if (check(b[0][j]! + b[1][j]! + b[2][j]!)) return true;
    }
    // Diagonals
    if (b[0][0] && b[1][1] && b[2][2]) if (check(b[0][0]! + b[1][1]! + b[2][2]!)) return true;
    if (b[0][2] && b[1][1] && b[2][0]) if (check(b[0][2]! + b[1][1]! + b[2][0]!)) return true;
    return false;
  },

  isDraw: (board) => {
    return board.every((row) => row.every((cell) => cell !== null));
  },

  isValidMove: (board, x, y) => {
    return x >= 0 && x < 3 && y >= 0 && y < 3 && board[x][y] === null;
  },

  getInitialBoard: (_size) => {
    return Array(3).fill(null).map(() => Array(3).fill(null));
  },

  getRandomMove: (board) => {
    const available = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[i][j] === null) available.push({ x: i, y: j });
    if (available.length === 0) return null;
    const move = available[Math.floor(Math.random() * available.length)];
    return { ...move, symbol: 'E' };
  },

  getBestMove: (board, _currentPlayer) => {
    const letters = "ETAOINSRHLDCUMFPGWYBVKXJQZ";
    let bestScore = -Infinity;
    let bestMove: Move | null = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === null) {
          for (const L of letters) {
            let score = evaluateMove(board, i, j, L);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { x: i, y: j, symbol: L };
            }
            if (score >= 10000) return bestMove;
          }
        }
      }
    }
    return bestMove;
  },
};

function evaluateMove(board: (string | null)[][], r: number, c: number, letter: string): number {
  let score = 0;
  board[r][c] = letter;
  if (WordGameLogic.checkWin(board, letter)) {
    board[r][c] = null;
    return 10000;
  }
  
  // Blocking opponent win
  const letters = "ETAOINSRHLDCUMFPGWYBVKXJQZ";
  for (const L of letters) {
    if (WordGameLogic.checkWin(board, L)) { // This is not quite right logic but similar to C++ blocks_opponent_win
       // score += 5000; 
    }
  }

  board[r][c] = null;
  return score;
}
