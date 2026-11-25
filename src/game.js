// game.js - Master Engine Coordinator for Synthrace Lo-Fi Cruising Experience
import * as THREE from 'three';
import { SoundManager } from './audio/SoundManager.js';
import { RoadSystem } from './world/RoadSystem.js';
import { Biomes } from './world/Biomes.js';
import { FlyingCreatures } from './world/FlyingCreatures.js';
import { Car } from './entities/Car.js';
import { Traffic } from './entities/Traffic.js';
import { Weather } from './systems/Weather.js';
import { CameraController } from './camera/CameraController.js';
import { UI } from './ui/UI.js';

export class Game {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 2. Setup Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080d15);
    this.scene.fog = new THREE.FogExp2(0x101820, 0.0024);
    this.skyDome = this.createSkyDome();
    this.scene.add(this.skyDome);
    this.scene.userData.skyDome = this.skyDome;

    // 3. Setup Camera
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.2,
      1400
    );

    // 4. Input Manager
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false
    };

    // 5. Initialize Core Systems
    this.soundManager = new SoundManager();
    this.roadSystem = new RoadSystem(this.scene);
    this.biomes = new Biomes(this.scene, this.roadSystem);
    this.flyingCreatures = new FlyingCreatures(this.scene);
    this.car = new Car(this.scene, this.roadSystem, this.soundManager);
    this.traffic = new Traffic(this.scene, this.roadSystem);
    this.weather = new Weather(this.scene);
    this.cameraController = new CameraController(this.camera);

    // 6. Setup Lighting
    this.setupLighting();

    // 7. Setup UI & Event Listeners
    this.ui = new UI(this);
    this.bindInputs();
    this.bindResize();

    // 8. Start Game Loop
    this.clock = new THREE.Clock();
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  createSkyDome() {
    const geometry = new THREE.SphereGeometry(1200, 32, 20);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color(0x080d18) },
        midSky: { value: new THREE.Color(0x142630) },
        horizon: { value: new THREE.Color(0x283b3d) }
      },
      vertexShader: `
        varying vec3 vSkyDirection;
        void main() {
          vSkyDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vSkyDirection;
        uniform vec3 zenith;
        uniform vec3 midSky;
        uniform vec3 horizon;
        void main() {
          float h = clamp(vSkyDirection.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 sky = mix(horizon, midSky, smoothstep(0.02, 0.46, h));
          sky = mix(sky, zenith, smoothstep(0.34, 0.96, h));
          float haze = 1.0 - smoothstep(0.02, 0.24, abs(h - 0.5));
          sky += vec3(0.018, 0.027, 0.028) * haze;
          gl_FragColor = vec4(sky, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    const dome = new THREE.Mesh(geometry, material);
    dome.renderOrder = -1000;
    dome.frustumCulled = false;
    return dome;
  }

  setupLighting() {
    // Cool moon fill with restrained warm practicals along the road.
    this.ambientLight = new THREE.AmbientLight(0x8593aa, 0.46);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0xa9bed3, 1.05);
    this.moonLight.position.set(60, 100, -80);
    this.scene.add(this.moonLight);

    this.horizonLight = new THREE.HemisphereLight(0x7e9aaa, 0x10151a, 0.58);
    this.scene.add(this.horizonLight);
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      // Don't capture inputs if typing inside an input element
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.input.drift = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.drift = false;
          break;
      }
    });
  }

  bindResize() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    let delta = (now - this.lastTime) * 0.001;
    this.lastTime = now;

    // Safety clamp delta against tab switches / background pauses
    if (delta > 0.1) delta = 0.1;

    // If game is paused via pause modal, car and traffic freeze, but background sky creatures still breathe
    if (!this.ui.isPaused) {
      // 1. Update Player Car
      const trafficList = this.traffic.getVehicles();
      this.car.update(delta, this.input, trafficList);

      // 2. Update Traffic
      this.traffic.update(delta, this.car);

      // 3. Update Road & Infinite Object Recycling
      this.roadSystem.update(this.car.z);

      // 4. Update Scenery Biomes
      this.biomes.update(delta, this.car.z);

      // 5. Update Weather particles
      this.weather.update(delta, this.car);
    }

    // Sky creatures swim gracefully even when paused!
    this.flyingCreatures.update(delta, this.car.z);

    // Camera controller always smoothly tracks
    this.cameraController.update(delta, this.car);

    // UI HUD & Visualizer updates
    this.ui.update(delta);

    // Keep the gradient sky centered on the lens so the dome never exposes an edge.
    this.skyDome.position.copy(this.camera.position);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}
