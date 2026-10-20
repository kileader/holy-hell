# v0.1 verification — October 20, 2026

## Automated checks

- `npm test`: 24 passing tests.
- `npm run build`: TypeScript check and Vite production build pass.
- All three starting FENs are valid, have White to move, and do not place the nonmoving black king in check.
- Each authored solution clears its objective against the actual deterministic opponent. The initial knight fork also wins the rook after every legal king defense.
- Rules integration covers illegal moves, turn ownership, check, checkmate, stalemate, castling, en passant, and all four promotion choices.
- Recovery checks cover undo before/after a reply, captured mission pieces, promotion reversal, and search preserving move history.
- Progress checks cover sequential unlocks, replayed bonuses, malformed saves, and save round trips.
- Following the current-position hints clears Royal Escort and Bishop Sniper within ten player moves.

## Browser checks

Tested in the Codex in-app browser:

- Played through all three encounters by clicking board squares.
- Confirmed knight selection highlights legal moves and captures.
- Exposed the knight, observed `Rxa7`, and used Undo to recover the initial board.
- Completed the fork, received the victory dialog and bonus star, and unlocked Royal Escort.
- Played the six-move pawn escort, canceled the promotion dialog, reopened it, and successfully promoted to a knight.
- Used the boss diagonal overlay and a live hint, captured the bishop, and received the campaign-completion dialog.
- Reloaded and confirmed all three encounter clears and earned stars persisted.
- Started a fresh campaign through How to play and confirmed stars/unlocks reset.
- Confirmed a pending reply disables Hint; Retry restored the initial board and no stale reply changed it afterward.
- Confirmed arrow-key board navigation, Space selection, and Escape deselection.
- Inspected desktop layouts at 1280×1000 and 1280×800, plus responsive layouts at 390×844 and 320×568. Both narrow layouts had no horizontal overflow. The 1280×800 layout kept the board and controls visible together.
- Served `dist/` using `npm run preview`, completed the fork again, and confirmed the production victory/unlock path. Browser warning/error logs were empty.

## Still needs Kevin's playtest

- Beginner comprehension, difficulty, humor, and hint usefulness require human feedback.
- The boss opponent may repeat bishop retreats. Decide whether a longer hunt is fun or needs more active threats and more purposeful defenses.
- Responsive checks used browser viewport overrides; physical touch-device and broader cross-browser testing remain unverified.
- Reduced-motion behavior is implemented in CSS; operating-system preference testing and a screen-reader walkthrough have not been performed.
- Solving these three authored encounters does not establish transfer to unfamiliar positions or improvement in full games.
