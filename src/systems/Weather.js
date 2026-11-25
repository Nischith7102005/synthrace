// Weather.js - Particle Systems for Rain, Sakura Petals, and Bioluminescent Fireflies
import * as THREE from 'three';

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.currentMode = 'rain'; // 'rain', 'clear', 'sakura', 'fireflies'

    this.initRain();
    this.initFireflies();
  }

  initRain() {
    this.rainCount = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.rainCount * 6);
    const velocities = [];

    for (let i = 0; i < this.rainCount; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = Math.random() * 40;
      const z = (Math.random() - 0.5) * 120;
      const offset = i * 6;
      positions[offset] = x;
      positions[offset + 1] = y;
      positions[offset + 2] = z;
      positions[offset + 3] = x - 0.42;
      positions[offset + 4] = y - 1.7;
      positions[offset + 5] = z;

      velocities.push({ y: -35 - Math.random() * 20, x: -2 - Math.random() * 2 });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMat = new THREE.LineBasicMaterial({
      color: 0xb9d5df,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.rainPoints = new THREE.LineSegments(geo, this.rainMat);
    this.rainPoints.userData = { velocities };
    this.group.add(this.rainPoints);
  }

  initFireflies() {
    this.fireflyCount = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.fireflyCount * 3);
    const colors = new Float32Array(this.fireflyCount * 3);

    for (let i = 0; i < this.fireflyCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      // Glow yellow-green or cyan
      if (Math.random() > 0.5) {
        colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.95; colors[i * 3 + 2] = 0.3;
      } else {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 0.95;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.fireflyHomes = positions.slice();
    this.fireflyPhases = Float32Array.from({ length: this.fireflyCount }, () => Math.random() * Math.PI * 2);

    this.fireflyMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.fireflyPoints = new THREE.Points(geo, this.fireflyMat);
    this.fireflyPoints.visible = false;
    this.group.add(this.fireflyPoints);
  }

  setMode(mode) {
    this.currentMode = mode;
    this.rainPoints.visible = (mode === 'rain');
    this.fireflyPoints.visible = (mode === 'fireflies');
  }

  update(delta, playerCar) {
    const pPos = playerCar.group.position;
    const time = performance.now() * 0.001;

    // Follow player car
    this.group.position.copy(pPos);

    // Update Rain
    if (this.rainPoints.visible) {
      const pos = this.rainPoints.geometry.attributes.position.array;
      const vels = this.rainPoints.userData.velocities;

      for (let i = 0; i < this.rainCount; i++) {
        const offset = i * 6;
        const { x, y } = vels[i];
        pos[offset] += x * delta;
        pos[offset + 1] += y * delta;
        pos[offset + 3] += x * delta;
        pos[offset + 4] += y * delta;

        // Recycle a whole streak together so its length and angle stay consistent.
        if (pos[offset + 4] < 0) {
          const startX = (Math.random() - 0.5) * 80;
          const startY = 35 + Math.random() * 10;
          const startZ = (Math.random() - 0.5) * 120;
          pos[offset] = startX;
          pos[offset + 1] = startY;
          pos[offset + 2] = startZ;
          pos[offset + 3] = startX - 0.42;
          pos[offset + 4] = startY - 1.7;
          pos[offset + 5] = startZ;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }

    // Update Fireflies
    if (this.fireflyPoints.visible) {
      const pos = this.fireflyPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.fireflyCount; i++) {
        const offset = i * 3;
        const phase = this.fireflyPhases[i];
        pos[offset] = this.fireflyHomes[offset] + Math.sin(time * 0.38 + phase) * 0.55;
        pos[offset + 1] = this.fireflyHomes[offset + 1] + Math.cos(time * 0.52 + phase) * 0.34;
        pos[offset + 2] = this.fireflyHomes[offset + 2] + Math.sin(time * 0.24 + phase) * 0.3;
      }
      this.fireflyPoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
