import { AUDIO_RECORDINGS } from '../data/caseData';

class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private infrasoundOsc: OscillatorNode | null = null;
  private infrasoundGain: GainNode | null = null;
  private ambientRunning = false;

  private masterVolume = 0.75;
  private binauralEnabled = true;

  // Cassette playback nodes
  private tapeTimerId: number | null = null;
  private tapeGain: GainNode | null = null;
  private tapeSource: AudioBufferSourceNode | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setBinauralEnabled(enabled: boolean) {
    this.binauralEnabled = enabled;
  }

  public startAmbientNight() {
    if (this.ambientRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.ambientRunning = true;
    try {
      // Filtered brown/pink rain drizzle buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
      }

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 620;
      filter.Q.value = 0.6;

      const gain = ctx.createGain();
      gain.gain.value = 0.08;

      rainSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      rainSource.start();
      this.ambientGain = gain;

      // Subtle 14.2 Hz / 42.6 Hz harmonic infrasound hum
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 42.6;
      const infraGain = ctx.createGain();
      infraGain.gain.value = 0.012;
      osc.connect(infraGain);
      infraGain.connect(this.masterGain);
      osc.start();
      this.infrasoundOsc = osc;
      this.infrasoundGain = infraGain;
    } catch {
      this.ambientRunning = false;
    }
  }

  public updateParanoiaIntensity(paranoia: number, gazeWarningActive: boolean) {
    if (!this.ctx || !this.infrasoundGain || !this.ambientGain) return;
    const norm = Math.max(0, Math.min(1, paranoia / 100));
    const targetInfra = 0.008 + norm * 0.055 + (gazeWarningActive ? 0.045 : 0);
    this.infrasoundGain.gain.setTargetAtTime(targetInfra, this.ctx.currentTime, 0.15);
    this.ambientGain.gain.setTargetAtTime(0.06 + norm * 0.05, this.ctx.currentTime, 0.25);
  }

  public stopAmbientNight() {
    this.ambientRunning = false;
    try {
      this.infrasoundOsc?.stop();
    } catch {
      // Ignore already stopped
    }
    this.infrasoundOsc = null;
    this.infrasoundGain = null;
    this.ambientGain = null;
  }

  public playToneCue(
    freq: number,
    durationSec: number,
    gainLevel = 0.12,
    type: OscillatorType = 'sine',
    slideToFreq?: number,
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideToFreq), now + durationSec);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    if (this.binauralEnabled && typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = (Math.random() - 0.5) * 0.6;
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      osc.connect(gain);
      gain.connect(this.masterGain);
    }

    osc.start(now);
    osc.stop(now + durationSec + 0.04);
  }

  public playGateLockClank(unlocked: boolean) {
    if (unlocked) {
      this.playToneCue(190, 0.22, 0.18, 'triangle', 95);
      window.setTimeout(() => this.playToneCue(125, 0.55, 0.16, 'sawtooth', 78), 160);
    } else {
      this.playToneCue(140, 0.12, 0.14, 'square', 90);
    }
  }

  public playSwingCreak() {
    this.playToneCue(680, 0.34, 0.06, 'triangle', 510);
  }

  public playDuckCue(
    kind: 'squeak' | 'footstep' | 'gaze-sting' | 'whisper-you-took-so-long',
  ) {
    switch (kind) {
      case 'squeak':
        this.playToneCue(940, 0.11, 0.07, 'sine', 620);
        break;
      case 'footstep':
        this.playToneCue(92, 0.1, 0.09, 'triangle', 48);
        break;
      case 'gaze-sting':
        this.playToneCue(220, 0.45, 0.14, 'sawtooth', 142);
        this.playToneCue(233, 0.45, 0.11, 'sine', 148);
        break;
      case 'whisper-you-took-so-long':
        // Eerie multi-formant child-echo cadence matching "You took so long."
        this.playToneCue(540, 0.32, 0.08, 'sine', 490);
        window.setTimeout(() => this.playToneCue(460, 0.28, 0.07, 'sine', 430), 340);
        window.setTimeout(() => this.playToneCue(510, 0.28, 0.07, 'sine', 470), 660);
        window.setTimeout(() => this.playToneCue(420, 0.58, 0.09, 'sine', 350), 980);
        break;
    }
  }

  public startCassetteAudio(recordingId: string, startSec: number) {
    this.stopCassetteAudio();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const rec = AUDIO_RECORDINGS.find((r) => r.id === recordingId);
    // Mechanical tape button click
    this.playToneCue(310, 0.06, 0.14, 'square', 160);

    try {
      // Analog tape hiss loop
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.25;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1450;
      bandpass.Q.value = 0.9;

      const gain = ctx.createGain();
      gain.gain.value = 0.065;

      src.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain);
      src.start();

      this.tapeSource = src;
      this.tapeGain = gain;

      if (rec) {
        let localElapsed = startSec;
        this.tapeTimerId = window.setInterval(() => {
          localElapsed += 0.5;
          // Play eerie acoustic signature when passing hidden clue timestamp
          if (
            Math.abs(localElapsed - rec.hiddenClueTimestampSec) < 0.4 &&
            rec.id === 'rec-02-playground'
          ) {
            this.playDuckCue('squeak');
            window.setTimeout(() => this.playDuckCue('squeak'), 750);
          } else if (Math.abs(localElapsed - rec.hiddenClueTimestampSec) < 0.4) {
            this.playToneCue(142, 0.48, 0.09, 'sine', 120);
          }
        }, 500);
      }
    } catch {
      // Fail safely on audio hardware restrictions
    }
  }

  public stopCassetteAudio() {
    if (this.tapeTimerId !== null) {
      window.clearInterval(this.tapeTimerId);
      this.tapeTimerId = null;
    }
    try {
      this.tapeSource?.stop();
    } catch {
      // Ignore
    }
    this.tapeSource = null;
    this.tapeGain = null;
  }
}

export const horrorAudioEngine = new HorrorAudioEngine();
