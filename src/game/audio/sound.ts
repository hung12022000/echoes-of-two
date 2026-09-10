import type { EffectKind } from '../combat/encounter';

/** Original synthesis only; starts on an explicit user gesture. */
export class GameSound {
  private ctx?: AudioContext;
  private ambience?: AudioBufferSourceNode;
  private ambienceGain?: GainNode;
  private isEnabled = true;
  get enabled() { return this.isEnabled; }
  set enabled(value: boolean) { this.isEnabled=value;if(this.ambienceGain)this.ambienceGain.gain.value=value ? 0.1 : 0; }
  resume() {
    if (!this.enabled) return; this.ctx ??= new AudioContext(); void this.ctx.resume().catch(() => undefined);
    if(!this.ambience) {
      const ctx=this.ctx, buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate), samples=buffer.getChannelData(0);
      let last=0;for(let i=0;i<samples.length;i++){last=(last+Math.random()*.04-.02)/1.02;samples[i]=last;}
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
      const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;
      const gain=ctx.createGain();gain.gain.value=.1;source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start();this.ambience=source;this.ambienceGain=gain;
    }
  }
  play(kind: EffectKind | 'step' | 'land') {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx, now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const low = kind === 'slam' || kind === 'land' || kind === 'step';
    osc.type = low ? 'triangle' : kind === 'bolt' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(kind === 'link' ? 660 : low ? 90 : kind === 'strike' ? 220 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'link' ? 990 : low ? 32 : 90, now + 0.22);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(kind === 'step' ? 0.018 : 0.075, now + 0.012); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + 0.3);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  dispose() { this.ambience?.stop(); if (this.ctx) void this.ctx.close(); }
}
