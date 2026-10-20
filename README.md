# Holy Hell!

A small, humorous chess-learning game: real chess rules, ridiculous characters, and nine authored encounters. Short lessons teach tactics and special moves, with two boss encounters to put ideas together.

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

Opening `index.html` directly is not supported; use the development or preview server. The generated `dist/` folder works on static web hosts.

## The nine encounters

| Encounter | Objective | Teaching focus |
| --- | --- | --- |
| Horsie Havoc | Fork the king and rook, then capture the rook with the knight | Knight movement, forcing checks, forks |
| Royal Escort | Promote the pawn | King support, safe pawn advances, promotion choices |
| Bishop Sniper — Boss | Capture the enemy bishop | Diagonal sight lines, opening paths, forcing moves |
| Check Yourself | Escape the rook check without stepping into the bishop's attack | Legal king escapes, check |
| Castle Crash Course | Castle kingside | Castling conditions, king safety |
| Pin & Punishment | Win the pinned knight with a pawn | Absolute pins, creating an attack |
| Discovered Drama | Uncover a rook check, then take the queen with the knight | Discovered checks, forcing replies |
| En Passant Incident | Capture the pawn that just advanced two squares | En passant and its one-move window |
| The Back-Rank Baron — Boss | Sacrifice the queen and finish with rook mate | Deflection, blocked escape squares, checkmate |

You play White. Click an ivory piece, then a highlighted destination. Dots mean legal moves; rings mean captures. The dark pieces reply automatically. The rules library handles captures, check, checkmate, draws, castling, en passant, and promotion. A checkmate against the opponent also clears an encounter.

Hints are optional and suggest a legal move from the current position. Tactical explanations change after the pin advance, discovered check, and boss sacrifice. Hints use a slightly deeper local search; they are teaching suggestions, not a guarantee of optimal play in every position.

Mistakes continue as real chess. A lost mission piece can make its objective impossible, and normal chess game endings stop the attempt. Moving the king/rook can forfeit castling; delaying en passant closes its immediate capture window. These failures explain what happened and offer Undo. **Undo** restores your last move and the opponent's reply, including captures, promotion, castling rights, and en passant. **Retry** restarts the current encounter. Retrying while the opponent is thinking cancels the pending reply.

Clear an encounter to unlock the next one. An optional star rewards clearing within its listed move count without hints or undo. Stars and unlocks are saved in this browser; active boards are not. Replaying never removes earned stars. Saves from the original three encounters retain their clears and unlock Check Yourself. Encounter selection uses pages of two cards to keep every control visible. **Menu → Encounters → Start a fresh campaign** clears the saved campaign. If browser storage is unavailable, progress still works for the current visit. Saves are local to each site origin; localhost and the published site have separate progress.

## Game view and controls

The board and controls fit a fixed game viewport. Missions, tactics, help, hints, history, and encounter selection open as short panels; help is paged. Opening a panel pauses a pending opponent reply. Narrow screens give the board the available space, with the mission in Briefing and bishop diagonals in the game menu.

Click **Fullscreen** or press **F** for browser fullscreen. A browser can require a mouse click or key press before allowing fullscreen; in an embedded panel that blocks it, open the game in a regular browser and use F11. **Menu → Theme** offers System, Light, and Dark. System follows the operating system; explicit choices persist locally.

| Action | Keyboard | Standard gamepad (Xbox labels) |
| --- | --- | --- |
| Move board cursor / menu focus | Arrow keys | D-pad / left stick |
| Select / confirm | Enter / Space | A |
| Cancel selection / close panel / open menu | Escape | B |
| Game menu | Escape with no selection | Start / Menu |
| Undo a turn | X | X |
| Hint | Y | Y |
| Mission & tactic | L | LB |
| Toggle bishop diagonals | V | RB |

Connect a controller and press then release a button to let the browser detect it. The game supports controllers exposed with the browser's **standard** mapping. It uses a stick dead zone, delayed direction repeat, and a neutral-input gate when connecting or returning to the window. The same confirm/back navigation works through promotion, victory, and menu panels; left/right changes the focused theme choice. Fullscreen should be entered with a click or keyboard gesture before using the controller.

Native dialogs contain focus. Confetti respects reduced-motion settings. Bishop sight lines have a striped pattern as well as color, and square labels describe pieces and legal destinations. Hardware controller feel and broader browser/device compatibility still need human playtesting.

## Implementation

- **Vite + TypeScript:** static browser app with no application framework or backend.
- **[chess.js](https://github.com/jhlywa/chess.js):** the authority for chess legality and game state; BSD-2-Clause licensed.
- **Local opponent:** deterministic, two-ply alpha-beta search with material and encounter-specific evaluation. Hint suggestions use three plies. This is a small beginner opponent, not Stockfish or a rated competitor.
- **Vitest:** meaningful behavior and rules-boundary tests, including solutions against the actual opponent.
- **Original SVG artwork:** Sir Neighs-a-Lot, Pip, King Reginald, and Rook Norris represent your pieces in ivory armor and white capes. Bishop Deadeye and Baron von Backrank wear dark enemy gear. Board pieces retain simple readable silhouettes.
- **Fonts:** Barlow Condensed and DM Sans, bundled through Fontsource under the SIL Open Font License. The production build includes [third-party license notices](public/THIRD_PARTY_NOTICES.txt).

```text
src/encounters.ts  Authored positions, missions, dialogue, and lessons
src/game.ts        Rules integration, objectives, opponent, hints, undo
src/progress.ts    Sequential unlocks and validated local-save format
src/controller.ts Standard gamepad mapping, neutral gate, and cursor navigation
src/art.ts         Original SVG characters, chess pieces, and icons
src/main.ts        Board interaction, panels, fullscreen, themes, and UI rendering
src/style.css      Fixed viewport, responsive presentation, and reduced motion
tests/game.test.ts Encounter solutions and behavior regression checks
tests/controller.test.ts Controller transitions, repeat timing, and board edges
```

See [the prototype verification record](docs/verification.md) for tested flows and the remaining human playtest questions.

The current runtime is sufficient for this board-based slice. Fullscreen and controller input do not require an engine migration. Revisit Godot if native packaging or more elaborate scene animation becomes a concrete priority; the chess/session rules remain separate from rendering.

## What to playtest

1. Can a complete beginner understand selection, legal moves, and captures without coaching?
2. Does the two-move knight fork teach the idea, or reveal it too quickly?
3. Does Royal Escort communicate *why* the king needs to support the pawn?
4. Does the longer bishop hunt feel like a boss? The current opponent is deliberately simple and may repeat defensive moves.
5. Are the hints helpful without doing all the thinking, and is the humor working?
6. Does the controller cursor feel predictable, and do the short panels and larger text work from the couch?
7. Can players explain why castling/en passant was legal, why the pinned knight could not move, and why the final queen sacrifice worked?

The move-count stars are optional, and the boss is intentionally asymmetric in material. This first version tests the encounter loop; it does not establish learning transfer or promise rating gains. There is no procedural campaign, deckbuilding, opening trainer, account system, analytics, music, or paid AI integration.

<details>
<summary>Developer spoilers: tested solutions</summary>

These lines are legal and complete each objective against the deterministic local opponent. The tests also verify that the opening knight fork wins the rook after every legal king defense.

- **Horsie Havoc:** `1. Nc7+ Kd7 2. Nxa8`
- **Royal Escort:** `1. Kd6 Kg6 2. Ke7 Kf5 3. e6 Ke5 4. Kd7 Kf6 5. e7 Ke5 6. e8=Q+`
- **Bishop Sniper:** `1. a4 Ba7 2. b4 Bb6 3. c4 Ba7 4. d4 Bb6 5. e4 Ba7 6. Qg4 Bb6 7. Qc8+ Bd8 8. Qxd8#`
- **Check Yourself:** `1. Kh1`
- **Castle Crash Course:** `1. O-O`
- **Pin & Punishment:** `1. d6 a5 2. dxe7`
- **Discovered Drama:** `1. Nb7+ Kb8 2. Nxd8` (if the queen blocks on a5 instead, `2. Nxa5` wins it)
- **En Passant Incident:** `1. exd6 e.p.` (Black's previous move was `...d5`)
- **The Back-Rank Baron:** `1. Qxe8+ Rxe8 2. Rxe8#`

The solutions demonstrate solvability against this opponent. They are not claims of optimal play against a strong chess engine.

</details>
