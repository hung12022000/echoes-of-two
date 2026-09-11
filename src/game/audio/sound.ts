import type { EffectKind } from '../combat/encounter';
import type { Weather } from '../oceanbound/session';

export type WorldSound = EffectKind | 'step' | 'land' | 'gather' | 'hook' | 'hammer' | 'spear' | 'shovel' | 'water' | 'shark' | 'bite' | 'craft' | 'plant' | 'build' | 'harvest' | 'fish' | 'thunder' | 'gull';

type Layer = { source: AudioBufferSourceNode; filter: BiquadFilterNode; gain: GainNode };
type Voice = { source: AudioScheduledSourceNode; nodes: AudioNode[] };
type Note = {
  noise?: boolean; from: number; to?: number; duration: number; level: number;
  delay?: number; attack?: number; shape?: OscillatorType; filter?: BiquadFilterType;
};
type Climate = { sea: number; wind: number; rain: number; cutoff: number; swell: number };

const CLIMATE: Record<Weather, Climate> = {
  'Trong xanh': { sea: .14, wind: .025, rain: 0, cutoff: 480, swell: .85 },
  'Gió mạnh': { sea: .19, wind: .12, rain: 0, cutoff: 900, swell: 1.3 },
  'Mưa rào': { sea: .16, wind: .065, rain: .075, cutoff: 700, swell: 1 },
  'Giông sét': { sea: .22, wind: .13, rain: .1, cutoff: 1100, swell: 1.45 },
  'Bão nhiệt đới': { sea: .27, wind: .19, rain: .13, cutoff: 1450, swell: 1.75 },
  'Mắt bão': { sea: .1, wind: .015, rain: .006, cutoff: 380, swell: .65 },
  'Mưa tuyết dị thường': { sea: .12, wind: .09, rain: .009, cutoff: 580, swell: .75 },
};

// Filtered noise supplies texture; quiet resonances identify each action.
// Conservative levels precede the compressor and shared 0.55 master gain.
const SCORES: Record<WorldSound, readonly Note[]> = {
  step: [{ noise: true, from: 520, duration: .09, level: .07 }, { from: 95, to: 55, duration: .1, level: .026 }],
  land: [{ noise: true, from: 650, duration: .22, level: .12 }, { from: 115, to: 42, duration: .23, level: .075 }],
  hook: [
    { noise: true, from: 1800, to: 420, duration: .38, attack: .035, level: .12, filter: 'bandpass' },
    { from: 780, to: 330, duration: .13, level: .03, delay: .025 },
    { noise: true, from: 2200, duration: .2, level: .095, delay: .3 },
  ],
  hammer: [{ from: 175, to: 62, duration: .2, level: .105, shape: 'triangle' }, { noise: true, from: 1450, duration: .1, level: .095 }, { from: 240, to: 90, duration: .17, level: .07, delay: .22, shape: 'triangle' }],
  spear: [{ noise: true, from: 2600, to: 620, duration: .24, level: .12, filter: 'bandpass' }, { from: 440, to: 150, duration: .14, level: .04, delay: .14 }],
  shovel: [{ noise: true, from: 760, to: 210, duration: .32, level: .12 }, { from: 125, to: 68, duration: .18, level: .045, delay: .18 }],
  water: [{ noise: true, from: 3400, to: 850, duration: .72, level: .085, filter: 'bandpass', attack: .06 }, { from: 520, to: 310, duration: .22, level: .025, delay: .5 }],
  shark: [{ from: 82, to: 48, duration: 1.6, level: .1, attack: .22 }, { noise: true, from: 620, to: 160, duration: 1.1, level: .12, attack: .16 }],
  bite: [{ noise: true, from: 1250, to: 120, duration: .5, level: .2 }, { from: 95, to: 34, duration: .62, level: .13, shape: 'triangle' }, { noise: true, from: 2100, duration: .16, level: .12, delay: .25 }],
  gather: [{ noise: true, from: 1500, duration: .16, level: .08 }, { from: 390, to: 270, duration: .1, level: .05 }, { from: 650, duration: .12, level: .025, delay: .09 }],
  craft: [
    { noise: true, from: 2100, duration: .08, level: .085 },
    { from: 840, to: 620, duration: .13, level: .04 },
    { noise: true, from: 1700, duration: .07, level: .07, delay: .18 },
    { from: 1120, to: 900, duration: .22, level: .035, delay: .2 },
  ],
  plant: [{ noise: true, from: 850, duration: .3, attack: .035, level: .12 }, { from: 270, to: 110, duration: .14, level: .04, delay: .15 }],
  build: [
    { from: 170, to: 65, duration: .19, level: .1, shape: 'triangle' },
    { noise: true, from: 1400, duration: .08, level: .1 },
    { from: 210, to: 85, duration: .22, level: .08, delay: .2, shape: 'triangle' },
    { noise: true, from: 1000, duration: .1, level: .08, delay: .2 },
  ],
  harvest: [{ noise: true, from: 2800, duration: .17, level: .095 }, { from: 370, to: 170, duration: .09, level: .045, delay: .08 }, { noise: true, from: 1400, duration: .17, level: .06, delay: .16 }],
  fish: [{ noise: true, from: 3200, to: 600, duration: .5, level: .16, attack: .025 }, { from: 520, to: 170, duration: .16, level: .04, delay: .12 }, { from: 370, to: 120, duration: .14, level: .035, delay: .29 }],
  thunder: [
    { noise: true, from: 1900, to: 180, duration: 1.4, level: .2, attack: .018 },
    { noise: true, from: 240, to: 70, duration: 4.5, level: .32, attack: .3 },
    { from: 62, to: 30, duration: 3.6, level: .075, attack: .18 },
  ],
  gull: [{ from: 900, to: 1550, duration: .18, level: .025, attack: .05 }, { from: 1550, to: 760, duration: .37, level: .032, attack: .04, delay: .13 }, { from: 1200, to: 790, duration: .25, level: .02, attack: .04, delay: .62 }],
  strike: [{ noise: true, from: 1600, to: 360, duration: .2, level: .12 }, { from: 190, to: 55, duration: .18, level: .075, shape: 'triangle' }],
  bolt: [{ from: 1050, to: 200, duration: .26, level: .055 }, { noise: true, from: 2400, to: 800, duration: .12, level: .06, filter: 'bandpass' }],
  impact: [{ noise: true, from: 1900, to: 500, duration: .18, level: .14 }, { from: 140, to: 45, duration: .17, level: .065 }],
  slam: [{ noise: true, from: 1200, to: 180, duration: .65, level: .19 }, { from: 95, to: 32, duration: .55, level: .11, shape: 'triangle' }],
  pulse: [{ from: 75, to: 230, duration: .45, level: .075 }, { noise: true, from: 460, to: 1500, duration: .48, level: .1, filter: 'bandpass', attack: .03 }],
  link: [{ from: 440, duration: .5, level: .035, attack: .03 }, { from: 660, duration: .5, level: .03, delay: .1, attack: .03 }, { from: 880, duration: .6, level: .025, delay: .2, attack: .03 }],
  phase: [{ from: 110, to: 220, duration: 1.1, level: .06, attack: .15 }, { from: 165, to: 330, duration: 1.2, level: .04, delay: .1, attack: .15 }, { noise: true, from: 400, to: 1800, duration: 1.1, level: .09, attack: .2, filter: 'bandpass' }],
};

/** Original synthesis only. The caller invokes resume() from a key/pointer gesture. */
export class GameSound {
  private ctx?: AudioContext;
  private master?: GainNode;
  private compressor?: DynamicsCompressorNode;
  private noise?: AudioBuffer;
  private layers: Layer[] = [];
  private voices = new Set<Voice>();
  private lastPlayed = new Map<WorldSound, number>();
  private resuming = false;
  private disposed = false;
  private worldClock = 0;
  private nextMix = 0;
  private nextGull = 13;
  private isEnabled = true;

  get enabled() { return this.isEnabled; }
  set enabled(value: boolean) {
    if (value === this.isEnabled) return;
    this.isEnabled = value;
    if (this.ctx && this.master) {
      const gain = this.master.gain, now = this.ctx.currentTime;
      gain.cancelScheduledValues(now);
      gain.setTargetAtTime(value ? .55 : 0, now, .008);
      // Don't allow a muted, delayed score to reappear when unmuting.
      if (!value) for (const voice of this.voices) this.stopVoice(voice, now + .06);
    }
  }

  resume() {
    if (!this.enabled || this.disposed || typeof AudioContext === 'undefined') return;
    try {
      if (!this.ctx) this.initialize();
      if (this.ctx && this.ctx.state !== 'running' && this.ctx.state !== 'closed' && !this.resuming) {
        this.resuming = true;
        void this.ctx.resume().catch(() => undefined).finally(() => { this.resuming = false; });
      }
    } catch {
      // Audio unavailable is non-fatal; clean a partial graph and retry next gesture.
      this.releaseGraph();
    }
  }

  private initialize() {
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    const master = ctx.createGain(), compressor = ctx.createDynamicsCompressor();
    this.master = master;
    this.compressor = compressor;
    master.gain.value = 0;
    master.gain.setTargetAtTime(.55, ctx.currentTime, .15);
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 6;
    compressor.attack.value = .004;
    compressor.release.value = .22;
    compressor.connect(master);
    master.connect(ctx.destination);

    // One reusable ~0.6 MB mono noise buffer; no per-wave buffer allocation.
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 3), ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    this.noise = noise;
    for (let i = 0; i < 3; i++) {
      const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      this.layers.push({ source, filter, gain });
      source.buffer = noise;
      source.loop = true;
      filter.type = i === 0 ? 'lowpass' : i === 1 ? 'bandpass' : 'highpass';
      filter.frequency.value = i === 0 ? 480 : i === 1 ? 650 : 1900;
      filter.Q.value = .5;
      gain.gain.value = 0;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(compressor);
      source.start(ctx.currentTime, i * .79);
    }
    this.nextMix = 0;
  }

  update(dt: number, weather: Weather) {
    if (!this.ctx || this.ctx.state !== 'running' || this.layers.length !== 3 || !Number.isFinite(dt) || dt <= 0) return;
    // No timer callbacks or catch-up bursts after a background tab resumes.
    this.worldClock += Math.min(dt, .25);
    if (this.worldClock < this.nextMix) return;
    this.nextMix = this.worldClock + .1;
    const climate = CLIMATE[weather] ?? CLIMATE['Trong xanh'];
    const now = this.ctx.currentTime, t = this.worldClock;
    const swell = .72 + .28 * Math.sin(t * .8 * climate.swell);
    const gust = .76 + .24 * Math.sin(t * .37 + Math.sin(t * .13));
    const [sea, wind, rain] = this.layers;
    this.smooth(sea.gain.gain, climate.sea * swell, now, 1.1);
    this.smooth(sea.filter.frequency, climate.cutoff * (.85 + .15 * swell), now, 1.5);
    this.smooth(wind.gain.gain, climate.wind * gust, now, 1.6);
    this.smooth(wind.filter.frequency, 350 + climate.wind * 3400 * gust, now, 1.8);
    this.smooth(rain.gain.gain, climate.rain, now, 1.4);
    if (t >= this.nextGull) {
      this.nextGull = t + 19 + Math.random() * 24;
      if (weather === 'Trong xanh' || weather === 'Mắt bão' || weather === 'Gió mạnh') this.play('gull');
    }
    // Thunder remains event-driven through play('thunder') to match visual lightning.
  }

  private smooth(param: AudioParam, value: number, now: number, seconds: number) {
    param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  }

  play(kind: WorldSound) {
    if (!this.enabled || this.disposed || !this.ctx || this.ctx.state !== 'running' || !this.compressor || !this.noise) return;
    const now = this.ctx.currentTime;
    const cooldown = kind === 'thunder' ? 2.5 : kind === 'gull' ? 3 : kind === 'step' ? .12 : .075;
    if (now - (this.lastPlayed.get(kind) ?? -Infinity) < cooldown) return;
    const score = SCORES[kind];
    // Bound polyphony, including delayed notes, during dense/repeated network events.
    if (!score || this.voices.size + score.length > 24) return;
    this.lastPlayed.set(kind, now);
    const variation = kind === 'link' || kind === 'phase' ? 1 : .96 + Math.random() * .08;
    for (const note of score) this.playNote(note, now, variation);
  }

  private playNote(note: Note, now: number, variation: number) {
    const ctx = this.ctx!, start = now + (note.delay ?? 0), end = start + note.duration;
    const gain = ctx.createGain();
    let source: AudioBufferSourceNode | OscillatorNode;
    const nodes: AudioNode[] = [gain];
    let pitch: AudioParam;
    if (note.noise) {
      source = ctx.createBufferSource();
      source.buffer = this.noise!;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = note.filter ?? 'lowpass';
      filter.Q.value = .65;
      source.connect(filter);
      filter.connect(gain);
      nodes.push(filter);
      pitch = filter.frequency;
    } else {
      source = ctx.createOscillator();
      source.type = note.shape ?? 'sine';
      source.connect(gain);
      pitch = source.frequency;
    }
    pitch.setValueAtTime(note.from * variation, start);
    pitch.exponentialRampToValueAtTime((note.to ?? note.from) * variation, end);
    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(note.level, start + (note.attack ?? .008));
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    gain.gain.linearRampToValueAtTime(0, end + .015);
    gain.connect(this.compressor!);
    const voice: Voice = { source, nodes };
    this.voices.add(voice);
    source.onended = () => this.cleanVoice(voice);
    if (source instanceof AudioBufferSourceNode) source.start(start, Math.random() * 2);
    else source.start(start);
    source.stop(end + .02);
  }

  private stopVoice(voice: Voice, when?: number) {
    try { voice.source.stop(when); } catch { /* Already stopped or partially initialized. */ }
  }

  private cleanVoice(voice: Voice) {
    voice.source.onended = null;
    voice.source.disconnect();
    for (const node of voice.nodes) node.disconnect();
    this.voices.delete(voice);
  }

  private releaseGraph() {
    for (const voice of this.voices) { this.stopVoice(voice); this.cleanVoice(voice); }
    for (const layer of this.layers) {
      try { layer.source.stop(); } catch { /* May not have started during initialization. */ }
      layer.source.disconnect();
      layer.filter.disconnect();
      layer.gain.disconnect();
    }
    this.layers = [];
    this.compressor?.disconnect();
    this.master?.disconnect();
    const ctx = this.ctx;
    this.ctx = undefined;
    this.master = undefined;
    this.compressor = undefined;
    this.noise = undefined;
    this.lastPlayed.clear();
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => undefined);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseGraph();
  }
}
