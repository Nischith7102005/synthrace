# Synthrace · Lo-Fi Highway Cruise 🚗✨

An aesthetic, zero-lag, online 3D highway riding experience designed for chilling, relaxing, and vibing to lo-fi beats with seamless crossfades, dynamic night scenery, and celestial sky animals.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNischith7102005%2Fsynthrace)

---

## ⚡ 1-Click Deploy to Vercel

This repository is configured for instantaneous deployment on **Vercel** (`vercel.json` included with Vite presets, audio streaming byte-range headers, and asset caching).

### Method 1: Import via Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select repository **`Nischith7102005/synthrace`**.
3. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. In ~30 seconds, your game will be live on your custom `*.vercel.app` domain!

### Method 2: Deploy via Vercel CLI
From your local machine:
```bash
npm i -g vercel
vercel
```

---

## ✨ Features

- **Endless Lo-Fi Night Highway**: An infinite, gently curving 4-lane expressway with reflective wet asphalt, streetlights, Tokyo expressway highway gantries, and cat-eye reflectors.
- **Majestic Celestial Flying Animals**:
  - **Celestial Sky Whales**: Articulated swimming spine, bioluminescent glowing belly, fin ripples, and trailing stardust particles.
  - **Spirit Manta Rays**: Translucent glowing wings undulating across the starry sky.
  - **Luminous Spirit Birds**: Flying in formation toward the giant moon.
  - **Floating Starlit Jellyfish**: Pulsating domes and trailing tentacles.
- **Dynamic Changing Sceneries (Biomes)**:
  - 🏙️ **Neo-Tokyo Midnight**: Towering skyscrapers, glowing windows, and animated neon signs.
  - 🌸 **Sakura Night**: Giant Torii gates, glowing cherry blossom trees, drifting petals, and Mount Fuji silhouette.
  - 🌊 **Coastal Breeze**: Endless moonlit ocean, swaying palm trees, and rotating lighthouse beam.
  - 🌲 **Misty Pine Aurora**: Alpine fir forests, cozy roadside cabins, and dancing Aurora Borealis ribbons.
  - 💎 **Celestial Dreamscape**: Amethyst crystals and Saturn-like cosmic planetary rings.
- **Vintage Lo-Fi Cassette Tape Player & Endless Radio**:
  - 7 curated royalty-free studio lo-fi tracks from artists like Mellow Fox, Red Tractor, Sellar, Robot Age, and Yellofish.
  - **Seamless 3.5s Equal-Power Crossfading** between songs (no pops, silence, or abrupt cuts).
  - **Endless Generative Lo-Fi FM Radio**: In-engine Web Audio jazz Rhodes electric piano chords (Maj7, Min9), warm basslines, and lo-fi drums.
  - Spinning cassette tape reels with real-time 16-band audio spectrum visualizer.
  - Ambient procedural sound generators: vinyl crackle & tape flutter, soothing rain on windshield, cozy inline-6 engine purr.
- **Chill, Frustration-Free Cruising**:
  - **No Scoreboard, No Retries, No Game Over**: Built strictly for chilling when you are bored.
  - **Soft Bump & Respawn**: Collisions with guardrails or traffic trigger an ethereal holographic float mode, decelerating gently to 45 km/h before smoothly cruising forward without interrupting the road, scenery, or music!
  - **Autonomous Auto-Cruise Mode** (`Tab` / On-screen toggle): Sit back and let the AI steer and weave gently through traffic.
  - **Multiple Camera Views** (`C`): Third-Person Chase, Cockpit/Hood View, and Slow Cinematic Drone Orbit.
  - **Pause & Settings Modal** (`Esc` / `P`): Volume sliders for Master, Music, Ambience/Rain, and Engine sound, plus weather and scenery selectors.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Accelerate** | `W` or `↑` | On-Screen GAS Pedal |
| **Brake / Decelerate** | `S` or `↓` | On-Screen BRAKE Pedal |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | On-Screen `◀` / `▶` Buttons |
| **Drift / Handbrake** | `Space` | Touch & hold |
| **Auto-Cruise (Hands-Free)** | `Tab` | Top-right `AUTO CRUISE` button |
| **Switch Camera View** | `C` | Top-right `VIEW` button |
| **Next / Previous Track** | `N` / Cassette buttons | Tape Deck `⏮` / `⏭` |
| **Play / Pause Music** | `Space` (when on tape) | Tape Deck `▶` / `⏸` |
| **Pause & Settings** | `Esc` or `P` | Top-right `PAUSE` button |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License

MIT License. Music tracks licensed for personal listening and web appreciation under MIT.
