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
import { adjacentIndex, ControllerInput } from './controller';
import type { ControlAction, Direction } from './controller';

const app = document.querySelector<HTMLDivElement>('#app')!;
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
type Theme = 'system' | 'light' | 'dark';
let theme: Theme = 'system';
try { const saved = localStorage.getItem('holy-hell-theme'); if (saved === 'light' || saved === 'dark') theme = saved; } catch { /* System theme remains available. */ }
function applyTheme(): void {
  const resolved = theme === 'system' ? systemTheme.matches ? 'dark' : 'light' : theme;
  document.documentElement.dataset.theme = resolved;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = resolved === 'dark' ? '#141c19' : '#f5f1e7';
}
applyTheme();
systemTheme.addEventListener('change', () => { if (theme === 'system') applyTheme(); });
let progress = emptyProgress();
let storageAvailable = true;
try { progress = parseProgress(localStorage.getItem(storageKey)); } catch { storageAvailable = false; }
let currentIndex = Math.min(progress.completed.length, encounters.length - 1);
let session = new Session(encounters[currentIndex]);
let selected: Square | undefined;
let focusSquare: Square = 'b5';
let hint: ReturnType<Session['hint']> | undefined;
let showSight = false;
let pending = false;
let replyTimer: ReturnType<typeof setTimeout> | undefined;
let promotionMove: { from: Square; to: Square } | undefined;
let feedback = 'Pick an ivory piece to see its legal moves.';
let inputMode: 'mouse' | 'keyboard' | 'gamepad' = 'mouse';
let controllerStatus = 'Keyboard & mouse';
let helpPage = 0;
type Overlay = 'briefing' | 'menu' | 'help' | 'campaign' | 'hint' | 'history' | 'promotion' | 'victory' | 'notice';
let activeOverlay: Overlay | undefined;
const movement = {
  p: 'One square forward. Captures diagonally. Two squares from its starting rank.',
  n: 'Two squares one way, then one sideways. The only piece that can jump.',
  b: 'Slides diagonally. An excellent hat does not change this.',
  r: 'Slides in straight lines: up, down, left, right.',
  q: 'Slides in straight lines and diagonals. Very versatile. Knows it.',
  k: 'One square in any direction. Cannot move into an attack.',
};

app.innerHTML = `<header class="game-header">
  <a class="brand" href="./" aria-label="Holy Hell! Home"><img src="${import.meta.env.BASE_URL}favicon.svg" width="36" height="36" alt=""/><span>HOLY HELL<span class="brand-mark">!</span></span></a>
  <h1 id="encounter-title"></h1>
  <div class="header-actions"><button data-action="campaign" aria-label="Choose encounter" title="Choose encounter">${icon('target')}<span>Encounters</span></button><button data-action="fullscreen" aria-label="Toggle fullscreen" title="Fullscreen (F)">${icon('expand')}<span id="fullscreen-label">Fullscreen</span></button><button data-action="menu" aria-label="Game menu" title="Menu (Escape / Start)">${icon('menu')}<span>Menu</span></button></div>
</header>
<main id="game"></main>
<footer class="control-strip"><div id="control-hints"></div><span id="controller-status"></span></footer>
<p id="announcement" class="sr-only" aria-live="polite" aria-atomic="true"></p>
${(['briefing','menu','help','campaign','hint','history','promotion','victory','notice'] as Overlay[]).map((name) => `<dialog id="${name}-dialog" aria-labelledby="${name}-title"></dialog>`).join('')}`;

function announce(text: string): void { document.querySelector('#announcement')!.textContent = text; }
function saveProgress(): void { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { storageAvailable = false; } }
function dialog(name: Overlay): HTMLDialogElement { return document.querySelector<HTMLDialogElement>(`#${name}-dialog`)!; }
function closeOverlay(): void {
  if (activeOverlay === 'promotion') promotionMove = undefined;
  if (activeOverlay) dialog(activeOverlay).close();
  activeOverlay = undefined;
  focusBoard();
  queueReply();
}
function showOverlay(name: Overlay, content: string, className = ''): void {
  if (pending && replyTimer) { clearTimeout(replyTimer); replyTimer = undefined; }
  if (activeOverlay) dialog(activeOverlay).close();
  const target = dialog(name);
  target.className = className;
  target.innerHTML = `<button class="close-button" data-action="close-overlay" aria-label="Close panel">${icon('x')}</button>${content}`;
  activeOverlay = name;
  target.showModal();
  const first = target.querySelector<HTMLButtonElement>('button[autofocus]') ?? target.querySelector<HTMLButtonElement>('button:not(.close-button):not(:disabled)');
  first?.focus({ preventScroll: true });
}
for (const target of document.querySelectorAll<HTMLDialogElement>('dialog')) {
  target.addEventListener('cancel', (event) => { event.preventDefault(); closeOverlay(); });
}
function statusText(): string {
  if (session.result === 'won') return 'Encounter cleared';
  if (session.result === 'lost') return 'Try another approach';
  if (session.result === 'draw') return 'Draw — try another route';
  if (pending) return 'Rival is plotting…';
  return session.chess.isCheck() ? 'Check! Protect your king' : 'Your move';
}
function fitBoard(): void {
  const stage = document.querySelector<HTMLElement>('.board-stage');
  if (!stage) return;
  const size = Math.floor(Math.min(stage.clientWidth, stage.clientHeight));
  stage.style.setProperty('--board-size', `${Math.max(0, size)}px`);
}
new ResizeObserver(fitBoard).observe(app);
function renderPrompts(): void {
  document.querySelector('#controller-status')!.textContent = controllerStatus;
  document.querySelector('#control-hints')!.innerHTML = inputMode === 'gamepad'
    ? '<span><kbd>✚</kbd> Move</span><span><kbd>A</kbd> Select</span><span><kbd>B</kbd> Back</span><span class="extra-prompt"><kbd>X</kbd> Undo</span><span class="extra-prompt"><kbd>Y</kbd> Hint</span><span><kbd>Start</kbd> Menu</span>'
    : '<span><kbd>↑↓←→</kbd> Move</span><span><kbd>Enter</kbd> Select</span><span class="extra-prompt"><kbd>X</kbd> Undo</span><span class="extra-prompt"><kbd>Y</kbd> Hint</span><span><kbd>Esc</kbd> Menu</span>';
}
function render(): void {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const oldSquare = active?.dataset.square;
  const oldAction = active?.dataset.action;
  const encounter = session.encounter;
  const history = session.history;
  const legal = selected ? session.legalMoves(selected) : [];
  const last = history.at(-1);
  const sight = showSight && encounter.id === 'bishop' ? bishopSight(session.chess) : new Set<Square>();
  const checkedKing = session.chess.isCheck() ? session.chess.board().flat().find((piece) => piece?.type === 'k' && piece.color === session.chess.turn())?.square : undefined;
  const result = session.result;
  document.querySelector('#encounter-title')!.innerHTML = `<span>0${currentIndex + 1} / 03</span> ${encounter.name}${encounter.id === 'bishop' ? ' <em>BOSS</em>' : ''}`;
  document.querySelector('#game')!.innerHTML = `<div class="game-layout ${encounter.id === 'bishop' ? 'is-boss' : ''}">
    <aside class="character-panel"><p class="encounter-label">${encounter.id === 'bishop' ? 'BOSS ENCOUNTER' : 'YOUR RIVAL'}</p><div class="character-poster ${encounter.id}">${characterArt(encounter.id)}<span class="poster-caption">${encounter.character}</span></div><blockquote class="speech"><p>“${encounter.dialogue}”</p></blockquote></aside>
    <section class="board-panel" aria-label="Play encounter"><div class="board-topline"><span class="side-label"><span class="ivory-dot"></span> You play White</span><span class="turn-status ${pending ? 'thinking' : result !== 'playing' ? 'ended' : session.chess.isCheck() ? 'in-check' : ''}"><i></i>${statusText()}</span></div>
      <div class="board-stage"><div class="board-frame"><div class="chessboard" role="group" aria-label="Chessboard, White at the bottom. Use arrow keys to navigate.">${SQUARES.map((square, index) => {
        const piece = session.chess.get(square);
        const move = legal.find((candidate) => candidate.to === square);
        const classes = ['square', (Math.floor(index / 8) + index % 8) % 2 ? 'dark-square' : 'light-square', selected === square ? 'selected' : '', last?.from === square || last?.to === square ? 'last-move' : '', sight.has(square) ? 'in-sight' : '', square === checkedKing ? 'checked' : '', hint?.target === square ? 'hint-target' : '', inputMode !== 'mouse' && focusSquare === square ? 'cursor' : ''].filter(Boolean).join(' ');
        return `<button class="${classes}" data-square="${square}" tabindex="${square === focusSquare ? 0 : -1}" aria-label="${square}, ${piece ? `${piece.color === 'w' ? 'white' : 'black'} ${pieceNames[piece.type]}` : 'empty'}${move ? move.captured ? ', legal capture' : ', legal move' : ''}${sight.has(square) ? ', in bishop sight line' : ''}${square === checkedKing ? ', king in check' : ''}" aria-pressed="${selected === square}">${index % 8 === 0 ? `<span class="rank-coordinate">${square[1]}</span>` : ''}${index >= 56 ? `<span class="file-coordinate">${square[0]}</span>` : ''}${piece ? pieceSvg(piece.type, piece.color) : ''}${move ? `<span class="${move.captured ? 'capture-ring' : 'move-dot'}"></span>` : ''}${hint?.target === square ? '<span class="hint-marker">!</span>' : ''}</button>`;
      }).join('')}</div></div></div>
      <div class="board-controls"><button class="secondary-button" data-action="undo" ${history.length ? '' : 'disabled'} title="Undo (X)">${icon('undo')}<span>Undo</span></button><button class="secondary-button" data-action="retry" title="Retry encounter">${icon('retry')}<span>Retry</span></button><button class="hint-button" data-action="hint" ${pending || result !== 'playing' ? 'disabled' : ''} title="Hint (Y)">${icon('bulb')}<span>Hint</span></button><button class="secondary-button" data-action="briefing" title="Mission & tactic (L / LB)">${icon('book')}<span>Briefing</span></button></div>
    </section>
    <aside class="mission-panel"><p class="eyebrow">YOUR MISSION</p><h2>${encounter.id === 'horsie' ? 'Make it a double.' : encounter.id === 'escort' ? 'Get Pip promoted.' : 'Take out the sniper.'}</h2><p class="mission-objective">${encounter.objective}</p><div class="objective-checks">${encounter.id === 'horsie' ? `<p class="${session.forked ? 'achieved' : ''}">${icon(session.forked ? 'check' : 'target')} Fork king + rook</p><p class="${session.objectiveComplete ? 'achieved' : ''}">${icon(session.objectiveComplete ? 'check' : 'target')} Capture the rook</p>` : `<p class="${session.objectiveComplete ? 'achieved' : ''}">${icon(session.objectiveComplete ? 'check' : 'target')} ${encounter.id === 'escort' ? 'Reach rank 8' : 'Capture the bishop'}</p>`}</div><div class="feedback ${session.chess.isCheck() || result === 'lost' ? 'warning' : ''}" role="status"><p>${feedback}</p></div>${encounter.id === 'bishop' ? `<button class="sight-button ${showSight ? 'enabled' : ''}" data-action="sight" aria-pressed="${showSight}" title="Bishop diagonals (V / RB)">${icon('eye')} ${showSight ? 'Hide' : 'Show'} diagonals</button>` : ''}<button class="text-button" data-action="briefing">${icon('book')} Mission & tactic</button><p class="bonus-line">${icon('star')} Bonus: ≤ ${encounter.par} moves.<br/>No hints or undo.</p></aside>
  </div>`;
  requestAnimationFrame(fitBoard);
  renderPrompts();
  if (oldSquare) document.querySelector<HTMLButtonElement>(`[data-square="${oldSquare}"]`)?.focus({ preventScroll: true });
  else if (oldAction && !activeOverlay) document.querySelector<HTMLButtonElement>(`#game [data-action="${oldAction}"]`)?.focus({ preventScroll: true });
}
function focusBoard(): void {
  document.querySelector<HTMLButtonElement>(`[data-square="${focusSquare}"]`)?.focus({ preventScroll: true });
}
function moveCursor(direction: Direction): void {
  focusSquare = SQUARES[adjacentIndex(SQUARES.indexOf(focusSquare), direction)];
  document.querySelectorAll<HTMLButtonElement>('[data-square]').forEach((button) => {
    button.tabIndex = button.dataset.square === focusSquare ? 0 : -1;
    button.classList.toggle('cursor', button.dataset.square === focusSquare);
  });
  focusBoard();
}
function cancelReply(): void { if (replyTimer) clearTimeout(replyTimer); replyTimer = undefined; pending = false; }
function startEncounter(index: number): void {
  if (!isUnlocked(progress, index)) return;
  cancelReply(); closeOverlay();
  currentIndex = index; session = new Session(encounters[index]); selected = undefined;
  focusSquare = session.chess.board().flat().find((piece) => piece?.color === 'w')!.square;
  hint = undefined; promotionMove = undefined; showSight = false;
  feedback = 'Pick an ivory piece. Dots show legal moves; rings show captures.';
  render(); showBriefing();
  announce(`${session.encounter.name}. ${session.encounter.objective}`);
}
function showBriefing(lesson = false): void {
  const e = session.encounter;
  showOverlay('briefing', `<p class="eyebrow">ENCOUNTER 0${currentIndex + 1}${e.id === 'bishop' ? ' · BOSS' : ''}</p><h2 id="briefing-title">${lesson ? e.concept : e.name}</h2><div class="briefing-content"><div class="briefing-art ${e.id}">${characterArt(e.id)}</div><div>${lesson ? `<p>${e.lesson}</p><p class="bonus-copy">${icon('star')} Optional star: ${e.par} moves or fewer, without hints or undo.</p>` : `<p class="briefing-objective">${e.objective}</p><p class="briefing-quote">${e.character}<br/>“${e.dialogue}”</p>`}</div></div><div class="dialog-actions"><button class="secondary-button" data-action="${lesson ? 'briefing' : 'lesson'}">${lesson ? 'Mission' : 'Learn the tactic'}</button><button class="primary-button" data-action="close-overlay" autofocus>Let’s play ${icon('arrow')}</button></div>`, lesson ? 'briefing-dialog lesson-briefing' : 'briefing-dialog');
}
function showCampaign(): void {
  showOverlay('campaign', `<p class="eyebrow">${progress.completed.length} OF 3 CLEARED</p><h2 id="campaign-title">Choose your trouble.</h2><div class="encounter-choices">${encounters.map((e, index) => `<button data-encounter="${index}" ${isUnlocked(progress,index) ? '' : 'disabled'} class="encounter-choice ${index === currentIndex ? 'current' : ''}"><span class="choice-number">${progress.completed.includes(e.id) ? icon('check') : isUnlocked(progress,index) ? `0${index + 1}` : icon('lock')}</span><strong>${e.name}</strong><span>${progress.completed.includes(e.id) ? 'Cleared' : isUnlocked(progress,index) ? e.concept : `Clear ${encounters[index - 1].name} first`}</span></button>`).join('')}</div><button class="text-button" data-action="reset-progress">Start a fresh campaign</button>`, 'campaign-dialog');
}
function showMenu(): void {
  showOverlay('menu', `<p class="eyebrow">TAKE YOUR TIME</p><h2 id="menu-title">Game menu</h2><div class="pause-options"><button data-action="close-overlay" autofocus>Resume game</button><button data-action="briefing">Mission & tactic</button><button data-action="campaign">Encounters</button><button data-action="help">Controls & rules</button><button data-action="history">Move history</button><button data-action="retry">Retry encounter</button>${session.encounter.id === 'bishop' ? `<button data-action="sight">${showSight ? 'Hide' : 'Show'} bishop diagonals</button>` : ''}</div><label class="theme-control">${icon('moon')}<span>Theme</span><select id="theme-select" aria-label="Color theme">${(['system','light','dark'] as Theme[]).map((value) => `<option value="${value}" ${theme === value ? 'selected' : ''}>${value[0].toUpperCase()+value.slice(1)}</option>`).join('')}</select></label><p class="menu-status">${controllerStatus} · ${storageAvailable ? 'Progress saved' : 'Progress saved for this visit'}</p>`, 'menu-dialog');
}
function showHelp(page = 0): void {
  helpPage = Math.max(0,page);
  const pieces = (types: Array<keyof typeof movement>) => `<div class="piece-guide">${types.map((type) => `<div>${pieceSvg(type,'w')}<p><strong>${pieceNames[type]}</strong><span>${movement[type]}</span></p></div>`).join('')}</div>`;
  const pages = [
    ['Make your move', '<p>You play the ivory pieces. Select a piece, then a highlighted square. Dots are moves; rings are captures. Your rival replies automatically.</p><p>Undo rewinds your move and the reply. Hints are optional. Use Briefing for the encounter’s mission.</p>'],
    ['Controller basics', '<div class="controller-guide"><p><kbd>✚ / Stick</kbd> Move cursor</p><p><kbd>A</kbd> Select / confirm</p><p><kbd>B</kbd> Cancel / back</p><p><kbd>Start</kbd> Game menu</p></div><p class="small-note">Connect a standard controller and press a button. Keyboard: arrows to move, Enter/Space to select, Escape to go back.</p>'],
    ['A few good shortcuts', '<div class="controller-guide"><p><kbd>X</kbd> Undo turn</p><p><kbd>Y</kbd> Hint</p><p><kbd>LB</kbd> Briefing</p><p><kbd>RB</kbd> Bishop diagonals</p></div><p class="small-note">Keyboard: X undo, Y hint, L briefing, V diagonals. F toggles fullscreen. Browser fullscreen starts with a click or key press.</p>'],
    ['Small pieces. Big plans.', pieces(['p','n'])],
    ['Hold the line', pieces(['b','r'])],
    ['The royal troublemakers', pieces(['q','k'])],
    ['Keep your king safe', '<p><strong>Check:</strong> your king is attacked. Capture the attacker, block the line, or move to safety.</p><p><strong>Checkmate:</strong> there is no legal escape. Kings are never captured. Checkmating your rival also clears an encounter.</p><p><strong>Draw:</strong> no winner. Undo or retry to find another route.</p>'],
  ];
  helpPage = Math.min(helpPage,pages.length-1);
  showOverlay('help', `<p class="eyebrow">CONTROLS & RULES · ${helpPage+1} / ${pages.length}</p><h2 id="help-title">${pages[helpPage][0]}</h2><div class="help-page">${pages[helpPage][1]}</div><div class="dialog-actions"><button class="secondary-button" data-action="help-prev" ${helpPage ? '' : 'disabled'}>Previous</button><button class="primary-button" data-action="${helpPage < pages.length-1 ? 'help-next' : 'menu'}" autofocus>${helpPage < pages.length-1 ? 'Next' : 'Back to menu'} ${icon('arrow')}</button></div>`, 'help-dialog');
}
function showHistory(): void {
  const history = session.history;
  showOverlay('history', `<p class="eyebrow">${session.whiteMoves} PLAYER MOVES</p><h2 id="history-title">The last four moves.</h2><ol class="history-list">${history.length ? history.slice(-4).map((move) => `<li><strong>${move.color === 'w' ? 'You' : 'Rival'}</strong> ${describeMove(move)}</li>`).join('') : '<li>No moves yet. A suspiciously quiet chessboard.</li>'}</ol><button class="primary-button" data-action="menu" autofocus>Back to menu</button>`, 'history-dialog');
}
function showHint(): void {
  if (pending || session.result !== 'playing') return;
  hint = session.hint(); selected = hint.square; if (selected) focusSquare = selected;
  render();
  showOverlay('hint', `<p class="eyebrow">A NUDGE, NOT A JUDGMENT</p><h2 id="hint-title">Here’s an idea.</h2><p>${hint.text}</p><button class="primary-button" data-action="close-overlay" autofocus>Try it on the board ${icon('arrow')}</button>`, 'hint-dialog');
  announce(hint.text);
}
function showVictory(): void {
  const e = session.encounter;
  const alternateMate = session.chess.isCheckmate() && !session.objectiveComplete;
  progress = complete(progress,e.id,session.bonus); saveProgress(); render();
  showOverlay('victory', `<div class="celebration" aria-hidden="true">${Array.from({length:18},(_,i) => `<i style="--x:${(i*37)%100}%;--delay:${i%5*.08}s;--color:${['#e75435','#edb845','#819a7f'][i%3]}"></i>`).join('')}</div><p class="eyebrow">ENCOUNTER CLEARED</p><div class="victory-content"><div class="victory-art">${characterArt(e.id)}</div><div><h2 id="victory-title">${alternateMate ? 'CHECKMATE. HOLY HELL!' : e.victory}</h2><p>${alternateMate ? 'A chess victory clears the encounter too. Beautifully excessive.' : e.victoryLine}</p><p class="victory-stats">${session.whiteMoves} moves · ${session.hintsUsed} hints${session.bonus ? ' · ★ Bonus star!' : ''}</p>${currentIndex === 2 ? '<p class="campaign-complete">All three encounters cleared. One new chess menace.</p>' : ''}</div></div><div class="dialog-actions"><button class="secondary-button" data-action="close-overlay">Review board</button><button class="primary-button" data-action="next" autofocus>${currentIndex < 2 ? `Next: ${encounters[currentIndex+1].name}` : 'Victory lap'} ${icon('arrow')}</button></div>`, 'victory-dialog');
  announce(`Victory! ${e.victory}`);
}
function finishTurn(): void {
  if (session.result === 'won') { feedback = 'Mission complete. Excellent nonsense.'; showVictory(); return; }
  if (session.result !== 'playing') {
    const text = session.result === 'draw' ? 'This position is drawn. Undo to try a different route.' : session.chess.isCheckmate() ? 'Your king has no safe escape. Undo to investigate.' : `Your ${session.encounter.id === 'horsie' ? 'knight' : 'pawn'} was captured. Undo to save it.`;
    feedback = text; render();
    showOverlay('notice', `<p class="eyebrow">THE BOARD HAS A COUNTERARGUMENT</p><h2 id="notice-title">${session.result === 'draw' ? 'A draw. Another route?' : 'A lesson learned.'}</h2><p>${text}</p><div class="dialog-actions"><button class="secondary-button" data-action="retry">Retry</button><button class="primary-button" data-action="undo" autofocus>Undo turn</button></div>`);
  } else render();
  announce(`${statusText()}. ${feedback}`);
}
function queueReply(): void {
  if (!pending || replyTimer || activeOverlay) return;
  replyTimer = setTimeout(() => {
    const reply = session.reply(); pending = false; replyTimer = undefined;
    if (reply) feedback = `Rival: ${describeMove(reply)}.${session.forked && session.encounter.id === 'horsie' && session.result === 'playing' ? ' Take the rook!' : ''}`;
    finishTurn();
  },400);
}
function makeMove(from: Square, to: Square, promotion?: Promotion): void {
  const move = session.play(from,to,promotion); if (!move) return;
  selected = undefined; hint = undefined; focusSquare = to;
  feedback = isRookFork(move) ? 'A fork! The king must move. The rook is also under attack.' : `You: ${describeMove(move)}.`;
  if (session.result !== 'playing') { finishTurn(); return; }
  pending = true; render(); announce(feedback);
  queueReply();
}
function clickSquare(square: Square): void {
  if (pending || session.result !== 'playing' || session.chess.turn() !== 'w') return;
  focusSquare = square;
  if (selected === square) { selected = undefined; render(); return; }
  const legal = selected ? session.legalMoves(selected).filter((move) => move.to === square) : [];
  if (selected && legal.length) {
    if (legal.some((move) => move.promotion)) {
      promotionMove = { from:selected,to:square };
      showOverlay('promotion', `<p class="eyebrow">CAREER DEVELOPMENT</p><h2 id="promotion-title">Pick your promotion.</h2><p>A queen is usually strongest. Any choice completes Royal Escort.</p><div class="promotion-choices">${(['q','r','b','n'] as const).map((type) => `<button data-promotion="${type}" ${type === 'q' ? 'autofocus' : ''}>${pieceSvg(type,'w')}<span>${pieceNames[type]}</span></button>`).join('')}</div>`, 'promotion-dialog');
    } else makeMove(selected,square);
    return;
  }
  const piece = session.chess.get(square);
  if (piece?.color === 'w') {
    selected = square;
    const count = new Set(session.legalMoves(square).map((move) => move.to)).size;
    feedback = `${pieceNames[piece.type][0].toUpperCase()+pieceNames[piece.type].slice(1)} on ${square}: ${count} legal ${count === 1 ? 'move' : 'moves'}.`;
  } else feedback = session.chess.isCheck() ? 'Your king is in check. Choose a highlighted escape.' : selected ? 'Choose a highlighted square or another ivory piece.' : 'You control the ivory pieces.';
  render(); announce(feedback);
}
async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showOverlay('notice', '<h2 id="notice-title">Fullscreen needs a click.</h2><p>Use the Fullscreen button with your mouse, or press F. If this browser panel cannot enter fullscreen, open the game in your regular browser and use F11.</p><button class="primary-button" data-action="close-overlay" autofocus>Back to game</button>');
  }
}
document.addEventListener('fullscreenchange', () => {
  document.querySelector('#fullscreen-label')!.textContent = document.fullscreenElement ? 'Windowed' : 'Fullscreen';
  fitBoard();
});
function performAction(action: string): void {
  switch (action) {
    case 'close-overlay': closeOverlay(); break;
    case 'menu': activeOverlay === 'menu' ? closeOverlay() : showMenu(); break;
    case 'briefing': showBriefing(); break;
    case 'lesson': showBriefing(true); break;
    case 'campaign': showCampaign(); break;
    case 'help': showHelp(); break;
    case 'help-prev': showHelp(helpPage-1); break;
    case 'help-next': showHelp(helpPage+1); break;
    case 'history': showHistory(); break;
    case 'fullscreen': void toggleFullscreen(); break;
    case 'retry': startEncounter(currentIndex); break;
    case 'undo': cancelReply(); closeOverlay(); if (session.undo()) { selected = undefined; hint = undefined; feedback = 'Turn rewound. Try a different idea.'; render(); focusBoard(); } break;
    case 'hint': showHint(); break;
    case 'sight': if (session.encounter.id === 'bishop') { showSight = !showSight; if (activeOverlay) closeOverlay(); render(); announce(showSight ? 'Bishop sight lines shown.' : 'Bishop sight lines hidden.'); } break;
    case 'next': startEncounter(currentIndex < 2 ? currentIndex+1 : 0); break;
    case 'reset-progress': progress = emptyProgress(); saveProgress(); startEncounter(0); break;
  }
}
app.addEventListener('pointerdown', () => { inputMode = 'mouse'; document.querySelector('.square.cursor')?.classList.remove('cursor'); renderPrompts(); });
app.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button'); if (!button || button.disabled) return;
  if (button.dataset.square) { clickSquare(button.dataset.square as Square); return; }
  if (button.dataset.encounter !== undefined) { startEncounter(Number(button.dataset.encounter)); return; }
  if (button.dataset.promotion && promotionMove) {
    const move = promotionMove; promotionMove = undefined; closeOverlay(); makeMove(move.from,move.to,button.dataset.promotion as Promotion); return;
  }
  if (button.dataset.action) performAction(button.dataset.action);
});
app.addEventListener('change', (event) => {
  const select = event.target as HTMLSelectElement;
  if (select.id !== 'theme-select' || !['system','light','dark'].includes(select.value)) return;
  theme = select.value as Theme; applyTheme();
  try { localStorage.setItem('holy-hell-theme',theme); } catch { /* The choice works for this visit. */ }
});
function moveMenuFocus(direction: Direction): void {
  if (!activeOverlay) return;
  const panel = dialog(activeOverlay);
  const controls = [...panel.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button:not(:disabled),select')].filter((element) => element.getClientRects().length);
  const current = document.activeElement as HTMLElement;
  if (!panel.contains(current)) { controls.find((control) => !control.classList.contains('close-button'))?.focus(); return; }
  if (current instanceof HTMLSelectElement && (direction === 'left' || direction === 'right')) {
    current.selectedIndex = (current.selectedIndex + (direction === 'left' ? -1 : 1) + current.options.length) % current.options.length;
    current.dispatchEvent(new Event('change',{bubbles:true})); return;
  }
  const box = current.getBoundingClientRect(); const x = box.x+box.width/2; const y = box.y+box.height/2;
  const horizontal = direction === 'left' || direction === 'right'; const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const next = controls.filter((control) => control !== current).map((control) => {
    const rect = control.getBoundingClientRect(); const dx = rect.x+rect.width/2-x; const dy = rect.y+rect.height/2-y;
    return { control, forward:(horizontal ? dx : dy)*sign, across:Math.abs(horizontal ? dy : dx) };
  }).filter((item) => item.forward > 2).sort((a,b) => a.forward+a.across*2-b.forward-b.across*2)[0];
  next?.control.focus({preventScroll:true});
}
function handleControl(action: ControlAction): void {
  if (action === 'menu') { performAction('menu'); return; }
  if (action === 'back') {
    if (activeOverlay) closeOverlay();
    else if (selected) { selected = undefined; hint = undefined; render(); focusBoard(); }
    else showMenu();
    return;
  }
  if (activeOverlay) {
    if (['up','down','left','right'].includes(action)) moveMenuFocus(action as Direction);
    else if (action === 'confirm') {
      const active = document.activeElement;
      if (active instanceof HTMLSelectElement) { active.selectedIndex = (active.selectedIndex+1)%active.options.length; active.dispatchEvent(new Event('change',{bubbles:true})); }
      else if (active instanceof HTMLButtonElement) active.click();
    }
    return;
  }
  if (['up','down','left','right'].includes(action)) moveCursor(action as Direction);
  else if (action === 'confirm') clickSquare(focusSquare);
  else performAction(action);
}
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target instanceof HTMLSelectElement) return;
  const actions: Record<string,ControlAction> = { ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Escape:'back',x:'undo',y:'hint',l:'briefing',v:'sight' };
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === 'f' && !event.repeat) { event.preventDefault(); void toggleFullscreen(); return; }
  if (actions[key]) {
    event.preventDefault(); if (event.repeat && !key.startsWith('Arrow')) return;
    inputMode = 'keyboard'; renderPrompts(); handleControl(actions[key]);
  } else if ((key === 'Enter' || key === ' ') && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault(); if (!event.repeat) handleControl('confirm');
  }
});
const controller = new ControllerInput();
let padIndex: number | undefined;
let pollingFailed = false;
function pollControllers(time: number): void {
  if (!document.hidden && document.hasFocus() && !pollingFailed) {
    try {
      const pads = navigator.getGamepads?.() ?? [];
      const pad = [...pads].find((entry) => entry?.connected && entry.mapping === 'standard');
      if (pad?.index !== padIndex) {
        padIndex = pad?.index; controller.reset();
        controllerStatus = pad ? 'Controller ready' : 'Keyboard & mouse'; renderPrompts();
      }
      if (pad) {
        const actions = controller.sample(pad,time);
        if (actions.length) {
          inputMode = 'gamepad'; renderPrompts();
          // A menu transition consumes the frame, so two buttons cannot click through it.
          if (actions.includes('menu')) handleControl('menu');
          else if (actions.includes('back')) handleControl('back');
          else for (const action of actions) handleControl(action);
        }
      }
    } catch { pollingFailed = true; controllerStatus = 'Controller access unavailable'; renderPrompts(); }
  }
  requestAnimationFrame(pollControllers);
}
document.addEventListener('visibilitychange', () => controller.reset());
window.addEventListener('blur', () => controller.reset());
requestAnimationFrame(pollControllers);
startEncounter(currentIndex);
