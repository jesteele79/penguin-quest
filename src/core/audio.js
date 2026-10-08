// Everything you hear is synthesized with WebAudio: effects, wind, and a small procedural score.
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

const MOODS = {
  title: { bpm: 70, chords: [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 61]], box: 0.55, bass: true, kick: false, pluck: false },
  explore: { bpm: 76, chords: [[50, 57, 61, 66], [47, 54, 57, 62], [43, 50, 54, 59], [45, 52, 57, 61]], box: 0.7, bass: true, kick: false, pluck: false, layered: true },
  quiz: { bpm: 84, chords: [[50, 57, 62, 66], [43, 50, 55, 59], [47, 54, 59, 62], [45, 52, 57, 61]], box: 0.35, bass: true, kick: false, pluck: true },
  battle: { bpm: 112, chords: [[47, 54, 59, 62], [43, 50, 55, 59], [50, 57, 62, 66], [45, 52, 57, 61]], box: 0.45, bass: true, kick: true, pluck: true, drive: true },
  boss: { bpm: 100, chords: [[40, 47, 52, 55], [48, 55, 60, 64], [50, 57, 62, 66], [47, 54, 59, 63]], box: 0.4, bass: true, kick: true, pluck: true, drive: true, scale: [4, 7, 9, 11, 2] },
  finale: { bpm: 84, chords: [[50, 57, 62, 66], [43, 50, 55, 59], [45, 52, 57, 61], [50, 57, 62, 69]], box: 0.85, bass: true, kick: false, pluck: true },
};
const PENTA = [0, 2, 4, 7, 9];
// D major pentatonic (same notes as B minor pentatonic), as pitch classes.
const SCALE_D = [2, 4, 6, 9, 11];
// Every effect is in the music's key (D major) so feedback sounds like part of the score.
const D5 = 74;
const penta = (step) => D5 + PENTA[((step % 5) + 5) % 5] + 12 * Math.floor(step / 5);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicVol = 0.5;
    this.sfxVol = 0.8;
    this.mood = null;
    this.voicePitch = 1;
    // Music layers: 0 to 5, one per restored aurora crystal (pad always, then bass, bells, plucks, shaker, lead).
    this.layers = 1;
    this.duck = 1;
  }

  setLayers(n) { this.layers = Math.max(1, Math.min(5, n)); }

  // Quieter music under quizzes and reading, so the question has the room.
  setDuck(on) {
    this.duck = on ? 0.6 : 1;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(this.musicVol * this.duck, this.ctx.currentTime, 0.4);
  }

  init() {
    if (this.ctx) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3.5;
    this.master.connect(comp).connect(c.destination);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = this.sfxVol;
    this.sfxBus.connect(this.master);
    this.musicBus = c.createGain();
    this.musicBus.gain.value = this.musicVol;
    this.musicBus.connect(this.master);
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.impulse(2.8, 2.2);
    const wet = c.createGain();
    wet.gain.value = 0.42;
    this.reverb.connect(wet).connect(this.master);
    this.musicSend = c.createGain(); this.musicSend.gain.value = 0.55; this.musicSend.connect(this.reverb);
    this.sfxSend = c.createGain(); this.sfxSend.gain.value = 0.22; this.sfxSend.connect(this.reverb);
    this.noiseBuf = this.makeNoise(2);
    this.startWind();
    this.startSlideLoop();
    this.sched = setInterval(() => this.tick(), 60);
    this.resume();
  }

  resume() { if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {}); }

  setVolumes(music, sfx) {
    this.musicVol = music; this.sfxVol = sfx;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(music * this.duck, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, t, 0.1);
    this.windGain?.gain.setTargetAtTime(0.022 * sfx, t, 0.3);
  }

  impulse(seconds, decay) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  makeNoise(seconds) {
    const c = this.ctx, len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // --- primitives ---
  tone({ f, type = 'sine', dur = 0.2, vol = 0.2, a = 0.005, r = 0.12, when = 0, to = null, bus = 'sfx', lp = null, send = true, detune = 0 }) {
    const c = this.ctx;
    if (!c) return;
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    o.detune.value = detune;
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.setValueAtTime(vol, t0 + Math.max(a, dur - r));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = o.connect(g);
    if (lp) {
      const f2 = c.createBiquadFilter();
      f2.type = 'lowpass'; f2.frequency.value = lp;
      node = g.connect(f2);
    }
    const out = bus === 'music' ? this.musicBus : this.sfxBus;
    node.connect(out);
    if (send) node.connect(bus === 'music' ? this.musicSend : this.sfxSend);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.2, vol = 0.2, type = 'bandpass', f = 1000, q = 1, when = 0, to = null, a = 0.005, bus = 'sfx' }) {
    const c = this.ctx;
    if (!c) return;
    const t0 = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filt = c.createBiquadFilter();
    filt.type = type; filt.frequency.setValueAtTime(f, t0); filt.Q.value = q;
    if (to) filt.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(bus === 'music' ? this.musicBus : this.sfxBus);
    g.connect(this.sfxSend);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.05);
  }

  bell(f, when = 0, vol = 0.12, dur = 1.2, bus = 'sfx') {
    this.tone({ f, type: 'sine', dur, vol, a: 0.004, r: dur * 0.9, when, bus });
    this.tone({ f: f * 2.01, type: 'sine', dur: dur * 0.5, vol: vol * 0.35, a: 0.003, r: dur * 0.45, when, bus });
    this.tone({ f: f * 3.02, type: 'sine', dur: dur * 0.25, vol: vol * 0.15, a: 0.002, r: dur * 0.2, when, bus });
  }

  // --- ambience ---
  startWind() {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.7;
    const g = c.createGain();
    g.gain.value = 0.022 * this.sfxVol;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = c.createGain(); lfoG.gain.value = 180;
    lfo.connect(lfoG).connect(f.frequency);
    const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.13;
    const lfo2G = c.createGain(); lfo2G.gain.value = 0.01;
    lfo2.connect(lfo2G).connect(g.gain);
    src.connect(f).connect(g).connect(this.master);
    src.start(); lfo.start(); lfo2.start();
    this.windGain = g;
  }

  startSlideLoop() {
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.9;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start();
    this.slideGain = g; this.slideFilter = f;
  }

  setSlide(amount, water = false) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.slideGain.gain.setTargetAtTime(Math.min(0.16, amount * 0.16), t, 0.08);
    this.slideFilter.frequency.setTargetAtTime(water ? 500 : 800 + amount * 900, t, 0.1);
  }

  // --- effects ---
  play(name, o = {}) {
    if (!this.ctx) return;
    const r = Math.random;
    switch (name) {
      case 'step':
        if (o.wood) this.tone({ f: 170 + r() * 40, type: 'triangle', dur: 0.06, vol: 0.09, send: false });
        else this.noise({ dur: 0.08, vol: 0.09, f: 1400 + r() * 1200, q: 1.2, type: 'bandpass' });
        break;
      case 'jump':
        this.tone({ f: 300, to: 640, type: 'sine', dur: 0.16, vol: 0.12 });
        this.noise({ dur: 0.18, vol: 0.05, f: 1800, to: 3200, q: 0.7 });
        break;
      case 'land':
        this.noise({ dur: 0.14, vol: 0.14, type: 'lowpass', f: 700, q: 0.5 });
        this.tone({ f: 120, to: 70, type: 'sine', dur: 0.12, vol: 0.12, send: false });
        break;
      case 'splash':
        this.noise({ dur: 0.6, vol: 0.2, f: 900, to: 300, q: 0.6 });
        for (let i = 0; i < 5; i++) this.tone({ f: 500 + r() * 700, to: 900 + r() * 700, type: 'sine', dur: 0.07, vol: 0.05, when: 0.08 + i * 0.07 });
        break;
      case 'stroke':
        this.noise({ dur: 0.3, vol: 0.06, f: 600, to: 350, q: 0.8 });
        break;
      case 'correct': {
        // A rising pentatonic run that starts one step higher for each answer in a streak.
        const k = Math.min(o.streak ?? 0, 9);
        [0, 1, 2, 4].forEach((s, i) => this.bell(midi(penta(k + s)), i * 0.07, 0.1, 0.9));
        this.tone({ f: midi(penta(k + 7)), type: 'sine', dur: 0.4, vol: 0.03, when: 0.28 });
        break;
      }
      case 'wrong':
        // A soft, curious "hmm?" in key: never a buzzer.
        this.tone({ f: midi(69), type: 'triangle', dur: 0.16, vol: 0.06, lp: 1600 });
        this.tone({ f: midi(66), type: 'triangle', dur: 0.26, vol: 0.055, when: 0.13, lp: 1400 });
        break;
      case 'hint':
        this.bell(midi(81), 0, 0.07, 0.6); this.bell(midi(88), 0.09, 0.05, 0.6);
        break;
      case 'coin':
        this.tone({ f: midi(83), type: 'square', dur: 0.07, vol: 0.045, send: false, lp: 3000 });
        this.tone({ f: midi(88), type: 'square', dur: 0.16, vol: 0.045, when: 0.06, lp: 3000 });
        break;
      case 'chime':
        for (let i = 0; i < 4; i++) this.bell(midi(79 + PENTA[Math.floor(r() * 5)] + (i > 1 ? 12 : 0)), i * 0.06, 0.06, 0.7);
        break;
      case 'restore': {
        this.tone({ f: 180, to: 1400, type: 'sine', dur: 1.8, vol: 0.1, a: 0.3, r: 0.6 });
        [62, 66, 69, 74].forEach((m) => this.tone({ f: midi(m), type: 'triangle', dur: 3.2, vol: 0.05, a: 0.8, r: 1.8, when: 0.6, lp: 2400 }));
        for (let i = 0; i < 12; i++) this.bell(midi(86 + PENTA[i % 5] + (i > 5 ? 12 : 0)), 0.8 + i * 0.09, 0.05, 1.2);
        break;
      }
      case 'fade':
        this.tone({ f: 900, to: 110, type: 'sine', dur: 2.6, vol: 0.08, a: 0.2, r: 1.2 });
        [69, 65, 62, 57].forEach((m, i) => this.bell(midi(m), i * 0.35, 0.05, 1.4));
        this.noise({ dur: 2.4, vol: 0.05, type: 'lowpass', f: 900, to: 200, q: 0.5 });
        break;
      case 'blip':
        this.tone({ f: (o.pitch ?? 520) * (0.9 + r() * 0.25), type: 'triangle', dur: 0.045, vol: 0.035, send: false });
        break;
      case 'click':
        this.tone({ f: 1400 * (0.95 + r() * 0.1), type: 'sine', dur: 0.03, vol: 0.05, send: false });
        break;
      case 'tab':
        this.tone({ f: midi(penta(3)) * (0.97 + r() * 0.06), type: 'triangle', dur: 0.06, vol: 0.04, send: false });
        break;
      case 'open':
        this.noise({ dur: 0.3, vol: 0.05, f: 800, to: 2600, q: 0.8 });
        this.bell(midi(76), 0.05, 0.04, 0.5);
        break;
      case 'close':
        this.noise({ dur: 0.25, vol: 0.04, f: 2200, to: 700, q: 0.8 });
        break;
      case 'chest':
        this.tone({ f: 90, to: 160, type: 'sawtooth', dur: 0.35, vol: 0.05, lp: 700 });
        for (let i = 0; i < 6; i++) this.tone({ f: midi(84 + Math.floor(r() * 8)), type: 'square', dur: 0.06, vol: 0.03, when: 0.3 + i * 0.05, lp: 3500 });
        break;
      case 'zap':
        this.tone({ f: 1500, to: 220, type: 'sawtooth', dur: 0.35, vol: 0.06, lp: 2800 });
        this.noise({ dur: 0.3, vol: 0.06, f: 3000, to: 800, q: 0.9 });
        break;
      case 'cheer':
        [0, 4, 7, 11, 14].forEach((s, i) => this.bell(midi(D5 + s), i * 0.05, 0.07, 0.8));
        this.tone({ f: 220, to: 880, type: 'sine', dur: 0.25, vol: 0.07 });
        break;
      case 'hurt':
        this.noise({ dur: 0.4, vol: 0.1, type: 'lowpass', f: 500, q: 0.6 });
        this.tone({ f: 180, to: 110, type: 'sine', dur: 0.35, vol: 0.1 });
        break;
      case 'fanfare': {
        const seq = [[69, 0], [74, 0.14], [78, 0.28], [81, 0.42], [86, 0.62]];
        seq.forEach(([m, w]) => {
          this.tone({ f: midi(m), type: 'sawtooth', dur: 0.4, vol: 0.05, when: w, lp: 2200 });
          this.bell(midi(m + 12), w, 0.04, 0.6);
        });
        [62, 66, 69, 74].forEach((m) => this.tone({ f: midi(m), type: 'triangle', dur: 1.4, vol: 0.05, a: 0.05, r: 1, when: 0.62, lp: 2600 }));
        break;
      }
      case 'build':
        this.tone({ f: 1760 + r() * 300, type: 'sine', dur: 0.12, vol: 0.05 });
        this.tone({ f: 2640 + r() * 300, type: 'sine', dur: 0.08, vol: 0.03 });
        break;
      case 'register':
        this.bell(midi(88), 0, 0.08, 0.5); this.bell(midi(93), 0.09, 0.08, 0.8);
        this.noise({ dur: 0.15, vol: 0.05, f: 5000, q: 1 });
        break;
      case 'crack':
        for (let i = 0; i < 4; i++) this.noise({ dur: 0.05, vol: 0.12, f: 2500 + r() * 2000, q: 2, when: i * 0.05 + r() * 0.03 });
        break;
      case 'reel':
        for (let i = 0; i < 8; i++) this.tone({ f: 2200, type: 'square', dur: 0.015, vol: 0.02, when: i * 0.04, send: false });
        break;
      case 'bubble':
        this.tone({ f: 380, to: 900, type: 'sine', dur: 0.12, vol: 0.06 });
        break;
      case 'sizzle':
        this.noise({ dur: 0.7, vol: 0.11, type: 'highpass', f: 4200, to: 2400, q: 0.5 });
        for (let i = 0; i < 6; i++) this.noise({ dur: 0.03, vol: 0.07, f: 2500 + r() * 3500, q: 3, when: 0.04 + r() * 0.5 });
        break;
      case 'whoosh':
        this.noise({ dur: 0.5, vol: 0.08, f: 400, to: 2400, q: 0.7 });
        break;
      default:
        break;
    }
  }

  // --- music ---
  // A new mood starts on the next downbeat (all moods share the key), so music never cuts to silence.
  setMood(mood) {
    if (!this.ctx || mood === (this.pending ?? this.mood)) return;
    if (!this.moodDef) {
      this.mood = mood;
      this.moodDef = MOODS[mood] || null;
      this.beat = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
      const t = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.setValueAtTime(0.0001, t);
      this.musicBus.gain.linearRampToValueAtTime(this.musicVol * this.duck, t + 1.5);
      return;
    }
    this.pending = mood;
  }

  tick() {
    const c = this.ctx;
    if (!c || !this.moodDef || c.state !== 'running') return;
    while (this.nextTime < c.currentTime + 0.25) {
      if (this.pending && this.beat % 4 === 0) {
        this.mood = this.pending;
        this.moodDef = MOODS[this.pending] || this.moodDef;
        this.pending = null;
        this.beat = 0;
      }
      const m = this.moodDef;
      const spb = 60 / m.bpm;
      this.scheduleEighth(this.nextTime - c.currentTime, m, spb);
      this.nextTime += spb / 2;
      this.beat += 0.5;
    }
  }

  scheduleEighth(when, m, spb) {
    const barLen = 4;
    const chordIdx = Math.floor(this.beat / (barLen * 2)) % m.chords.length;
    const chord = m.chords[chordIdx];
    const posInBar = this.beat % barLen;
    const posInChord = this.beat % (barLen * 2);
    const w = Math.max(0, when);
    if (posInChord === 0) {
      for (const n of chord) {
        this.tone({ f: midi(n), type: 'triangle', dur: spb * 8.2, vol: 0.028, a: 0.9, r: 2.2, when: w, bus: 'music', lp: 1100 });
        this.tone({ f: midi(n + 12), type: 'sine', dur: spb * 8, vol: 0.012, a: 1.2, r: 2, when: w, bus: 'music', detune: 6 });
      }
    }
    // Exploring, the band grows with the aurora: each restored crystal adds a layer.
    const layers = m.layered ? this.layers : 5;
    if (m.bass && layers >= 2 && (posInBar === 0 || posInBar === 2 || (m.drive && Number.isInteger(this.beat)))) {
      this.tone({ f: midi(chord[0] - 12), type: m.drive ? 'triangle' : 'sine', dur: spb * (m.drive ? 0.9 : 1.8), vol: m.drive ? 0.07 : 0.06, a: 0.02, r: 0.4, when: w, bus: 'music', send: false });
    }
    if (m.kick && (posInBar === 0 || posInBar === 2)) {
      this.tone({ f: 130, to: 42, type: 'sine', dur: 0.22, vol: 0.12, when: w, bus: 'music', send: false });
    }
    if (m.kick && (posInBar === 1 || posInBar === 3)) {
      this.noise({ dur: 0.12, vol: 0.035, f: 2400, q: 0.8, when: w, bus: 'music' });
    }
    if (m.layered && layers >= 5 && posInChord === 4) {
      // Lead: a short pentatonic phrase answering the chord.
      [0, 1, 2].forEach((k, i) => this.tone({ f: midi(penta(Math.floor(Math.random() * 3) + k + 2)), type: 'triangle', dur: spb * 0.9, vol: 0.022, a: 0.02, r: spb * 0.6, when: w + i * spb * 0.5, bus: 'music', lp: 2600 }));
    }
    if (m.layered && layers >= 4 && !Number.isInteger(this.beat)) {
      this.noise({ dur: 0.05, vol: 0.016, f: 6500, q: 1.4, when: w, bus: 'music' });
    }
    if (Math.random() < m.box * (m.layered ? 0.4 + layers * 0.12 : 1)) {
      // Music box: mostly chord tones, sometimes a pentatonic neighbor, in a high octave.
      const pcs = Math.random() < 0.6 ? chord.map((n) => n % 12) : (m.scale ?? SCALE_D);
      const pc = pcs[Math.floor(Math.random() * pcs.length)];
      const octave = Math.random() < 0.5 ? 72 : 84;
      const note = octave + ((pc - (octave % 12)) + 12) % 12;
      this.bell(midi(note), w, 0.028, 1.1, 'music');
    }
    if ((m.pluck || (m.layered && layers >= 3)) && Number.isInteger(this.beat)) {
      const n = chord[(Math.floor(this.beat) + 1) % chord.length] + 12;
      this.tone({ f: midi(n), type: 'triangle', dur: 0.25, vol: 0.03, a: 0.003, r: 0.2, when: w, bus: 'music' });
    }
  }
}
