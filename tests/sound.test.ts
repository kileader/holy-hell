import { describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { moveSound, SoundEffects, soundCues, soundSamples } from '../src/sound';

function audioDevice(state = 'running') {
  const voices: Array<{ start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
  const context = {
    state, currentTime: 1, destination: {}, resume: vi.fn().mockResolvedValue(undefined),
    createGain: () => ({ gain: { value: 1 }, connect: vi.fn() }),
    createBuffer: (_channels: number, frames: number) => ({ getChannelData: () => new Float32Array(frames) }),
    createBufferSource: () => {
      const voice = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null };
      voices.push(voice); return voice;
    },
  };
  return { context, voices, factory: () => context as unknown as AudioContext };
}

describe('original sound effects', () => {
  for (const cue of soundCues) {
    it(`${cue} produces a finite, bounded, short audible waveform with silent edges`, () => {
      const pcm = soundSamples(cue);
      expect(pcm.length).toBeLessThan(22050 * 2);
      expect(pcm.every(Number.isFinite)).toBe(true);
      const peak = pcm.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
      expect(peak).toBeGreaterThan(.04); expect(peak).toBeLessThan(.7);
      expect(pcm[0]).toBe(0); expect(pcm.at(-1)).toBe(0);
    });
  }
  it('uses distinct effects for movement, captures, castling, and promotion', () => {
    expect(moveSound(new Chess().move('e4'))).toBe('move');
    const chess = new Chess(); chess.move('e4'); chess.move('d5');
    expect(moveSound(chess.move('exd5'))).toBe('capture');
    expect(moveSound(new Chess('4k3/8/8/8/8/8/8/4K2R w K - 0 1').move('O-O'))).toBe('castle');
    expect(moveSound(new Chess('8/4P1k1/8/8/8/8/8/6K1 w - - 0 1').move('e8=N'))).toBe('promotion');
  });
  it('does not create audio until interaction; mute stops current and future effects', () => {
    const device = audioDevice(); const create = vi.fn(device.factory);
    const sounds = new SoundEffects(create);
    sounds.setMuted(false); expect(create).not.toHaveBeenCalled();
    sounds.play('victory'); expect(device.voices[0].start).toHaveBeenCalled();
    sounds.setMuted(true); expect(device.voices[0].stop).toHaveBeenCalled();
    sounds.play('move'); expect(device.voices).toHaveLength(1);
    sounds.setMuted(false); sounds.play('move'); expect(device.voices).toHaveLength(2);
  });
  it('does not queue blocked sounds or burst them after autoplay unlock', () => {
    const device = audioDevice('suspended'); const sounds = new SoundEffects(device.factory);
    sounds.play('victory'); expect(device.voices).toHaveLength(0);
    device.context.state = 'running'; sounds.play('select');
    expect(device.voices).toHaveLength(1);
  });
  it('stops audio on interruption and bounds repeated navigation/polyphony', () => {
    const device = audioDevice(); const sounds = new SoundEffects(device.factory);
    sounds.play('navigate'); sounds.play('navigate'); expect(device.voices).toHaveLength(1);
    for (let i = 0; i < 30; i++) sounds.play('select');
    expect(device.voices).toHaveLength(12);
    sounds.stop(); expect(device.voices.every(voice => voice.stop.mock.calls.length === 1)).toBe(true);
    sounds.play('move'); expect(device.voices).toHaveLength(13);
  });
  it('an unavailable audio device never breaks gameplay', () => {
    const sounds = new SoundEffects(() => { throw new Error('Audio unavailable'); });
    expect(() => { sounds.unlock(); sounds.play('move'); sounds.setMuted(true); sounds.setMuted(false); }).not.toThrow();
  });
});
