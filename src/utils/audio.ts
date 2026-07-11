// Simple Web Audio API Synthesizer for Retro 8-bit Tetris Sound Effects

class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize to bypass auto-play policies
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('tetris_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('tetris_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createOscillator(
    type: 'sine' | 'square' | 'sawtooth' | 'triangle',
    freq: number,
    duration: number,
    gainStart: number
  ): { osc: OscillatorNode; gain: GainNode } | null {
    this.init();
    if (!this.ctx || this.isMuted) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    return { osc, gain };
  }

  public playMove() {
    const sound = this.createOscillator('triangle', 120, 0.08, 0.15);
    if (sound) {
      sound.osc.start();
      sound.osc.stop(this.ctx!.currentTime + 0.08);
    }
  }

  public playRotate() {
    const sound = this.createOscillator('triangle', 220, 0.1, 0.15);
    if (sound) {
      sound.osc.frequency.exponentialRampToValueAtTime(330, this.ctx!.currentTime + 0.1);
      sound.osc.start();
      sound.osc.stop(this.ctx!.currentTime + 0.1);
    }
  }

  public playHold() {
    const sound = this.createOscillator('sine', 180, 0.15, 0.15);
    if (sound) {
      sound.osc.frequency.linearRampToValueAtTime(270, this.ctx!.currentTime + 0.15);
      sound.osc.start();
      sound.osc.stop(this.ctx!.currentTime + 0.15);
    }
  }

  public playDrop() {
    const sound = this.createOscillator('triangle', 80, 0.15, 0.2);
    if (sound) {
      sound.osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.15);
      sound.osc.start();
      sound.osc.stop(this.ctx!.currentTime + 0.15);
    }
  }

  public playLineClear(lines: number) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    const baseNotes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const count = Math.min(lines, 4);
    const durationPerNote = 0.08;

    for (let i = 0; i < count * 2; i++) {
      const noteIndex = i % baseNotes.length;
      const freq = baseNotes[noteIndex] * (1 + Math.floor(i / baseNotes.length) * 0.5);
      const timeOffset = i * durationPerNote;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Use square for line clears to make it crunchy and celebratory
      osc.type = lines === 4 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + timeOffset);

      gain.gain.setValueAtTime(lines === 4 ? 0.12 : 0.08, this.ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + timeOffset + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + timeOffset);
      osc.stop(this.ctx.currentTime + timeOffset + 0.2);
    }
  }

  public playLevelUp() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // A simple happy arpeggio: C4 -> E4 -> G4 -> C5 -> E5 -> G5
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const timeOffset = index * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + timeOffset);
      gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + timeOffset + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + timeOffset);
      osc.stop(this.ctx!.currentTime + timeOffset + 0.25);
    });
  }

  public playGameOver() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    // Sad descending slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }
}

export const audioSynth = new AudioSynth();
