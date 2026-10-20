import { describe, expect, it } from 'vitest';
import { Chess, validateFen } from 'chess.js';
import type { Square } from 'chess.js';
import { encounterById, encounters } from '../src/encounters';
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
    [3, ['g1h1'], []],
    [4, ['e1g1'], []],
    [5, ['d5d6', 'd6e7'], ['a5']],
    [6, ['a5b7', 'b7d8'], ['Kb8']],
    [7, ['e5d6'], []],
    [8, ['e2e8', 'e1e8'], ['Rxe8']],
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

  it.each(encounters)('following live hints clears $name', (encounter) => {
      const session = new Session(encounter);
      for (let i = 0; i < 10 && session.result === 'playing'; i++) {
        const hint = session.hint();
        expect(hint.square).toBeDefined(); expect(hint.target).toBeDefined();
        session.play(hint.square!, hint.target!);
        session.reply();
      }
      expect(session.result).toBe('won');
  }, 20_000);

  it('the pinned knight cannot capture the pawn or dodge its advance', () => {
    const session = new Session(encounterById('pin'));
    const black = new Chess(session.encounter.fen.replace(' w ', ' b '));
    expect(black.moves({ square: 'e7' })).toEqual([]);
    play(session, 'd5d6');
    expect(session.chess.moves({ square: 'e7' })).toEqual([]);
  });

  it('wins the queen after every legal response to the discovered check', () => {
    const start = new Chess(encounterById('discovery').fen);
    start.move('Nb7+');
    for (const reply of start.moves({ verbose: true })) {
      const session = new Session(encounterById('discovery'));
      play(session, 'a5b7'); session.chess.move(reply);
      const capture = session.legalMoves('b7').find((move) => move.captured === 'q');
      expect(capture, `Queen must be capturable after ${reply.san}`).toBeDefined();
      play(session, capture!.lan);
      expect(session.discovered).toBe(true);
      expect(session.result).toBe('won');
    }
  });

  it('requires a prior discovered check, not an unrelated knight capture', () => {
    const capture = new Session({ ...encounterById('discovery'), fen: 'k2q4/1N6/2K5/8/8/8/8/7R w - - 0 1' });
    play(capture, 'b7d8');
    expect(capture.discovered).toBe(false);
    expect(capture.objectiveComplete).toBe(false);
  });

  it('castling rights are retained after a pawn move and restored by undo after a king move', () => {
    const session = new Session(encounterById('castle'));
    play(session, 'g2g3'); expect(session.result).toBe('playing'); session.undo();
    play(session, 'e1f1'); expect(session.result).toBe('lost');
    expect(session.failureReason).toContain('castling');
    session.undo(); expect(session.chess.getCastlingRights('w').k).toBe(true);
    play(session, 'e1g1'); expect(session.result).toBe('won');
    session.undo(); expect(session.chess.get('h1')?.type).toBe('r');
  });

  it('explains an expired en passant opportunity and restores it with undo', () => {
    const session = new Session(encounterById('en-passant'));
    play(session, 'e5e6');
    expect(session.result).toBe('lost'); expect(session.failureReason).toContain('immediately');
    session.undo(); play(session, 'e5d6');
    expect(session.chess.get('d5')).toBeUndefined(); expect(session.result).toBe('won');
  });

  it('does not award the pawn-pin goal for a rook capture', () => {
    const session = new Session(encounterById('pin'));
    play(session, 'e1e7');
    expect(session.objectiveComplete).toBe(false); expect(session.result).toBe('lost');
    session.undo(); expect(session.result).toBe('playing');
  });

  it('the back-rank sacrifice forces the defending rook onto e8', () => {
    const session = new Session(encounterById('back-rank'));
    play(session, 'e2e8');
    expect(session.chess.moves()).toEqual(['Rxe8']);
    expect(session.result).toBe('playing');
    session.reply(); play(session, 'e1e8');
    expect(session.chess.isCheckmate()).toBe(true);
    expect(session.result).toBe('won');
  });

  it('updates tactical explanations after a pin advance, a queen block, and the boss sacrifice', () => {
    const pin = new Session(encounterById('pin'));
    play(pin, 'd5d6'); pin.reply();
    expect(pin.hint()).toMatchObject({ square: 'd6', target: 'e7' });
    expect(pin.hint().text).not.toContain('Push d5');
    const discovery = new Session(encounterById('discovery'));
    play(discovery, 'a5b7'); discovery.chess.move('Qa5');
    expect(discovery.hint()).toMatchObject({ square: 'b7', target: 'a5' });
    expect(discovery.hint().text).not.toContain('queen on d8');
    const boss = new Session(encounterById('back-rank'));
    play(boss, 'e2e8'); boss.reply();
    expect(boss.hint().text).toContain('rook');
    expect(boss.hint().text).not.toContain('Your queen can');
  });
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
  it('keeps the original three clears and unlocks the first added lesson', () => {
    const saved = parseProgress('{"version":1,"completed":["horsie","escort","bishop"],"bonuses":["horsie","bishop"]}');
    expect(saved.completed).toEqual(['horsie','escort','bishop']);
    expect(saved.bonuses).toEqual(['horsie','bishop']);
    expect(isUnlocked(saved,3)).toBe(true);
    expect(isUnlocked(saved,4)).toBe(false);
  });

  it('unlocks and round-trips the full expanded campaign without skipping lessons', () => {
    let saved = emptyProgress();
    for (const [index,e] of encounters.entries()) {
      expect(isUnlocked(saved,index)).toBe(true);
      saved = complete(saved,e.id,true);
    }
    expect(saved.completed).toHaveLength(9);
    expect(parseProgress(JSON.stringify(saved))).toEqual(saved);
  });
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
