import { describe, expect, it } from 'vitest';
import { Chess, validateFen } from 'chess.js';
import type { Square } from 'chess.js';
import { encounters } from '../src/encounters';
import { Session, bishopSight, chooseMove } from '../src/game';
import type { Promotion } from '../src/game';
import { complete, emptyProgress, isUnlocked, parseProgress } from '../src/progress';

function play(session: Session, lan: string): void {
  const move = session.play(lan.slice(0, 2) as Square, lan.slice(2, 4) as Square, lan[4] as Promotion | undefined);
  expect(move, `Expected ${lan} to be legal in ${session.chess.fen()}`).toBeDefined();
}

describe('authored encounters', () => {
  for (const encounter of encounters) {
    it(`${encounter.name} starts in a valid, playable chess position`, () => {
      expect(validateFen(encounter.fen).ok).toBe(true);
      const session = new Session(encounter);
      const blackKing = session.chess.board().flat().find((piece) => piece?.color === 'b' && piece.type === 'k')!;
      expect(session.chess.isAttacked(blackKing.square, 'w')).toBe(false);
      expect(session.chess.turn()).toBe('w');
      expect(session.result).toBe('playing');
    });
  }

  const solutions: Array<[number, string[], string[]]> = [
    [0, ['b5c7', 'c7a8'], ['Kd7']],
    [1, ['d5d6', 'd6e7', 'e5e6', 'e7d7', 'e6e7', 'e7e8q'], ['Kg6', 'Kf5', 'Ke5', 'Kf6', 'Ke5']],
    [2, ['a2a4', 'b2b4', 'c2c4', 'd2d4', 'e2e4', 'd1g4', 'g4c8', 'c8d8'], ['Ba7', 'Bb6', 'Ba7', 'Bb6', 'Ba7', 'Bb6', 'Bd8']],
  ];
  for (const [index, moves, replies] of solutions) {
    it(`${encounters[index].name} can be cleared against the actual opponent`, () => {
      const session = new Session(encounters[index]);
      const actualReplies: string[] = [];
      for (const lan of moves) {
        play(session, lan);
        const reply = session.reply();
        if (reply) actualReplies.push(reply.san);
      }
      expect(actualReplies).toEqual(replies);
      expect(session.result).toBe('won');
      expect(session.whiteMoves).toBe(moves.length);
      expect(session.bonus).toBe(true);
      expect(session.reply()).toBeUndefined();
    });
  }

  it('the knight fork wins the rook after every legal king defense', () => {
    const board = new Chess(encounters[0].fen);
    board.move('Nc7+');
    for (const reply of board.moves({ verbose: true })) {
      const session = new Session(encounters[0]);
      play(session, 'b5c7');
      expect(session.forked).toBe(true);
      session.chess.move(reply);
      play(session, 'c7a8');
      expect(session.result).toBe('won');
    }
  });

  it('a safe off-solution move continues; an exposed knight can be captured and undone', () => {
    const session = new Session(encounters[0]);
    play(session, 'b5c3');
    session.reply();
    expect(session.result).toBe('playing');
    expect(session.undo()).toBe(true);
    play(session, 'b5a7');
    expect(session.reply()?.san).toBe('Rxa7');
    expect(session.result).toBe('lost');
    session.undo();
    expect(session.chess.fen()).toBe(encounters[0].fen);
    expect(session.result).toBe('playing');
  });

  it('taking a rook without first finding a fork does not satisfy the fork mission', () => {
    const session = new Session({ ...encounters[0], fen: 'r3k3/p4ppp/1N6/8/8/8/5PPP/6K1 w - - 0 1' });
    play(session, 'b6a8');
    expect(session.forked).toBe(false);
    expect(session.result).not.toBe('won');
  });

  it.each(['q', 'r', 'b', 'n'] as const)('promotion to %s completes the goal, including underpromotion draws', (promotion) => {
    const session = new Session({ ...encounters[1], fen: 'k7/4P3/4K3/8/8/8/8/8 w - - 0 1' });
    play(session, `e7e8${promotion}`);
    expect(session.chess.get('e8')?.type).toBe(promotion);
    expect(session.result).toBe('won');
    session.undo();
    expect(session.chess.get('e7')?.type).toBe('p');
  });

  it('boss sight lines stop at blocking pieces', () => {
    const session = new Session(encounters[2]);
    const sight = bishopSight(session.chess);
    expect([...sight].sort()).toEqual(['a3', 'a7', 'b4', 'b6', 'd4', 'd6', 'e3', 'e7', 'f2', 'f8'].sort());
    expect(sight.has('g1')).toBe(false);
  });

  it('the first fork hint gives a legal move and updates after the enemy reply', () => {
    const session = new Session(encounters[0]);
    expect(session.hint()).toMatchObject({ square: 'b5', target: 'c7' });
    play(session, 'b5c7'); session.reply();
    expect(session.hint()).toMatchObject({ square: 'c7', target: 'a8' });
    expect(session.bonus).toBe(false);
  });

  it('following live hints clears promotion and the boss', () => {
    for (const encounter of encounters.slice(1)) {
      const session = new Session(encounter);
      for (let i = 0; i < 10 && session.result === 'playing'; i++) {
        const hint = session.hint();
        expect(hint.square).toBeDefined(); expect(hint.target).toBeDefined();
        session.play(hint.square!, hint.target!);
        session.reply();
      }
      expect(session.result).toBe('won');
    }
  }, 20_000);
});

describe('rules integration and state recovery', () => {
  it('rejects illegal moves, enemy moves, and extra input on the enemy turn', () => {
    const session = new Session(encounters[0]);
    const initial = session.chess.fen();
    expect(session.play('b5', 'b6')).toBeUndefined();
    expect(session.play('e8', 'e7')).toBeUndefined();
    expect(session.chess.fen()).toBe(initial);
    play(session, 'b5c7');
    expect(session.play('g2', 'g3')).toBeUndefined();
  });

  it('enforces check and permits only legal king escapes', () => {
    const session = new Session({ ...encounters[0], fen: '4r1k1/8/8/8/8/8/P7/1N2K3 w - - 0 1' });
    expect(session.chess.isCheck()).toBe(true);
    expect(session.play('a2', 'a3')).toBeUndefined();
    expect(session.legalMoves('b1')).toHaveLength(0);
    play(session, 'e1d1');
    expect(session.chess.isCheck()).toBe(false);
  });

  it('passes castling through the rules library and undoes both pieces', () => {
    const fen = 'r3k3/p7/8/8/8/8/8/RN2K2R w KQ - 0 1';
    const session = new Session({ ...encounters[0], fen });
    play(session, 'e1g1');
    expect(session.chess.get('f1')?.type).toBe('r');
    expect(session.chess.get('g1')?.type).toBe('k');
    session.undo();
    expect(session.chess.fen()).toBe(fen);
  });

  it('passes en passant through the rules library and restores the captured pawn', () => {
    const fen = 'r3k3/8/8/3pP3/8/8/8/1N2K3 w - d6 0 2';
    const session = new Session({ ...encounters[0], fen });
    play(session, 'e5d6');
    expect(session.chess.get('d5')).toBeUndefined();
    expect(session.history[0].captured).toBe('p');
    session.undo();
    expect(session.chess.get('d5')?.color).toBe('b');
    expect(session.chess.get('e5')?.color).toBe('w');
  });

  it('distinguishes checkmate from stalemate', () => {
    const mate = new Session({ ...encounters[0], fen: 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3' });
    expect(mate.chess.isCheckmate()).toBe(true);
    expect(mate.result).toBe('lost');
    const stale = new Session({ ...encounters[1], fen: 'K1k5/P7/8/8/8/8/8/8 w - - 0 1' });
    expect(stale.chess.isStalemate()).toBe(true);
    expect(stale.result).toBe('draw');
  });

  it('searching does not mutate board history, and undo restores a whole turn', () => {
    const session = new Session(encounters[0]);
    play(session, 'b5c7');
    const before = session.chess.fen();
    chooseMove(session.chess, 'horsie');
    expect(session.chess.fen()).toBe(before);
    expect(session.history).toHaveLength(1);
    session.reply(); session.undo();
    expect(session.chess.fen()).toBe(encounters[0].fen);
    expect(session.forked).toBe(false);
    expect(session.whiteMoves).toBe(0);
    expect(session.bonus).toBe(false);
  });
});

describe('progression and browser save validation', () => {
  it('unlocks encounters in order and retains an earned bonus when replayed', () => {
    let progress = emptyProgress();
    expect(isUnlocked(progress, 0)).toBe(true);
    expect(isUnlocked(progress, 1)).toBe(false);
    expect(complete(progress, 'bishop', true)).toEqual(progress);
    progress = complete(progress, 'horsie', true);
    expect(isUnlocked(progress, 1)).toBe(true);
    expect(isUnlocked(progress, 2)).toBe(false);
    progress = complete(progress, 'horsie', false);
    expect(progress.bonuses).toEqual(['horsie']);
    progress = complete(progress, 'escort', false);
    expect(isUnlocked(progress, 2)).toBe(true);
    expect(parseProgress(JSON.stringify(progress))).toEqual(progress);
  });

  it('recovers from missing, corrupt, unknown-version, or malformed saves', () => {
    for (const raw of [null, '', '{oops', 'null', '[]', '{"version":2}', '{"version":1,"completed":"bishop"}']) {
      expect(parseProgress(raw)).toEqual(emptyProgress());
    }
    expect(parseProgress('{"version":1,"completed":["horsie","bishop","unknown","horsie"],"bonuses":["bishop","horsie"]}'))
      .toEqual({ version: 1, completed: ['horsie'], bonuses: ['horsie'] });
  });
});
