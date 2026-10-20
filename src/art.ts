import type { PieceSymbol } from 'chess.js';
import type { EncounterId } from './encounters';

export function icon(name: 'arrow' | 'retry' | 'undo' | 'bulb' | 'lock' | 'check' | 'target' | 'star' | 'book' | 'x' | 'eye'): string {
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

const burst = '<path d="m138 16 17 28 31-12 5 34 35 4-15 29 24 25-30 16 5 34-35-2-13 32-25-21-28 20-10-33-34-1 9-32-27-21 29-19-4-34 33 6Z" fill="#edb845"/>';

export function characterArt(id: EncounterId): string {
  const character = id === 'horsie'
    ? `<g transform="rotate(-8 130 120)" stroke="#293b38" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M78 186c3-37 37-47 35-78L75 126l-12-25 51-44 3-28 18 17 16-5 34 33 9 41-29 61 22 19H75Z" fill="#f7f0dc"/>
      <path d="m147 51 20-12-2 26 18 1 2 21 13 7-10 20 6 18-16 9-1 18-15 7" fill="#e75435"/>
      <path d="m79 101 11 7 13-10m7 27 20-23m-6-43 17 3" fill="none"/>
      <path d="m117 70 45 6-8 17-18-2-5-12-8 9-15-2Z" fill="#293b38"/><path d="m143 79 8 2m-33-5 5 1" stroke="#f7f0dc"/>
      <path d="m123 135 16 8 13-11" fill="none"/><path d="M71 191h119l9 16H62Z" fill="#f7f0dc"/>
      <path d="m58 62 7-9m119 108 12 4m-137-9 5 5" stroke="#e75435"/>
    </g><g fill="#293b38" font-family="Arial,sans-serif" font-size="19" font-weight="900"><text x="30" y="49" transform="rotate(-15 30 49)">L!</text><text x="200" y="69" transform="rotate(13 200 69)">L!</text></g>`
    : id === 'escort'
      ? `<g stroke="#293b38" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m87 185 15-58h53l17 58Z" fill="#f7f0dc"/><circle cx="128" cy="91" r="40" fill="#f7f0dc"/><path d="M102 83h8m35 0h8m-37 19q13 15 26-1" fill="none"/><path d="m95 151-25-22-17 7m111 15 21-38 14 2" fill="none"/><path d="m101 177-12 20m65-20 15 20" fill="none"/><path d="M81 194h99l9 15H73Z" fill="#f7f0dc"/><path d="m109 55-5-28 18 14 11-23 10 23 17-13-4 31Z" fill="#e75435"/><path d="m188 80 8-13m-143 17 10 6m123 85 14 3" stroke="#e75435"/></g><text x="24" y="48" fill="#293b38" font-family="Arial,sans-serif" font-size="18" font-weight="900" transform="rotate(-10 24 48)">BIG</text><text x="26" y="66" fill="#293b38" font-family="Arial,sans-serif" font-size="18" font-weight="900" transform="rotate(-10 26 66)">DREAMS.</text>`
      : `<g stroke="#293b38" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="131" cy="126" r="77" fill="none" stroke-dasharray="8 10" opacity=".45"/><path d="M131 37v26m0 126v26m-89-89h26m128 0h25" fill="none"/><path d="m95 190 13-53h45l17 53Z" fill="#293b38"/><path d="M101 83h58v41c0 39-58 39-58 0Z" fill="#f7f0dc"/><path d="M91 97c0-34 25-66 40-78 15 12 40 44 40 78Z" fill="#e75435"/><path d="M131 36v39m-12-23h24" stroke="#f7f0dc"/><path d="m105 109 13 5m27-1 11-5m-37 25 22-1" fill="none"/><circle cx="151" cy="117" r="16" fill="none"/><path d="m166 125 18 19m-81 17-23-14m2-3-20 4" fill="none"/><path d="M90 192h86l9 17H80Z" fill="#293b38"/></g><text x="19" y="47" fill="#293b38" font-family="Arial,sans-serif" font-size="18" font-weight="900" transform="rotate(-12 19 47)">BOSS!</text>`;
  return `<svg class="character-art" viewBox="0 0 260 225" role="img" aria-label="${id === 'horsie' ? 'A smug cartoon knight wearing sunglasses' : id === 'escort' ? 'An ambitious little pawn dreaming of a crown' : 'A scowling bishop with an enormous red bishop’s hat and a monocle'}">${burst}${character}</svg>`;
}
