// Car.js - Stylized 90s Sports Coupe with Smooth Physics, Pop-up Headlights, Neon Underglow, & Soft Respawn
import * as THREE from 'three';

export class Car {
  constructor(scene, roadSystem, soundManager) {
    this.scene = scene;
    this.roadSystem = roadSystem;
    this.soundManager = soundManager;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Dynamic Physics & State
    this.speed = 0; // current speed in m/s (1 m/s ~= 3.6 km/h)
    this.targetSpeed = 0;
    this.cruiseSpeed = 26; // ~95 km/h default cruise speed
    this.maxSpeed = 44; // ~160 km/h
    this.minSpeed = 0;
    this.acceleration = 12; // m/s^2
    this.braking = 22; // m/s^2
    this.drag = 0.985;

    // Lateral Position on road (relative to road center)
    // Road width is 26, lanes are at -8.25, -2.75, +2.75, +8.25
    this.lateralOffset = 2.75; // starts in right-center cruising lane
    this.lateralVelocity = 0;
    this.steerAngle = 0;
    this.maxSteerAngle = 0.45;
    this.steerSensitivity = 3.6;

    // World position along highway curve
    this.distanceTraveled = 0;
    this.z = 0;

    // Body Tilt / Suspension Dynamics
    this.bodyRoll = 0;
    this.bodyPitch = 0;
    this.suspensionBounce = 0;

    // Drifting
    this.isDrifting = false;
    this.driftAngle = 0;

    // Auto-Cruise
    this.autoCruise = false;
    this.cruiseTargetLane = 2.75;

    // Collision & Soft Respawn State
    this.isGhostMode = false;
    this.ghostTimer = 0;
    this.ghostDuration = 2.5; // seconds
    this.onSoftRespawn = null;

    // Wheels & Lights references
    this.wheels = [];
    this.frontWheelL = null;
    this.frontWheelR = null;
    this.taillightMat = null;
    this.brakeLightMat = null;
    this.underglowMat = null;
    this.headlightBeams = [];
    this.bodyMaterials = [];

    // Particles
    this.exhaustParticles = [];
    this.driftParticles = [];

    this.initCarModel();
    this.initLights();
    this.initExhaustParticles();

    // Start with gentle initial cruising speed
    this.speed = 18; // ~65 km/h
  }

  initCarModel() {
    this.carBodyGroup = new THREE.Group();
    this.group.add(this.carBodyGroup);

    // Colors: Retro Japanese Sports Coupe (Twilight Dark Purple-Grey with Teal accents)
    this.paintMat = new THREE.MeshStandardMaterial({
      color: 0x221c35,
      roughness: 0.25,
      metalness: 0.7,
      flatShading: true
    });
    this.bodyMaterials.push(this.paintMat);

    this.accentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.3,
      roughness: 0.3
    });
    this.bodyMaterials.push(this.accentMat);

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.85
    });
    this.bodyMaterials.push(this.glassMat);

    this.blackTrimMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.7
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.45, 4.4);
    chassisGeo.translate(0, 0.45, 0);
    const chassis = new THREE.Mesh(chassisGeo, this.paintMat);
    this.carBodyGroup.add(chassis);

    // 2. Cabin / Greenhouse
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.55, 2.3);
    cabinGeo.translate(0, 0.95, -0.2);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    this.carBodyGroup.add(cabin);

    // Roof panel
    const roofGeo = new THREE.BoxGeometry(1.68, 0.08, 1.8);
    roofGeo.translate(0, 1.25, -0.2);
    const roof = new THREE.Mesh(roofGeo, this.paintMat);
    this.carBodyGroup.add(roof);

    // Front Hood Slope
    const hoodGeo = new THREE.BoxGeometry(1.95, 0.22, 1.3);
    hoodGeo.translate(0, 0.65, -1.5);
    const hood = new THREE.Mesh(hoodGeo, this.paintMat);
    hood.rotation.x = 0.08;
    this.carBodyGroup.add(hood);

    // Rear Hatch Slope
    const trunkGeo = new THREE.BoxGeometry(1.95, 0.22, 1.1);
    trunkGeo.translate(0, 0.68, 1.55);
    const trunk = new THREE.Mesh(trunkGeo, this.paintMat);
    trunk.rotation.x = -0.05;
    this.carBodyGroup.add(trunk);

    // Rear Aerodynamic Spoiler
    const wingGeo = new THREE.BoxGeometry(1.9, 0.08, 0.35);
    wingGeo.translate(0, 0.98, 2.05);
    const wing = new THREE.Mesh(wingGeo, this.paintMat);
    this.carBodyGroup.add(wing);

    const postGeo = new THREE.BoxGeometry(0.08, 0.25, 0.12);
    const postL = new THREE.Mesh(postGeo, this.paintMat);
    postL.position.set(-0.7, 0.85, 2.05);
    this.carBodyGroup.add(postL);

    const postR = new THREE.Mesh(postGeo, this.paintMat);
    postR.position.set(0.7, 0.85, 2.05);
    this.carBodyGroup.add(postR);

    // Pop-up Headlight Pods (80s/90s iconic flip-ups)
    const popGeo = new THREE.BoxGeometry(0.42, 0.18, 0.32);
    popGeo.translate(0, 0.82, -1.9);

    const popL = new THREE.Mesh(popGeo, this.paintMat);
    popL.position.x = -0.65;
    this.carBodyGroup.add(popL);

    const popR = new THREE.Mesh(popGeo, this.paintMat);
    popR.position.x = 0.65;
    this.carBodyGroup.add(popR);

    // Glowing Pop-up Headlamp Faces
    const lampFaceGeo = new THREE.PlaneGeometry(0.36, 0.14);
    lampFaceGeo.rotateY(Math.PI);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    const lampL = new THREE.Mesh(lampFaceGeo, lampMat);
    lampL.position.set(-0.65, 0.82, -2.07);
    this.carBodyGroup.add(lampL);

    const lampR = new THREE.Mesh(lampFaceGeo, lampMat);
    lampR.position.set(0.65, 0.82, -2.07);
    this.carBodyGroup.add(lampR);

    // Rear Light Bar (Signature continuous 90s red neon strip)
    const rearBarGeo = new THREE.BoxGeometry(1.85, 0.16, 0.1);
    this.taillightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.95,
      roughness: 0.3
    });
    const rearBar = new THREE.Mesh(rearBarGeo, this.taillightMat);
    rearBar.position.set(0, 0.58, 2.22);
    this.carBodyGroup.add(rearBar);

    // Front & Rear Bumpers
    const bumperFGeo = new THREE.BoxGeometry(2.05, 0.28, 0.25);
    const bumperF = new THREE.Mesh(bumperFGeo, this.blackTrimMat);
    bumperF.position.set(0, 0.3, -2.18);
    this.carBodyGroup.add(bumperF);

    const bumperRGeo = new THREE.BoxGeometry(2.05, 0.28, 0.25);
    const bumperR = new THREE.Mesh(bumperRGeo, this.blackTrimMat);
    bumperR.position.set(0, 0.3, 2.18);
    this.carBodyGroup.add(bumperR);

    // Dual Chrome Exhaust Pipes
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    const exhaustL = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustL.position.set(-0.6, 0.22, 2.26);
    this.carBodyGroup.add(exhaustL);

    const exhaustR = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustR.position.set(-0.4, 0.22, 2.26);
    this.carBodyGroup.add(exhaustR);

    // 4 Stylized Wheels with Alloy Rims
    this.initWheels();
  }

  initWheels() {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.2
    });

    const wheelRadius = 0.38;
    const wheelWidth = 0.28;

    const createWheel = () => {
      const wGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 14);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      wGroup.add(tire);

      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 10);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wGroup.add(rim);

      return wGroup;
    };

    const wheelOffsets = [
      { x: -0.98, y: wheelRadius, z: -1.35, isFront: true, isLeft: true },
      { x: 0.98, y: wheelRadius, z: -1.35, isFront: true, isLeft: false },
      { x: -0.98, y: wheelRadius, z: 1.45, isFront: false, isLeft: true },
      { x: 0.98, y: wheelRadius, z: 1.45, isFront: false, isLeft: false }
    ];

    wheelOffsets.forEach(cfg => {
      const wheel = createWheel();
      wheel.position.set(cfg.x, cfg.y, cfg.z);
      this.carBodyGroup.add(wheel);

      if (cfg.isFront) {
        if (cfg.isLeft) this.frontWheelL = wheel;
        else this.frontWheelR = wheel;
      }
      this.wheels.push(wheel);
    });
  }

  initLights() {
    // 1. Headlight Light Beams (Volumetric glowing cones shining on road ahead)
    const coneGeo = new THREE.ConeGeometry(3.5, 35, 12, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, -17.5);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const beamL = new THREE.Mesh(coneGeo, beamMat);
    beamL.position.set(-0.65, 0.8, -2.0);
    this.carBodyGroup.add(beamL);
    this.headlightBeams.push(beamL);

    const beamR = new THREE.Mesh(coneGeo, beamMat);
    beamR.position.set(0.65, 0.8, -2.0);
    this.carBodyGroup.add(beamR);
    this.headlightBeams.push(beamR);

    // 2. Soft Neon Underglow beneath the chassis
    const underglowCanvas = document.createElement('canvas');
    underglowCanvas.width = 128;
    underglowCanvas.height = 128;
    const uctx = underglowCanvas.getContext('2d');
    const ugrad = uctx.createRadialGradient(64, 64, 15, 64, 64, 60);
    ugrad.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
    ugrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.5)');
    ugrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    uctx.fillStyle = ugrad;
    uctx.fillRect(0, 0, 128, 128);

    const underglowTex = new THREE.CanvasTexture(underglowCanvas);
    const underglowGeo = new THREE.PlaneGeometry(3.6, 6.2);
    underglowGeo.rotateX(-Math.PI / 2);

    this.underglowMat = new THREE.MeshBasicMaterial({
      map: underglowTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const underglowMesh = new THREE.Mesh(underglowGeo, this.underglowMat);
    underglowMesh.position.set(0, 0.08, 0);
    this.carBodyGroup.add(underglowMesh);
  }

  initExhaustParticles() {
    this.particlePoolSize = 25;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.particlePoolSize * 3);

    for (let i = 0; i < this.particlePoolSize; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -100; // hidden initially
      pos[i * 3 + 2] = 0;
      this.exhaustParticles.push({
        active: false,
        life: 0,
        maxLife: 0.6,
        vx: 0,
        vy: 0,
        vz: 0
      });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.exhaustParticleMat = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.8,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    this.exhaustPoints = new THREE.Points(pGeo, this.exhaustParticleMat);
    this.scene.add(this.exhaustPoints);
  }

  // Soft Respawn Trigger (called when car bumps an obstacle or traffic car)
  triggerSoftRespawn(obstacleLane = 0) {
    if (this.isGhostMode) return; // already in ghost recovery

    this.isGhostMode = true;
    this.ghostTimer = this.ghostDuration;

    // Slow down smoothly to 13 m/s (~47 km/h) instead of resetting to 0
    this.speed = Math.max(10, this.speed * 0.55);

    // Softly slide away into neighboring open lane
    if (this.lateralOffset > 0) {
      this.lateralOffset = Math.max(1.5, this.lateralOffset - 3.5);
    } else {
      this.lateralOffset = Math.min(-1.5, this.lateralOffset + 3.5);
    }

    // Play ethereal chime
    if (this.soundManager) {
      this.soundManager.playRespawnChime();
    }

    if (this.onSoftRespawn) {
      this.onSoftRespawn();
    }
  }

  update(delta, input, trafficList = []) {
    // 1. Ghost mode recovery timer
    if (this.isGhostMode) {
      this.ghostTimer -= delta;

      // Ethereal glowing hologram flicker effect
      const flicker = 0.35 + Math.sin(performance.now() * 0.02) * 0.25;
      this.bodyMaterials.forEach(mat => {
        mat.transparent = true;
        mat.opacity = flicker;
      });

      if (this.ghostTimer <= 0) {
        this.isGhostMode = false;
        this.bodyMaterials.forEach(mat => {
          mat.transparent = (mat === this.glassMat);
          mat.opacity = (mat === this.glassMat ? 0.85 : 1.0);
        });
      }
    }

    // 2. Auto-Cruise Autonomous Driving Logic
    if (this.autoCruise) {
      // Aim for comfortable cruising speed (~95 km/h = 26 m/s)
      const targetCruiseSpeed = 26.0;

      // Sense traffic ahead
      let leaderCar = null;
      let minDistance = 999;
      trafficList.forEach(t => {
        const dz = t.z - this.z;
        if (dz < 0 && dz > -60 && Math.abs(t.lateralOffset - this.lateralOffset) < 3.0) {
          if (Math.abs(dz) < minDistance) {
            minDistance = Math.abs(dz);
            leaderCar = t;
          }
        }
      });

      if (leaderCar) {
        if (minDistance < 25) {
          // Slow down or gently change lane to pass
          this.speed = Math.max(leaderCar.speed - 2, this.speed - this.braking * delta * 0.7);
          if (this.lateralOffset > 0) {
            this.cruiseTargetLane = -2.75; // change to other lane
          } else {
            this.cruiseTargetLane = 2.75;
          }
        }
      } else {
        // Smoothly accelerate to cruise speed
        if (this.speed < targetCruiseSpeed) {
          this.speed = Math.min(targetCruiseSpeed, this.speed + this.acceleration * delta * 0.6);
        } else if (this.speed > targetCruiseSpeed) {
          this.speed = Math.max(targetCruiseSpeed, this.speed - this.braking * delta * 0.4);
        }
      }

      // Smoothly steer towards target lane
      const laneDiff = this.cruiseTargetLane - this.lateralOffset;
      this.lateralOffset += laneDiff * delta * 1.8;
      this.steerAngle = -laneDiff * 0.08;
    } else {
      // Manual Player Input
      // Throttle & Brake
      if (input.forward) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
      } else if (input.backward) {
        this.speed = Math.max(this.minSpeed, this.speed - this.braking * delta);
        // Taillights flare red when braking
        if (this.taillightMat) this.taillightMat.emissiveIntensity = 2.4;
      } else {
        // Natural gentle coasting
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - 2.8 * delta);
        }
        if (this.taillightMat) this.taillightMat.emissiveIntensity = 0.95;
      }

      // Steering
      const steerInput = (input.left ? -1 : 0) + (input.right ? 1 : 0);
      const targetSteer = steerInput * this.maxSteerAngle;
      this.steerAngle += (targetSteer - this.steerAngle) * delta * 8.0;

      // Lateral velocity scales with forward speed
      const speedFactor = Math.min(1.0, this.speed / 15);
      this.lateralVelocity = this.steerAngle * this.steerSensitivity * 5.5 * speedFactor;
      this.lateralOffset += this.lateralVelocity * delta;

      // Keep within highway bounds with soft bumper cushions
      const maxRoadOffset = (this.roadSystem.roadWidth * 0.5) - 2.0;
      if (Math.abs(this.lateralOffset) > maxRoadOffset) {
        this.lateralOffset = Math.sign(this.lateralOffset) * maxRoadOffset;
        this.lateralVelocity = 0;
        this.triggerSoftRespawn();
      }
    }

    // 3. Forward Movement along infinite highway
    this.distanceTraveled += this.speed * delta;
    this.z -= this.speed * delta; // moving negative Z forward

    // 4. Sample highway road curve at current Z
    const roadX = this.roadSystem.getRoadCenterX(this.z);
    const roadY = this.roadSystem.getRoadCenterY(this.z);
    const roadAngle = this.roadSystem.getRoadAngle(this.z);

    // Calculate actual car position perpendicular to road tangent
    const carX = roadX + Math.cos(roadAngle) * this.lateralOffset;
    const carY = roadY;
    const carZ = this.z + Math.sin(roadAngle) * this.lateralOffset;

    this.group.position.set(carX, carY, carZ);

    // 5. Dynamic Body Physics (Roll, Pitch, Suspension)
    // Roll tilts car chassis into curves and steering
    const targetRoll = this.steerAngle * 0.22 + (this.lateralVelocity * 0.04);
    this.bodyRoll += (targetRoll - this.bodyRoll) * delta * 7.0;

    // Pitch tilts nose down under hard braking, up under acceleration
    let targetPitch = 0;
    if (input.backward) targetPitch = 0.05;
    else if (input.forward) targetPitch = -0.04;
    this.bodyPitch += (targetPitch - this.bodyPitch) * delta * 6.0;

    // Subtle gentle highway suspension micro-bounce
    this.suspensionBounce = Math.sin(performance.now() * 0.008 * (this.speed / 10 + 0.5)) * 0.015;

    // Apply orientation
    this.group.rotation.y = roadAngle - this.steerAngle * 0.4;
    this.carBodyGroup.rotation.z = -this.bodyRoll;
    this.carBodyGroup.rotation.x = this.bodyPitch;
    this.carBodyGroup.position.y = this.suspensionBounce;

    // Front wheels turn with steering
    if (this.frontWheelL && this.frontWheelR) {
      this.frontWheelL.rotation.y = -this.steerAngle * 1.2;
      this.frontWheelR.rotation.y = -this.steerAngle * 1.2;
    }

    // Spin all 4 wheels based on speed
    const wheelSpin = (this.speed / 0.38) * delta;
    this.wheels.forEach(w => {
      w.rotation.x += wheelSpin;
    });

    // 6. Sound Engine Sync
    if (this.soundManager) {
      this.soundManager.updateEngineSound(this.getSpeedKmH());
    }

    // 7. Exhaust particles
    this.updateExhaustParticles(delta, carX, carY, carZ, roadAngle);
  }

  updateExhaustParticles(delta, x, y, z, angle) {
    if (!this.exhaustPoints) return;
    const pos = this.exhaustPoints.geometry.attributes.position.array;

    // Emit new particle every few frames if moving
    if (this.speed > 2 && Math.random() < 0.4) {
      // Find inactive particle
      const p = this.exhaustParticles.find(pt => !pt.active);
      if (p) {
        p.active = true;
        p.life = 0;
        p.maxLife = 0.4 + Math.random() * 0.3;

        // Position at exhaust pipe
        p.x = x - Math.sin(angle) * 2.2 + (Math.random() - 0.5) * 0.2;
        p.y = y + 0.25;
        p.z = z + Math.cos(angle) * 2.2;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = 0.4 + Math.random() * 0.4;
        p.vz = 2.0 + Math.random() * 1.5;
      }
    }

    // Update active particles
    this.exhaustParticles.forEach((p, idx) => {
      if (p.active) {
        p.life += delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;

        pos[idx * 3] = p.x;
        pos[idx * 3 + 1] = p.y;
        pos[idx * 3 + 2] = p.z;

        if (p.life >= p.maxLife) {
          p.active = false;
          pos[idx * 3 + 1] = -100; // hide
        }
      }
    });

    this.exhaustPoints.geometry.attributes.position.needsUpdate = true;
  }

  getSpeedKmH() {
    return Math.round(this.speed * 3.6);
  }

  getSpeedMph() {
    return Math.round(this.speed * 2.237);
  }
}
