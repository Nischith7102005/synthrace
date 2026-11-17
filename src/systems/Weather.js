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
    const positions = new Float32Array(this.rainCount * 3);
    const velocities = [];

    for (let i = 0; i < this.rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;

      velocities.push({
        y: -35 - Math.random() * 20,
        x: -2 - Math.random() * 2
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.9,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.rainPoints = new THREE.Points(geo, this.rainMat);
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
    this.group.position.set(pPos.x, 0, pPos.z);

    // Update Rain
    if (this.rainPoints.visible) {
      const pos = this.rainPoints.geometry.attributes.position.array;
      const vels = this.rainPoints.userData.velocities;

      for (let i = 0; i < this.rainCount; i++) {
        pos[i * 3 + 1] += vels[i].y * delta;
        pos[i * 3] += vels[i].x * delta;

        // Reset if hit ground or out of view
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 35 + Math.random() * 10;
          pos[i * 3] = (Math.random() - 0.5) * 80;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 120;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }

    // Update Fireflies
    if (this.fireflyPoints.visible) {
      const pos = this.fireflyPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.fireflyCount; i++) {
        pos[i * 3] += Math.sin(time * 1.5 + i) * 0.04;
        pos[i * 3 + 1] += Math.cos(time * 2.0 + i) * 0.02;

        if (pos[i * 3 + 1] < 0.2) pos[i * 3 + 1] = 0.5;
        if (pos[i * 3 + 1] > 9.0) pos[i * 3 + 1] = 8.5;
      }
      this.fireflyPoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
