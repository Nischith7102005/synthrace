// Biomes.js - Dynamic Changing Sceneries: Neo-Tokyo, Sakura Night, Ocean Coast, Pine Aurora & Crystal Canyon
import * as THREE from 'three';

export class Biomes {
  constructor(scene, roadSystem) {
    this.scene = scene;
    this.roadSystem = roadSystem;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Biome definitions
    this.biomeList = [
      { id: 'neotokyo', name: 'Neo-Tokyo Midnight', fog: 0x110f24, light: 0xa855f7, ambient: 0x1e1b4b, moon: 0xf472b6 },
      { id: 'sakura', name: 'Sakura Night', fog: 0x1f0e24, light: 0xf43f5e, ambient: 0x3b0764, moon: 0xfda4af },
      { id: 'coastal', name: 'Coastal Breeze', fog: 0x081e2b, light: 0x06b6d4, ambient: 0x0c4a6e, moon: 0x7dd3fc },
      { id: 'aurora', name: 'Misty Pine Aurora', fog: 0x091c1b, light: 0x10b981, ambient: 0x064e3b, moon: 0x6ee7b7 },
      { id: 'crystal', name: 'Celestial Dreamscape', fog: 0x180b29, light: 0xec4899, ambient: 0x2e1065, moon: 0xe879f9 }
    ];

    this.currentBiomeIndex = 0;
    this.targetBiomeIndex = 0;
    this.transitionProgress = 1.0; // 0 to 1
    this.transitionSpeed = 0.4; // seconds to blend

    this.autoCycleTime = 75; // seconds per scenery
    this.autoCycleTimer = 0;
    this.autoCycleEnabled = true;

    // Scenery object pools
    this.cityBuildings = [];
    this.sakuraTrees = [];
    this.toriiGates = [];
    this.palmTrees = [];
    this.oceanMesh = null;
    this.lighthouse = null;
    this.pineTrees = [];
    this.auroraRibbons = [];
    this.crystalClusters = [];
    this.fallingPetals = null;

    // Shared Materials
    this.initSharedMaterials();
    this.initCelestialSky();
    this.initCityBuildings();
    this.initSakuraElements();
    this.initCoastalElements();
    this.initPineAuroraElements();
    this.initCrystalElements();
    this.initSakuraPetals();

    this.tempColor1 = new THREE.Color();
    this.tempColor2 = new THREE.Color();
    this.blendedFogColor = new THREE.Color();

    this.applyBiomeInstant(0);
  }

  initSharedMaterials() {
    // City building materials
    this.buildingMat = new THREE.MeshStandardMaterial({
      color: 0x121420,
      roughness: 0.5,
      metalness: 0.3
    });

    // Window canvas texture with warm lofi glowing windows
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 128;
    winCanvas.height = 256;
    const wctx = winCanvas.getContext('2d');
    wctx.fillStyle = '#10121d';
    wctx.fillRect(0, 0, 128, 256);

    // Draw grid of warm lit windows
    for (let y = 8; y < 250; y += 14) {
      for (let x = 6; x < 122; x += 12) {
        if (Math.random() > 0.4) {
          const colors = ['#fde047', '#fb923c', '#38bdf8', '#f472b6', '#a78bfa'];
          wctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          wctx.fillRect(x, y, 7, 9);
        }
      }
    }

    this.windowTex = new THREE.CanvasTexture(winCanvas);
    this.windowTex.colorSpace = THREE.SRGBColorSpace;
    this.windowTex.wrapS = THREE.RepeatWrapping;
    this.windowTex.wrapT = THREE.RepeatWrapping;
    this.windowTex.repeat.set(2, 6);

    this.buildingWindowMat = new THREE.MeshBasicMaterial({
      map: this.windowTex
    });

    // Foliage materials
    this.trunkMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.9 });
    this.sakuraMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 0.45,
      roughness: 0.6,
      flatShading: true
    });
    this.pineMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: 0x022c22,
      emissiveIntensity: 0.3,
      roughness: 0.8,
      flatShading: true
    });
    this.palmFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    // Torii Gate material
    this.toriiMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4,
      roughness: 0.4
    });

    // Crystal Material
    this.crystalMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.4,
      flatShading: true
    });
  }

  // Giant glowing moon & celestial star dome
  initCelestialSky() {
    this.skyGroup = new THREE.Group();
    this.group.add(this.skyGroup);

    // Textured lunar sphere: soft crater relief reads much better than a flat disc at distance.
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 512;
    moonCanvas.height = 256;
    const moonCtx = moonCanvas.getContext('2d');
    const moonGradient = moonCtx.createLinearGradient(0, 0, 0, moonCanvas.height);
    moonGradient.addColorStop(0, '#d9d9ce');
    moonGradient.addColorStop(0.5, '#c9cbbf');
    moonGradient.addColorStop(1, '#a9b0aa');
    moonCtx.fillStyle = moonGradient;
    moonCtx.fillRect(0, 0, moonCanvas.width, moonCanvas.height);
    for (let i = 0; i < 42; i++) {
      const x = (i * 137.5 + 29) % moonCanvas.width;
      const y = 22 + ((i * 73) % 210);
      const radius = 4 + ((i * 19) % 16);
      const crater = moonCtx.createRadialGradient(x - radius * 0.28, y - radius * 0.28, 1, x, y, radius);
      crater.addColorStop(0, 'rgba(246, 245, 229, 0.42)');
      crater.addColorStop(0.56, 'rgba(189, 194, 185, 0.22)');
      crater.addColorStop(1, 'rgba(89, 101, 99, 0.18)');
      moonCtx.fillStyle = crater;
      moonCtx.beginPath();
      moonCtx.arc(x, y, radius, 0, Math.PI * 2);
      moonCtx.fill();
    }
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.colorSpace = THREE.SRGBColorSpace;
    this.moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      color: 0xf0eee0,
      transparent: true,
      opacity: 0.96
    });
    const moonGeo = new THREE.SphereGeometry(48, 48, 32);
    this.moonMesh = new THREE.Mesh(moonGeo, this.moonMat);
    this.moonMesh.position.set(120, 150, -850);
    this.skyGroup.add(this.moonMesh);

    // Moon Glow Halo (soft radial aura)
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 256;
    haloCanvas.height = 256;
    const hctx = haloCanvas.getContext('2d');
    const grad = hctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    grad.addColorStop(0, 'rgba(244, 114, 182, 0.4)');
    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;
    const haloGeo = new THREE.PlaneGeometry(160, 160);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(120, 150, -855);
    this.skyGroup.add(haloMesh);

    // Stars Field (350 twinkling stars)
    const starCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.45; // upper hemisphere
      const dist = 900;

      starPos[i * 3] = dist * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 1] = dist * Math.cos(phi) + 50;
      starPos[i * 3 + 2] = -Math.abs(dist * Math.sin(phi) * Math.cos(theta));

      const col = Math.random() > 0.4 ? [0.95, 0.95, 1.0] : [0.9, 0.7, 1.0];
      starColors[i * 3] = col[0];
      starColors[i * 3 + 1] = col[1];
      starColors[i * 3 + 2] = col[2];
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.skyGroup.add(this.starPoints);

    // Mount Fuji Silhouette in distance
    const fujiShape = new THREE.Shape();
    fujiShape.moveTo(-160, 0);
    fujiShape.lineTo(-30, 95);
    fujiShape.lineTo(30, 95);
    fujiShape.lineTo(160, 0);
    fujiShape.closePath();

    const fujiGeo = new THREE.ShapeGeometry(fujiShape);
    const fujiMat = new THREE.MeshBasicMaterial({
      color: 0x090a14,
      side: THREE.DoubleSide
    });
    this.fujiMesh = new THREE.Mesh(fujiGeo, fujiMat);
    this.fujiMesh.position.set(-80, 0, -820);
    this.skyGroup.add(this.fujiMesh);
  }

  // 1. Neo-Tokyo Skyscrapers & Neon Billboards
  initCityBuildings() {
    this.cityGroup = new THREE.Group();
    this.group.add(this.cityGroup);

    const numBuildings = 36;
    for (let i = 0; i < numBuildings; i++) {
      const bGroup = new THREE.Group();

      const width = 16 + Math.random() * 18;
      const height = 45 + Math.random() * 75;
      const depth = 16 + Math.random() * 20;

      const geo = new THREE.BoxGeometry(width, height, depth);
      const mesh = new THREE.Mesh(geo, this.buildingWindowMat);
      mesh.position.y = height * 0.5;
      bGroup.add(mesh);

      // Neon rooftop antenna or billboard
      if (Math.random() > 0.4) {
        const signGeo = new THREE.PlaneGeometry(8, 4);
        const signMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0xf43f5e : 0x06b6d4,
          side: THREE.DoubleSide
        });
        const signMesh = new THREE.Mesh(signGeo, signMat);
        signMesh.position.set(0, height + 2.5, 0);
        bGroup.add(signMesh);
      }

      const side = (i % 2 === 0) ? -1 : 1;
      const offsetDist = 32 + Math.random() * 45;
      const z = - (i * 35 + Math.random() * 15);

      bGroup.userData = { side, offsetDist, baseZ: z };
      this.positionSceneryObject(bGroup, z, offsetDist * side);

      this.cityGroup.add(bGroup);
      this.cityBuildings.push(bGroup);
    }
  }

  // 2. Sakura Trees & Torii Gates
  initSakuraElements() {
    this.sakuraGroup = new THREE.Group();
    this.group.add(this.sakuraGroup);

    // Sakura Trees
    const numTrees = 36;
    for (let i = 0; i < numTrees; i++) {
      const tGroup = new THREE.Group();

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 7, 5);
      trunkGeo.translate(0, 3.5, 0);
      const trunk = new THREE.Mesh(trunkGeo, this.trunkMat);
      tGroup.add(trunk);

      // Pink Sakura Canopy (cluster of 3 soft low-poly spheres)
      for (let j = 0; j < 3; j++) {
        const canopyGeo = new THREE.DodecahedronGeometry(3.5 + Math.random() * 1.5);
        const canopy = new THREE.Mesh(canopyGeo, this.sakuraMat);
        canopy.position.set(
          (Math.random() - 0.5) * 2.5,
          7.5 + j * 1.5,
          (Math.random() - 0.5) * 2.5
        );
        tGroup.add(canopy);
      }

      const side = (i % 2 === 0) ? -1 : 1;
      const offsetDist = 18 + Math.random() * 20;
      const z = - (i * 32);

      tGroup.userData = { side, offsetDist, baseZ: z };
      this.positionSceneryObject(tGroup, z, offsetDist * side);

      this.sakuraGroup.add(tGroup);
      this.sakuraTrees.push(tGroup);
    }

    // Torii Gates crossing over the highway
    const numTorii = 4;
    for (let i = 0; i < numTorii; i++) {
      const toriiGroup = new THREE.Group();
      const span = this.roadSystem.roadWidth + 4;
      const height = 11;

      // Pillars
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, height, 8), this.toriiMat);
      p1.position.set(-span * 0.5, height * 0.5, 0);
      toriiGroup.add(p1);

      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, height, 8), this.toriiMat);
      p2.position.set(span * 0.5, height * 0.5, 0);
      toriiGroup.add(p2);

      // Upper Lintels (Kasagi)
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(span + 5, 0.9, 1.2), this.toriiMat);
      topBeam.position.set(0, height + 0.4, 0);
      toriiGroup.add(topBeam);

      const midBeam = new THREE.Mesh(new THREE.BoxGeometry(span + 1, 0.6, 0.8), this.toriiMat);
      midBeam.position.set(0, height - 1.6, 0);
      toriiGroup.add(midBeam);

      const z = - (i * 260 + 120);
      toriiGroup.userData = { baseZ: z };
      this.positionSceneryObject(toriiGroup, z, 0);

      this.sakuraGroup.add(toriiGroup);
      this.toriiGates.push(toriiGroup);
    }
  }

  // 3. Coastal Highway & Lighthouse
  initCoastalElements() {
    this.coastalGroup = new THREE.Group();
    this.group.add(this.coastalGroup);

    // Ocean Surface Plane on right side
    const oceanGeo = new THREE.PlaneGeometry(350, 1400, 20, 20);
    oceanGeo.rotateX(-Math.PI / 2);
    this.oceanMat = new THREE.MeshStandardMaterial({
      color: 0x072635,
      roughness: 0.15,
      metalness: 0.65,
      flatShading: true
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMat);
    this.oceanMesh.position.set(190, -1.5, -600);
    this.coastalGroup.add(this.oceanMesh);

    // Palm Trees along coastal shoulder
    const numPalms = 28;
    for (let i = 0; i < numPalms; i++) {
      const pGroup = new THREE.Group();

      // Slanted curved trunk
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 10, 6);
      trunkGeo.translate(0, 5, 0);
      const trunk = new THREE.Mesh(trunkGeo, this.trunkMat);
      trunk.rotation.z = (Math.random() - 0.5) * 0.3;
      pGroup.add(trunk);

      // Fronds
      for (let f = 0; f < 6; f++) {
        const frondAngle = (f / 6) * Math.PI * 2;
        const frondGeo = new THREE.PlaneGeometry(1.2, 5.5);
        frondGeo.translate(0, 2.7, 0);
        const frond = new THREE.Mesh(frondGeo, this.palmFoliageMat);
        frond.position.set(0, 10, 0);
        frond.rotation.y = frondAngle;
        frond.rotation.x = 0.8;
        pGroup.add(frond);
      }

      const offsetDist = 18 + Math.random() * 8;
      const z = - (i * 38);

      pGroup.userData = { side: 1, offsetDist, baseZ: z };
      this.positionSceneryObject(pGroup, z, offsetDist);

      this.coastalGroup.add(pGroup);
      this.palmTrees.push(pGroup);
    }

    // Lighthouse with rotating light beam
    this.lighthouseGroup = new THREE.Group();
    const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 4.5, 26, 8), this.toriiMat);
    lhBase.position.y = 13;
    this.lighthouseGroup.add(lhBase);

    // Rotating lantern beam
    const beamGeo = new THREE.ConeGeometry(80, 260, 12, 1, true);
    beamGeo.rotateX(-Math.PI / 2);
    beamGeo.translate(0, 0, -130);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.lighthouseBeam = new THREE.Mesh(beamGeo, beamMat);
    this.lighthouseBeam.position.set(0, 26, 0);
    this.lighthouseGroup.add(this.lighthouseBeam);

    this.lighthouseGroup.position.set(220, 0, -450);
    this.coastalGroup.add(this.lighthouseGroup);
  }

  // 4. Pine Forest & Aurora Borealis
  initPineAuroraElements() {
    this.pineGroup = new THREE.Group();
    this.group.add(this.pineGroup);

    const numPines = 40;
    for (let i = 0; i < numPines; i++) {
      const pGroup = new THREE.Group();

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4, 5), this.trunkMat);
      trunk.position.y = 2;
      pGroup.add(trunk);

      // 3 Tiers of Cones
      for (let c = 0; c < 3; c++) {
        const coneGeo = new THREE.ConeGeometry(3.5 - c * 0.8, 4.5, 6);
        const cone = new THREE.Mesh(coneGeo, this.pineMat);
        cone.position.y = 4.5 + c * 2.8;
        pGroup.add(cone);
      }

      const side = (i % 2 === 0) ? -1 : 1;
      const offsetDist = 18 + Math.random() * 30;
      const z = - (i * 30);

      pGroup.userData = { side, offsetDist, baseZ: z };
      this.positionSceneryObject(pGroup, z, offsetDist * side);

      this.pineGroup.add(pGroup);
      this.pineTrees.push(pGroup);
    }

    // Aurora Borealis dancing ribbons
    for (let a = 0; a < 3; a++) {
      const ribbonGeo = new THREE.PlaneGeometry(600, 90, 32, 4);
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: a === 0 ? 0x10b981 : a === 1 ? 0x06b6d4 : 0xa855f7,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbon.position.set(0, 140 + a * 20, -700 - a * 60);
      ribbon.rotation.x = 0.2;
      this.pineGroup.add(ribbon);
      this.auroraRibbons.push(ribbon);
    }
  }

  // 5. Celestial Crystal Monoliths & Rings
  initCrystalElements() {
    this.crystalGroup = new THREE.Group();
    this.group.add(this.crystalGroup);

    const numCrystals = 28;
    for (let i = 0; i < numCrystals; i++) {
      const cGroup = new THREE.Group();

      // Cluster of hexagonal crystal spikes
      for (let k = 0; k < 3; k++) {
        const height = 9 + Math.random() * 12;
        const radius = 1.0 + Math.random() * 1.2;
        const spikeGeo = new THREE.CylinderGeometry(0.1, radius, height, 6);
        spikeGeo.translate(0, height * 0.5, 0);
        const spike = new THREE.Mesh(spikeGeo, this.crystalMat);
        spike.rotation.z = (Math.random() - 0.5) * 0.4;
        spike.rotation.x = (Math.random() - 0.5) * 0.4;
        spike.position.set((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3);
        cGroup.add(spike);
      }

      const side = (i % 2 === 0) ? -1 : 1;
      const offsetDist = 18 + Math.random() * 25;
      const z = - (i * 38);

      cGroup.userData = { side, offsetDist, baseZ: z };
      this.positionSceneryObject(cGroup, z, offsetDist * side);

      this.crystalGroup.add(cGroup);
      this.crystalClusters.push(cGroup);
    }

    // Giant Planetary Rings in sky
    const ringGeo = new THREE.RingGeometry(180, 240, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.cosmicRing = new THREE.Mesh(ringGeo, ringMat);
    this.cosmicRing.position.set(-60, 220, -820);
    this.cosmicRing.rotation.x = 1.2;
    this.cosmicRing.rotation.y = 0.5;
    this.crystalGroup.add(this.cosmicRing);
  }

  // Sakura Petals Particle System
  initSakuraPetals() {
    const count = 180;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 25 + 1;
      pos[i * 3 + 2] = -Math.random() * 200;

      velocities.push({
        x: (Math.random() - 0.5) * 2.0,
        y: -1.2 - Math.random() * 1.5,
        z: -Math.random() * 2.0,
        rot: Math.random() * Math.PI
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf472b6,
      size: 1.2,
      transparent: true,
      opacity: 0.85
    });

    this.fallingPetals = new THREE.Points(geo, mat);
    this.fallingPetals.userData = { velocities, count };
    this.group.add(this.fallingPetals);
  }

  positionSceneryObject(obj, z, offsetDistance) {
    const rx = this.roadSystem.getRoadCenterX(z);
    const ry = this.roadSystem.getRoadCenterY(z);
    const angle = this.roadSystem.getRoadAngle(z);

    obj.position.set(
      rx + Math.cos(angle) * offsetDistance,
      ry,
      z + Math.sin(angle) * offsetDistance
    );
    obj.rotation.y = angle;
  }

  // Switch Biome
  setBiome(index) {
    this.targetBiomeIndex = ((index % this.biomeList.length) + this.biomeList.length) % this.biomeList.length;
    this.transitionProgress = 0.0;
  }

  nextBiome() {
    this.setBiome(this.currentBiomeIndex + 1);
  }

  applyBiomeInstant(index) {
    this.currentBiomeIndex = index;
    this.targetBiomeIndex = index;
    this.transitionProgress = 1.0;

    const b = this.biomeList[index];
    if (this.scene.fog) {
      this.scene.fog.color.setHex(b.fog);
    }
    this.scene.background = new THREE.Color(b.fog);
    if (this.moonMat) {
      this.moonMat.color.setHex(b.moon);
    }
    const skyUniforms = this.scene.userData?.skyDome?.material?.uniforms;
    if (skyUniforms) {
      skyUniforms.zenith.value.setHex(b.fog).multiplyScalar(0.44);
      skyUniforms.midSky.value.setHex(b.fog).lerp(new THREE.Color(b.ambient), 0.32);
      skyUniforms.horizon.value.setHex(b.fog).lerp(new THREE.Color(b.light), 0.2);
    }

    this.updateLayerVisibilities(index, index, 1.0);
  }

  updateLayerVisibilities(fromIdx, toIdx, progress) {
    // Smoothly crossfade opacity or enable scenery groups
    const groups = [
      this.cityGroup,
      this.sakuraGroup,
      this.coastalGroup,
      this.pineGroup,
      this.crystalGroup
    ];

    groups.forEach((grp, idx) => {
      if (idx === toIdx) {
        grp.visible = true;
      } else if (idx === fromIdx && progress < 1.0) {
        grp.visible = true;
      } else {
        grp.visible = false;
      }
    });

    // Petals visible in Sakura biome
    if (this.fallingPetals) {
      this.fallingPetals.visible = (toIdx === 1 || fromIdx === 1);
    }
  }

  update(delta, playerZ) {
    const time = performance.now() * 0.001;

    // 1. Auto scenery cycling
    if (this.autoCycleEnabled) {
      this.autoCycleTimer += delta;
      if (this.autoCycleTimer >= this.autoCycleTime) {
        this.autoCycleTimer = 0;
        this.nextBiome();
      }
    }

    // 2. Biome transition blend
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + delta * this.transitionSpeed);

      const fromB = this.biomeList[this.currentBiomeIndex];
      const toB = this.biomeList[this.targetBiomeIndex];

      this.tempColor1.setHex(fromB.fog);
      this.tempColor2.setHex(toB.fog);
      this.blendedFogColor.copy(this.tempColor1).lerp(this.tempColor2, this.transitionProgress);

      if (this.scene.fog) this.scene.fog.color.copy(this.blendedFogColor);
      if (this.scene.background) this.scene.background.copy(this.blendedFogColor);
      const skyUniforms = this.scene.userData?.skyDome?.material?.uniforms;
      if (skyUniforms) {
        skyUniforms.zenith.value.copy(this.blendedFogColor).multiplyScalar(0.44);
        skyUniforms.midSky.value.copy(this.blendedFogColor).lerp(this.tempColor2.setHex(toB.ambient), 0.32);
        skyUniforms.horizon.value.copy(this.blendedFogColor).lerp(this.tempColor1.setHex(toB.light), 0.2);
      }

      this.tempColor1.setHex(fromB.moon);
      this.tempColor2.setHex(toB.moon);
      if (this.moonMat) this.moonMat.color.copy(this.tempColor1).lerp(this.tempColor2, this.transitionProgress);

      this.updateLayerVisibilities(this.currentBiomeIndex, this.targetBiomeIndex, this.transitionProgress);

      if (this.transitionProgress >= 1.0) {
        this.currentBiomeIndex = this.targetBiomeIndex;
      }
    }

    // 3. Keep Sky Dome & Moon centered with player
    this.skyGroup.position.z = playerZ;
    this.skyGroup.position.x = this.roadSystem.getRoadCenterX(playerZ) * 0.3;

    // 4. Lighthouse rotating beam
    if (this.lighthouseBeam && this.coastalGroup.visible) {
      this.lighthouseBeam.rotation.y = time * 0.6;
    }

    // 5. Aurora ribbons wave
    if (this.pineGroup.visible && this.auroraRibbons.length > 0) {
      this.auroraRibbons.forEach((rib, idx) => {
        rib.rotation.z = Math.sin(time * 0.4 + idx) * 0.05;
        rib.position.y = 140 + idx * 20 + Math.sin(time * 0.8 + idx) * 5;
      });
    }

    // 6. Falling Sakura Petals
    if (this.fallingPetals && this.fallingPetals.visible) {
      const pos = this.fallingPetals.geometry.attributes.position.array;
      const vel = this.fallingPetals.userData.velocities;
      const count = this.fallingPetals.userData.count;
      const centerX = this.roadSystem.getRoadCenterX(playerZ);

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += vel[i].y * delta * 5.0; // fall down
        pos[i * 3] += Math.sin(time * 2.0 + i) * 0.12;

        // Reset petal if fallen below road or behind player
        if (pos[i * 3 + 1] < 0 || pos[i * 3 + 2] - playerZ > 20) {
          pos[i * 3 + 1] = 22 + Math.random() * 10;
          pos[i * 3 + 2] = playerZ - 30 - Math.random() * 150;
          pos[i * 3] = centerX + (Math.random() - 0.5) * 50;
        }
      }
      this.fallingPetals.geometry.attributes.position.needsUpdate = true;
    }

    // 7. Scenery Props Infinite Recycling (Pool recycle ahead of car)
    const recycleList = [
      { list: this.cityBuildings, spacing: 35, spread: 35 },
      { list: this.sakuraTrees, spacing: 32, spread: 20 },
      { list: this.palmTrees, spacing: 38, spread: 8 },
      { list: this.pineTrees, spacing: 30, spread: 30 },
      { list: this.crystalClusters, spacing: 38, spread: 25 },
      { list: this.toriiGates, spacing: 260, spread: 0 }
    ];

    recycleList.forEach(category => {
      const items = category.list;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.userData.baseZ - playerZ > 80) {
          // Find lowest Z in this category
          let minZ = 0;
          for (let j = 0; j < items.length; j++) {
            if (items[j].userData.baseZ < minZ) {
              minZ = items[j].userData.baseZ;
            }
          }
          item.userData.baseZ = minZ - category.spacing;
          const offsetDist = item.userData.offsetDist || 0;
          const side = item.userData.side || 1;
          this.positionSceneryObject(item, item.userData.baseZ, offsetDist * side);
        }
      }
    });
  }

  getCurrentBiome() {
    return this.biomeList[this.currentBiomeIndex];
  }
}
