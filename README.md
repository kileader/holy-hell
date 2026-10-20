# Holy Hell!

A small, humorous chess-learning game: real chess rules, ridiculous rivals, and three authored encounters. Built to test whether short tactical challenges and a longer boss hunt make a welcoming first chess game.

Holy Hell! is a standalone prototype. Chess Lab remains the personal game-analysis and study project. Positions use FEN, and moves retain standard SAN/UCI notation, so a future connection is possible without coupling the apps today.

## Play locally

Use Node.js 22.12+ (Node 24 recommended) and npm. In PowerShell:

```powershell
cd 'C:\Users\kevin\projects\holy-hell!'
npm install
npm run dev
```

Open the Local URL printed by Vite, normally **http://127.0.0.1:5173/**. No account, server API, chess engine download, or credentials are needed. Fonts and artwork are bundled locally; the game makes no external service calls.

```powershell
npm test          # Behavior, rules integration, encounter solutions, and progression
npm run build    # TypeScript check and production build
npm run preview  # Serve the production build locally
```

Opening `index.html` directly is not supported; use the development or preview server. Deploy the generated `dist/` folder to a static web host. Hosting has not been configured in this prototype.

## The three encounters

| Encounter | Objective | Teaching focus |
| --- | --- | --- |
| Horsie Havoc | Fork the king and rook, then capture the rook with the knight | Knight movement, forcing checks, forks |
| Royal Escort | Promote the pawn | King support, safe pawn advances, promotion choices |
| Bishop Sniper — Boss | Capture the enemy bishop | Diagonal sight lines, opening paths, forcing moves |

You play White. Click an ivory piece, then a highlighted destination. Dots mean legal moves; rings mean captures. The dark pieces reply automatically. The rules library handles captures, check, checkmate, draws, castling, en passant, and promotion. A checkmate against the opponent also clears an encounter.

Hints are optional and suggest a legal move from the current position. The fork hints explain the specific double attack; promotion and boss hints use a slightly deeper local search. They are teaching suggestions, not a guarantee of optimal play in every position.

Mistakes continue as real chess. A lost knight/pawn can make its objective impossible, and normal chess game endings stop the attempt. **Undo** restores your last move and the opponent's reply, including captures and promotion. **Retry** restarts the current encounter. Both remain available after a loss or draw. Retrying while the opponent is thinking cancels the pending reply.

Clear an encounter to unlock the next one. An optional star rewards clearing within its listed move count without hints or undo. Stars and unlocks are saved in this browser; active boards are not. Replaying never removes earned stars. **How to play → Start a fresh campaign** clears the saved campaign. If browser storage is unavailable, progress still works for the current visit.

Keyboard: Tab to the board, arrow keys to navigate, Enter/Space to select a square, Escape to deselect. Native dialogs support Escape and focus containment. Confetti respects reduced-motion settings. Bishop sight lines have a striped pattern as well as color, and square labels describe pieces and legal destinations.

## Implementation

- **Vite + TypeScript:** static browser app with no application framework or backend.
- **[chess.js](https://github.com/jhlywa/chess.js):** the authority for chess legality and game state; BSD-2-Clause licensed.
- **Local opponent:** deterministic, two-ply alpha-beta search with material and encounter-specific evaluation. Hint suggestions use three plies. This is a small beginner opponent, not Stockfish or a rated competitor.
- **Vitest:** meaningful behavior and rules-boundary tests, including solutions against the actual opponent.
- **Original SVG placeholders:** characters, pieces, and icons drawn in code, with no external image dependencies.
- **Fonts:** Barlow Condensed and DM Sans, bundled through Fontsource under the SIL Open Font License. The production build includes [third-party license notices](public/THIRD_PARTY_NOTICES.txt).

```text
src/encounters.ts  Authored positions, missions, dialogue, and lessons
src/game.ts        Rules integration, objectives, opponent, hints, undo
src/progress.ts    Sequential unlocks and validated local-save format
src/art.ts         Original SVG characters, chess pieces, and icons
src/main.ts        Board interaction and UI rendering
src/style.css      Responsive presentation and reduced-motion behavior
tests/game.test.ts Encounter solutions and behavior regression checks
```

See [the prototype verification record](docs/verification.md) for tested flows and the remaining human playtest questions.

## What to playtest

1. Can a complete beginner understand selection, legal moves, and captures without coaching?
2. Does the two-move knight fork teach the idea, or reveal it too quickly?
3. Does Royal Escort communicate *why* the king needs to support the pawn?
4. Does the longer bishop hunt feel like a boss? The current opponent is deliberately simple and may repeat defensive moves.
5. Are the hints helpful without doing all the thinking, and is the humor working?

The move-count stars are optional, and the boss is intentionally asymmetric in material. This first version tests the encounter loop; it does not establish learning transfer or promise rating gains. There is no procedural campaign, deckbuilding, opening trainer, account system, analytics, music, or paid AI integration.

<details>
<summary>Developer spoilers: tested solutions</summary>

These lines are legal and complete each objective against the deterministic local opponent. The tests also verify that the opening knight fork wins the rook after every legal king defense.

- **Horsie Havoc:** `1. Nc7+ Kd7 2. Nxa8`
- **Royal Escort:** `1. Kd6 Kg6 2. Ke7 Kf5 3. e6 Ke5 4. Kd7 Kf6 5. e7 Ke5 6. e8=Q+`
- **Bishop Sniper:** `1. a4 Ba7 2. b4 Bb6 3. c4 Ba7 4. d4 Bb6 5. e4 Ba7 6. Qg4 Bb6 7. Qc8+ Bd8 8. Qxd8#`

The solutions demonstrate solvability against this opponent. They are not claims of optimal play against a strong chess engine.

</details>
