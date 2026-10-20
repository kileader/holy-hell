export type EncounterId = 'horsie' | 'escort' | 'bishop';

export interface Encounter {
  id: EncounterId;
  name: string;
  subtitle: string;
  concept: string;
  objective: string;
  fen: string;
  character: string;
  dialogue: string;
  lesson: string;
  victory: string;
  victoryLine: string;
  par: number;
}

export const encounters: readonly Encounter[] = [
  {
    id: 'horsie', name: 'Horsie Havoc', subtitle: 'One horsie. Two problems.',
    concept: 'The knight fork', objective: 'Fork the king and rook, then take the rook with your knight.',
    fen: 'r3k3/p4ppp/8/1N6/8/8/5PPP/6K1 w - - 0 1',
    character: 'Sir Neighs-a-Lot', dialogue: 'I move in an L. The L stands for your opponent’s loss.',
    lesson: 'A fork attacks two pieces at once. Check makes the king move first, leaving the other piece behind. Knights jump over pieces: two squares one way, then one sideways.',
    victory: 'FORK AROUND. FIND OUT.', victoryLine: 'One knight, two threats. Their king ran. Their rook did not.', par: 2,
  },
  {
    id: 'escort', name: 'Royal Escort', subtitle: 'Small pawn. Big ambitions.',
    concept: 'Pawn promotion', objective: 'Escort your pawn to the far edge and promote it.',
    fen: '8/5k2/8/3KP3/8/8/8/8 w - - 0 1',
    character: 'Pip, Future Management', dialogue: 'Today: pawn. Tomorrow: wildly overqualified.',
    lesson: 'Pawns move one square forward and capture diagonally. At the far edge, they become a queen, rook, bishop, or knight. Bring your king along to keep the enemy king away.',
    victory: 'PROMOTED TO A PROBLEM.', victoryLine: 'Pip reached the other side. The benefits package is outrageous.', par: 6,
  },
  {
    id: 'bishop', name: 'Bishop Sniper', subtitle: 'He brought a very serious hat.',
    concept: 'Diagonals & coordination', objective: 'Hunt down and capture the enemy bishop. Watch its diagonals.',
    fen: '6k1/5ppp/8/2b5/8/8/PPPPPPPP/RN1Q2K1 w - - 0 1',
    character: 'His Holiness, the Scope', dialogue: 'I can see you from across the board. Diagonally, obviously.',
    lesson: 'Bishops slide along diagonals and always stay on the same square color. Pieces block their line of sight. Open a path for your queen, then use checks and threats to corner the sniper.',
    victory: 'HAT CONFISCATED.', victoryLine: 'The diagonal menace has been relieved of his extremely tactical headwear.', par: 8,
  },
];

export function encounterById(id: EncounterId): Encounter {
  return encounters.find((encounter) => encounter.id === id)!;
}
