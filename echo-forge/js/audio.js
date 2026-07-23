// === AUDIO SYSTEM ===
// Procedural sound effects via Web Audio API

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.6;
    this.oscillators = [];
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch(e) {
      console.warn('Web Audio not available', e);
    }
  }

  _playTone(freq, duration, type = 'sine', gain = 0.3, detune = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;

    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);

    this.oscillators.push(osc);
    osc.onended = () => {
      const idx = this.oscillators.indexOf(osc);
      if (idx !== -1) this.oscillators.splice(idx, 1);
    };
  }

  _playNoise(duration, gain = 0.15, filterFreq = 3000) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.5;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // === Sound Effects ===

  swing() {
    this._playNoise(0.08, 0.1, 2000);
    this._playTone(400, 0.06, 'sawtooth', 0.08);
  }

  heavySwing() {
    this._playNoise(0.12, 0.15, 1500);
    this._playTone(200, 0.1, 'sawtooth', 0.12);
    this._playTone(80, 0.15, 'triangle', 0.1);
  }

  hit() {
    this._playNoise(0.06, 0.12, 4000);
    this._playTone(600, 0.04, 'square', 0.06);
  }

  heavyHit() {
    this._playNoise(0.1, 0.2, 3000);
    this._playTone(300, 0.08, 'sawtooth', 0.1);
    this._playTone(100, 0.12, 'triangle', 0.08);
  }

  block() {
    this._playTone(500, 0.08, 'triangle', 0.08);
    this._playTone(800, 0.06, 'triangle', 0.05, 5);
  }

  parry() {
    this._playTone(1200, 0.15, 'sine', 0.2);
    this._playTone(1800, 0.1, 'sine', 0.15, 10);
    this._playNoise(0.05, 0.08, 6000);
  }

  perfectDodge() {
    this._playTone(800, 0.15, 'sine', 0.15);
    this._playTone(1200, 0.1, 'sine', 0.12, 12);
    this._playTone(400, 0.2, 'triangle', 0.1);
  }

  dodge() {
    this._playNoise(0.08, 0.08, 2000);
    this._playTone(300, 0.06, 'sine', 0.06);
  }

  jump() {
    this._playTone(200, 0.1, 'sine', 0.06);
    this._playTone(400, 0.08, 'sine', 0.04, 3);
  }

  land() {
    this._playNoise(0.04, 0.08, 1500);
    this._playTone(100, 0.06, 'triangle', 0.06);
  }

  footstep() {
    this._playNoise(0.02, 0.03, 3000);
  }

  echoSpawn() {
    this._playTone(600, 0.3, 'sine', 0.12);
    this._playTone(900, 0.2, 'sine', 0.1, 8);
    this._playTone(1200, 0.15, 'sine', 0.08, 16);
    // Ethereal shimmer
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this._playTone(500 + i * 200, 0.2, 'sine', 0.04, i * 20);
      }, i * 80);
    }
  }

  echoFade() {
    this._playTone(400, 0.5, 'sine', 0.06);
    this._playTone(600, 0.4, 'sine', 0.05, -8);
  }

  recordStart() {
    this._playTone(300, 0.15, 'sine', 0.08);
    this._playTone(450, 0.1, 'triangle', 0.06, 5);
  }

  recordStop() {
    this._playTone(450, 0.1, 'sine', 0.06);
    this._playTone(300, 0.15, 'triangle', 0.08, -5);
  }

  enemyDeath() {
    this._playNoise(0.15, 0.1, 2000);
    this._playTone(400, 0.2, 'sawtooth', 0.08);
    this._playTone(200, 0.3, 'triangle', 0.06);
    this._playTone(100, 0.4, 'sine', 0.04);
  }

  bossIntro() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this._playTone(100 + i * 50, 0.4, 'sawtooth', 0.12);
      }, i * 150);
    }
    this._playNoise(0.3, 0.08, 1000);
  }

  playerHurt() {
    this._playNoise(0.1, 0.15, 2000);
    this._playTone(150, 0.2, 'sawtooth', 0.1);
  }

  criticalHit() {
    this._playTone(1500, 0.2, 'sine', 0.15);
    this._playTone(2000, 0.15, 'sine', 0.1, 20);
    this._playNoise(0.08, 0.1, 8000);
    // Slow-mo bass drop
    setTimeout(() => {
      this._playTone(60, 0.5, 'sine', 0.15);
    }, 80);
  }

  // Background drone (looping ambient)
  startAmbient() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Low drone
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.04;
    drone.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start(now);
    this.ambientDrone = drone;
  }

  stopAmbient() {
    if (this.ambientDrone) {
      this.ambientDrone.stop();
      this.ambientDrone = null;
    }
  }

  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  dispose() {
    this.oscillators.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    if (this.ambientDrone) {
      try { this.ambientDrone.stop(); } catch(e) {}
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export { AudioSystem };
