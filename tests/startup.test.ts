import { describe, expect, it } from 'vitest';
import { FADE_MS, GamepadPressTracker, HOLD_MS, logoOpacity, SPLASH_MS } from '../studio/splash';

describe('supplied studio presentation', () => {
  it('preserves the sine fade and shared timing', () => {
    expect(SPLASH_MS).toBe(2400);
    expect(logoOpacity(0)).toBe(0); expect(logoOpacity(FADE_MS / 2)).toBeCloseTo(.5);
    expect(logoOpacity(FADE_MS + HOLD_MS / 2)).toBe(1);
    expect(logoOpacity(SPLASH_MS - FADE_MS / 2)).toBeCloseTo(.5);
    expect(logoOpacity(SPLASH_MS)).toBe(0);
  });
  it('ignores a held controller button until release and a fresh press', () => {
    const pad = { index: 0, id: 'pad', buttons: [{ pressed: true }] };
    const tracker = new GamepadPressTracker([pad]);
    expect(tracker.poll([pad])).toBeNull();
    pad.buttons[0].pressed = false; expect(tracker.poll([pad])).toBeNull();
    pad.buttons[0].pressed = true; expect(tracker.poll([pad])?.button).toBe(0);
    expect(tracker.poll([pad])).toBeNull();
  });
  it('detects a fresh press on a newly connected controller', () => {
    const tracker = new GamepadPressTracker([]);
    expect(tracker.poll([{ index: 2, id: 'new', buttons: [{ pressed: true }] }])?.index).toBe(2);
  });
});
