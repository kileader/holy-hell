import { Chess, SQUARES } from 'chess.js';
import type { Move, PieceSymbol, Square } from 'chess.js';
import type { Encounter, EncounterId } from './encounters';

export const pieceNames: Record<PieceSymbol, string> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};
const value: Record<PieceSymbol, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export type Result = 'playing' | 'won' | 'lost' | 'draw';
export type Promotion = 'q' | 'r' | 'b' | 'n';

export function knightAttacks(from: Square, to: Square): boolean {
  const file = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const rank = Math.abs(Number(from[1]) - Number(to[1]));
  return (file === 1 && rank === 2) || (file === 2 && rank === 1);
}

export function isRookFork(move: Move): boolean {
  if (move.color !== 'w' || move.piece !== 'n') return false;
  const after = new Chess(move.after);
  return after.isCheck() && after.board().flat().some((piece) =>
    piece?.color === 'b' && piece.type === 'r' && knightAttacks(move.to, piece.square),
  );
}

/** Geometry of the boss's current sight lines, ending at the first blocker. */
export function bishopSight(chess: Chess): Set<Square> {
  const result = new Set<Square>();
  for (const piece of chess.board().flat()) {
    if (piece?.color !== 'b' || piece.type !== 'b') continue;
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      let file = piece.square.charCodeAt(0) - 97 + dx;
      let rank = Number(piece.square[1]) + dy;
      while (file >= 0 && file < 8 && rank >= 1 && rank <= 8) {
        const square = `${String.fromCharCode(97 + file)}${rank}` as Square;
        result.add(square);
        if (chess.get(square)) break;
        file += dx; rank += dy;
      }
    }
  }
  return result;
}

export function isDiscoveredCheck(move: Move): boolean {
  if (move.color !== 'w' || move.piece !== 'n') return false;
  const after = new Chess(move.after);
  const king = after.board().flat().find((piece) => piece?.color === 'b' && piece.type === 'k');
  return !!king && after.isCheck() && !knightAttacks(move.to, king.square);
}

function goalOnBoard(chess: Chess, id: EncounterId, lastMove?: Move, priorDiscovery = false): boolean {
  const pieces = chess.board().flat();
  if (id === 'bishop') return !pieces.some((piece) => piece?.color === 'b' && piece.type === 'b');
  if (id === 'escort') return pieces.some((piece) => piece?.color === 'w' && piece.type !== 'p' && piece.type !== 'k');
  if (id === 'back-rank') return chess.isCheckmate() && chess.turn() === 'b';
  if (lastMove?.color !== 'w') return false;
  if (id === 'check') {
    const king = pieces.find((piece) => piece?.color === 'w' && piece.type === 'k');
    return !!king && !chess.isAttacked(king.square, 'b');
  }
  if (id === 'castle') return lastMove.isKingsideCastle();
  if (id === 'pin') return lastMove.piece === 'p' && lastMove.captured === 'n';
  if (id === 'discovery') return priorDiscovery && lastMove.piece === 'n' && lastMove.captured === 'q';
  if (id === 'en-passant') return lastMove.isEnPassant();
  return false;
}

/** Only irreversible objective failures end an attempt before normal chess does. */
function missionFailure(chess: Chess, id: EncounterId): string | undefined {
  if (id === 'castle') return !chess.getCastlingRights('w').k ? 'Moving the king or its rook gives up kingside castling. Undo to restore that right.' : undefined;
  if (id === 'en-passant') return chess.fen().split(' ')[3] === '-' ? 'En passant must be played immediately after the two-square pawn move. Undo to reopen the opportunity.' : undefined;
  if (!['horsie', 'escort', 'pin', 'discovery'].includes(id)) return undefined;
  const pieces = chess.board().flat();
  const has = (color: 'w' | 'b', type: PieceSymbol) => pieces.some((piece) => piece?.color === color && piece.type === type);
  if ((id === 'horsie' || id === 'discovery') && !has('w', 'n')) return 'Your knight was captured. Undo to save it.';
  if ((id === 'escort' || id === 'pin') && !has('w', 'p')) return 'Your pawn is gone. Undo to try the mission again.';
  if (id === 'pin' && !has('b', 'n')) return 'The mission needs your pawn to take the knight. Undo to try that plan.';
  if (id === 'discovery' && !has('b', 'q')) return 'The mission needs your knight to win the queen after a discovered check. Undo to try that plan.';
  return undefined;
}

function evaluate(chess: Chess, id: EncounterId, lastMove?: Move, priorDiscovery = false): number {
  // Encounter goals take precedence over a draw caused by the final capture/underpromotion.
  if (goalOnBoard(chess, id, lastMove, priorDiscovery)) return 100_000;
  if (chess.isCheckmate()) return chess.turn() === 'b' ? 200_000 : -200_000;
  if (chess.isDraw()) return 0;
  if (missionFailure(chess, id)) return -100_000;
  let score = 0;
  let pawnSquare: Square | undefined;
  let whiteKing: Square | undefined;
  let blackKing: Square | undefined;
  for (const piece of chess.board().flat()) {
    if (!piece) continue;
    let worth = value[piece.type];
    if (id === 'bishop' && piece.type === 'b' && piece.color === 'b') worth = 1400;
    score += piece.color === 'w' ? worth : -worth;
    if (piece.type === 'p' && piece.color === 'w') {
      score += (Number(piece.square[1]) - 2) * (id === 'escort' ? 32 : 5);
      pawnSquare = piece.square;
    }
    if (piece.type === 'k') {
      if (piece.color === 'w') whiteKing = piece.square;
      else blackKing = piece.square;
    }
  }
  if (id === 'escort' && pawnSquare && whiteKing && blackKing) {
    const distance = (a: Square, b: Square) => Math.max(Math.abs(a.charCodeAt(0) - b.charCodeAt(0)), Math.abs(Number(a[1]) - Number(b[1])));
    const ahead = `${pawnSquare[0]}${Math.min(8, Number(pawnSquare[1]) + 1)}` as Square;
    score -= distance(whiteKing, ahead) * 14;
    score += distance(blackKing, pawnSquare) * 10;
    if (Number(whiteKing[1]) > Number(pawnSquare[1])) score += 20;
  }
  return score;
}

function orderedMoves(chess: Chess): Move[] {
  return chess.moves({ verbose: true }).sort((a, b) => {
    const priority = (move: Move) => (move.captured ? value[move.captured] : 0) + (move.promotion ? value[move.promotion] : 0) + (move.san.includes('+') ? 20 : 0);
    return priority(b) - priority(a) || a.lan.localeCompare(b.lan);
  });
}

function search(chess: Chess, id: EncounterId, depth: number, alpha: number, beta: number, lastMove: Move, priorDiscovery: boolean): number {
  if (depth === 0 || goalOnBoard(chess, id, lastMove, priorDiscovery) || missionFailure(chess, id) || chess.isGameOver()) return evaluate(chess, id, lastMove, priorDiscovery);
  const maximize = chess.turn() === 'w';
  const discovered = priorDiscovery || (id === 'discovery' && isDiscoveredCheck(lastMove));
  let best = maximize ? -Infinity : Infinity;
  for (const move of orderedMoves(chess)) {
    chess.move(move);
    const score = search(chess, id, depth - 1, alpha, beta, move, discovered);
    chess.undo();
    best = maximize ? Math.max(best, score) : Math.min(best, score);
    if (maximize) alpha = Math.max(alpha, best);
    else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/** A small, deterministic local opponent. Uses only legal moves, never a service. */
export function chooseMove(chess: Chess, id: EncounterId, depth = 2): Move | undefined {
  if (chess.isGameOver()) return undefined;
  const maximize = chess.turn() === 'w';
  const discovered = id === 'discovery' && chess.history({ verbose: true }).some(isDiscoveredCheck);
  let bestScore = maximize ? -Infinity : Infinity;
  let bestMove: Move | undefined;
  for (const move of orderedMoves(chess)) {
    chess.move(move);
    const score = search(chess, id, depth - 1, -Infinity, Infinity, move, discovered);
    chess.undo();
    if (!bestMove || (maximize ? score > bestScore : score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

export class Session {
  readonly encounter: Encounter;
  readonly chess: Chess;
  hintsUsed = 0;
  undosUsed = 0;

  constructor(encounter: Encounter) {
    this.encounter = encounter;
    this.chess = new Chess(encounter.fen);
  }

  get history(): Move[] { return this.chess.history({ verbose: true }); }
  get whiteMoves(): number { return this.history.filter((move) => move.color === 'w').length; }
  get forked(): boolean { return this.history.some(isRookFork); }
  get discovered(): boolean { return this.history.some(isDiscoveredCheck); }
  get objectiveComplete(): boolean {
    const history = this.history;
    if (this.encounter.id === 'horsie') return history.some((move, index) => move.color === 'w' && move.piece === 'n' && move.captured === 'r' && history.slice(0, index).some(isRookFork));
    if (this.encounter.id === 'discovery') return history.some((move, index) => move.color === 'w' && move.piece === 'n' && move.captured === 'q' && history.slice(0, index).some(isDiscoveredCheck));
    if (['check', 'castle', 'pin', 'en-passant'].includes(this.encounter.id)) return history.some((move) => goalOnBoard(new Chess(move.after), this.encounter.id, move));
    return goalOnBoard(this.chess, this.encounter.id);
  }
  get failureReason(): string | undefined { return this.objectiveComplete ? undefined : missionFailure(this.chess, this.encounter.id); }
  get result(): Result {
    if (this.objectiveComplete) return 'won';
    if (this.chess.isCheckmate()) return this.chess.turn() === 'b' ? 'won' : 'lost';
    if (this.chess.isDraw()) return 'draw';
    if (this.failureReason) return 'lost';
    return 'playing';
  }

  get bonus(): boolean { return this.hintsUsed === 0 && this.undosUsed === 0 && this.whiteMoves <= this.encounter.par; }

  legalMoves(square?: Square): Move[] {
    if (this.result !== 'playing' || this.chess.turn() !== 'w') return [];
    return square ? this.chess.moves({ square, verbose: true }) : this.chess.moves({ verbose: true });
  }

  play(from: Square, to: Square, promotion: Promotion = 'q'): Move | undefined {
    const legal = this.legalMoves(from).find((move) => move.to === to && (!move.promotion || move.promotion === promotion));
    return legal ? this.chess.move(legal) : undefined;
  }

  reply(): Move | undefined {
    if (this.result !== 'playing' || this.chess.turn() !== 'b') return undefined;
    const move = chooseMove(this.chess, this.encounter.id);
    return move ? this.chess.move(move) : undefined;
  }

  undo(): boolean {
    if (!this.history.length) return false;
    if (this.history.at(-1)?.color === 'b') this.chess.undo();
    this.chess.undo();
    this.undosUsed++;
    return true;
  }

  hint(): { text: string; square?: Square; target?: Square } {
    this.hintsUsed++;
    if (this.result !== 'playing') return { text: 'Use Undo to revisit the last decision, or Retry for a fresh board.' };
    if (this.chess.turn() === 'b') return { text: 'Let the opponent finish its move first.' };
    const moves = this.legalMoves();
    if (this.encounter.id === 'horsie') {
      const fork = moves.find(isRookFork);
      const capture = this.forked ? moves.find((move) => move.piece === 'n' && move.captured === 'r') : undefined;
      const move = capture ?? fork;
      if (move) return { text: capture ? `The king escaped, but the rook is still there. Move your knight from ${move.from} to ${move.to} and take it!` : `Try your knight from ${move.from} to ${move.to}. It checks the king and attacks the rook at the same time.`, square: move.from, target: move.to };
    }
    const move = chooseMove(this.chess, this.encounter.id, 3);
    if (!move) return { text: 'This position has ended. Undo or Retry to explore another approach.' };
    let intro = this.encounter.hintIntro;
    if (this.encounter.id === 'pin' && move.captured === 'n' && move.piece === 'p') intro = 'Your pawn can now take the knight. The pin gave you time to attack it.';
    if (this.encounter.id === 'discovery' && this.discovered) intro = 'Their response to your rook’s check left the queen within reach. Look for the knight capture.';
    if (this.encounter.id === 'castle' && !move.isKingsideCastle()) intro = 'Make the king’s route safe while keeping king and rook unmoved. You cannot castle in, through, or into check.';
    if (this.encounter.id === 'back-rank' && move.san.includes('#')) intro = 'The defender has been drawn away. Your rook can give check along the back rank, and the king has no escape.';
    return { text: `${intro} Try ${pieceNames[move.piece]} ${move.from} → ${move.to}${move.promotion ? ' and promote' : ''}.`, square: move.from, target: move.to };
  }
}

export function describeMove(move: Move): string {
  const action = move.captured ? `takes the ${pieceNames[move.captured]} on` : 'moves to';
  return `${pieceNames[move.piece]} ${move.from} ${action} ${move.to}${move.promotion ? `, promoting to ${pieceNames[move.promotion]}` : ''}${move.san.includes('#') ? ' — checkmate!' : move.san.includes('+') ? ' — check!' : ''}`;
}

export { SQUARES };
