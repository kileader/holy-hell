import { describe, expect, it } from 'vitest';
import { adjacentIndex, ControllerInput } from '../src/controller';
import type { PadSnapshot } from '../src/controller';

function pad(buttons: number[] = [], axes = [0, 0]): PadSnapshot {
  return { buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: buttons.includes(index), value: buttons.includes(index) ? 1 : 0 })), axes };
}

describe('controller input', () => {
  it('waits for neutral input on connection and after reset', () => {
    const input = new ControllerInput();
    expect(input.sample(pad([0]), 0)).toEqual([]);
    expect(input.sample(pad([0]), 500)).toEqual([]);
    expect(input.sample(pad(), 600)).toEqual([]);
    expect(input.sample(pad([0]), 700)).toEqual(['confirm']);
    input.reset();
    expect(input.sample(pad([0]), 800)).toEqual([]);
  });

  it('activates face buttons once per press so opening a dialog cannot select through it', () => {
    const input = new ControllerInput(); input.sample(pad(), 0);
    expect(input.sample(pad([3]), 10)).toEqual(['hint']);
    expect(input.sample(pad([3]), 500)).toEqual([]);
    input.sample(pad(), 600);
    expect(input.sample(pad([3]), 700)).toEqual(['hint']);
  });

  it('maps cancel, undo, briefing, sight lines, and pause', () => {
    const input = new ControllerInput(); input.sample(pad(), 0);
    expect(input.sample(pad([1, 2, 4, 5, 9]), 10)).toEqual(['back', 'undo', 'briefing', 'sight', 'menu']);
  });

  it('ignores stick drift and chooses one direction for diagonal input', () => {
    const input = new ControllerInput(); input.sample(pad(), 0);
    expect(input.sample(pad([], [.2, -.3]), 10)).toEqual([]);
    expect(input.sample(pad([], [.9, -.7]), 20)).toEqual(['right']);
    expect(input.sample(pad([], [.3, -.9]), 30)).toEqual(['up']);
  });

  it('repeats held directions after a delay without catch-up bursts', () => {
    const input = new ControllerInput(); input.sample(pad(), 0);
    expect(input.sample(pad([13]), 10)).toEqual(['down']);
    expect(input.sample(pad([13]), 200)).toEqual([]);
    expect(input.sample(pad([13]), 330)).toEqual(['down']);
    expect(input.sample(pad([13]), 400)).toEqual([]);
    expect(input.sample(pad([13]), 1000)).toEqual(['down']);
    input.sample(pad(), 1010);
    expect(input.sample(pad([13]), 1020)).toEqual(['down']);
  });

  it('cancels opposing D-pad directions', () => {
    const input = new ControllerInput(); input.sample(pad(), 0);
    expect(input.sample(pad([12, 13, 14, 15]), 10)).toEqual([]);
  });

  it('keeps the board cursor inside the board at every edge', () => {
    expect(adjacentIndex(0, 'up')).toBe(0);
    expect(adjacentIndex(0, 'left')).toBe(0);
    expect(adjacentIndex(7, 'right')).toBe(7);
    expect(adjacentIndex(63, 'down')).toBe(63);
    expect(adjacentIndex(27, 'right')).toBe(28);
    expect(adjacentIndex(27, 'up')).toBe(19);
  });
});
