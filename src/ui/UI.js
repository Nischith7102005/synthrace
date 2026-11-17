// UI.js - Lofi Cassette Tape Player, Audio Visualizer, Minimalist HUD, Pause & Settings Modal, Mobile Controls

export class UI {
  constructor(game) {
    this.game = game;
    this.soundManager = game.soundManager;
    this.car = game.car;
    this.biomes = game.biomes;
    this.cameraController = game.cameraController;
    this.weather = game.weather;

    this.isPaused = false;
    this.useMph = false;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    this.initDOM();
    this.bindEvents();
    this.setupVisualizer();
  }

  initDOM() {
    // 1. CRT / Scanline Overlay
    this.crtOverlay = document.createElement('div');
    this.crtOverlay.className = 'crt-overlay';
    document.body.appendChild(this.crtOverlay);

    // 2. Start / Click to Cruise Screen (handles browser audio unlock)
    this.startScreen = document.createElement('div');
    this.startScreen.className = 'start-screen';
    this.startScreen.innerHTML = `
      <div class="start-card">
        <div class="lofi-badge">✦ SYNTHRACE · LOFI HIGHWAY ✦</div>
        <h1 class="start-title">MIDNIGHT CRUISE</h1>
        <p class="start-subtitle">an infinite night drive for when you just want to chill</p>
        <div class="start-features">
          <span>🎧 Handcrafted Lofi Beats</span>
          <span>🌌 Flying Sky Whales</span>
          <span>🌸 Dynamic Sceneries</span>
          <span>✨ No Score, No Rush</span>
        </div>
        <button class="start-button" id="start-btn">
          <span class="start-btn-icon">▶</span> START CRUISING
        </button>
        <p class="start-hint">Press [Space] or Tap to Begin</p>
      </div>
    `;
    document.body.appendChild(this.startScreen);

    // 3. Top-Left Minimalist HUD (Speed, Distance, Biome tag)
    this.hud = document.createElement('div');
    this.hud.className = 'hud-container';
    this.hud.innerHTML = `
      <div class="hud-item speed-meter">
        <span class="speed-num" id="hud-speed">0</span>
        <span class="speed-unit" id="hud-unit">KM/H</span>
      </div>
      <div class="hud-item distance-badge">
        <span class="dist-icon">🛣️</span>
        <span id="hud-dist">0.0 km</span>
      </div>
      <div class="hud-item biome-badge" id="hud-biome-badge">
        <span id="hud-biome-icon">🏙️</span>
        <span id="hud-biome-text">Neo-Tokyo</span>
      </div>
    `;
    document.body.appendChild(this.hud);

    // 4. Top-Right Quick Controls (Auto-Cruise, Camera, Pause)
    this.quickControls = document.createElement('div');
    this.quickControls.className = 'quick-controls';
    this.quickControls.innerHTML = `
      <button class="icon-btn" id="btn-cruise" title="Toggle Auto-Cruise (Tab)">
        <span class="icon-label">AUTO CRUISE</span>
        <span class="badge-status" id="cruise-status">OFF</span>
      </button>
      <button class="icon-btn" id="btn-camera" title="Switch Camera (C)">
        <span>📷 VIEW</span>
      </button>
      <button class="icon-btn" id="btn-pause" title="Pause / Settings (Esc / P)">
        <span>⚙️ PAUSE</span>
      </button>
    `;
    document.body.appendChild(this.quickControls);

    // 5. Bottom Floating Cassette Tape Deck Player
    this.tapeDeck = document.createElement('div');
    this.tapeDeck.className = 'tape-deck';
    this.tapeDeck.innerHTML = `
      <div class="tape-body">
        <div class="tape-wheels">
          <div class="tape-wheel wheel-left" id="wheel-l">
            <div class="spool"></div>
          </div>
          <div class="tape-center-window">
            <div class="tape-ribbon"></div>
          </div>
          <div class="tape-wheel wheel-right" id="wheel-r">
            <div class="spool"></div>
          </div>
        </div>
        <div class="tape-info">
          <div class="track-marquee">
            <span class="track-title" id="tape-title">Coastal Road</span>
            <span class="track-artist" id="tape-artist">Mellow Fox</span>
          </div>
          <div class="tape-visualizer" id="tape-viz"></div>
        </div>
        <div class="tape-controls">
          <button class="tape-btn" id="btn-prev" title="Previous Track">⏮</button>
          <button class="tape-btn play-btn" id="btn-play" title="Play / Pause">⏸</button>
          <button class="tape-btn" id="btn-next" title="Next Track">⏭</button>
          <button class="tape-btn mode-btn" id="btn-mode" title="Toggle Tape Deck / Endless Lo-Fi FM">📻</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.tapeDeck);

    // 6. Pause & Settings Modal (Only pause option, volume & aesthetic settings)
    this.pauseModal = document.createElement('div');
    this.pauseModal.className = 'pause-modal hidden';
    this.pauseModal.innerHTML = `
      <div class="pause-card">
        <div class="pause-header">
          <h2>✦ CRUISING PAUSED ✦</h2>
          <p>take a breath, chill out, adjust your vibe</p>
        </div>

        <div class="settings-grid">
          <!-- Audio Volumes -->
          <div class="settings-group">
            <h3>🎧 AUDIO SETTINGS</h3>
            <div class="slider-row">
              <label>Master Volume</label>
              <input type="range" id="vol-master" min="0" max="100" value="80" />
            </div>
            <div class="slider-row">
              <label>Music Volume</label>
              <input type="range" id="vol-music" min="0" max="100" value="85" />
            </div>
            <div class="slider-row">
              <label>Rain & Ambience</label>
              <input type="range" id="vol-ambience" min="0" max="100" value="50" />
            </div>
            <div class="slider-row">
              <label>Engine Sound</label>
              <input type="range" id="vol-sfx" min="0" max="100" value="60" />
            </div>
          </div>

          <!-- Atmosphere & Scenery -->
          <div class="settings-group">
            <h3>🌌 SCENERY & BIOMES</h3>
            <div class="biome-selector">
              <button class="option-btn active" data-biome="0">🏙️ Neo-Tokyo</button>
              <button class="option-btn" data-biome="1">🌸 Sakura Night</button>
              <button class="option-btn" data-biome="2">🌊 Coastal Road</button>
              <button class="option-btn" data-biome="3">🌲 Pine Aurora</button>
              <button class="option-btn" data-biome="4">💎 Crystal Canyon</button>
            </div>
            <div class="toggle-row" style="margin-top: 10px;">
              <label>Auto-Cycle Sceneries</label>
              <input type="checkbox" id="toggle-autocycle" checked />
            </div>
          </div>

          <!-- Weather & Visuals -->
          <div class="settings-group">
            <h3>🌧️ WEATHER & VIBE</h3>
            <div class="weather-selector">
              <button class="option-btn active" data-weather="rain">🌧️ Lofi Rain</button>
              <button class="option-btn" data-weather="clear">✨ Clear Night</button>
              <button class="option-btn" data-weather="fireflies">🧚 Fireflies</button>
            </div>
            <div class="toggle-row" style="margin-top: 10px;">
              <label>CRT Retro Scanlines</label>
              <input type="checkbox" id="toggle-crt" checked />
            </div>
            <div class="toggle-row">
              <label>Speed Unit: MPH</label>
              <input type="checkbox" id="toggle-mph" />
            </div>
          </div>

          <!-- Controls Help -->
          <div class="settings-group controls-help">
            <h3>🎮 CONTROLS GUIDE</h3>
            <div class="help-grid">
              <div><kbd>W</kbd> / <kbd>↑</kbd> Accelerate</div>
              <div><kbd>S</kbd> / <kbd>↓</kbd> Brake</div>
              <div><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd> Steer</div>
              <div><kbd>Tab</kbd> Auto-Cruise</div>
              <div><kbd>C</kbd> Change Camera</div>
              <div><kbd>N</kbd> Next Track</div>
              <div><kbd>Space</kbd> Play/Pause Music</div>
              <div><kbd>Esc</kbd> / <kbd>P</kbd> Pause Menu</div>
            </div>
          </div>
        </div>

        <div class="pause-actions">
          <button class="resume-btn" id="btn-resume">RESUME CRUISING ▶</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.pauseModal);

    // 7. Mobile On-Screen Controls
    this.mobileControls = document.createElement('div');
    this.mobileControls.className = 'mobile-controls';
    this.mobileControls.innerHTML = `
      <div class="mobile-left">
        <button class="mobile-btn" id="m-left">◀</button>
        <button class="mobile-btn" id="m-right">▶</button>
      </div>
      <div class="mobile-right">
        <button class="mobile-btn m-brake" id="m-brake">BRAKE</button>
        <button class="mobile-btn m-gas" id="m-gas">GAS</button>
      </div>
    `;
    document.body.appendChild(this.mobileControls);

    // 8. Notification Toast
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);
  }

  setupVisualizer() {
    const container = document.getElementById('tape-viz');
    if (!container) return;
    this.vizBars = [];
    for (let i = 0; i < 16; i++) {
      const bar = document.createElement('div');
      bar.className = 'viz-bar';
      container.appendChild(bar);
      this.vizBars.push(bar);
    }
  }

  bindEvents() {
    // Start screen click
    const startBtn = document.getElementById('start-btn');
    const startHandler = () => {
      this.startScreen.classList.add('hidden');
      this.soundManager.ensureUnlocked();
      this.soundManager.play();
      this.showToast('🎧 Lo-fi Radio Connected · Smooth Cruising Ahead');
      window.removeEventListener('keydown', keyStartHandler);
    };

    const keyStartHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        startHandler();
      }
    };

    startBtn.addEventListener('click', startHandler);
    window.addEventListener('keydown', keyStartHandler);

    // Quick controls
    const btnCruise = document.getElementById('btn-cruise');
    btnCruise.addEventListener('click', () => {
      this.toggleAutoCruise();
    });

    const btnCamera = document.getElementById('btn-camera');
    btnCamera.addEventListener('click', () => {
      const mode = this.cameraController.toggleMode();
      this.showToast(`📷 Camera: ${mode.toUpperCase()} VIEW`);
    });

    const btnPause = document.getElementById('btn-pause');
    btnPause.addEventListener('click', () => {
      this.togglePause();
    });

    const btnResume = document.getElementById('btn-resume');
    btnResume.addEventListener('click', () => {
      this.togglePause();
    });

    // Tape deck buttons
    const btnPlay = document.getElementById('btn-play');
    btnPlay.addEventListener('click', () => {
      this.soundManager.togglePlay();
    });

    const btnNext = document.getElementById('btn-next');
    btnNext.addEventListener('click', () => {
      this.soundManager.nextTrack(true);
    });

    const btnPrev = document.getElementById('btn-prev');
    btnPrev.addEventListener('click', () => {
      this.soundManager.prevTrack(true);
    });

    const btnMode = document.getElementById('btn-mode');
    btnMode.addEventListener('click', () => {
      if (this.soundManager.mode === 'playlist') {
        this.soundManager.startGenerativeLoFi();
        this.showToast('📻 Switched to Endless Lo-Fi Generative FM');
      } else {
        this.soundManager.mode = 'playlist';
        this.soundManager.stopGenerativeLoFi();
        this.soundManager.loadTrack(this.soundManager.currentIndex, true);
        this.showToast('📼 Switched to Curated Cassette Tape Deck');
      }
    });

    // Volume Sliders
    document.getElementById('vol-master').addEventListener('input', (e) => {
      this.soundManager.setMasterVolume(e.target.value / 100);
    });
    document.getElementById('vol-music').addEventListener('input', (e) => {
      this.soundManager.setMusicVolume(e.target.value / 100);
    });
    document.getElementById('vol-ambience').addEventListener('input', (e) => {
      this.soundManager.setAmbienceVolume(e.target.value / 100);
    });
    document.getElementById('vol-sfx').addEventListener('input', (e) => {
      this.soundManager.setSfxVolume(e.target.value / 100);
    });

    // Biome Selector Buttons
    const biomeBtns = document.querySelectorAll('[data-biome]');
    biomeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        biomeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const idx = parseInt(btn.dataset.biome, 10);
        this.biomes.setBiome(idx);
        this.showToast(`Scenery: ${this.biomes.biomeList[idx].name}`);
      });
    });

    // Weather Selector Buttons
    const weatherBtns = document.querySelectorAll('[data-weather]');
    weatherBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        weatherBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.weather;
        this.weather.setMode(mode);
        this.showToast(`Atmosphere: ${mode.toUpperCase()}`);
      });
    });

    // Toggle Checkboxes
    document.getElementById('toggle-autocycle').addEventListener('change', (e) => {
      this.biomes.autoCycleEnabled = e.target.checked;
    });

    document.getElementById('toggle-crt').addEventListener('change', (e) => {
      this.crtOverlay.style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('toggle-mph').addEventListener('change', (e) => {
      this.useMph = e.target.checked;
      document.getElementById('hud-unit').textContent = this.useMph ? 'MPH' : 'KM/H';
    });

    // Sound Manager Callbacks
    this.soundManager.onTrackChange = (track) => {
      const titleEl = document.getElementById('tape-title');
      const artistEl = document.getElementById('tape-artist');
      if (titleEl) titleEl.textContent = track.title;
      if (artistEl) artistEl.textContent = track.artist;
      this.showToast(`🎵 Now Playing: ${track.title} · ${track.artist}`);
    };

    this.soundManager.onPlayStateChange = (playing) => {
      const btn = document.getElementById('btn-play');
      const wheelL = document.getElementById('wheel-l');
      const wheelR = document.getElementById('wheel-r');
      if (btn) btn.textContent = playing ? '⏸' : '▶';
      if (wheelL) wheelL.classList.toggle('spinning', playing);
      if (wheelR) wheelR.classList.toggle('spinning', playing);
    };

    // Soft Respawn callback from Car
    this.car.onSoftRespawn = () => {
      const quotes = [
        '✦ take it easy... no rush',
        '✦ smoothly gliding back into lane',
        '✦ infinite road ahead... breathe in',
        '✦ just cruising... chill vibes only'
      ];
      this.showToast(quotes[Math.floor(Math.random() * quotes.length)]);
    };

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        this.toggleAutoCruise();
      } else if (e.code === 'KeyC') {
        this.cameraController.toggleMode();
      } else if (e.code === 'KeyN') {
        this.soundManager.nextTrack(true);
      }
    });

    // Mobile Virtual Touch Controls
    this.setupTouchControls();
  }

  setupTouchControls() {
    const bindTouch = (id, prop) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.input[prop] = true;
      });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.game.input[prop] = false;
      });
    };

    bindTouch('m-gas', 'forward');
    bindTouch('m-brake', 'backward');
    bindTouch('m-left', 'left');
    bindTouch('m-right', 'right');
  }

  toggleAutoCruise() {
    this.car.autoCruise = !this.car.autoCruise;
    const statusEl = document.getElementById('cruise-status');
    const btn = document.getElementById('btn-cruise');

    if (this.car.autoCruise) {
      statusEl.textContent = 'ON';
      btn.classList.add('active');
      this.showToast('🚀 Auto-Cruise Active · Sit back and relax');
    } else {
      statusEl.textContent = 'OFF';
      btn.classList.remove('active');
      this.showToast('Manual Driving Resumed');
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseModal.classList.toggle('hidden', !this.isPaused);

    if (this.isPaused) {
      this.showToast('Cruising Paused');
    }
  }

  showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'lofi-toast';
    toast.textContent = msg;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  update(delta) {
    // 1. Update Speedometer
    const speed = this.useMph ? this.car.getSpeedMph() : this.car.getSpeedKmH();
    const speedEl = document.getElementById('hud-speed');
    if (speedEl) speedEl.textContent = speed;

    // 2. Update Distance
    const distKm = (this.car.distanceTraveled / 1000).toFixed(1);
    const distEl = document.getElementById('hud-dist');
    if (distEl) distEl.textContent = `${distKm} km`;

    // 3. Update Current Biome Badge
    const curBiome = this.biomes.getCurrentBiome();
    const iconEl = document.getElementById('hud-biome-icon');
    const textEl = document.getElementById('hud-biome-text');
    if (iconEl && textEl && curBiome) {
      const icons = {
        neotokyo: '🏙️',
        sakura: '🌸',
        coastal: '🌊',
        aurora: '🌲',
        crystal: '💎'
      };
      iconEl.textContent = icons[curBiome.id] || '🌌';
      textEl.textContent = curBiome.name;
    }

    // 4. Update Audio Visualizer Spectrum Bars
    if (this.vizBars && this.soundManager.isPlaying) {
      const freqData = this.soundManager.getVisualizerData();
      if (freqData) {
        for (let i = 0; i < 16; i++) {
          const val = freqData[i] || 0;
          const height = Math.max(3, (val / 255) * 22);
          this.vizBars[i].style.height = `${height}px`;
        }
      }
    }
  }
}
