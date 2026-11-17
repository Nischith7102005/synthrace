// Traffic.js - Ambient Night Cruising Vehicles (Sedans, Vans, Hatchbacks) with Headlights & Taillights
import * as THREE from 'three';

export class Traffic {
  constructor(scene, roadSystem) {
    this.scene = scene;
    this.roadSystem = roadSystem;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.vehicles = [];
    this.poolSize = 14;

    // Available highway lanes
    // Center divider at 0; Lanes: Far Left (-8.25), Inner Left (-2.75), Inner Right (+2.75), Far Right (+8.25)
    this.lanes = [-8.25, -2.75, 2.75, 8.25];

    this.initSharedMaterials();
    this.initVehiclePool();
  }

  initSharedMaterials() {
    this.colors = [
      0x3b82f6, // royal blue
      0xef4444, // crimson
      0x10b981, // emerald
      0xf59e0b, // amber
      0x8b5cf6, // violet
      0xe2e8f0, // pearl white
      0x334155  // slate
    ];

    this.carMaterials = this.colors.map(col =>
      new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.35,
        metalness: 0.5,
        flatShading: true
      })
    );

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8
    });

    this.wheelMat = new THREE.MeshStandardMaterial({
      color: 0x090a0f,
      roughness: 0.8
    });

    this.headlightMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    this.taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.turnSignalMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  }

  initVehiclePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const type = i % 3; // 0: Sedan, 1: Delivery Van, 2: Hatchback
      const v = this.createVehicleMesh(type, i);

      const lane = this.lanes[i % this.lanes.length];
      const z = - (120 + i * 45 + Math.random() * 20);
      const speed = 15 + Math.random() * 6; // 54 - 75 km/h gentle cruise

      v.userData = {
        type,
        lateralOffset: lane,
        targetOffset: lane,
        z,
        speed,
        laneTimer: Math.random() * 15,
        isChangingLane: false,
        length: type === 1 ? 4.8 : 4.2,
        width: 2.0
      };

      this.positionVehicle(v, z, lane);
      this.group.add(v);
      this.vehicles.push(v);
    }
  }

  createVehicleMesh(type, colorIdx) {
    const vGroup = new THREE.Group();
    const bodyMat = this.carMaterials[colorIdx % this.carMaterials.length];

    if (type === 1) {
      // Delivery Van (Iconic Japanese Retro Hauler)
      const vanBodyGeo = new THREE.BoxGeometry(2.1, 1.8, 4.6);
      vanBodyGeo.translate(0, 1.1, 0);
      const vanMesh = new THREE.Mesh(vanBodyGeo, bodyMat);
      vGroup.add(vanMesh);

      // Windshield
      const winGeo = new THREE.PlaneGeometry(1.8, 0.7);
      winGeo.rotateY(Math.PI);
      const win = new THREE.Mesh(winGeo, this.glassMat);
      win.position.set(0, 1.35, -2.32);
      vGroup.add(win);
    } else {
      // Sedan or Hatchback
      const lowerGeo = new THREE.BoxGeometry(2.0, 0.5, 4.2);
      lowerGeo.translate(0, 0.45, 0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      vGroup.add(lower);

      const cabinLength = (type === 0) ? 2.2 : 2.5;
      const cabinZ = (type === 0) ? -0.1 : 0.1;
      const cabinGeo = new THREE.BoxGeometry(1.65, 0.55, cabinLength);
      cabinGeo.translate(0, 0.95, cabinZ);
      const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
      vGroup.add(cabin);
    }

    // Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.16, 0.05);
    const hlL = new THREE.Mesh(hlGeo, this.headlightMat);
    hlL.position.set(-0.65, 0.55, -2.15);
    vGroup.add(hlL);

    const hlR = new THREE.Mesh(hlGeo, this.headlightMat);
    hlR.position.set(0.65, 0.55, -2.15);
    vGroup.add(hlR);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(0.4, 0.16, 0.05);
    const tlL = new THREE.Mesh(tlGeo, this.taillightMat);
    tlL.position.set(-0.65, 0.55, 2.15);
    vGroup.add(tlL);

    const tlR = new THREE.Mesh(tlGeo, this.taillightMat);
    tlR.position.set(0.65, 0.55, 2.15);
    vGroup.add(tlR);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
    wGeo.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [-0.95, 0.35, -1.3],
      [0.95, 0.35, -1.3],
      [-0.95, 0.35, 1.3],
      [0.95, 0.35, 1.3]
    ];
    wheelPositions.forEach(p => {
      const w = new THREE.Mesh(wGeo, this.wheelMat);
      w.position.set(p[0], p[1], p[2]);
      vGroup.add(w);
    });

    return vGroup;
  }

  positionVehicle(v, z, lateralOffset) {
    const rx = this.roadSystem.getRoadCenterX(z);
    const ry = this.roadSystem.getRoadCenterY(z);
    const angle = this.roadSystem.getRoadAngle(z);

    v.position.set(
      rx + Math.cos(angle) * lateralOffset,
      ry,
      z + Math.sin(angle) * lateralOffset
    );
    v.rotation.y = angle;
  }

  update(delta, playerCar) {
    const playerZ = playerCar.z;

    this.vehicles.forEach(v => {
      const u = v.userData;

      // 1. Move forward
      u.z -= u.speed * delta;

      // 2. Gentle lane change AI
      u.laneTimer += delta;
      if (u.laneTimer > 18) {
        u.laneTimer = 0;
        if (Math.random() > 0.6) {
          // Pick adjacent lane
          const currentIdx = this.lanes.indexOf(u.targetOffset);
          const dir = Math.random() > 0.5 ? 1 : -1;
          const nextIdx = Math.max(0, Math.min(this.lanes.length - 1, currentIdx + dir));
          u.targetOffset = this.lanes[nextIdx];
        }
      }

      // Smoothly interpolate lateral position
      u.lateralOffset += (u.targetOffset - u.lateralOffset) * delta * 1.2;

      // Position along road
      this.positionVehicle(v, u.z, u.lateralOffset);

      // 3. Collision Detection with Player Car
      if (!playerCar.isGhostMode) {
        const dz = Math.abs(u.z - playerZ);
        const dx = Math.abs(u.lateralOffset - playerCar.lateralOffset);

        // Bounding box overlap test
        if (dz < 3.8 && dx < 1.8) {
          // BUMP! Trigger soft respawn
          playerCar.triggerSoftRespawn(u.lateralOffset);
        }
      }

      // 4. Recycle vehicle when far behind player or excessively far ahead
      if (u.z - playerZ > 60) {
        // Vehicle is behind player, respawn far ahead
        let minZ = playerZ;
        this.vehicles.forEach(other => {
          if (other.userData.z < minZ) minZ = other.userData.z;
        });

        u.z = Math.min(playerZ - 250, minZ - (40 + Math.random() * 30));
        u.lateralOffset = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        u.targetOffset = u.lateralOffset;
        u.speed = 16 + Math.random() * 7;
        this.positionVehicle(v, u.z, u.lateralOffset);
      }
    });
  }

  getVehicles() {
    return this.vehicles.map(v => v.userData);
  }
}
