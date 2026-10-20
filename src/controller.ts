export type Direction = 'up' | 'down' | 'left' | 'right';
export type ControlAction = Direction | 'confirm' | 'back' | 'undo' | 'hint' | 'menu' | 'briefing' | 'sight';
export interface PadSnapshot {
  buttons: ReadonlyArray<{ pressed: boolean; value: number }>;
  axes: readonly number[];
}

const bindings: ReadonlyArray<[number, ControlAction]> = [
  [0, 'confirm'], [1, 'back'], [2, 'undo'], [3, 'hint'],
  [4, 'briefing'], [5, 'sight'], [9, 'menu'],
];
const pressed = (pad: PadSnapshot, index: number) => !!pad.buttons[index]?.pressed || (pad.buttons[index]?.value ?? 0) > .5;

function direction(pad: PadSnapshot): Direction | undefined {
  const x = (pressed(pad, 15) ? 1 : 0) - (pressed(pad, 14) ? 1 : 0);
  const y = (pressed(pad, 13) ? 1 : 0) - (pressed(pad, 12) ? 1 : 0);
  if (x) return x > 0 ? 'right' : 'left';
  if (y) return y > 0 ? 'down' : 'up';
  // A deliberate dead zone and a dominant axis keep diagonal stick motion predictable.
  const horizontal = pad.axes[0] ?? 0;
  const vertical = pad.axes[1] ?? 0;
  if (Math.max(Math.abs(horizontal), Math.abs(vertical)) < .55) return undefined;
  return Math.abs(horizontal) >= Math.abs(vertical)
    ? horizontal > 0 ? 'right' : 'left'
    : vertical > 0 ? 'down' : 'up';
}

/** Standard-layout gamepad input, independent of rendering and chess state. */
export class ControllerInput {
  private armed = false;
  private previous: boolean[] = [];
  private heldDirection?: Direction;
  private repeatAt = 0;

  reset(): void {
    this.armed = false;
    this.previous = [];
    this.heldDirection = undefined;
  }

  sample(pad: PadSnapshot, time: number): ControlAction[] {
    const held = pad.buttons.map((button) => button.pressed || button.value > .5);
    const nextDirection = direction(pad);
    // Connecting, refocusing, or resuming a held button must not activate a menu.
    if (!this.armed) {
      if (!held.some(Boolean) && !nextDirection) this.armed = true;
      this.previous = held;
      return [];
    }
    const actions: ControlAction[] = [];
    for (const [index, action] of bindings) {
      if (held[index] && !this.previous[index]) actions.push(action);
    }
    if (nextDirection !== this.heldDirection) {
      if (nextDirection) actions.push(nextDirection);
      this.repeatAt = time + 320;
    } else if (nextDirection && time >= this.repeatAt) {
      actions.push(nextDirection);
      this.repeatAt = time + 150;
    }
    this.heldDirection = nextDirection;
    this.previous = held;
    return actions;
  }
}

/** Board navigation stops at the edge, rather than wrapping to another rank. */
export function adjacentIndex(index: number, action: Direction): number {
  if (action === 'left') return index % 8 ? index - 1 : index;
  if (action === 'right') return index % 8 < 7 ? index + 1 : index;
  if (action === 'up') return index >= 8 ? index - 8 : index;
  return index < 56 ? index + 8 : index;
}
