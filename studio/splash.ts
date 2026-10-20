/** Shared studio presentation. The caller owns the destination and startup backdrop. */
export const FADE_MS = 450;
export const HOLD_MS = 1500;
export const SPLASH_MS = FADE_MS * 2 + HOLD_MS;
const logoUrl = new URL('./phicid_logo.png', import.meta.url).href;

export function logoOpacity(elapsed: number): number {
  const sine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
  if (elapsed <= 0 || elapsed >= SPLASH_MS) return 0;
  if (elapsed < FADE_MS) return sine(elapsed / FADE_MS);
  if (elapsed <= FADE_MS + HOLD_MS) return 1;
  return 1 - sine((elapsed - FADE_MS - HOLD_MS) / FADE_MS);
}

export interface PadSnapshot {
  index: number;
  id: string;
  buttons: readonly { pressed: boolean }[];
}
interface PadPress { index: number; id: string; button: number }

/** Copy button states: browsers can reuse mutable Gamepad objects between polls. */
export class GamepadPressTracker {
  private previous: Map<string, boolean[]>;

  constructor(pads: readonly (PadSnapshot | null)[]) {
    this.previous = this.snapshot(pads);
  }

  private snapshot(pads: readonly (PadSnapshot | null)[]): Map<string, boolean[]> {
    return new Map(pads.filter(pad => pad !== null).map(pad =>
      [`${pad.index}:${pad.id}`, pad.buttons.map(button => button.pressed)]));
  }

  poll(pads: readonly (PadSnapshot | null)[]): PadPress | null {
    let press: PadPress | null = null;
    for (const pad of pads) {
      if (!pad) continue;
      const previous = this.previous.get(`${pad.index}:${pad.id}`) ?? [];
      const button = pad.buttons.findIndex((value, index) => value.pressed && !previous[index]);
      if (!press && button >= 0) press = { index: pad.index, id: pad.id, button };
    }
    this.previous = this.snapshot(pads);
    return press;
  }
}

type SkipInput = { kind: 'key'; code: string } | { kind: 'mouse'; button: number }
  | { kind: 'gamepad'; press: PadPress };
let startup: Promise<void> | undefined;

/** Play once per page/application startup; game resets must not re-run this entry. */
export function showStudioSplash(): Promise<void> {
  if (startup) return startup;
  startup = new Promise<void>(resolve => {
    const overlay = document.createElement('div');
    overlay.id = 'studio-splash';
    overlay.setAttribute('aria-label', 'Phicid Productions studio splash');
    const logo = document.createElement('img');
    logo.src = logoUrl;
    logo.alt = 'Phicid Productions';
    logo.draggable = false;
    logo.style.opacity = '0';
    overlay.append(logo);
    document.body.append(overlay);

    const readPads = (): readonly (PadSnapshot | null)[] => {
      try { return navigator.getGamepads?.() ?? []; }
      catch { return []; } // Gamepad access may be unavailable in embedded browsers.
    };
    const pads = new GamepadPressTracker(readPads());
    let started: number | null = null;
    let finishing = false;
    let skip: SkipInput | null = null;
    let released = false;
    let neutralFrame = false;
    let frame: number;

    const consume = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const finish = (input: SkipInput | null = null) => {
      if (finishing) return;
      finishing = true;
      skip = input;
      released = input === null;
      logo.style.opacity = '0';
    };
    const keyDown = (event: KeyboardEvent) => {
      consume(event);
      if (!event.repeat) finish({ kind: 'key', code: event.code || event.key });
    };
    const keyUp = (event: KeyboardEvent) => {
      consume(event);
      if (skip?.kind === 'key' && skip.code === (event.code || event.key)) released = true;
    };
    const mouseDown = (event: MouseEvent) => {
      consume(event);
      if (event.button >= 0 && event.button <= 2) finish({ kind: 'mouse', button: event.button });
    };
    const mouseUp = (event: MouseEvent) => {
      consume(event);
      if (skip?.kind === 'mouse' && skip.button === event.button) released = true;
    };
    const blur = () => { if (finishing) { skip = null; released = true; } };
    const listeners: [string, EventListener][] = [
      ['keydown', keyDown as EventListener], ['keyup', keyUp as EventListener],
      ['mousedown', mouseDown as EventListener], ['mouseup', mouseUp as EventListener],
      ['keypress', consume], ['click', consume], ['auxclick', consume], ['dblclick', consume],
      ['contextmenu', consume], ['blur', blur],
    ];
    for (const [type, listener] of listeners) window.addEventListener(type, listener, { capture: true });

    const tick = (now: number) => {
      const currentPads = readPads();
      const press = pads.poll(currentPads);
      if (!finishing && press) finish({ kind: 'gamepad', press });
      if (finishing) {
        if (skip?.kind === 'gamepad') {
          const held = skip.press;
          released = !currentPads.find(pad => pad?.index === held.index && pad.id === held.id)
            ?.buttons[held.button]?.pressed;
        }
        if (released && neutralFrame) {
          cancelAnimationFrame(frame);
          for (const [type, listener] of listeners) window.removeEventListener(type, listener, { capture: true });
          overlay.remove();
          resolve();
          return;
        }
        // Keep capture through release/click and one complete frame before handoff.
        neutralFrame = released;
      } else if (started !== null) {
        const elapsed = now - started;
        logo.style.opacity = String(logoOpacity(elapsed));
        if (elapsed >= SPLASH_MS) finish();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    void logo.decode().then(() => {
      if (!finishing) started = performance.now();
    }).catch(error => {
      console.error('Unable to load the studio logo.', error);
      finish();
    });
  });
  return startup;
}
