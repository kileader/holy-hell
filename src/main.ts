import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/barlow-condensed/latin-900-italic.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import './style.css';
import { encounters } from './encounters';
import { Session, bishopSight, describeMove, isRookFork, pieceNames, SQUARES } from './game';
import type { Promotion } from './game';
import type { Square } from 'chess.js';
import { complete, emptyProgress, isUnlocked, parseProgress, storageKey } from './progress';
import { characterArt, icon, pieceSvg } from './art';

const app = document.querySelector<HTMLDivElement>('#app')!;
let progress = emptyProgress();
let storageAvailable = true;
try { progress = parseProgress(localStorage.getItem(storageKey)); } catch { storageAvailable = false; }
let currentIndex = Math.min(progress.completed.length, encounters.length - 1);
let session = new Session(encounters[currentIndex]);
let selected: Square | undefined;
let focusSquare: Square = 'a8';
let hint: ReturnType<Session['hint']> | undefined;
let showSight = false;
let pending = false;
let replyTimer: ReturnType<typeof setTimeout> | undefined;
let promotionMove: { from: Square; to: Square } | undefined;
let feedback = 'Your move. Pick an ivory piece to see where it can go.';
const movement = {
  p: 'One square forward. Captures diagonally. Two squares from its starting rank.',
  n: 'Two squares one way, then one sideways. The only piece that can jump.',
  b: 'Slides diagonally. An excellent hat does not change this.',
  r: 'Slides in straight lines: up, down, left, right.',
  q: 'Slides in straight lines and diagonals. Very versatile. Knows it.',
  k: 'One square in any direction. Cannot move into an attack.',
};

app.innerHTML = `<header class="masthead">
  <a class="brand" href="./" aria-label="Holy Hell! Home"><img src="${import.meta.env.BASE_URL}favicon.svg" width="43" height="43" alt=""/><span>HOLY HELL<span class="brand-mark">!</span><small>TINY MOVES. BIG NONSENSE.</small></span></a>
  <div class="header-right"><span class="prototype-label">A CHESS ADVENTURE <b>v0.1</b></span><button class="help-button" data-action="help">${icon('book')} How to play</button></div>
</header>
<main>
  <section class="intro"><div><p class="eyebrow">WELCOME TO THE BOARD, ROOKIE.</p><h1>Good chess.<br class="mobile-break"/> <span>Questionable company.</span></h1></div><p>Real rules. Ridiculous rivals.<br/>One big-brain move at a time.</p></section>
  <nav id="campaign" class="campaign" aria-label="Encounter progression"></nav>
  <div id="game"></div>
</main>
<footer><span>64 squares. Approximately zero dignity.</span><span id="save-status"></span></footer>
<p id="announcement" class="sr-only" aria-live="polite" aria-atomic="true"></p>
<dialog id="help-dialog" aria-labelledby="help-title"><button class="close-button" data-action="close-help" aria-label="Close how to play">${icon('x')}</button><p class="eyebrow">THE EXTREMELY SHORT RULEBOOK</p><h2 id="help-title">Chess, minus the panic.</h2><p>You control the <strong>ivory pieces</strong> at the bottom. Your opponent controls the dark pieces and replies automatically.</p><ol class="help-steps"><li><strong>Click a piece.</strong> Dots show legal moves. Rings show captures.</li><li><strong>Click a destination.</strong> Take an enemy piece by landing on its square.</li><li><strong>Follow the encounter’s mission.</strong> Use a hint whenever you want. Undo takes back your move and the enemy’s reply.</li></ol><div class="piece-guide">${(['p', 'n', 'b', 'r', 'q', 'k'] as const).map((type) => `<div>${pieceSvg(type, 'w')}<p><strong>${pieceNames[type]}</strong><span>${movement[type]}</span></p></div>`).join('')}</div><p class="help-note"><strong>Check:</strong> your king is attacked; your next move must make it safe. <strong>Checkmate:</strong> there is no legal escape. Kings are never captured. A stalemate or other chess draw ends the attempt; you can undo or retry. Checkmating the opponent also clears an encounter.</p><p class="help-note">Keyboard: Tab to the board, use arrow keys to move between squares, Enter or Space to select, and Escape to deselect. Hints are optional; the bonus star rewards a clear in the listed number of moves without hints or undo.</p><button class="primary-button" data-action="close-help">Okay, let’s cause problems ${icon('arrow')}</button></dialog>
<dialog id="promotion-dialog" aria-labelledby="promotion-title"><p class="eyebrow">CAREER DEVELOPMENT</p><h2 id="promotion-title">A promotion! Pick a piece.</h2><p>Most of the time, a queen is the strongest choice. All four choices complete Royal Escort.</p><div class="promotion-choices">${(['q', 'r', 'b', 'n'] as const).map((type) => `<button data-promotion="${type}">${pieceSvg(type, 'w')}<span>${pieceNames[type]}</span></button>`).join('')}</div><button class="text-button" data-action="cancel-promotion">Keep thinking</button></dialog>
<dialog id="victory-dialog" class="victory-dialog" aria-labelledby="victory-title"></dialog>`;

const helpDialog = document.querySelector<HTMLDialogElement>('#help-dialog')!;
helpDialog.insertAdjacentHTML('beforeend', '<div class="reset-campaign"><button class="text-button" data-action="reset-progress">Start a fresh campaign</button><p>Clears the stars and unlocks saved in this browser.</p></div>');
const promotionDialog = document.querySelector<HTMLDialogElement>('#promotion-dialog')!;
const victoryDialog = document.querySelector<HTMLDialogElement>('#victory-dialog')!;

function announce(text: string): void { document.querySelector('#announcement')!.textContent = text; }

function saveProgress(): void {
  try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
  catch { storageAvailable = false; }
}

function statusText(): string {
  if (session.result === 'won') return 'Encounter cleared';
  if (session.result === 'lost') return session.chess.isCheckmate() ? 'Checkmate. Try again!' : 'A lesson learned';
  if (session.result === 'draw') return session.chess.isStalemate() ? 'Stalemate — a draw' : 'Draw — try another route';
  if (pending) return 'Rival is plotting…';
  return session.chess.isCheck() ? 'Check! Protect your king' : 'Your move';
}

function render(): void {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const activeSquare = active?.dataset.square;
  const activeAction = active?.dataset.action;
  const lessonOpen = document.querySelector<HTMLDetailsElement>('.lesson-card')?.open ?? true;
  const encounter = session.encounter;
  const history = session.history;
  const legal = selected ? session.legalMoves(selected) : [];
  const last = history.at(-1);
  const sight = showSight && encounter.id === 'bishop' ? bishopSight(session.chess) : new Set<Square>();
  const checkedKing = session.chess.isCheck() ? session.chess.board().flat().find((piece) => piece?.type === 'k' && piece.color === session.chess.turn())?.square : undefined;
  const captures = history.filter((move) => move.color === 'w' && move.captured);
  const losses = history.filter((move) => move.color === 'b' && move.captured);
  const selectedPiece = selected ? session.chess.get(selected) : undefined;
  const result = session.result;
  document.querySelector('#campaign')!.innerHTML = encounters.map((entry, index) => {
    const unlocked = isUnlocked(progress, index);
    const cleared = progress.completed.includes(entry.id);
    return `<button data-encounter="${index}" class="campaign-stop ${index === currentIndex ? 'active' : ''} ${cleared ? 'cleared' : ''}" ${unlocked ? '' : 'disabled'} ${index === currentIndex ? 'aria-current="step"' : ''} title="${unlocked ? entry.name : `Complete ${encounters[index - 1].name} to unlock`}"><span class="stop-number">${cleared ? icon('check') : unlocked ? `0${index + 1}` : icon('lock')}</span><span class="stop-copy"><strong>${entry.name}${index === 2 ? '<em>BOSS</em>' : ''}</strong><small>${cleared ? 'Cleared. Replay anytime.' : unlocked ? entry.concept : `Clear encounter 0${index} to unlock`}</small></span>${progress.bonuses.includes(entry.id) ? `<span class="earned-star" aria-label="Bonus star earned">${icon('star')}</span>` : `<span class="stop-arrow">${icon('arrow')}</span>`}</button>`;
  }).join('');

  document.querySelector('#game')!.innerHTML = `<div class="game-layout">
    <aside class="character-panel"><p class="encounter-label">${encounter.id === 'bishop' ? 'BOSS ENCOUNTER' : `ENCOUNTER 0${currentIndex + 1}`}</p><h2>${encounter.name}</h2><p class="encounter-subtitle">${encounter.subtitle}</p><div class="character-poster ${encounter.id}">${characterArt(encounter.id)}<span class="poster-caption">${encounter.character}</span><span class="poster-stamp">100%<br/>CHESS MENACE</span></div><div class="speech"><span class="quote-mark">“</span><p>${encounter.dialogue}</p></div><p class="character-footnote">${encounter.id === 'horsie' ? 'Yes, the knight is called a horsie.<br/>No, this will not be on the exam.' : encounter.id === 'escort' ? 'Every queen started somewhere.<br/>Pip started right here.' : 'The hat is regulation.<br/>The attitude is not.'}</p></aside>
    <section class="board-panel" aria-label="Play encounter"><div class="board-topline"><span class="side-label"><span class="ivory-dot"></span> YOU PLAY WHITE</span><span class="turn-status ${pending ? 'thinking' : result !== 'playing' ? 'ended' : session.chess.isCheck() ? 'in-check' : ''}"><i></i>${statusText()}</span></div>
      <div class="board-frame"><div class="chessboard" role="group" aria-label="Chessboard, White at the bottom. Use arrow keys to navigate.">${SQUARES.map((square, index) => {
        const piece = session.chess.get(square);
        const move = legal.find((candidate) => candidate.to === square);
        const isLast = last?.from === square || last?.to === square;
        const isHint = hint?.target === square;
        const classes = ['square', (Math.floor(index / 8) + index % 8) % 2 ? 'dark-square' : 'light-square', selected === square ? 'selected' : '', isLast ? 'last-move' : '', sight.has(square) ? 'in-sight' : '', square === checkedKing ? 'checked' : '', isHint ? 'hint-target' : ''].filter(Boolean).join(' ');
        return `<button class="${classes}" data-square="${square}" tabindex="${square === focusSquare ? 0 : -1}" aria-label="${square}, ${piece ? `${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : 'empty'}${move ? move.captured ? ', legal capture' : ', legal move' : ''}${sight.has(square) ? ', in bishop sight line' : ''}${square === checkedKing ? ', king in check' : ''}" aria-pressed="${selected === square}">${index % 8 === 0 ? `<span class="rank-coordinate">${square[1]}</span>` : ''}${index >= 56 ? `<span class="file-coordinate">${square[0]}</span>` : ''}${piece ? pieceSvg(piece.type, piece.color) : ''}${move ? `<span class="${move.captured ? 'capture-ring' : 'move-dot'}"></span>` : ''}${isHint ? '<span class="hint-marker">!</span>' : ''}</button>`;
      }).join('')}</div></div>
      <div class="board-legend"><span><i class="legend-dot"></i> Legal move</span><span><i class="legend-ring"></i> Capture</span><span>Click piece → click square</span></div>
      <div class="board-controls"><button class="secondary-button" data-action="undo" ${history.length ? '' : 'disabled'}>${icon('undo')} Undo</button><button class="secondary-button" data-action="retry">${icon('retry')} Retry</button><button class="hint-button" data-action="hint" ${pending || result !== 'playing' ? 'disabled' : ''}>${icon('bulb')} A little hint</button></div>
      <div class="feedback ${result === 'lost' || session.chess.isCheck() ? 'warning' : ''}" role="status"><span class="feedback-symbol">${result === 'won' ? icon('check') : icon('arrow')}</span><p>${feedback}</p></div>
      ${hint ? `<div class="hint-note"><strong>${icon('bulb')} A nudge, not a judgment.</strong><p>${hint.text}</p><button class="text-button" data-action="dismiss-hint">Hide hint</button></div>` : ''}
      ${result === 'won' ? `<button class="primary-button continue-inline" data-action="next">${currentIndex < 2 ? `Next: ${encounters[currentIndex + 1].name}` : 'All clear! Play again'} ${icon('arrow')}</button>` : result !== 'playing' ? `<div class="recovery-note"><strong>${result === 'draw' ? 'Nobody wins this board. Everybody learns.' : 'The board has a counterargument.'}</strong><p>${result === 'draw' ? 'This is a real chess draw. Undo to try a different move, or retry from the beginning.' : session.chess.isCheckmate() ? 'Your king has no legal escape. Undo to find a safer move, or retry.' : `Your ${encounter.id === 'horsie' ? 'knight' : 'pawn'} was captured, so this mission needs another try. Undo to save it, or retry.`}</p></div>` : ''}
    </section>
    <aside class="field-notes"><section class="mission-card"><div class="mission-heading"><span class="eyebrow">YOUR MISSION</span>${icon('target')}</div><h3>${encounter.id === 'horsie' ? 'Make it a double.' : encounter.id === 'escort' ? 'Get Pip promoted.' : 'End the diagonal drama.'}</h3><p>${encounter.objective}</p><div class="objective-checks">${encounter.id === 'horsie' ? `<p class="${session.forked ? 'achieved' : ''}">${icon(session.forked ? 'check' : 'target')} Fork king + rook</p><p class="${result === 'won' ? 'achieved' : ''}">${icon(result === 'won' ? 'check' : 'target')} Capture the rook</p>` : `<p class="${result === 'won' ? 'achieved' : ''}">${icon(result === 'won' ? 'check' : 'target')} ${encounter.id === 'escort' ? 'Reach rank 8 with your pawn' : 'Capture the bishop'}</p>`}</div><div class="bonus-line">${icon('star')}<span><strong>For the show-offs</strong>Clear in ${encounter.par} moves or fewer.<br/>No hints or undo. Entirely optional.</span></div></section>
      <details class="lesson-card" ${lessonOpen ? 'open' : ''}><summary><span>${icon('book')} Learn a thing</span><span class="details-toggle">+</span></summary><h3>${encounter.concept}</h3><p>${encounter.lesson}</p></details>
      ${encounter.id === 'bishop' ? `<button class="sight-button ${showSight ? 'enabled' : ''}" data-action="sight" aria-pressed="${showSight}">${icon('eye')} ${showSight ? 'Hide' : 'Show'} bishop diagonals</button>${showSight ? '<p class="sight-note">Striped squares show the bishop’s current sight lines, up to the first blocking piece.</p>' : ''}` : ''}
      <div class="piece-tip">${selectedPiece ? `${pieceSvg(selectedPiece.type, 'w')}<div><strong>${pieceNames[selectedPiece.type]} on ${selected}</strong><p>${movement[selectedPiece.type]}</p></div>` : `${icon('bulb')}<p>Pick an ivory piece.<br/>We’ll show you its legal moves.</p>`}</div>
      <section class="move-notes" aria-label="Move history"><div class="move-notes-heading"><span class="eyebrow">THE STORY SO FAR</span><span>${session.whiteMoves} ${session.whiteMoves === 1 ? 'move' : 'moves'}</span></div>${history.length ? `<ol>${history.slice(-4).map((move) => `<li><span class="move-color ${move.color}">${move.color === 'w' ? 'YOU' : 'RIVAL'}</span><span>${describeMove(move)}</span><b>${move.san}</b></li>`).join('')}</ol>` : '<p class="empty-log">A suspiciously quiet chessboard.</p>'}<div class="capture-tray"><span>Won <b>${captures.length ? captures.map((move) => pieceNames[move.captured!]).join(', ') : '—'}</b></span><span>Lost <b>${losses.length ? losses.map((move) => pieceNames[move.captured!]).join(', ') : '—'}</b></span></div></section>
    </aside>
  </div>`;
  document.querySelector('#save-status')!.textContent = storageAvailable ? `${progress.completed.length}/3 encounters cleared · Saved in this browser` : `${progress.completed.length}/3 encounters cleared · Progress lasts for this visit`;
  if (activeSquare) document.querySelector<HTMLButtonElement>(`[data-square="${activeSquare}"]`)?.focus({ preventScroll: true });
  else if (activeAction) document.querySelector<HTMLButtonElement>(`#game [data-action="${activeAction}"]`)?.focus({ preventScroll: true });
}

function cancelReply(): void { if (replyTimer) clearTimeout(replyTimer); replyTimer = undefined; pending = false; }

function startEncounter(index: number): void {
  if (!isUnlocked(progress, index)) return;
  cancelReply();
  currentIndex = index;
  session = new Session(encounters[index]);
  selected = undefined;
  focusSquare = session.chess.board().flat().find((piece) => piece?.color === 'w')!.square;
  hint = undefined;
  promotionMove = undefined;
  showSight = false;
  feedback = 'Your move. Pick an ivory piece to see where it can go.';
  victoryDialog.close();
  promotionDialog.close();
  render();
  announce(`${session.encounter.name}. ${session.encounter.objective}`);
}

function showVictory(): void {
  const encounter = session.encounter;
  const checkmate = session.chess.isCheckmate() && !session.objectiveComplete;
  progress = complete(progress, encounter.id, session.bonus);
  saveProgress();
  render();
  victoryDialog.innerHTML = `<div class="celebration" aria-hidden="true">${Array.from({ length: 20 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--delay:${(i % 5) * 0.08}s;--rotation:${i * 41}deg;--color:${['#e75435', '#edb845', '#819a7f'][i % 3]}"></i>`).join('')}</div><button class="close-button" data-action="review-board" aria-label="Review the final board">${icon('x')}</button><p class="victory-stamp">ENCOUNTER 0${currentIndex + 1} CLEARED</p><div class="victory-art">${characterArt(encounter.id)}</div><h2 id="victory-title">${checkmate ? 'CHECKMATE. HOLY HELL!' : encounter.victory}</h2><p>${checkmate ? 'You checkmated the rival’s king. A chess victory clears the encounter too. Beautifully excessive.' : encounter.victoryLine}</p><div class="victory-stats"><span><strong>${session.whiteMoves}</strong> moves</span><span><strong>${session.hintsUsed}</strong> hints</span><span class="${session.bonus ? 'bonus-earned' : ''}">${icon('star')} ${session.bonus ? 'Bonus star!' : `Bonus: ≤ ${encounter.par} moves, no hints or undo`}</span></div><div class="victory-lesson"><strong>What you just learned</strong><p>${encounter.lesson}</p></div>${currentIndex === 2 ? '<p class="campaign-complete">THREE ENCOUNTERS. ONE NEW CHESS MENACE.<br/>You’ve cleared the prototype. Thanks for playing!</p>' : ''}<button class="primary-button" data-action="next">${currentIndex < 2 ? `Bring on ${encounters[currentIndex + 1].name}` : 'Take a victory lap'} ${icon('arrow')}</button><button class="text-button" data-action="review-board">Review the final board</button>`;
  victoryDialog.showModal();
  announce(`Victory! ${encounter.victory} ${session.bonus ? 'Bonus star earned.' : ''}`);
}

function finishTurn(): void {
  if (session.result === 'won') { feedback = 'Mission complete. That was some excellent nonsense.'; showVictory(); return; }
  if (session.result !== 'playing') {
    feedback = session.result === 'draw' ? 'This position is drawn. You can undo and find another route.' : session.chess.isCheckmate() ? 'Checkmate. Your king has no safe escape. Undo or retry to investigate.' : `Your ${session.encounter.id === 'horsie' ? 'knight' : 'pawn'} was captured. Undo to see how to save it.`;
  }
  render(); announce(`${statusText()}. ${feedback}`);
}

function makeMove(from: Square, to: Square, promotion?: Promotion): void {
  const move = session.play(from, to, promotion);
  if (!move) return;
  selected = undefined;
  hint = undefined;
  focusSquare = to;
  feedback = `You: ${describeMove(move)}.${isRookFork(move) ? ' A fork! The king must answer the check; the rook is also under attack.' : ''}`;
  if (session.result !== 'playing') { finishTurn(); return; }
  pending = true;
  render(); announce(feedback);
  replyTimer = setTimeout(() => {
    const reply = session.reply();
    pending = false;
    replyTimer = undefined;
    if (reply) {
      feedback = `Rival: ${describeMove(reply)}.${reply.captured ? ` That cost you a ${pieceNames[reply.captured]}. Look at what was attacking its square. Undo is available.` : session.chess.isCheck() ? ' Your king is attacked. Capture the attacker, block the line, or move the king to safety.' : ' Your turn.'}`;
      if (session.forked && session.encounter.id === 'horsie' && session.result === 'playing') feedback += ' The rook is still yours for the taking.';
    }
    finishTurn();
  }, 400);
}

function clickSquare(square: Square): void {
  if (pending || session.result !== 'playing' || session.chess.turn() !== 'w') return;
  focusSquare = square;
  if (selected === square) { selected = undefined; render(); return; }
  const legal = selected ? session.legalMoves(selected).filter((move) => move.to === square) : [];
  if (selected && legal.length) {
    if (legal.some((move) => move.promotion)) {
      promotionMove = { from: selected, to: square };
      promotionDialog.showModal();
    } else makeMove(selected, square);
    return;
  }
  const piece = session.chess.get(square);
  if (piece?.color === 'w') {
    selected = square;
    const count = new Set(session.legalMoves(square).map((move) => move.to)).size;
    feedback = `${pieceNames[piece.type][0].toUpperCase()}${pieceNames[piece.type].slice(1)} on ${square}: ${count ? `${count} legal ${count === 1 ? 'destination' : 'destinations'}. Pick a dot or capture ring.` : 'no legal moves right now. Try another piece.'}`;
  } else feedback = selected ? session.chess.isCheck() ? 'Your king is in check. Choose a highlighted move that makes it safe.' : 'That destination isn’t legal. Choose a highlighted square or another ivory piece.' : 'You control the ivory pieces. Click one to begin.';
  render(); announce(feedback);
}

app.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button || button.disabled) return;
  if (button.dataset.square) { clickSquare(button.dataset.square as Square); return; }
  if (button.dataset.encounter !== undefined) { startEncounter(Number(button.dataset.encounter)); return; }
  if (button.dataset.promotion && promotionMove) {
    const move = promotionMove; promotionMove = undefined; promotionDialog.close();
    makeMove(move.from, move.to, button.dataset.promotion as Promotion); return;
  }
  switch (button.dataset.action) {
    case 'help': helpDialog.showModal(); break;
    case 'close-help': helpDialog.close(); break;
    case 'cancel-promotion': promotionMove = undefined; promotionDialog.close(); break;
    case 'retry': startEncounter(currentIndex); break;
    case 'undo':
      cancelReply();
      if (session.undo()) { selected = undefined; hint = undefined; feedback = 'One turn rewound. Your move and the rival’s reply are back. Try a different idea.'; render(); announce(feedback); }
      break;
    case 'hint': hint = session.hint(); selected = hint.square; if (selected) focusSquare = selected; render(); announce(hint.text); break;
    case 'dismiss-hint': hint = undefined; render(); break;
    case 'sight': showSight = !showSight; render(); break;
    case 'review-board': victoryDialog.close(); document.querySelector<HTMLButtonElement>(`[data-square="${focusSquare}"]`)?.focus({ preventScroll: true }); break;
    case 'reset-progress': progress = emptyProgress(); saveProgress(); helpDialog.close(); startEncounter(0); break;
    case 'next': startEncounter(currentIndex < 2 ? currentIndex + 1 : 0); break;
  }
});

document.querySelector('#game')!.addEventListener('keydown', (event) => {
  const key = event as KeyboardEvent;
  const square = (event.target as HTMLElement).dataset.square as Square | undefined;
  if (!square) return;
  if (key.key === 'Escape') { selected = undefined; render(); return; }
  const index = SQUARES.indexOf(square);
  const offset: Record<string, number> = { ArrowUp: -8, ArrowDown: 8, ArrowLeft: -1, ArrowRight: 1 };
  if (!(key.key in offset)) return;
  key.preventDefault();
  const next = index + offset[key.key];
  if (next < 0 || next > 63 || (key.key === 'ArrowRight' && index % 8 === 7) || (key.key === 'ArrowLeft' && index % 8 === 0)) return;
  focusSquare = SQUARES[next];
  document.querySelectorAll<HTMLButtonElement>('[data-square]').forEach((button) => { button.tabIndex = button.dataset.square === focusSquare ? 0 : -1; });
  document.querySelector<HTMLButtonElement>(`[data-square="${focusSquare}"]`)!.focus();
});
promotionDialog.addEventListener('cancel', () => { promotionMove = undefined; });
startEncounter(currentIndex);
