import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { moveSquares, victoryMoment, VictoryReveal, VICTORY_BOARD_MS } from '../src/celebration';

describe('board-first victory', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the end position for the full celebration before opening the result', () => {
    const reveal = new VictoryReveal(); const popup = vi.fn();
    reveal.start(popup);
    vi.advanceTimersByTime(VICTORY_BOARD_MS - 1);
    expect(reveal.active).toBe(true); expect(popup).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(reveal.active).toBe(false); expect(popup).toHaveBeenCalledTimes(1);
  });

  it('preserves remaining board time while a menu is open or the tab is hidden', () => {
    const reveal = new VictoryReveal(); const popup = vi.fn();
    reveal.start(popup); vi.advanceTimersByTime(1200); reveal.pause(); reveal.pause();
    vi.advanceTimersByTime(10000); expect(popup).not.toHaveBeenCalled();
    reveal.resume(); reveal.resume(); vi.advanceTimersByTime(1999);
    expect(popup).not.toHaveBeenCalled(); vi.advanceTimersByTime(1);
    expect(popup).toHaveBeenCalledTimes(1);
  });

  it('undo, retry, or switching encounters cancels a pending popup', () => {
    const reveal = new VictoryReveal(); const popup = vi.fn();
    reveal.start(popup); vi.advanceTimersByTime(100); reveal.cancel(); reveal.resume();
    vi.advanceTimersByTime(10000);
    expect(popup).not.toHaveBeenCalled(); expect(reveal.active).toBe(false);
  });

  it('a new victory cannot trigger the previous encounter result', () => {
    const reveal = new VictoryReveal(); const old = vi.fn(); const current = vi.fn();
    reveal.start(old); vi.advanceTimersByTime(2000); reveal.start(current);
    vi.advanceTimersByTime(VICTORY_BOARD_MS);
    expect(old).not.toHaveBeenCalled(); expect(current).toHaveBeenCalledTimes(1);
  });
});

describe('compound move feedback', () => {
  it('shows both pieces and all four squares after kingside castling', () => {
    const chess = new Chess('r5k1/5ppp/8/8/8/8/5PPP/4K2R w K - 0 1');
    const move = chess.move('O-O');
    expect(chess.get('g1')?.type).toBe('k'); expect(chess.get('f1')?.type).toBe('r');
    expect(moveSquares(move)).toEqual(['e1', 'g1', 'h1', 'f1']);
    expect(victoryMoment(move, false)).toBe('Castled! King g1 · rook f1');
  });
  it('handles queenside castling for the opponent', () => {
    const chess = new Chess('r3k3/8/8/8/8/8/8/4K3 b q - 0 1');
    const move = chess.move('O-O-O');
    expect(moveSquares(move)).toEqual(['e8', 'c8', 'a8', 'd8']);
  });
  it('highlights the pawn removed by en passant', () => {
    const chess = new Chess('6k1/8/8/3pP3/8/8/8/6K1 w - d6 0 2');
    const move = chess.move('exd6');
    expect(moveSquares(move)).toEqual(['e5', 'd6', 'd5']);
    expect(victoryMoment(move, false)).toBe('En passant! Holy hell!');
  });
});
