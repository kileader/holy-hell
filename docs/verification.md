# Prototype verification — October 20, 2026

## Automated checks

- `npm test`: 119 passing tests.
- `npm run build`: TypeScript check and Vite production build pass.
- All thirteen starting FENs are valid, have White to move, and do not place the nonmoving black king in check. Check Yourself intentionally starts with White in check.
- Each authored solution clears its objective against the actual deterministic opponent. The initial knight fork also wins the rook after every legal king defense.
- Rules integration covers illegal moves, turn ownership, check, checkmate, stalemate, castling, en passant, and all four promotion choices.
- Recovery checks cover undo before/after a reply, captured mission pieces, promotion reversal, and search preserving move history.
- Progress checks cover sequential unlocks, replayed bonuses, malformed saves, and save round trips.
- Following the current-position hints clears Royal Escort and Bishop Sniper within ten player moves.
- Controller tests cover standard button mapping, neutral input on connection/reset, single activation per press, stick drift, directional repeat without catch-up bursts, and board edges.
- New goal tests cover escaping check, kingside castling, pawn capture of a pinned knight, discovered check before a knight wins the queen, en passant, and back-rank checkmate. The discovered attack works against every legal check defense; the final boss sacrifice has a forced reply.
- Recovery checks preserve castling rights and the en passant window through Undo. Wrong-piece captures cannot satisfy pawn/knight missions. Existing three-encounter saves retain their stars and unlock the first added lesson.
- Live hints clear every encounter. Follow-up hints adapt after the pin advance, a queen block against the discovered check, and the final boss sacrifice.
- Result timing checks cover the full 3.2-second board interval, pause/resume without resetting it, cancellation on recovery, and replacing stale victory callbacks. Compound-move checks include both castling sides and the captured en passant square.
- Audio checks render all 15 cues to deterministic PCM and verify finite samples, bounded peaks, short duration, and silent edges. Playback checks cover move-specific cues, lazy device creation, immediate mute/stop, no queued autoplay burst, navigation throttling, bounded polyphony, and unavailable audio support.
- Shared splash checks preserve the 2.4-second sine fade sequence and copied controller button states, including held and newly connected controllers.
- Menu traversal checks visit and wrap through every enabled control in both directions across varying panel sizes, and recover from missing focus or empty control lists.
- Startup selection checks cover fresh saves, every partial campaign including an unfinished ninth encounter, and a fully cleared campaign returning to encounter one without changing its stars or unlocks.
- Strategy checks cover the bishop-for-rook exchange including the recapture and net material change; opening and developing a supported bishop; either central pawn creating a protected passer; passed-pawn blockers ahead versus behind; and the supported space advance. Goals wait for Black's reply. A greedy capture in Room Service is punished by Nxd5; Undo restores the supported alternative. Live hints solve all four additions, and the development hint updates once the diagonal opens.
- Victories after an opponent reply retain highlights for both the player's achievement and that reply, including a bishop that was recaptured during a favorable exchange.
- Existing nine-encounter saves keep clears and stars, then unlock Bishop Stonks. Complete saves of thirteen encounters reopen the first lesson with all unlocks intact.

## Browser checks

Tested in the Codex in-app browser:

- Played through all nine encounters by clicking board squares, including queen promotion and both boss victories.
- Confirmed knight selection highlights legal moves and captures.
- Exposed the knight, observed `Rxa7`, and used Undo to recover the initial board.
- Completed the fork, received the victory dialog and bonus star, and unlocked Royal Escort.
- Played the six-move pawn escort, canceled the promotion dialog, reopened it, and successfully promoted to a knight.
- Used the boss diagonal overlay and a live hint, captured the bishop, and received the campaign-completion dialog.
- Reloaded and confirmed all three encounter clears and earned stars persisted.
- Started a fresh campaign and confirmed stars/unlocks reset. This action now lives under Menu → Encounters.
- Confirmed a pending reply disables Hint; Retry restored the initial board and no stale reply changed it afterward.
- Confirmed arrow-key board navigation, Space selection, and Escape deselection.
- Inspected the original desktop/mobile layouts, then replaced the scrolling page with a fixed game viewport. Verified page dimensions match the viewport at 1280×720, 320×568, and 844×390, with the board and controls in bounds.
- Completed the encounters through the revised interface, including keyboard navigation for the fork and the eight-move boss capture. Mistakes continued with real opponent captures; Retry restored the initial position.
- Measured mission/lesson pages, all seven help pages, menu, campaign selection, hints, history, and boss victory for clipped content on the narrow and landscape layouts. Split help into shorter pages and adjusted landscape encounter selection to keep controls reachable.
- Confirmed menus pause an opponent reply and closing them resumes it. Switching between menu and briefing preserves that pause.
- Inspected Light and Dark themes, confirmed the explicit preference survives reload, and checked readable board silhouettes in both. System theme listens for OS preference changes; changing the actual OS setting was not tested.
- Entered fullscreen through the UI and observed the fullscreen-change label update. The game also handles denied fullscreen with instructions for opening a regular browser.
- Inspected the armored warhorse, royal pawn overlord, and bishop sniper portraits together and in the game. All are local SVG art; each rendered instance gets unique gradient identifiers.
- Corrected character ownership: Sir Neighs-a-Lot and Pip have ivory armor, white capes, and explicit player-piece labels in portraits and mission briefings. Bishop Deadeye is labeled as the enemy. Generic turn/history text calls the opposing side the opponent.
- Played all six new lessons through the no-scroll 320×568 layout. Checked new mission, tactic, and victory panels; shortened the en passant setup to keep it fully visible. Checked all five campaign pages with nine saved clears and adjusted card padding to prevent clipping.
- Delayed en passant, read its failure explanation, used Undo, and completed the capture. The final boss correctly reports all nine encounters cleared; the first boss advances to Check Yourself.
- Checked the meme dialogue at its actual triggers: pawn advances in Bishop Sniper, the discovered check, and the Baron's queen capture. Undo restores the Baron's original line. The revised bishop, en passant, and campaign victory text fits at 320×568.
- Served `dist/` using `npm run preview`, completed the fork again, and confirmed the production victory/unlock path. Browser warning/error logs were empty.
- Verified the supplied studio splash on black, automatic startup, Escape/mouse skip without dismissing the mission, and Retry without replaying it. The shared studio files remain unchanged.
- Castled through the UI: the board showed king g1 and rook f1, highlighted all four affected squares, and displayed 36 confetti particles with no dialog covering the move. The result panel opened after the board interval. Menu preserved the remaining interval; Undo and Retry canceled the pending result.
- Checked the celebration at 1280×720 and 320×568, and sound/settings menus at 320×568 and 844×390. No page overflow; theme value and mute control remained readable. M and the menu toggle agreed, mute survived reload, and warning/error logs were empty.
- Used the shared directional navigation through every menu option, theme, Sound, and Close, confirmed wraparound, adjusted the theme, toggled Sound with confirm, and backed out from the theme without getting trapped. Focus had a visible 4px outline after switching away from mouse input.
- Reproduced the completed-save startup bug locally: nine saved clears opened the ninth boss. After the fix, the same save opened Horsie Havoc with a Replay 01 label on full reload; encounter selection still showed 9/9 clears and the earned stars.
- Added `/tests/board-render.html` as a development-only real-browser regression. Before the sizing fix, selection inside an animation frame collapsed the board from 462px to its 20px border/padding minimum before the next frame. Rendering now fits the board synchronously, before a controller frame can paint it collapsed.
- The repaint regression passes at 1280×720 (462px board), 320×568 (296px), and 844×390 (254px), including four selections, a legal move, and Undo within one animation frame. Browser warning/error logs were empty.
- Played Bishop Stonks, Bishop Unboxed, Chain Reaction, and Room Service through the 320×568 interface. Confirmed the bishop capture and recapture, actual bishop development to f4, pawn support on d5, and the e5 advance. Tried the tempting exd5, observed Nxd5 and its recovery prompt, then used Undo and completed the space objective. The new mission, lesson, and victory panels fit without internal scrolling.
- Confirmed 13/13 saved clears, all seven encounter-selection pages, and the updated completion panel. Inspected the ivory bishop at 1280×720, checked the development lesson at 844×390, and reran the controller-frame repaint regression successfully. Browser warning/error logs were empty.

## Still needs Kevin's playtest

- Beginner comprehension, difficulty, humor, and hint usefulness require human feedback.
- The boss opponent may repeat bishop retreats. Decide whether a longer hunt is fun or needs more active threats and more purposeful defenses.
- Responsive checks used browser viewport overrides; physical touch-device and broader cross-browser testing remain unverified.
- Physical gamepad input and couch-distance readability remain unverified. The controller sampler has automated coverage; keyboard and mouse exercised the shared UI actions. This does not establish hardware/controller feel.
- Audio waveforms and playback lifecycle are tested; subjective loudness, timbre, and controller-only autoplay behavior still need listening on Kevin's setup.
- Reduced-motion behavior is implemented in CSS; operating-system preference testing and a screen-reader walkthrough have not been performed.
- Solving these authored encounters does not establish transfer to unfamiliar positions or improvement in full games.
