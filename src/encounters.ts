import type { Square } from 'chess.js';

export type EncounterId = 'horsie' | 'escort' | 'bishop' | 'check' | 'castle' | 'pin' | 'discovery' | 'en-passant' | 'back-rank' | 'material' | 'activity' | 'pawn-chain' | 'space';
export type Portrait = 'horsie' | 'escort' | 'bishop' | 'white-bishop' | 'king' | 'rook' | 'baron';

export interface Encounter {
  id: EncounterId;
  name: string;
  subtitle: string;
  concept: string;
  objective: string;
  fen: string;
  character: string;
  characterRole: string;
  portrait: Portrait;
  boss?: boolean;
  missionTitle: string;
  goalLabel: string;
  hintIntro: string;
  setup?: string;
  previousMove?: { from: Square; to: Square };
  dialogue: string;
  lesson: string;
  victory: string;
  victoryLine: string;
  par: number;
}

export const encounters: readonly Encounter[] = [
  {
    id: 'horsie', name: 'Horsie Havoc', subtitle: 'One horsie. Zero chill.',
    concept: 'The knight fork', objective: 'Fork the king and rook, then take the rook with your knight.',
    fen: 'r3k3/p4ppp/8/1N6/8/8/5PPP/6K1 w - - 0 1',
    character: 'Sir Neighs-a-Lot', characterRole: 'YOUR WHITE KNIGHT', dialogue: 'Knightmare fuel. Now available in ivory.',
    portrait: 'horsie', missionTitle: 'Make it a double.', goalLabel: 'Capture the rook after a fork',
    hintIntro: 'Look for checks and keep your knight safe; you can also undo.',
    lesson: 'A fork attacks two pieces at once. Check makes the king move first, leaving the other piece behind. Knights jump over pieces: two squares one way, then one sideways.',
    victory: 'FORK AROUND. FIND OUT.', victoryLine: 'Knightmare fuel. One king running. One rook missing.', par: 2,
  },
  {
    id: 'escort', name: 'Royal Escort', subtitle: 'Small pawn. Big ambitions.',
    concept: 'Pawn promotion', objective: 'Escort your pawn to the far edge and promote it.',
    fen: '8/5k2/8/3KP3/8/8/8/8 w - - 0 1',
    character: 'Pip, Future Overlord', characterRole: 'YOUR WHITE PAWN', dialogue: 'Pawn storm incoming. It’s just me. I’m the storm.',
    portrait: 'escort', missionTitle: 'Get Pip promoted.', goalLabel: 'Reach rank 8',
    hintIntro: 'Keep your king close to the pawn. Don’t rush into the enemy king’s reach.',
    lesson: 'Pawns move one square forward and capture diagonally. At the far edge, they become a queen, rook, bishop, or knight. Bring your king along to keep the enemy king away.',
    victory: 'PROMOTED TO A PROBLEM.', victoryLine: 'New piece just dropped. Pip immediately demands a bigger crown.', par: 6,
  },
  {
    id: 'bishop', name: 'Bishop Sniper', subtitle: 'No mercy. Very large hat.',
    concept: 'Diagonals & coordination', objective: 'Hunt down and capture the enemy bishop. Watch its diagonals.',
    fen: '6k1/5ppp/8/2b5/8/8/PPPPPPPP/RN1Q2K1 w - - 0 1',
    character: 'Bishop Deadeye', characterRole: 'ENEMY BISHOP · BOSS', dialogue: 'I went on vacation. I came back with a scope.',
    portrait: 'bishop', boss: true, missionTitle: 'Take out the sniper.', goalLabel: 'Capture the bishop',
    hintIntro: 'Use the diagonal overlay to spot the sniper’s sight lines. Checks can force its king to respond.',
    lesson: 'Bishops slide along diagonals and always stay on the same square color. Pieces block their line of sight. Open a path for your queen, then use checks and threats to corner the sniper.',
    victory: 'CALL THE EXORCIST.', victoryLine: 'Bishop went on vacation. Never came back.', par: 8,
  },
  {
    id: 'check', name: 'Check Yourself', subtitle: 'Alive is a good opening.',
    concept: 'Escaping check', objective: 'Get your king out of check. Find a square the enemy cannot attack.',
    fen: '2k3r1/8/8/1b6/8/8/5P1P/R5K1 w - - 0 1',
    character: 'King Reginald', characterRole: 'YOUR WHITE KING', portrait: 'king',
    dialogue: 'What do I do in this position? Preferably survive.',
    missionTitle: 'Long live you.', goalLabel: 'Escape check safely',
    hintIntro: 'The rook attacks the g-file. The bishop covers f1. Your king needs a different escape square.',
    lesson: 'In check, your king is attacked. Your next move must capture the attacker, block its line, or move your king to safety. A king cannot escape onto another attacked square.',
    victory: 'STILL MAJESTIC. STILL ALIVE.', victoryLine: 'New response just dropped: move the king somewhere safe.', par: 1,
  },
  {
    id: 'castle', name: 'Castle Crash Course', subtitle: 'Two pieces. One royal evacuation.',
    concept: 'Castling & king safety', objective: 'Castle kingside: move your king from e1 to g1. The rook moves with him.',
    fen: 'r5k1/5ppp/8/8/8/8/5PPP/4K2R w K - 0 1',
    character: 'King Reginald', characterRole: 'YOUR WHITE KING', portrait: 'king',
    dialogue: 'Rook in the corner? Not for long.',
    missionTitle: 'Royal relocation.', goalLabel: 'Castle kingside',
    hintIntro: 'Select your king, then g1. Castling moves the king two squares; the rook hops to f1.',
    lesson: 'Castling moves your king two squares toward a rook, which hops beside it. Both must be unmoved, the path clear, and the king cannot be in, cross, or land in check.',
    victory: 'KING DELIVERED.', victoryLine: 'The rook left the corner. World domination is now a team project.', par: 1,
  },
  {
    id: 'pin', name: 'Pin & Punishment', subtitle: 'That horsie is going nowhere.',
    concept: 'The absolute pin', objective: 'Use your pawn to capture the knight pinned in front of its king.',
    fen: '4k3/p3n2p/8/3P4/8/8/8/4R1K1 w - - 0 1',
    character: 'Rook Norris', characterRole: 'YOUR WHITE ROOK', portrait: 'rook',
    dialogue: 'Actual zombie. That horsie legally cannot leave.',
    missionTitle: 'No horsie escapes.', goalLabel: 'Take the knight with a pawn',
    hintIntro: 'Push d5 to d6 to attack the knight. It cannot leave the e-file while your rook pins it to the king.',
    lesson: 'A piece pinned to its king cannot move off that line. Push the pawn to attack the pinned knight, then take it. Your rook keeps their king behind the knight.',
    victory: 'PIN IT TO WIN IT.', victoryLine: 'Actual zombie removed. The pawn did not need an exorcist.', par: 2,
  },
  {
    id: 'discovery', name: 'Discovered Drama', subtitle: 'The horsie was hiding a cannon.',
    concept: 'Discovered check', objective: 'Move the knight to uncover a rook check, then win the queen with your knight.',
    fen: 'k2q4/7p/2K5/N7/8/8/8/R7 w - - 0 1',
    character: 'Sir Neighs-a-Lot', characterRole: 'YOUR WHITE KNIGHT', portrait: 'horsie',
    dialogue: 'Knightmare fuel. Surprise rook included.',
    missionTitle: 'Reveal the cannon.', goalLabel: 'Discover check, then take the queen',
    hintIntro: 'Nb7 uncovers the rook’s check and attacks the queen on d8. Watch how the opponent answers the check.',
    lesson: 'A discovered check happens when moving one piece uncovers another piece’s attack on the king. Move your knight to uncover your rook, then use the forced reply to win the queen.',
    victory: 'SURPRISE. ALSO A ROOK.', victoryLine: 'New response just dropped. Their queen has left the chat.', par: 2,
  },
  {
    id: 'en-passant', name: 'En Passant Incident', subtitle: 'Google it. Then play it.',
    concept: 'En passant', objective: 'Capture the pawn that just rushed past Pip. Move e5 to d6.',
    setup: 'Black just played d7 → d5.', previousMove: { from: 'd7', to: 'd5' },
    fen: '6k1/8/8/3pP3/8/8/8/6K1 w - d6 0 2',
    character: 'Pip, Future Overlord', characterRole: 'YOUR WHITE PAWN', portrait: 'escort',
    dialogue: 'Google en passant.',
    missionTitle: 'Holy hell. It’s real.', goalLabel: 'Capture en passant',
    hintIntro: 'The black pawn passed through d6. Capture it by moving e5 to d6 now, even though d6 is empty.',
    lesson: 'When an enemy pawn advances two squares beside yours, your pawn may capture as if it advanced one. This en passant capture is legal only on your very next move.',
    victory: 'HOLY HELL!', victoryLine: 'New response just dropped. Their pawn just disappeared.', par: 1,
  },
  {
    id: 'back-rank', name: 'The Back-Rank Baron', subtitle: 'A fortress with no fire exit.',
    concept: 'Deflection & back-rank mate', objective: 'Checkmate the king behind its pawn wall. Use your queen and rook together.',
    fen: 'r3r1k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
    character: 'Baron von Backrank', characterRole: 'ENEMY ROOK · BOSS', portrait: 'baron', boss: true,
    dialogue: 'Rook’s in the corner, plotting world domination.',
    missionTitle: 'Breach the fortress.', goalLabel: 'Deliver checkmate',
    hintIntro: 'Your queen can take the e8 rook with check. After the other rook takes your queen, your rook can finish the job.',
    lesson: 'Their pawns block the king’s escape squares. Use a forcing check to lure a defender onto the back rank, then bring in your rook. Checkmate ends the game.',
    victory: 'FORTRESS: FORECLOSED.', victoryLine: 'Checkmate or riot? Checkmate. The queen knew what she was doing.', par: 2,
  },
  {
    id: 'material', name: 'Bishop Stonks', subtitle: 'Three points enter. Five points leave.',
    concept: 'Material & exchanges', objective: 'Trade your bishop for the rook on f7. After Black replies, come out at least two points better.',
    fen: '6k1/p4r1p/8/8/2B5/8/5PPP/6K1 w - - 0 1',
    character: 'Bishop Crossfire', characterRole: 'YOUR WHITE BISHOP', portrait: 'white-bishop',
    dialogue: 'Bishop goes on vacation. Returns with a hostile acquisition.',
    missionTitle: 'Profit, allegedly.', goalLabel: 'Win at least two points in the exchange',
    hintIntro: 'A bishop is about 3 points; a rook is 5. Look for the bishop capture, counting the king’s possible recapture too.',
    lesson: 'Typical values: pawn 1, knight or bishop 3, rook 5, queen 9. Trading a bishop for a rook gains about 2 points. Count the recapture too; king safety can matter more than points.',
    victory: 'STONKS. ACTUAL STONKS.', victoryLine: 'A rook for a bishop: about two points gained, even after the recapture.', par: 1,
  },
  {
    id: 'activity', name: 'Bishop Unboxed', subtitle: 'The hat would like to participate.',
    concept: 'Activity & development', objective: 'Open your bishop’s diagonal, develop it from c1 to f4, and keep it safe through Black’s reply.',
    fen: 'k7/pp6/8/8/8/6P1/1P1P1P1P/2B3K1 w - - 0 1',
    character: 'Bishop Crossfire', characterRole: 'YOUR WHITE BISHOP', portrait: 'white-bishop',
    dialogue: 'I have been behind this pawn since the invention of chess.',
    missionTitle: 'Let the hat cook.', goalLabel: 'Develop a safe, pawn-supported bishop to f4',
    hintIntro: 'Move the d2 pawn to open the diagonal. On f4 your bishop reaches into the center, protected by the g3 pawn.',
    lesson: 'An active piece reaches useful squares. Your bishop starts boxed in by pawns. Open its diagonal, then develop to f4: the g3 pawn protects it while it watches the center.',
    victory: 'VACATION IS OVER.', victoryLine: 'The bishop has a diagonal, pawn support, and absolutely no interest in desk work.', par: 2,
  },
  {
    id: 'pawn-chain', name: 'Chain Reaction', subtitle: 'Pip brought a union.',
    concept: 'Pawn structure & passed pawns', objective: 'Capture on d5 to create a passed pawn protected by another pawn. Keep the chain through Black’s reply.',
    fen: '6k1/p6p/8/3p4/2P1P3/8/5PPP/6K1 w - - 0 1',
    character: 'Pip, Future Overlord', characterRole: 'YOUR WHITE PAWNS', portrait: 'escort',
    dialogue: 'Pawn storm incoming. This time I actually brought coworkers.',
    missionTitle: 'No pawn left lonely.', goalLabel: 'Build a protected passed pawn on d5',
    hintIntro: 'Either c4 or e4 can capture d5. The other pawn will protect the pawn that lands there.',
    lesson: 'A passed pawn has no enemy pawn ahead on its file or either neighboring file. A pawn chain adds protection: after cxd5 or exd5, the remaining pawn supports d5 from behind.',
    victory: 'CONNECTED. PROTECTED.', victoryLine: 'Pip has backup and a clear pawn route. Still check for enemy pieces before advancing.', par: 1,
  },
  {
    id: 'space', name: 'Room Service', subtitle: 'The horsie’s rent just doubled.',
    concept: 'Space & pawn advances', objective: 'Advance e4 to e5, supported by d4. Claim new squares and keep both central pawns through Black’s reply.',
    fen: '6k1/p6p/5n2/3p4/3PP3/8/2B2PPP/6K1 w - - 0 1',
    character: 'Pip, Future Overlord', characterRole: 'YOUR WHITE PAWNS', portrait: 'escort',
    dialogue: 'Actual zoning dispute. The horsie can file an appeal.',
    missionTitle: 'Make some room.', goalLabel: 'Hold the supported d4–e5 pawn chain',
    hintIntro: 'e5 attacks the knight on f6 and controls d6 and f6. Your d4 pawn protects the advance.',
    lesson: 'Advanced pawns can control more territory and restrict enemy pieces. Here e5 gains d6 and f6, attacks the knight, and opens your bishop’s diagonal. Keep pawn support; pushing blindly can lose pawns.',
    victory: 'NEW LEASE JUST DROPPED.', victoryLine: 'More room for your pieces. Less room for theirs. Keep checking what your pawn moves leave behind.', par: 1,
  },
];

export function encounterById(id: EncounterId): Encounter {
  return encounters.find((encounter) => encounter.id === id)!;
}
