/**
 * Synthesized Web Audio API sound effects & Discord Soundboard Engine.
 * Supports zero-dependency procedural audio (instant, low latency, works offline)
 * AND playback of custom uploaded user sound clips.
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.8;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /* ==========================================================
     STANDARD SYSTEM SFX (Chat, Join, Leave, Poll, Games)
     ========================================================== */

  playPop() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  playMessage() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.06); // A5

      gain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  playJoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playLeave() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {}
  }

  playCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2 * this.volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {}
  }

  /* ==========================================================
     DISCORD-STYLE PROCEDURAL SOUNDBOARD PRESETS (Web Audio)
     ========================================================== */

  // 1. Air Horn (📢 classic hype burst)
  playAirHorn() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // 5-staccato blast pattern: ba-ba-ba-ba-baaaah
      const blasts = [
        { start: 0.0, dur: 0.12 },
        { start: 0.14, dur: 0.12 },
        { start: 0.28, dur: 0.12 },
        { start: 0.42, dur: 0.12 },
        { start: 0.56, dur: 0.45 }
      ];

      blasts.forEach(({ start, dur }) => {
        const t0 = this.ctx.currentTime + start;
        // Dual saw oscillators for brassy tone (Bb4: 466.16Hz + F5: 698.46Hz)
        [466.16, 698.46].forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, t0);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t0 + dur);

          gain.gain.setValueAtTime(0.22 * this.volume, t0);
          gain.gain.exponentialRampToValueAtTime(0.01, t0 + dur);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t0);
          osc.stop(t0 + dur);
        });
      });
    } catch {}
  }

  // 2. Ba-Dum Tss / Rimshot (🥁 joke punchline)
  playRimshot() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // "Ba" (kick)
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      kickGain.gain.setValueAtTime(0.4 * this.volume, now);
      kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(now);
      kickOsc.stop(now + 0.08);

      // "Dum" (snare tap at +0.18s)
      const t1 = now + 0.18;
      const snareOsc = this.ctx.createOscillator();
      const snareGain = this.ctx.createGain();
      snareOsc.frequency.setValueAtTime(180, t1);
      snareOsc.frequency.exponentialRampToValueAtTime(80, t1 + 0.07);
      snareGain.gain.setValueAtTime(0.35 * this.volume, t1);
      snareGain.gain.exponentialRampToValueAtTime(0.01, t1 + 0.07);
      snareOsc.connect(snareGain);
      snareGain.connect(this.ctx.destination);
      snareOsc.start(t1);
      snareOsc.stop(t1 + 0.07);

      // "Tsss" (cymbal sizzle at +0.34s)
      const t2 = now + 0.34;
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5000, t2);

      const cymbalGain = this.ctx.createGain();
      cymbalGain.gain.setValueAtTime(0.25 * this.volume, t2);
      cymbalGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.4);

      noise.connect(filter);
      filter.connect(cymbalGain);
      cymbalGain.connect(this.ctx.destination);
      noise.start(t2);
      noise.stop(t2 + 0.4);
    } catch {}
  }

  // 3. Sad Trombone (🎺 Wah-wah-wah-waaah fail)
  playSadTrombone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // D4, C#4, C4, B3 (with pitch bend)
      const notes = [
        { freq: 293.66, time: 0.0, dur: 0.28 },
        { freq: 277.18, time: 0.32, dur: 0.28 },
        { freq: 261.63, time: 0.64, dur: 0.28 },
        { freq: 246.94, time: 0.96, dur: 0.85, bendTo: 220.0 }
      ];

      notes.forEach(({ freq, time, dur, bendTo }) => {
        const t = now + time;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        if (bendTo) {
          osc.frequency.setValueAtTime(freq, t + 0.2);
          osc.frequency.linearRampToValueAtTime(bendTo, t + dur);
        }

        // Lowpass filter for muffled brass trombone effect
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);

        gain.gain.setValueAtTime(0.22 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    } catch {}
  }

  // 4. Cricket Chirp (🦗 Awkward silence)
  playCricket() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 3 pairs of high frequency chirps
      for (let burst = 0; burst < 3; burst++) {
        const bTime = now + burst * 0.35;
        for (let chirp = 0; chirp < 4; chirp++) {
          const t = bTime + chirp * 0.04;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(4500, t);
          osc.frequency.setValueAtTime(4800, t + 0.015);

          gain.gain.setValueAtTime(0.18 * this.volume, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.025);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.025);
        }
      }
    } catch {}
  }

  // 5. Applause / Clapping (👏 Crowd cheering)
  playApplause() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const duration = 1.8;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Random cluster of applause impulses
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 3) * 3;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, now);
      bandpass.Q.setValueAtTime(1.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.05 * this.volume, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + duration);
    } catch {}
  }

  // 6. Laugh Track (😂 Funny laugh chuckle)
  playLaughTrack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [380, 360, 420, 390, 350, 380, 330, 290];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.11;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 0.09);

        gain.gain.setValueAtTime(0.24 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.09);
      });
    } catch {}
  }

  // 7. Quack (🦆 Duck quack)
  playQuack() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(190, now + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(500, now + 0.25);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  // 8. Siren / Kalesh Alarm (🚨 Emergency alert)
  playSiren() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // 4 siren cycles
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.4;
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(1000, t + 0.2);
        osc.frequency.linearRampToValueAtTime(600, t + 0.4);
      }

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.6);
    } catch {}
  }

  // 9. Boing (💥 Spring bounce)
  playBoing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

      gain.gain.setValueAtTime(0.35 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  // 10. Dun Dun Duuun (😱 Dramatic cinematic shock)
  playDunDunDun() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Stabs: C3 (130.81Hz), B2 (123.47Hz), Ab2 (103.83Hz prolonged)
      const chords = [
        { freqs: [130.81, 196.0, 261.63], t: 0.0, dur: 0.2 },
        { freqs: [123.47, 185.0, 246.94], t: 0.28, dur: 0.2 },
        { freqs: [103.83, 155.56, 207.65], t: 0.58, dur: 0.9 }
      ];

      chords.forEach(({ freqs, t, dur }) => {
        const startTime = now + t;
        freqs.forEach((f) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, startTime);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(900, startTime);

          gain.gain.setValueAtTime(0.22 * this.volume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + dur);
        });
      });
    } catch {}
  }

  // 11. Anime Wow (✨ Chime shimmer)
  playAnimeWow() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5]; // C5 to E6
      notes.forEach((freq, i) => {
        const t = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.2 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {}
  }

  // 12. Bruh (💀 Deep voice drop)
  playBruh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.linearRampToValueAtTime(150, now + 0.35);

      gain.gain.setValueAtTime(0.4 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }

  /* ==========================================================
     CUSTOM UPLOAD AUDIO PLAYBACK & SOUNDBOARD DISPATCHER
     ========================================================== */

  playCustomAudio(audioDataUrl) {
    if (this.muted || !audioDataUrl) return;

    try {
      const audio = new Audio(audioDataUrl);
      audio.volume = this.volume;
      audio.play().catch((err) => {
        console.warn('[Soundboard] Custom audio playback error:', err);
      });
    } catch (err) {
      console.warn('[Soundboard] Could not initialize custom audio:', err);
    }
  }

  playSoundboardPreset(presetId) {
    switch (presetId) {
      case 'airhorn':
        this.playAirHorn();
        break;
      case 'rimshot':
        this.playRimshot();
        break;
      case 'sad_trombone':
        this.playSadTrombone();
        break;
      case 'cricket':
        this.playCricket();
        break;
      case 'applause':
        this.playApplause();
        break;
      case 'laugh':
        this.playLaughTrack();
        break;
      case 'quack':
        this.playQuack();
        break;
      case 'siren':
        this.playSiren();
        break;
      case 'boing':
        this.playBoing();
        break;
      case 'dun_dun_dun':
        this.playDunDunDun();
        break;
      case 'anime_wow':
        this.playAnimeWow();
        break;
      case 'bruh':
        this.playBruh();
        break;
      default:
        this.playPop();
        break;
    }
  }
}

export const soundFx = new SoundEffects();
