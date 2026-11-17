// SoundManager.js - Professional Lo-Fi Audio Engine with Seamless Crossfading & Ambient Synthesis

export class SoundManager {
  constructor() {
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.mode = 'playlist'; // 'playlist' or 'generative'

    // Volume settings (0.0 to 1.0)
    this.masterVolume = 0.8;
    this.musicVolume = 0.85;
    this.ambienceVolume = 0.5;
    this.sfxVolume = 0.6;
    this.isMuted = false;

    // Web Audio API Context
    this.audioCtx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.ambienceGain = null;
    this.sfxGain = null;
    this.analyser = null;
    this.analyserData = new Uint8Array(32);

    // Dual audio elements for seamless crossfading
    this.playerA = null;
    this.playerB = null;
    this.activePlayer = 'A'; // 'A' or 'B'
    this.crossfadeDuration = 3.5; // seconds
    this.crossfadeTimer = null;

    // Ambient generators
    this.rainNode = null;
    this.vinylNode = null;
    this.engineNode = null;
    this.engineGain = null;
    this.isRainActive = true;
    this.isVinylActive = true;

    // Generative Lo-Fi Synth Engine
    this.synthLoopInterval = null;
    this.synthStep = 0;

    // Callbacks
    this.onTrackChange = null;
    this.onPlayStateChange = null;

    this.initPlaylist();
  }

  async initPlaylist() {
    try {
      const res = await fetch('/music/playlist.json');
      if (res.ok) {
        this.playlist = await res.json();
      }
    } catch (e) {
      console.warn('Could not load playlist.json, using fallback tracks', e);
    }

    if (!this.playlist || this.playlist.length === 0) {
      this.playlist = [
        { id: 'coastal-road', title: 'Coastal Road', artist: 'Mellow Fox', file: '/music/coastal-road.mp3', vibe: 'Midnight Breeze' },
        { id: 'nightvision', title: 'Nightvision', artist: 'Sellar', file: '/music/nightvision.mp3', vibe: 'Neon Glow' },
        { id: 'this-is-easy', title: 'This Is Easy', artist: 'Red Tractor', file: '/music/this-is-easy.mp3', vibe: 'Rainy Drive' },
        { id: 'peaceful-retreat', title: 'Peaceful Retreat', artist: 'Mellow Fox', file: '/music/peaceful-retreat.mp3', vibe: 'Aurora Mist' },
        { id: 'new-beginnings', title: 'New Beginnings', artist: 'Mr. Käfer & Phlocalyst', file: '/music/new-beginnings.mp3', vibe: 'Sakura Bloom' },
        { id: 'bonsai-tree', title: 'Bonsai Tree', artist: 'Yellofish', file: '/music/bonsai-tree.mp3', vibe: 'Cosmic Drift' },
        { id: 'the-extra-mile', title: 'The Extra Mile', artist: 'Robot Age', file: '/music/the-extra-mile.mp3', vibe: 'Endless Horizon' },
      ];
    }
  }

  initAudioContext() {
    if (this.audioCtx) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();

    // Master bus
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.audioCtx.destination);

    // Music bus with Analyser
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.analyser);
    this.analyser.connect(this.masterGain);

    // Ambience bus
    this.ambienceGain = this.audioCtx.createGain();
    this.ambienceGain.gain.value = this.ambienceVolume;
    this.ambienceGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.audioCtx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Create dual HTML5 audio elements connected to Web Audio
    this.playerA = this.createPlayerInstance('Player A');
    this.playerB = this.createPlayerInstance('Player B');

    // Setup ambient generators
    this.setupRainAmbience();
    this.setupVinylCrackle();
    this.setupEngineSound();
  }

  createPlayerInstance(name) {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    let mediaNode = null;
    let gainNode = null;

    try {
      mediaNode = this.audioCtx.createMediaElementSource(audio);
      gainNode = this.audioCtx.createGain();
      gainNode.gain.value = 0;
      mediaNode.connect(gainNode);
      gainNode.connect(this.musicGain);
    } catch (e) {
      console.warn('MediaElementSource error:', e);
    }

    // Auto crossfade when near end of track (5s before ending)
    audio.addEventListener('timeupdate', () => {
      if (this.isPlaying && this.mode === 'playlist') {
        const remaining = audio.duration - audio.currentTime;
        if (remaining > 0 && remaining < this.crossfadeDuration && !audio._isTransitioning) {
          audio._isTransitioning = true;
          this.nextTrack(true);
        }
      }
    });

    audio.addEventListener('ended', () => {
      audio._isTransitioning = false;
      if (this.isPlaying && this.mode === 'playlist') {
        this.nextTrack(false);
      }
    });

    audio.addEventListener('error', (err) => {
      console.warn(`Audio playback error on ${name}:`, err);
      // If file fails, seamlessly continue or switch to next
    });

    return { audio, mediaNode, gainNode, _isTransitioning: false };
  }

  ensureUnlocked() {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  play() {
    this.ensureUnlocked();
    this.isPlaying = true;

    if (this.mode === 'playlist') {
      const currentPlayer = this.activePlayer === 'A' ? this.playerA : this.playerB;
      if (!currentPlayer.audio.src || currentPlayer.audio.src === '' || currentPlayer.audio.paused) {
        this.loadTrack(this.currentIndex, false);
      } else {
        currentPlayer.audio.play().catch(e => console.log('Autoplay deferred:', e));
      }
    } else {
      this.startGenerativeLoFi();
    }

    if (this.onPlayStateChange) this.onPlayStateChange(true);
  }

  pause() {
    this.isPlaying = false;
    if (this.playerA && this.playerA.audio) this.playerA.audio.pause();
    if (this.playerB && this.playerB.audio) this.playerB.audio.pause();
    this.stopGenerativeLoFi();
    if (this.onPlayStateChange) this.onPlayStateChange(false);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  loadTrack(index, crossfade = true) {
    if (!this.playlist || this.playlist.length === 0) return;

    this.ensureUnlocked();
    this.currentIndex = ((index % this.playlist.length) + this.playlist.length) % this.playlist.length;
    const track = this.playlist[this.currentIndex];

    const outgoing = this.activePlayer === 'A' ? this.playerA : this.playerB;
    const incoming = this.activePlayer === 'A' ? this.playerB : this.playerA;
    this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';

    incoming.audio.src = track.file;
    incoming.audio.currentTime = 0;
    incoming._isTransitioning = false;

    const now = this.audioCtx ? this.audioCtx.currentTime : 0;
    const fadeTime = crossfade ? this.crossfadeDuration : 0.4;

    if (this.audioCtx && incoming.gainNode && outgoing.gainNode) {
      // Crossfade using Web Audio gain curves
      incoming.gainNode.gain.cancelScheduledValues(now);
      incoming.gainNode.gain.setValueAtTime(0.001, now);
      incoming.gainNode.gain.exponentialRampToValueAtTime(1.0, now + fadeTime);

      outgoing.gainNode.gain.cancelScheduledValues(now);
      outgoing.gainNode.gain.setValueAtTime(outgoing.gainNode.gain.value || 1.0, now);
      outgoing.gainNode.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);

      setTimeout(() => {
        if (outgoing.audio && outgoing !== incoming) {
          outgoing.audio.pause();
          outgoing._isTransitioning = false;
        }
      }, (fadeTime + 0.1) * 1000);
    } else {
      // Fallback HTML5 audio volume ramp
      incoming.audio.volume = 1;
      if (outgoing.audio) outgoing.audio.pause();
    }

    incoming.audio.play().catch(e => {
      console.log('Audio play triggered on user action:', e);
    });

    if (this.onTrackChange) {
      this.onTrackChange(track, this.currentIndex);
    }
  }

  nextTrack(crossfade = true) {
    this.loadTrack(this.currentIndex + 1, crossfade);
  }

  prevTrack(crossfade = true) {
    this.loadTrack(this.currentIndex - 1, crossfade);
  }

  getCurrentTrack() {
    if (this.playlist && this.playlist[this.currentIndex]) {
      return this.playlist[this.currentIndex];
    }
    return { title: 'Lo-Fi Chill Beat', artist: 'Synthrace Radio', vibe: 'Endless Highway' };
  }

  getVisualizerData() {
    if (this.analyser && this.isPlaying) {
      this.analyser.getByteFrequencyData(this.analyserData);
      return this.analyserData;
    }
    return null;
  }

  // Ambience 1: Procedural Rain on windshield
  setupRainAmbience() {
    if (!this.audioCtx) return;

    try {
      const bufferSize = this.audioCtx.sampleRate * 2;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink / brown noise with rain drops
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.08;
        b2 = 0.85 * b2 + white * 0.12;

        let sample = (b0 + b1 + b2) * 0.3;
        // occasional soft raindrop patter
        if (Math.random() < 0.0008) {
          sample += (Math.random() * 2 - 1) * 0.5;
        }
        data[i] = sample;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 850;
      filter.Q.value = 0.8;

      const rainGain = this.audioCtx.createGain();
      rainGain.gain.value = 0.25;

      noise.connect(filter);
      filter.connect(rainGain);
      rainGain.connect(this.ambienceGain);

      noise.start(0);
      this.rainNode = { source: noise, gain: rainGain, filter };
    } catch (e) {
      console.warn('Rain audio error:', e);
    }
  }

  // Ambience 2: Vinyl Crackle & Tape Flutter
  setupVinylCrackle() {
    if (!this.audioCtx) return;

    try {
      const bufferSize = this.audioCtx.sampleRate * 3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        let sample = (Math.random() * 2 - 1) * 0.015; // low tape hiss
        if (Math.random() < 0.0003) {
          // Vinyl pop
          sample += (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.3);
        }
        data[i] = sample;
      }

      const vinyl = this.audioCtx.createBufferSource();
      vinyl.buffer = buffer;
      vinyl.loop = true;

      const vinylGain = this.audioCtx.createGain();
      vinylGain.gain.value = 0.3;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3500;

      vinyl.connect(filter);
      filter.connect(vinylGain);
      vinylGain.connect(this.ambienceGain);

      vinyl.start(0);
      this.vinylNode = { source: vinyl, gain: vinylGain };
    } catch (e) {
      console.warn('Vinyl audio error:', e);
    }
  }

  // Ambience 3: Cozy Engine Purr modulated with car speed
  setupEngineSound() {
    if (!this.audioCtx) return;

    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.value = 42;
      osc2.frequency.value = 84;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      filter.Q.value = 3;

      const engineGain = this.audioCtx.createGain();
      engineGain.gain.value = 0.12;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(this.masterGain);

      osc1.start(0);
      osc2.start(0);

      this.engineNode = { osc1, osc2, filter };
      this.engineGain = engineGain;
    } catch (e) {
      console.warn('Engine audio error:', e);
    }
  }

  updateEngineSound(speedKmH, maxSpeed = 160) {
    if (!this.engineNode || !this.audioCtx) return;

    const normalized = Math.max(0.1, Math.min(1.4, speedKmH / 100));
    const baseFreq = 38 + normalized * 50;
    const now = this.audioCtx.currentTime;

    this.engineNode.osc1.frequency.setTargetAtTime(baseFreq, now, 0.1);
    this.engineNode.osc2.frequency.setTargetAtTime(baseFreq * 2, now, 0.1);
    this.engineNode.filter.frequency.setTargetAtTime(180 + normalized * 320, now, 0.15);

    if (this.engineGain) {
      const targetGain = (0.08 + normalized * 0.12) * (this.isMuted ? 0 : this.sfxVolume);
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.2);
    }
  }

  // Ethereal bump / respawn chime
  playRespawnChime() {
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 dreamy arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.15 * this.sfxVolume, now + idx * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.3);
      });
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // Procedural Lo-Fi Generator ("Endless FM")
  startGenerativeLoFi() {
    this.stopGenerativeLoFi();
    this.mode = 'generative';

    // Lo-fi jazz chord progressions (maj7, min9, dim)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [164.81, 196.00, 246.94, 293.66], // Em7
    ];

    let chordIndex = 0;
    const playChordStep = () => {
      if (!this.isPlaying || this.mode !== 'generative') return;

      const chord = chords[chordIndex % chords.length];
      chordIndex++;

      const now = this.audioCtx.currentTime;
      // Warm Rhodes / FM electric piano sound
      chord.forEach((freq, i) => {
        const osc = this.audioCtx.createOscillator();
        const mod = this.audioCtx.createOscillator();
        const modGain = this.audioCtx.createGain();
        const noteGain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * 2, now);
        modGain.gain.setValueAtTime(freq * 0.6, now);

        mod.connect(modGain);
        modGain.connect(osc.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 2.5);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.08, now + 0.06 + i * 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.musicGain);

        mod.start(now);
        osc.start(now);
        mod.stop(now + 3.3);
        osc.stop(now + 3.3);
      });

      // Lo-fi soft kick and rim
      this.playLofiDrum(now);
    };

    playChordStep();
    this.synthLoopInterval = setInterval(playChordStep, 3200);

    if (this.onTrackChange) {
      this.onTrackChange({
        id: 'generative-fm',
        title: 'Endless Lo-Fi FM',
        artist: 'Generative Ambient Engine',
        vibe: 'Infinite Stars'
      }, -1);
    }
  }

  playLofiDrum(now) {
    if (!this.audioCtx) return;
    try {
      // Soft mellow kick
      const kickOsc = this.audioCtx.createOscillator();
      const kickGain = this.audioCtx.createGain();
      kickOsc.frequency.setValueAtTime(110, now);
      kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
      kickGain.gain.setValueAtTime(0.25, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.25);

      // Hi-hat swing on offbeat
      const hatTimes = [now + 0.4, now + 0.8, now + 1.2, now + 1.6, now + 2.0, now + 2.4, now + 2.8];
      hatTimes.forEach((t) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(8000, t);
        gain.gain.setValueAtTime(0.015, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch (e) {
      // ignore
    }
  }

  stopGenerativeLoFi() {
    if (this.synthLoopInterval) {
      clearInterval(this.synthLoopInterval);
      this.synthLoopInterval = null;
    }
  }

  // Volume Controls
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx ? this.audioCtx.currentTime : 0);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.audioCtx ? this.audioCtx.currentTime : 0);
    }
  }

  setAmbienceVolume(val) {
    this.ambienceVolume = Math.max(0, Math.min(1, val));
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.audioCtx ? this.audioCtx.currentTime : 0);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioCtx ? this.audioCtx.currentTime : 0);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : this.masterVolume,
        this.audioCtx.currentTime
      );
    }
    return this.isMuted;
  }
}
