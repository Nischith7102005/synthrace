// FlyingCreatures.js - Majestic Celestial Sky Whales, Spirit Manta Rays, and Luminous Birds in the Night Sky
import * as THREE from 'three';

export class FlyingCreatures {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.whales = [];
    this.rays = [];
    this.birds = [];
    this.jellyfish = [];
    this.starTrails = [];

    this.initWhales();
    this.initMantaRays();
    this.initSpiritBirds();
    this.initJellyfish();
  }

  // 1. Celestial Bioluminescent Sky Whale
  initWhales() {
    // We create 2 celestial whales at different altitudes and paths
    const whaleData = [
      { startZ: -250, startY: 95, startX: -60, scale: 1.8, speed: 0.12, phase: 0 },
      { startZ: -700, startY: 140, startX: 90, scale: 2.4, speed: 0.08, phase: 2.5 }
    ];

    whaleData.forEach((data, index) => {
      const whale = this.createWhaleMesh(data.scale);
      whale.position.set(data.startX, data.startY, data.startZ);
      // Merge path data into userData (createWhaleMesh already stored segments/fins there)
      Object.assign(whale.userData, {
        baseX: data.startX,
        baseY: data.startY,
        baseZ: data.startZ,
        speed: data.speed,
        phase: data.phase,
        index: index,
        swimmingAngle: 0
      });
      this.group.add(whale);
      this.whales.push(whale);
    });
  }

  createWhaleMesh(scale = 1.0) {
    const whaleGroup = new THREE.Group();

    // Body segments for smooth articulation
    const bodySegments = 6;
    const segments = [];
    const segmentRadius = [4.2, 5.0, 4.8, 3.8, 2.6, 1.4];
    const segmentLengths = [6.0, 7.0, 6.5, 6.0, 5.5, 5.0];

    // Low-poly aesthetic materials with glowing bioluminescent shaders
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0x141a2e,
      roughness: 0.35,
      metalness: 0.2,
      flatShading: true
    });

    const glowBellyMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      flatShading: true
    });

    const finMaterial = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
      side: THREE.DoubleSide
    });

    let currentZ = 0;
    for (let i = 0; i < bodySegments; i++) {
      const segGroup = new THREE.Group();
      const radius = segmentRadius[i] * scale;
      const length = segmentLengths[i] * scale;

      // Upper body
      const topGeo = new THREE.CylinderGeometry(
        radius * 0.9, radius, length, 8, 1, false, 0, Math.PI
      );
      topGeo.rotateX(Math.PI / 2);
      const topMesh = new THREE.Mesh(topGeo, skinMaterial);
      segGroup.add(topMesh);

      // Bioluminescent glowing belly
      const bellyGeo = new THREE.CylinderGeometry(
        radius * 0.9, radius, length, 8, 1, false, Math.PI, Math.PI
      );
      bellyGeo.rotateX(Math.PI / 2);
      const bellyMesh = new THREE.Mesh(bellyGeo, glowBellyMaterial);
      segGroup.add(bellyMesh);

      segGroup.position.z = currentZ;
      currentZ -= length;
      whaleGroup.add(segGroup);
      segments.push(segGroup);
    }

    // Pectoral Fins (Left & Right)
    const leftFinGroup = new THREE.Group();
    const rightFinGroup = new THREE.Group();

    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(-12 * scale, -2 * scale);
    finShape.quadraticCurveTo(-14 * scale, -7 * scale, -6 * scale, -8 * scale);
    finShape.lineTo(0, -3 * scale);
    finShape.closePath();

    const finGeo = new THREE.ShapeGeometry(finShape);

    const leftFin = new THREE.Mesh(finGeo, finMaterial);
    leftFin.rotation.x = Math.PI / 2;
    leftFin.position.set(-segmentRadius[1] * scale * 0.8, -1.0 * scale, -segmentLengths[0] * scale * 0.5);
    leftFinGroup.add(leftFin);

    const rightFin = new THREE.Mesh(finGeo, finMaterial);
    rightFin.rotation.x = Math.PI / 2;
    rightFin.rotation.y = Math.PI;
    rightFin.position.set(segmentRadius[1] * scale * 0.8, -1.0 * scale, -segmentLengths[0] * scale * 0.5);
    rightFinGroup.add(rightFin);

    whaleGroup.add(leftFinGroup);
    whaleGroup.add(rightFinGroup);

    // Fluke (Tail fin)
    const flukeGroup = new THREE.Group();
    const flukeShape = new THREE.Shape();
    flukeShape.moveTo(0, 0);
    flukeShape.lineTo(-10 * scale, -6 * scale);
    flukeShape.quadraticCurveTo(-8 * scale, -10 * scale, 0, -8 * scale);
    flukeShape.quadraticCurveTo(8 * scale, -10 * scale, 10 * scale, -6 * scale);
    flukeShape.lineTo(0, 0);
    flukeShape.closePath();

    const flukeGeo = new THREE.ShapeGeometry(flukeShape);
    const flukeMesh = new THREE.Mesh(flukeGeo, finMaterial);
    flukeMesh.rotation.x = Math.PI / 2;
    flukeGroup.add(flukeMesh);

    flukeGroup.position.z = currentZ;
    whaleGroup.add(flukeGroup);

    // Star Trail Particle Emitter behind whale
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6 * scale;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4 * scale;
      positions[i * 3 + 2] = currentZ - Math.random() * 30 * scale;

      // Pastel cyan to purple star colors
      const t = Math.random();
      colors[i * 3] = 0.3 + 0.6 * t;
      colors[i * 3 + 1] = 0.6 + 0.3 * (1 - t);
      colors[i * 3 + 2] = 1.0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 2.2 * scale,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const starParticles = new THREE.Points(particleGeo, particleMat);
    whaleGroup.add(starParticles);

    whaleGroup.userData = {
      segments,
      leftFinGroup,
      rightFinGroup,
      flukeGroup,
      starParticles,
      scale
    };

    return whaleGroup;
  }

  // 2. Spirit Manta Rays
  initMantaRays() {
    const rayData = [
      { x: -75, y: 75, z: -350, scale: 1.5, speed: 0.22, phase: 1.2 },
      { x: -90, y: 82, z: -380, scale: 1.2, speed: 0.22, phase: 1.5 }, // escort pair
      { x: 80, y: 110, z: -550, scale: 1.8, speed: 0.18, phase: 3.1 }
    ];

    rayData.forEach((data, index) => {
      const ray = this.createMantaRayMesh(data.scale);
      ray.position.set(data.x, data.y, data.z);
      // Merge instead of replace: createMantaRayMesh stored rayMesh/tailLine in userData
      Object.assign(ray.userData, {
        baseX: data.x,
        baseY: data.y,
        baseZ: data.z,
        speed: data.speed,
        phase: data.phase,
        index
      });
      this.group.add(ray);
      this.rays.push(ray);
    });
  }

  createMantaRayMesh(scale = 1.0) {
    const rayGroup = new THREE.Group();

    // Body & Wings geometry
    const wingGeo = new THREE.BufferGeometry();
    const wingVerts = new Float32Array([
      // Central body triangle
      0, 0.4 * scale, 5 * scale,
      -8 * scale, 0, -3 * scale,
      8 * scale, 0, -3 * scale,

      0, 0.4 * scale, 5 * scale,
      8 * scale, 0, -3 * scale,
      0, -0.4 * scale, -5 * scale,

      0, 0.4 * scale, 5 * scale,
      0, -0.4 * scale, -5 * scale,
      -8 * scale, 0, -3 * scale,

      // Left wing tip
      -8 * scale, 0, -3 * scale,
      -18 * scale, 0.5 * scale, -1 * scale,
      -6 * scale, -0.2 * scale, -7 * scale,

      // Right wing tip
      8 * scale, 0, -3 * scale,
      6 * scale, -0.2 * scale, -7 * scale,
      18 * scale, 0.5 * scale, -1 * scale
    ]);

    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
    wingGeo.computeVertexNormals();

    const rayMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      side: THREE.DoubleSide,
      flatShading: true
    });

    const rayMesh = new THREE.Mesh(wingGeo, rayMat);
    rayGroup.add(rayMesh);

    // Whip Tail
    const tailPoints = [];
    for (let i = 0; i <= 8; i++) {
      tailPoints.push(new THREE.Vector3(0, 0, -5 * scale - i * 2.2 * scale));
    }
    const tailGeo = new THREE.BufferGeometry().setFromPoints(tailPoints);
    const tailMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      linewidth: 2,
      transparent: true,
      opacity: 0.7
    });
    const tailLine = new THREE.Line(tailGeo, tailMat);
    rayGroup.add(tailLine);

    rayGroup.userData = { rayMesh, tailLine, wingVerts, scale };
    return rayGroup;
  }

  // 3. Spirit Origami Birds / Cranes Flying in V-formation
  initSpiritBirds() {
    const flockCount = 7;
    const vOffsets = [
      { x: 0, y: 0, z: 0 },
      { x: -14, y: 2, z: -12 },
      { x: 14, y: -1, z: -12 },
      { x: -28, y: 4, z: -24 },
      { x: 28, y: 1, z: -24 },
      { x: -42, y: 5, z: -36 },
      { x: 42, y: 3, z: -36 },
    ];

    const birdGeo = new THREE.BufferGeometry();
    const birdVerts = new Float32Array([
      // Left wing
      0, 0, 2,
      -4.5, 1.2, 0,
      0, 0, -2,
      // Right wing
      0, 0, 2,
      0, 0, -2,
      4.5, 1.2, 0
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(birdVerts, 3));
    birdGeo.computeVertexNormals();

    const birdMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    const flockGroup = new THREE.Group();
    flockGroup.position.set(40, 115, -450);

    const birdMeshes = [];
    for (let i = 0; i < flockCount; i++) {
      const bird = new THREE.Mesh(birdGeo.clone(), birdMat);
      bird.position.set(vOffsets[i].x, vOffsets[i].y, vOffsets[i].z);
      bird.userData = { phase: i * 0.4 };
      flockGroup.add(bird);
      birdMeshes.push(bird);
    }

    flockGroup.userData = { birdMeshes, speed: 0.35, phase: 0 };
    this.group.add(flockGroup);
    this.birds.push(flockGroup);
  }

  // 4. Luminous Celestial Jellyfish
  initJellyfish() {
    const jellyData = [
      { x: 110, y: 80, z: -280, scale: 1.2, phase: 0.5 },
      { x: -120, y: 105, z: -420, scale: 1.6, phase: 2.1 },
      { x: 60, y: 95, z: -620, scale: 2.0, phase: 1.4 }
    ];

    jellyData.forEach(data => {
      const jelly = this.createJellyfishMesh(data.scale);
      jelly.position.set(data.x, data.y, data.z);
      // Merge instead of replace: createJellyfishMesh stored domeMesh/tentacles in userData
      Object.assign(jelly.userData, {
        baseX: data.x,
        baseY: data.y,
        baseZ: data.z,
        phase: data.phase,
        scale: data.scale
      });
      this.group.add(jelly);
      this.jellyfish.push(jelly);
    });
  }

  createJellyfishMesh(scale = 1.0) {
    const jellyGroup = new THREE.Group();

    // Translucent dome bell
    const domeGeo = new THREE.SphereGeometry(4 * scale, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.7,
      transparent: true,
      opacity: 0.75,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    jellyGroup.add(domeMesh);

    // Tentacles
    const tentacleCount = 6;
    const tentacles = [];
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const r = 2.8 * scale;
      const points = [];
      for (let j = 0; j <= 6; j++) {
        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          -j * 1.8 * scale,
          Math.sin(angle) * r
        ));
      }
      const tGeo = new THREE.BufferGeometry().setFromPoints(points);
      const tMat = new THREE.LineBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.65
      });
      const tLine = new THREE.Line(tGeo, tMat);
      jellyGroup.add(tLine);
      tentacles.push({ line: tLine, baseAngle: angle, baseR: r });
    }

    jellyGroup.userData = { domeMesh, tentacles, scale };
    return jellyGroup;
  }

  // Update animations every frame
  update(delta, playerZ) {
    const time = performance.now() * 0.001;

    // 1. Update Whales
    this.whales.forEach(whale => {
      const u = whale.userData;
      u.phase += delta * u.speed;

      // Slow majestic swimming path that stays in sky view of the car
      // We wrap Z relative to player car so they stay perpetually visible
      let relativeZ = (whale.position.z - playerZ);
      if (relativeZ > 100) {
        whale.position.z = playerZ - 900 - Math.random() * 200;
      }

      // Gentle serpentine swimming sway
      whale.position.x = u.baseX + Math.sin(u.phase * 0.6) * 45;
      whale.position.y = u.baseY + Math.cos(u.phase * 0.4) * 15;

      // Whale body articulation: undulate each segment
      const segs = u.segments;
      if (segs) {
        for (let i = 0; i < segs.length; i++) {
          const segPhase = u.phase * 1.4 - i * 0.45;
          segs[i].rotation.y = Math.sin(segPhase) * 0.12;
          segs[i].rotation.x = Math.cos(segPhase) * 0.08;
        }
      }

      // Pectoral fin rippling
      if (u.leftFinGroup && u.rightFinGroup) {
        const finWave = Math.sin(u.phase * 1.8) * 0.25;
        u.leftFinGroup.rotation.z = -finWave;
        u.rightFinGroup.rotation.z = finWave;
      }

      // Tail fluke flapping
      if (u.flukeGroup) {
        const tailFlap = Math.sin(u.phase * 1.4 - 2.5) * 0.35;
        u.flukeGroup.rotation.x = tailFlap;
      }

      // Gentle banking orientation along movement
      whale.rotation.y = Math.PI + Math.cos(u.phase * 0.6) * 0.25;
      whale.rotation.z = -Math.cos(u.phase * 0.6) * 0.1;
    });

    // 2. Update Manta Rays
    this.rays.forEach(ray => {
      const u = ray.userData;
      u.phase += delta * 0.8;

      let relativeZ = (ray.position.z - playerZ);
      if (relativeZ > 120) {
        ray.position.z = playerZ - 800 - Math.random() * 150;
      }

      ray.position.x = u.baseX + Math.sin(u.phase * 0.5) * 35;
      ray.position.y = u.baseY + Math.sin(u.phase * 0.3) * 10;

      // Wing flapping animation
      if (u.rayMesh) {
        const wingFlap = Math.sin(u.phase * 2.2);
        u.rayMesh.rotation.x = Math.sin(u.phase * 0.8) * 0.1;
        u.rayMesh.rotation.z = wingFlap * 0.15;
      }
    });

    // 3. Update Birds V-Flock
    this.birds.forEach(flock => {
      const u = flock.userData;
      u.phase += delta * 1.8;

      let relZ = flock.position.z - playerZ;
      if (relZ > 100) {
        flock.position.z = playerZ - 950;
      }

      flock.position.x += Math.sin(u.phase * 0.2) * 0.15;

      u.birdMeshes.forEach(bird => {
        const wingFlap = Math.sin(u.phase * 4.0 + bird.userData.phase);
        bird.rotation.x = wingFlap * 0.25;
        bird.rotation.z = wingFlap * 0.15;
      });
    });

    // 4. Update Jellyfish Pulsing
    this.jellyfish.forEach(jelly => {
      const u = jelly.userData;
      u.phase += delta * 1.1;

      let relZ = jelly.position.z - playerZ;
      if (relZ > 100) {
        jelly.position.z = playerZ - 850;
      }

      // Pulsing bell expansion/contraction
      const pulse = 1.0 + Math.sin(u.phase * 2.0) * 0.15;
      const verticalPulse = 1.0 - Math.sin(u.phase * 2.0) * 0.18;
      if (u.domeMesh) {
        u.domeMesh.scale.set(pulse, verticalPulse, pulse);
      }

      // Slow ethereal hover
      jelly.position.y = u.baseY + Math.sin(u.phase * 0.8) * 8;
    });
  }
}
