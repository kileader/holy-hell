import type { Move, Square } from 'chess.js';

export const VICTORY_BOARD_MS = 3200;

/** Keep the final board visible for the full interval, excluding time in menus. */
export class VictoryReveal {
  private timer?: ReturnType<typeof setTimeout>;
  private remaining = 0;
  private started = 0;
  private reveal?: () => void;

  get active(): boolean { return this.reveal !== undefined; }

  start(reveal: () => void): void {
    this.cancel();
    this.remaining = VICTORY_BOARD_MS;
    this.reveal = reveal;
    this.resume();
  }

  pause(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.remaining = Math.max(0, this.remaining - (performance.now() - this.started));
  }

  resume(): void {
    if (!this.reveal || this.timer !== undefined) return;
    this.started = performance.now();
    this.timer = setTimeout(() => {
      const reveal = this.reveal;
      this.cancel();
      reveal?.();
    }, this.remaining);
  }

  cancel(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.reveal = undefined;
    this.remaining = 0;
  }
}

/** Include the second piece in castling and the removed pawn in en passant. */
export function moveSquares(move: Move | undefined): Square[] {
  if (!move) return [];
  const squares = [move.from, move.to];
  const rank = move.from[1];
  if (move.isKingsideCastle()) squares.push(`h${rank}` as Square, `f${rank}` as Square);
  if (move.isQueensideCastle()) squares.push(`a${rank}` as Square, `d${rank}` as Square);
  if (move.isEnPassant()) squares.push(`${move.to[0]}${rank}` as Square);
  return squares;
}

export function victoryMoment(move: Move | undefined, checkmate: boolean): string {
  if (checkmate) return 'Checkmate! Holy hell!';
  if (move?.isKingsideCastle() || move?.isQueensideCastle()) {
    return `Castled! King ${move.to} · rook ${move.isKingsideCastle() ? 'f' : 'd'}${move.to[1]}`;
  }
  if (move?.promotion) return 'Promoted! New royalty just dropped.';
  if (move?.isEnPassant()) return 'En passant! Holy hell!';
  return 'Mission complete! Beautiful nonsense.';
}

export function confetti(): string {
  return `<div class="celebration" aria-hidden="true">${Array.from({ length: 36 }, (_, i) =>
    `<i style="--x:${(i * 37) % 100}%;--delay:${i % 9 * .1}s;--drift:${i % 2 ? '-' : ''}${20 + i % 5 * 12}px;--color:${['#ff7955', '#ffd36a', '#c0eed1', '#b6b2ff'][i % 4]}"></i>`).join('')}</div>`;
}
