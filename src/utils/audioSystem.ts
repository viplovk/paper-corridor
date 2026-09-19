/**
 * Procedural Audio System using Web Audio API:
 * - Realistic wood floor footsteps with subtle acoustic resonance
 * - Ambient room acoustics (distant gallery paper/pencil resonance)
 * - Dynamic volume reactive to walking speed
 */

class GalleryAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbientSound();
      this.isInitialized = true;
    } catch {
      // Audio context might require user interaction gesture
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : 0.75;
      this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.1);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Play a soft footstep sound on hardwood plank
  public playFootstep(speedFactor: number = 1.0) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Wood floor thud frequency - slightly deeper and firmer for sprint
    const baseFreq = 75 + (1 - speedFactor * 0.2) * 25 + Math.random() * 20;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    // Acoustic bandpass for wooden gallery plank resonance
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(140 + Math.random() * 40 + speedFactor * 30, t);
    filter.Q.setValueAtTime(2.2, t);

    // Subtle volume scaled with speedFactor (walk ~ 0.12, sprint ~ 0.22)
    const stepVolume = Math.min(0.26, 0.09 + speedFactor * 0.13 + Math.random() * 0.02);
    gain.gain.setValueAtTime(stepVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);

    // Add subtle floor shoe creak/scuff noise burst and occasional graphite grain
    this.playShoeScuff(t, stepVolume * 0.35);

    // Occasional subtle pencil scratch sound in the distance (1 in 8 steps)
    if (Math.random() < 0.12) {
      this.playPencilScratch();
    }
  }

  // Very subtle faint pencil scratching / paper rustle
  public playPencilScratch() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const dur = 0.12 + Math.random() * 0.18;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 + Math.random() * 800, t);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02 + Math.random() * 0.015, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(t);
  }

  private playShoeScuff(t: number, vol: number) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 0.06;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(1200 + Math.random() * 400, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
  }

  // Soft museum gallery atmosphere (distant quiet air and paper room tone)
  private startAmbientSound() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    // Pink noise generation
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 0.15;
    }

    const ambientSource = this.ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    // Very low lowpass filter for gentle room hum
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    ambientSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    ambientSource.start();
    this.noiseNode = ambientSource;
  }
}

export const galleryAudio = new GalleryAudioEngine();
