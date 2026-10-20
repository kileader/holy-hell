import type { Move } from 'chess.js';

export type SoundCue = 'navigate' | 'select' | 'back' | 'menu' | 'start' | 'invalid'
  | 'move' | 'capture' | 'castle' | 'promotion' | 'check' | 'victory' | 'loss' | 'undo' | 'hint';
interface Note {
  at: number; duration: number; frequency: number; end?: number;
  gain?: number; wave?: 'sine' | 'triangle'; noise?: number;
}
const note = (frequency: number, at = 0, duration = .12, gain = .5): Note => ({ frequency, at, duration, gain });

// Short original arcade cues; the studio intro stays silent. No music or remote assets.
const scores: Record<SoundCue, Note[]> = {
  navigate: [note(440, 0, .035, .16)],
  select: [note(660, 0, .065, .32), note(880, .035, .08, .25)],
  back: [note(440, 0, .06, .25), note(330, .045, .08, .2)],
  menu: [note(392, 0, .1, .3), note(587, .06, .13, .25)],
  start: [note(392, 0, .1), note(494, .09, .1), note(587, .18, .2)],
  invalid: [{ ...note(140, 0, .13, .32), end: 90, wave: 'triangle' }],
  move: [{ ...note(240, 0, .09, .6), end: 100, noise: .16 }],
  capture: [{ ...note(150, 0, .2, .65), end: 45, noise: .45 }, note(620, .01, .07, .22)],
  castle: [{ ...note(260, 0, .13, .55), end: 110, noise: .18 },
    { ...note(340, .13, .16, .6), end: 150, noise: .18 }, note(784, .22, .22, .3)],
  promotion: [0, 4, 7, 12].map((step, i) => ({ ...note(392 * 2 ** (step / 12), i * .08, .28, .38), wave: 'triangle' })),
  check: [note(740, .07, .14, .35), note(988, .23, .23, .4)],
  victory: [0, 4, 7, 12, 7, 12].map((step, i) => ({ ...note(392 * 2 ** (step / 12), .12 + i * .13, i === 5 ? .55 : .24, .42), wave: 'triangle' })),
  loss: [note(294, 0, .22, .4), note(247, .18, .22, .35), note(196, .36, .4, .3)],
  undo: [{ ...note(300, 0, .18, .4), end: 650 }, note(440, .12, .08, .2)],
  hint: [note(784, 0, .2, .3), note(1175, .11, .3, .25)],
};
export const soundCues = Object.keys(scores) as SoundCue[];

/** Deterministic PCM makes the same authored cues usable in real-time and offline QA. */
export function soundSamples(cue: SoundCue, sampleRate = 22050): Float32Array {
  const notes = scores[cue];
  const duration = Math.max(...notes.map(n => n.at + n.duration));
  const samples = new Float32Array(Math.ceil(duration * sampleRate) + 1);
  let random = 531;
  for (const n of notes) {
    const offset = Math.round(n.at * sampleRate);
    const length = Math.floor(n.duration * sampleRate);
    let filteredNoise = 0;
    for (let i = 0; i < length && offset + i < samples.length; i++) {
      const t = i / sampleRate;
      const phase = 2 * Math.PI * (n.frequency * t + ((n.end ?? n.frequency) - n.frequency) * t * t / (2 * n.duration));
      const tone = n.wave === 'triangle' ? 2 / Math.PI * Math.asin(Math.sin(phase)) : Math.sin(phase);
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      filteredNoise = filteredNoise * .6 + (random / 0xffffffff * 2 - 1) * .4;
      const envelope = Math.min(1, t / .004) * Math.exp(-4 * t / n.duration) * Math.min(1, (length - i - 1) / (sampleRate * .012));
      samples[offset + i] += (tone * (1 - (n.noise ?? 0)) + filteredNoise * (n.noise ?? 0)) * envelope * (n.gain ?? .5);
    }
  }
  return samples.map(sample => Math.tanh(sample) * .7);
}

export function moveSound(move: Move): SoundCue {
  if (move.isKingsideCastle() || move.isQueensideCastle()) return 'castle';
  if (move.promotion) return 'promotion';
  return move.captured ? 'capture' : 'move';
}

/** Lazy, gesture-unlocked audio. Never queue blocked sounds to replay later. */
export class SoundEffects {
  private context?: AudioContext;
  private master?: GainNode;
  private buffers = new Map<SoundCue, AudioBuffer>();
  private sources = new Set<AudioBufferSourceNode>();
  private lastNavigation = -Infinity;
  private failed = false;
  muted = false;

  constructor(private readonly createContext = () => new AudioContext()) {}

  unlock(): void {
    if (this.muted || this.failed) return;
    try {
      if (!this.context) {
        this.context = this.createContext();
        this.master = this.context.createGain();
        this.master.gain.value = .65;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => { /* Next gesture can retry. */ });
    } catch { this.failed = true; } // Audio support cannot stop a chess game.
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stop();
    if (this.master) this.master.gain.value = muted ? 0 : .65;
    if (!muted && this.context) this.unlock();
  }

  stop(): void {
    for (const source of this.sources) { source.stop(); source.disconnect(); }
    this.sources.clear();
  }

  play(cue: SoundCue): void {
    if (this.muted) return;
    this.unlock();
    const context = this.context;
    if (!context || context.state !== 'running' || !this.master || this.sources.size >= 12) return;
    if (cue === 'navigate') {
      if (context.currentTime - this.lastNavigation < .05) return;
      this.lastNavigation = context.currentTime;
    }
    try {
      let buffer = this.buffers.get(cue);
      if (!buffer) {
        const samples = soundSamples(cue);
        buffer = context.createBuffer(1, samples.length, 22050);
        buffer.getChannelData(0).set(samples);
        this.buffers.set(cue, buffer);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.master);
      source.onended = () => { source.disconnect(); this.sources.delete(source); };
      this.sources.add(source);
      source.start();
    } catch { /* A device/context interruption is recoverable on the next gesture. */ }
  }
}
