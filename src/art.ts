import type { PieceSymbol } from 'chess.js';
import type { Portrait } from './encounters';

export function icon(name: 'arrow' | 'retry' | 'undo' | 'bulb' | 'lock' | 'check' | 'target' | 'star' | 'book' | 'x' | 'eye' | 'moon' | 'expand' | 'menu'): string {
  const paths = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    retry: '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
    undo: '<path d="m9 4-6 6 6 6M3 10h10a7 7 0 0 1 7 7v3"/>',
    bulb: '<path d="M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
    x: '<path d="m6 6 12 12M6 18 18 6"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    moon: '<path d="M20 14A8 8 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

/** Original code-drawn placeholders; no font-dependent chess glyphs or remote art. */
export function pieceSvg(type: PieceSymbol, color: 'w' | 'b'): string {
  const shapes: Record<PieceSymbol, string> = {
    p: '<circle cx="32" cy="18" r="9"/><path d="M26 28h12l-2 9 7 12H21l7-12Z"/>',
    n: '<path d="m18 47 7-17-10 3-3-9L32 8l7 4 9 17-6 18H18Z"/><path d="m25 30 9-7-3-4m3-10-1 8m4 11 4 5-9 14" fill="none"/><circle class="piece-eye" cx="35" cy="19" r="2.2" stroke="none"/>',
    b: '<path d="M32 7c-6 6-13 13-13 21 0 6 6 9 13 9s13-3 13-9C45 20 38 13 32 7Z"/><path d="M32 12v13m-6-6h12m-12 18-3 10h18l-3-10" fill="none"/><path d="M23 47h18l3 4H20Z"/>',
    r: '<path d="M17 10h8v8h5v-8h5v8h5v-8h8v16l-7 4 2 19H22l2-19-7-4Z"/><path d="M24 28h17m-16 8h15" fill="none"/>',
    q: '<circle cx="14" cy="14" r="3"/><circle cx="31" cy="9" r="3"/><circle cx="49" cy="14" r="3"/><path d="m15 19 10 7 6-12 8 12 9-7-7 22H23Zm8 22-3 8h24l-3-8Z"/><path d="M24 34h16" fill="none"/>',
    k: '<path d="M32 6v13m-6-8h12" fill="none"/><path d="M23 20c-10-4-12 9-5 15l7 5-4 9h22l-4-9 7-5c7-6 5-19-5-15-5 2-5 5-9 5s-4-3-9-5Z"/><path d="M25 40h14m-7-14v11" fill="none"/>',
  };
  return `<svg class="chess-piece ${color === 'w' ? 'ivory' : 'ink'}" viewBox="0 0 64 64" aria-hidden="true"><g stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${shapes[type]}<path d="M18 50h28l3 6H15Z"/></g></svg>`;
}

export function characterArt(id: Portrait): string {
  if (id === 'white-bishop') return bishopSniperArt(true);
  if (id === 'bishop') return bishopSniperArt();
  if (id === 'king') return kingArt();
  if (id === 'rook' || id === 'baron') return rookArt(id === 'baron');
  return id === 'horsie' ? warhorseArt() : royalPawnArt();
}

let portraitSequence = 0;
let sniperSequence = 0;

function kingArt(): string {
  const id = `king-${++portraitSequence}`;
  return `<svg class="character-art" viewBox="0 0 300 300" role="img" aria-label="King Reginald, your white king, in ivory plate armor and a white royal cloak, with a huge gold crown and a cross-topped scepter">
    <defs><linearGradient id="${id}-armor" x2="1" y2="1"><stop stop-color="#fff7dc"/><stop offset="1" stop-color="#a7b9ac"/></linearGradient><linearGradient id="${id}-gold" x2="1" y2="1"><stop stop-color="#ffe6a0"/><stop offset="1" stop-color="#a07838"/></linearGradient></defs>
    <rect width="300" height="300" rx="8" fill="#111d19"/>
    <g fill="none" stroke="#8c8d58" opacity=".65"><circle cx="150" cy="148" r="106" stroke-width="1.5"/><circle cx="150" cy="148" r="86" stroke-dasharray="3 12"/></g>
    <g stroke="#101b18" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="m107 142-36 13-30 116 55-14 20 22 34-17 34 17 22-21 50 13-28-114-36-15Z" fill="#e5e7d7"/>
      <path d="m75 188-18 65 35-10m131-55 19 65-35-10" fill="none" stroke="#bea86b" stroke-width="3"/>
      <path d="m105 147-31 7-18 34 24 29 32-17 14-34m65-18 31 7 18 34-24 29-32-17-14-34" fill="url(#${id}-armor)"/>
      <path d="m113 166-10 66 21 31h52l22-31-11-66Z" fill="url(#${id}-armor)"/>
      <path d="m127 176 24 8 23-8-4 32-20 18-20-18Z" fill="#284536"/>
      <path d="M150 189v22m-8-14h16" stroke="#edca74" stroke-width="4"/>
      <path d="m111 236 39 12 39-12" fill="none" stroke="#b89b52" stroke-width="3"/>
      <path d="m114 92 3 45 32 27 33-27 5-45Z" fill="#cda576"/>
      <path d="m119 126 16 7 15-6 16 6 17-8-7 25-26 20-28-20Z" fill="#e9e0c0"/>
      <path d="m124 111 16-3m21 1 13 3" stroke="#273c2c" stroke-width="4"/>
      <path d="m148 112-4 13 10 1m-14 17 21-1" fill="none" stroke="#77563a" stroke-width="2"/>
      <path d="m110 100-12-52 27 16 25-29 25 29 26-16-12 52-39 7Z" fill="url(#${id}-gold)"/>
      <path d="M150 14v34m-11-23h22" stroke="#f7d88c" stroke-width="7"/>
      <path d="m112 85 38 8 37-8" fill="none" stroke="#fff2bd" stroke-width="3"/>
      <path d="m150 62-10 12 10 12 10-12Z" fill="#2c6e50"/>
      <path d="M231 99v159" stroke="#d5b166" stroke-width="9"/>
      <path d="M231 66v30m-10-21h20" stroke="#f3d68e" stroke-width="6"/>
      <path d="m231 92-13 13 13 13 13-13Z" fill="url(#${id}-gold)"/>
      <path d="m199 204 24 2 15 14-7 18-30-8-11-15m-97-6-19 2-14 19 10 15 25-7 8-17Z" fill="#f2ecd5"/>
      <path d="M84 270h132l14 20H70Z" fill="#eee8d2" stroke="#9a9e78" stroke-width="2"/>
    </g>
  </svg>`;
}

function rookArt(enemy: boolean): string {
  const id = `rook-${++portraitSequence}`;
  const light = enemy ? '#64786c' : '#fff7dc';
  const shade = enemy ? '#23372f' : '#a7b9ac';
  const cloak = enemy ? '#522a33' : '#e5e7d7';
  const trim = enemy ? '#ed7750' : '#c7a65d';
  return `<svg class="character-art" viewBox="0 0 300 300" role="img" aria-label="${enemy ? 'Baron von Backrank, an enemy rook in dark fortress armor with a red cloak and a glowing visor' : 'Rook Norris, your white rook, in massive ivory fortress armor and a white cloak'}">
    <defs><linearGradient id="${id}-armor" x2="1" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${shade}"/></linearGradient></defs>
    <rect width="300" height="300" rx="8" fill="#111d19"/>
    <g fill="none" stroke="${trim}" opacity=".5"><circle cx="150" cy="148" r="107" stroke-width="1.5"/><circle cx="150" cy="148" r="87" stroke-dasharray="3 12"/></g>
    <g stroke="#101b18" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="m106 133-39 28-26 111 56-17 19 25 34-17 36 17 21-25 52 17-27-111-39-28Z" fill="${cloak}"/>
      <path d="m69 193-12 58 35-11m139-47 13 58-35-11" fill="none" stroke="${trim}" stroke-width="3"/>
      <path d="M58 146h44l20 26-14 39H67l-22-28Zm140 0h44l13 37-22 28h-41l-14-39Z" fill="url(#${id}-armor)"/>
      <path d="m61 147-2-23 22 20m157 3 2-23-22 20" fill="${trim}"/>
      <path d="m112 154-11 80 23 30h53l23-30-12-80Z" fill="url(#${id}-armor)"/>
      <path d="m120 174 30 8 30-8-7 42-23 19-23-19Z" fill="#1d352a"/>
      <path d="M137 194h7v8h12v-8h7v22h-26Z" fill="${trim}" stroke-width="2"/>
      <path d="M109 236h81m-59 0v19m39-19v19" fill="none" stroke="${trim}" stroke-width="2"/>
      <path d="M107 79h86l-6 59-37 27-37-27Z" fill="url(#${id}-armor)"/>
      <path d="m114 103 36 9 35-9-5 25-30 15-31-15Z" fill="#14271e"/>
      <path d="m124 117 17 4m19 0 17-4" stroke="${enemy ? '#ff9c62' : '#ffe6a0'}" stroke-width="4"/>
      <path d="M99 42h24v19h15V36h24v25h15V42h24v44l-18 10h-66L99 86Z" fill="url(#${id}-armor)"/>
      <path d="M112 79h77m-49-17v17m27-17v17m-35 60 18 10 18-10" fill="none" stroke="${trim}" stroke-width="3"/>
      <path d="m65 205-15 25 14 24 35-9 10-23-18-16Zm170 0 15 25-14 24-35-9-10-23 18-16Z" fill="url(#${id}-armor)"/>
      <path d="m61 225 29 9m-29 1 25 8m154-18-29 9m29 1-25 8" stroke="${trim}" stroke-width="2"/>
      <path d="M82 271h136l14 20H68Z" fill="${enemy ? '#1b3026' : '#eee8d2'}" stroke="${trim}" stroke-width="2"/>
    </g>
  </svg>`;
}

function warhorseArt(): string {
  const id = `warhorse-${++portraitSequence}`;
  return `<svg class="character-art" viewBox="0 0 300 300" role="img" aria-label="Sir Neighs-a-Lot, your white knight, a warhorse in ivory armor and a white cape, with a flaming mane and an enormous sword">
    <defs>
      <radialGradient id="${id}-halo"><stop stop-color="#ed6c24" stop-opacity=".5"/><stop offset="1" stop-color="#ed6c24" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-steel" x2="1" y2="1"><stop stop-color="#fff7dc"/><stop offset=".4" stop-color="#e8e7d7"/><stop offset="1" stop-color="#a3b2a5"/></linearGradient>
      <linearGradient id="${id}-cloth" x2="1" y2="1"><stop stop-color="#fff9e9"/><stop offset=".5" stop-color="#dfdfd0"/><stop offset="1" stop-color="#b7c4b6"/></linearGradient>
      <linearGradient id="${id}-fire" x2="0" y2="1"><stop stop-color="#f9d773"/><stop offset=".45" stop-color="#ff813e"/><stop offset="1" stop-color="#aa292c"/></linearGradient>
    </defs>
    <rect width="300" height="300" rx="8" fill="#111d19"/>
    <circle cx="158" cy="138" r="138" fill="url(#${id}-halo)"/>
    <g fill="none" stroke="#9b6e42" stroke-width="1.5" opacity=".7"><circle cx="150" cy="148" r="106"/><circle cx="150" cy="148" r="87" stroke-dasharray="3 12"/><path d="m51 50 23 24m151 151 23 23M44 148h25m162 0h25M150 43v22"/></g>
    <g stroke="#101b18" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <g transform="rotate(24 235 133)">
        <path d="m222 178 1-132 12-27 13 27-1 132Z" fill="url(#${id}-steel)"/>
        <path d="M235 35v130" stroke="#e7ebce" stroke-width="2"/>
        <path d="m207 173 28-8 29 8-3 12-26-5-25 5Z" fill="#d3ad59"/>
        <path d="M229 182h13v43h-13Z" fill="#a63c30"/><path d="m226 225 9 10 10-10-10-7Z" fill="#dfb961"/>
      </g>
      <path d="m148 68 16-38 15 26 12-43 18 42 26-21-6 44 31-10-18 35 31 9-28 27 19 22-31 8 9 34-34-10 3 32-33-19-14-91Z" fill="url(#${id}-fire)"/>
      <path d="m173 72 14-30 8 43 21-19-9 42 27-5-21 32 17 10-19 10" fill="none" stroke="#ffe09a" stroke-width="3"/>
      <path d="m129 143-43 24-38 99 54-11 29 23 32-17 58 12-21-92-24-36Z" fill="url(#${id}-cloth)"/>
      <path d="m87 183-25 66 39-7m101-37 12 51-30-7" fill="none" stroke="#ba9b57" stroke-width="3"/>
      <path d="m118 158-27 8-12 38 30 14 17-31m49-26 33 15 14 32-32 15-24-34" fill="url(#${id}-steel)"/>
      <path d="m89 169-7-20 20 12m101 15 9-22 7 29m-8 8 24-7-12 21" fill="#cfba79"/>
      <path d="m115 178-13 57 22 29h51l21-29-16-58Z" fill="url(#${id}-steel)"/>
      <path d="m113 195 39 14 29-15-10 35-20 17-23-17Z" fill="#273f37"/>
      <path d="m151 211-11 16 11 11 10-11Z" fill="#ffb34e" stroke="#c57538" stroke-width="2"/>
      <path d="m112 242 35 13 36-13m-28-31 1 33" fill="none" stroke="#d0c48d" stroke-width="2"/>
      <path d="m149 66 11-49 15 19 4 44m-60-12-8-46 25 22 10 26" fill="#b88c60"/>
      <path d="m159 52 3-22 8 19m-49-15 7 23" fill="none" stroke="#e8bc86" stroke-width="3"/>
      <path d="M132 57c-16 0-26 11-33 22l-24 22c-21 1-34 11-32 27 3 16 29 22 49 12l21-6 6 24 23 25 32-16-4-30c18-29 23-59 1-75Z" fill="#b98a59"/>
      <path d="m120 117 8 32 16 20 19-11-4-28" fill="#d0a16a" stroke="none"/>
      <path d="M76 103c-18-1-34 10-33 25 2 12 20 20 38 16l14-10-5-24Z" fill="#e0bd8b"/>
      <ellipse cx="58" cy="121" rx="5" ry="7" transform="rotate(24 58 121)" fill="#24382a" stroke-width="2"/>
      <path d="M49 135c13 6 27 4 42-5" fill="none" stroke="#533c29" stroke-width="3"/>
      <path d="m104 75 28-20 39 7 13 26-12 25-26 20-19-17-15-14-13-1Z" fill="url(#${id}-steel)"/>
      <path d="m110 81 36-11 17 21-21 10-25-1Z" fill="#172921"/>
      <path d="m117 86 23-5-7 11-16 1Z" fill="#ffcb63" stroke="#f8df9b" stroke-width="1.5"/>
      <path d="m91 103 10 26-8 14m10-21 21-15m23 1 13-7-6 20" fill="none" stroke="#d2c390" stroke-width="3"/>
      <path d="m94 111-8 3 5 14 9-3Z" fill="#536b55" stroke-width="2"/>
      <path d="m89 216-11 18 9 18 17-6 7-19Zm110-3 14 20-9 19-19-6-6-19Z" fill="#eee8d2"/>
      <path d="m82 231 17 10m94-10 14 10" stroke="#cec49a" stroke-width="2"/>
      <path d="M84 270h130l14 21H70Z" fill="#eee8d2" stroke="#8c9b7a" stroke-width="2"/>
      <path d="M96 278h107" stroke="#d2b46e" stroke-width="2"/>
    </g>
    <g fill="#ffc66b"><path d="m52 48 3 7-3 7-3-7Zm211 126 3 7-3 7-3-7Zm-29 70 2 5-2 5-2-5Z"/><circle cx="70" cy="143" r="2"/><circle cx="247" cy="43" r="2"/></g>
  </svg>`;
}

function royalPawnArt(): string {
  const id = `overlord-${++portraitSequence}`;
  return `<svg class="character-art" viewBox="0 0 300 300" role="img" aria-label="Pip, your white pawn, in absurdly huge ivory armor and a white cape, wearing a gold crown and wielding a massive royal war hammer">
    <defs>
      <radialGradient id="${id}-halo"><stop stop-color="#b28b2f" stop-opacity=".5"/><stop offset="1" stop-color="#b28b2f" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-gold" x2="1" y2="1"><stop stop-color="#ffe8a0"/><stop offset=".45" stop-color="#c89b49"/><stop offset="1" stop-color="#78532d"/></linearGradient>
      <linearGradient id="${id}-ivory" x2="1" y2="1"><stop stop-color="#fff7dc"/><stop offset=".45" stop-color="#e8e7d7"/><stop offset="1" stop-color="#a3b2a5"/></linearGradient>
      <linearGradient id="${id}-cape" x2="1" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#b7c4b6"/></linearGradient>
    </defs>
    <rect width="300" height="300" rx="8" fill="#111d19"/>
    <circle cx="148" cy="132" r="138" fill="url(#${id}-halo)"/>
    <g fill="none" stroke="#8b8149" stroke-width="1.5" opacity=".7"><circle cx="150" cy="145" r="105"/><circle cx="150" cy="145" r="86" stroke-dasharray="3 12"/><path d="M150 20v25m-125 100h25m199 0h25M44 39l24 24m167 164 24 24"/></g>
    <g stroke="#101b18" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="m108 135-37 16-39 121 51-11 24 21 42-16 42 16 25-21 48 11-34-117-41-20Z" fill="url(#${id}-cape)"/>
      <path d="m69 197-14 52 25-10m148-40 13 49-27-10m-103 6-8 24m81-25 9 25" fill="none" stroke="#ba9b57" stroke-width="3"/>
      <g transform="rotate(-17 65 148)">
        <path d="M59 73h13v161H59Z" fill="#6e5542"/><path d="M62 104v112" stroke="#d5b26b" stroke-width="2"/>
        <path d="M28 48h75l13 18-13 28H28L15 66Z" fill="url(#${id}-gold)"/>
        <path d="m29 48 9 17-10 29m76-46-10 18 9 28" fill="none" stroke="#f7df91" stroke-width="3"/>
        <path d="m62 52-14 17 14 17 14-17Z" fill="#bf3d36"/>
        <path d="m62 59-7 10 7 10 7-10Z" fill="#ff9c60" stroke="none"/>
      </g>
      <path d="m102 142-30 6-19 33 22 30 36-9 13-41m62-19 35 8 24 33-23 30-37-14-11-35" fill="url(#${id}-ivory)"/>
      <path d="m74 147-6-20 25 17m121 8 6-25 13 37m-4 7 23-9-10 23" fill="#ddd2a6"/>
      <path d="m73 171 24-11m-28 22 27-10m109-10 20 13m-22-1 24 13" stroke="#f4d58b" stroke-width="2"/>
      <path d="m116 153-8 58-16 44 56 18 59-18-18-44-8-58Z" fill="url(#${id}-ivory)"/>
      <path d="m125 171 24 9 24-9-3 31-20 19-22-19Z" fill="#284536"/>
      <path d="m149 183-9 13 9 13 9-13Z" fill="#f6d378" stroke="#e2b762" stroke-width="2"/>
      <path d="m113 226 36 13 39-13m-79 16 40 13 45-13" fill="none" stroke="#efda9a" stroke-width="2"/>
      <circle cx="149" cy="115" r="32" fill="#fff7dc"/>
      <path d="M119 107q29 10 59 0l-5 22-24 12-26-13Z" fill="#21382d"/>
      <path d="m128 119 12 2m17 0 12-3" stroke="#ffe293" stroke-width="3"/>
      <path d="M139 147h21l9 10h-39Z" fill="#efe3b5"/>
      <path d="m112 96-14-56 26 20 24-41 26 41 26-20-14 56-36 8Z" fill="url(#${id}-gold)"/>
      <path d="m112 80 37 8 38-8m-38-53 1 47" fill="none" stroke="#fff0b5" stroke-width="3"/>
      <path d="m148 55-11 15 12 13 12-14Z" fill="#c73b36"/>
      <circle cx="98" cy="39" r="5" fill="#f8d98c"/><circle cx="148" cy="19" r="6" fill="#f8d98c"/><circle cx="200" cy="39" r="5" fill="#f8d98c"/>
      <path d="m61 200 18-5 12 12-4 22-22 5-15-14Zm140-4 19 8 13 20-10 15-26-8-9-17Z" fill="url(#${id}-ivory)"/>
      <path d="m62 211 17 9m-15-1 12 7m125-15 15 12m-17-3 13 10" stroke="#f9e7ac" stroke-width="2"/>
      <path d="M86 269h126l14 21H73Z" fill="#eee8d2" stroke="#9e9b6e" stroke-width="2"/>
      <path d="M96 278h107" stroke="#e6c87f" stroke-width="2"/>
    </g>
    <g fill="#ffe09a"><path d="m244 64 3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM47 247l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><circle cx="239" cy="122" r="2"/><circle cx="80" cy="111" r="2"/></g>
  </svg>`;
}

function bishopSniperArt(friendly = false): string {
  const paintId = `sniper-${++sniperSequence}`;
  return `<svg class="character-art sniper-art" viewBox="0 0 300 300" role="img" aria-label="${friendly ? 'Bishop Crossfire, your white bishop in ivory armor, a white cloak and a gold-trimmed bishop hat, carrying a scoped rifle' : 'Bishop Deadeye, an armored sniper in a crimson bishop’s mitre and a torn cloak, carrying a long scoped rifle'}">
    <defs>
      <radialGradient id="${paintId}-halo"><stop stop-color="#d84432" stop-opacity=".38"/><stop offset="1" stop-color="#d84432" stop-opacity="0"/></radialGradient>
      <linearGradient id="${paintId}-cloak" x2=".8" y2="1"><stop stop-color="${friendly ? '#fff9e9' : '#52635b'}"/><stop offset="1" stop-color="${friendly ? '#b7c4b6' : '#15231f'}"/></linearGradient>
      <linearGradient id="${paintId}-mitre" x2="1" y2="1"><stop stop-color="${friendly ? '#fff7dc' : '#ff7753'}"/><stop offset=".55" stop-color="${friendly ? '#e9e2c4' : '#c82c2c'}"/><stop offset="1" stop-color="${friendly ? '#b7b99a' : '#7f2029'}"/></linearGradient>
    </defs>
    <rect width="300" height="300" rx="8" fill="#111d19"/>
    <circle cx="154" cy="138" r="131" fill="url(#${paintId}-halo)"/>
    <g fill="none" stroke="#63836d" stroke-width="1.5" opacity=".65">
      <circle cx="150" cy="143" r="107"/><circle cx="150" cy="143" r="86" stroke-dasharray="4 13"/>
      <path d="M150 20v30m0 189v31M26 143h29m191 0h29M47 40l31 31m143 143 32 32M47 246l31-32M222 71l31-31"/>
    </g>
    <g stroke="#101b18" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
      <path d="m113 133-39 33-28 107 51-14 18 23 27-17 40 18 20-20 47 10-25-101-43-38Z" fill="url(#${paintId}-cloak)"/>
      <path d="m109 135-30 24-7 38 28-9 15-29m64-23 32 25 10 39-34-12-16-29" fill="${friendly ? '#f2ecd5' : '#788773'}"/>
      <path d="m92 163 10 5m-18 8 12 5m99-16-10 6m19 7-13 6" stroke="#b7baa0" stroke-width="2"/>
      <path d="m114 159 7 86 22 18 34-21 9-82" fill="${friendly ? '#e8e3cb' : '#22362d'}"/>
      <path d="m139 177 3 73m15-73-4 73" stroke="#b5a05c" stroke-width="3"/>
      <path d="M106 94h79l-7 47-30 24-31-22Z" fill="#dcc7a0"/>
      <path d="m105 109 79-8-7 26-24-1-19 15-23-14Z" fill="#192821"/>
      <path d="m119 116 17-3m23-3 15-3" stroke="#f7d982" stroke-width="3"/>
      <path d="m148 120-4 14 10 1m-14 12 18-4" fill="none" stroke="#885447" stroke-width="2"/>
      <path d="m173 97-16 47" fill="none" stroke="#ac3e34" stroke-width="2"/>
      <path d="M99 105c-1-37 25-74 47-94 25 19 51 57 48 92l-48-7Z" fill="url(#${paintId}-mitre)"/>
      <path d="m146 24 1 60m-17-39 33-1" fill="none" stroke="#f4d58b" stroke-width="5"/>
      <path d="m103 90 44-8 43 7" fill="none" stroke="#f0b965" stroke-width="3"/>
      <path d="m148 13 20 43 8 35" fill="none" stroke="#ff9970" stroke-width="2"/>
      <g transform="rotate(-19 150 199)">
        <path d="m66 191-28 12v20l35-9 16 9 24-25Z" fill="#6f7968"/>
        <path d="M72 184h123l12 9-13 17H90l-13 13-13-8Z" fill="#243a32"/>
        <path d="M170 188h95v13h-95Z" fill="#7e8d7b"/><path d="M260 183h23v22h-23Z" fill="#273d33"/>
        <path d="m111 207 5 24 13-3-2-22m19-1v14h17l9-14" fill="#728270"/>
        <path d="M116 180v-9h52v11" fill="none" stroke="#7a8c78" stroke-width="5"/>
        <rect x="103" y="157" width="74" height="18" rx="6" fill="#3d5546"/>
        <path d="M167 153h18v26h-18Z" fill="#9b3130"/>
        <ellipse cx="185" cy="166" rx="6" ry="12" fill="#ff6a46" stroke="#f8b47d" stroke-width="2"/>
        <path d="M79 192h14m5 0h8m104 2h41" stroke="#b7c2a8" stroke-width="2"/>
      </g>
      <path d="m91 204 16 3 14 17-8 12-17-13-12-7Zm87-34 18 5 15 21-10 11-13-21-15-4Z" fill="#b4b79a"/>
      <path d="m76 249 13-35m114 24-9-25m-69 28-4 19m48-20 9 22" fill="none" stroke="#788b71" stroke-width="2"/>
      <path d="M74 278h151l12 13H62Z" fill="#111d19" stroke="#6a7f68" stroke-width="2"/>
    </g>
    <g fill="#ff825c"><circle cx="246" cy="70" r="3"/><path d="M246 57v7m0 12v7m-13-13h7m12 0h7" stroke="#ff825c" stroke-width="1.5"/></g>
  </svg>`;
}
