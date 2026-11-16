import type { MusicPreset } from '../types/reel';

interface MusicConfig {
  bpm: number;
  notes: number[];
  waveform: OscillatorType;
  filterHz: number;
  pulseGain: number;
}

const PRESETS: Record<MusicPreset, MusicConfig> = {
  lofi: {
    bpm: 78,
    notes: [261.63, 329.63, 392.0, 493.88, 220.0, 261.63, 329.63, 392.0],
    waveform: 'triangle',
    filterHz: 950,
    pulseGain: 0.14,
  },
  motivacional: {
    bpm: 112,
    notes: [220.0, 261.63, 329.63, 440.0, 246.94, 293.66, 392.0, 440.0],
    waveform: 'sawtooth',
    filterHz: 1400,
    pulseGain: 0.12,
  },
  dinamico: {
    bpm: 122,
    notes: [293.66, 369.99, 440.0, 587.33, 329.63, 392.0, 493.88, 587.33],
    waveform: 'triangle',
    filterHz: 1800,
    pulseGain: 0.16,
  },
  ambient: {
    bpm: 64,
    notes: [196.0, 246.94, 293.66, 392.0, 174.61, 220.0, 261.63, 349.23],
    waveform: 'sine',
    filterHz: 850,
    pulseGain: 0.13,
  },
  noticias: {
    bpm: 104,
    notes: [196.0, 233.08, 293.66, 392.0, 220.0, 261.63, 329.63, 392.0],
    waveform: 'square',
    filterHz: 1100,
    pulseGain: 0.08,
  },
};

export class RoyaltyFreeMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private timerId: number | null = null;
  private step = 0;
  private streamDest: MediaStreamAudioDestinationNode | null = null;

  public start(
    preset: MusicPreset,
    options?: { muteSpeakers?: boolean; captureStream?: boolean },
  ): MediaStream | null {
    this.stop();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    this.ctx = new AudioCtx();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = PRESETS[preset].filterHz;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = options?.muteSpeakers ? 0 : 0.35;

    filter.connect(this.masterGain);
    if (!options?.muteSpeakers) {
      this.masterGain.connect(this.ctx.destination);
    }

    let captured: MediaStream | null = null;
    if (options?.captureStream) {
      this.streamDest = this.ctx.createMediaStreamDestination();
      const exportGain = this.ctx.createGain();
      exportGain.gain.value = 0.45;
      filter.connect(exportGain);
      exportGain.connect(this.streamDest);
      captured = this.streamDest.stream;
    }

    const cfg = PRESETS[preset];
    const stepMs = Math.round((60 / cfg.bpm / 2) * 1000);
    this.step = 0;

    const triggerNote = () => {
      if (!this.ctx || this.ctx.state === 'closed') return;
      const now = this.ctx.currentTime;
      const freq = cfg.notes[this.step % cfg.notes.length];

      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = cfg.waveform;
      osc.frequency.setValueAtTime(freq, now);

      env.gain.setValueAtTime(0.001, now);
      env.gain.exponentialRampToValueAtTime(cfg.pulseGain, now + 0.04);
      env.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000 * 0.92);

      osc.connect(env);
      env.connect(filter);
      osc.start(now);
      osc.stop(now + stepMs / 1000);

      // Subtle warm bass root every 4 steps
      if (this.step % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bassEnv = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(freq / 2, now);
        bassEnv.gain.setValueAtTime(0.001, now);
        bassEnv.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
        bassEnv.gain.exponentialRampToValueAtTime(0.001, now + (stepMs / 1000) * 3.6);
        bass.connect(bassEnv);
        bassEnv.connect(filter);
        bass.start(now);
        bass.stop(now + (stepMs / 1000) * 3.8);
      }

      this.step += 1;
    };

    triggerNote();
    this.timerId = window.setInterval(triggerNote, stepMs);
    return captured;
  }

  public stop(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.streamDest = null;
  }
}
