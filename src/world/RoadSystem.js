// RoadSystem.js - Infinite Seamless Curving Highway with Object Pooling & Tokyo Expressway Elements
import * as THREE from 'three';

export class RoadSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Highway dimensions
    this.roadWidth = 26; // 4 lanes
    this.laneWidth = 5.5;
    this.chunkLength = 50; // length of each segment
    this.numChunks = 32; // covers 1600 meters of visible highway
    this.totalCoveredLength = this.chunkLength * this.numChunks;

    this.chunks = [];
    this.streetlights = [];
    this.gantries = [];
    this.reflectors = [];

    // Shared materials for maximum performance & zero lag
    this.initMaterials();
    this.initRoadChunks();
    this.initStreetlights();
    this.initGantries();
  }

  // Smooth mathematical road curve function
  // Closed-form so any vehicle or camera can query exact center & elevation at z
  getRoadCenterX(z) {
    return Math.sin(z * 0.003) * 32 + Math.sin(z * 0.0007) * 75;
  }

  getRoadCenterY(z) {
    return Math.sin(z * 0.0022) * 5.0 + Math.cos(z * 0.0009) * 3.0;
  }

  // Tangent angle in radians (yaw) at z
  getRoadAngle(z) {
    const dz = 2.0;
    const dx = this.getRoadCenterX(z + dz) - this.getRoadCenterX(z - dz);
    return Math.atan2(dx, dz * 2);
  }

  initMaterials() {
    // Wet asphalt with subtle specular sheen
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x11131a,
      roughness: 0.35,
      metalness: 0.15,
      flatShading: false
    });

    // Shoulder gravel / road edge
    this.shoulderMat = new THREE.MeshStandardMaterial({
      color: 0x1e2029,
      roughness: 0.8,
      metalness: 0.05
    });

    // Guardrail steel with neon strip
    this.guardrailMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.7
    });

    this.neonStripMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    // Lane markings
    this.dashedLineMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.9
    });

    this.solidLineMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15, // warm golden amber
      transparent: true,
      opacity: 0.95
    });

    // Cat-eye road reflectors
    this.reflectorMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b
    });

    // Streetlight post & glow
    this.poleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.6
    });

    this.lampHeadMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5
    });

    // Overhead gantry truss & sign
    this.trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4
    });

    // Sign texture generator
    this.signCanvas = document.createElement('canvas');
    this.signCanvas.width = 512;
    this.signCanvas.height = 128;
    this.renderSignTexture('LO-FI EXPWY · 渋谷 SHIBUYA 5km');
    this.signTexture = new THREE.CanvasTexture(this.signCanvas);

    this.signMat = new THREE.MeshBasicMaterial({
      map: this.signTexture
    });
  }

  renderSignTexture(text) {
    const ctx = this.signCanvas.getContext('2d');
    // Dark emerald green highway sign backing
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 128);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    // Glowing text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
  }

  initRoadChunks() {
    const halfWidth = this.roadWidth * 0.5;

    for (let i = 0; i < this.numChunks; i++) {
      const chunkGroup = new THREE.Group();

      // 1. Asphalt Road Plane
      const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength, 6, 2);
      roadGeo.rotateX(-Math.PI / 2);
      const roadMesh = new THREE.Mesh(roadGeo, this.asphaltMat);
      roadMesh.receiveShadow = true;
      chunkGroup.add(roadMesh);

      // 2. Road Shoulders / Curbs (Left & Right)
      const curbGeo = new THREE.BoxGeometry(2.0, 0.35, this.chunkLength);
      const leftCurb = new THREE.Mesh(curbGeo, this.shoulderMat);
      leftCurb.position.set(-halfWidth - 1.0, 0.1, 0);
      chunkGroup.add(leftCurb);

      const rightCurb = new THREE.Mesh(curbGeo, this.shoulderMat);
      rightCurb.position.set(halfWidth + 1.0, 0.1, 0);
      chunkGroup.add(rightCurb);

      // 3. Guardrails (Left & Right)
      const railGeo = new THREE.BoxGeometry(0.3, 0.8, this.chunkLength);
      const leftRail = new THREE.Mesh(railGeo, this.guardrailMat);
      leftRail.position.set(-halfWidth - 1.8, 0.7, 0);
      chunkGroup.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, this.guardrailMat);
      rightRail.position.set(halfWidth + 1.8, 0.7, 0);
      chunkGroup.add(rightRail);

      // Neon accent reflector stripes on guardrail
      const stripGeo = new THREE.BoxGeometry(0.34, 0.08, this.chunkLength);
      const leftStrip = new THREE.Mesh(stripGeo, this.neonStripMat);
      leftStrip.position.set(-halfWidth - 1.8, 0.8, 0);
      chunkGroup.add(leftStrip);

      const rightStrip = new THREE.Mesh(stripGeo, this.neonStripMat);
      rightStrip.position.set(halfWidth + 1.8, 0.8, 0);
      chunkGroup.add(rightStrip);

      // 4. Center Double Yellow Line
      const centerLineGeo = new THREE.PlaneGeometry(0.2, this.chunkLength);
      centerLineGeo.rotateX(-Math.PI / 2);
      const centerLine1 = new THREE.Mesh(centerLineGeo, this.solidLineMat);
      centerLine1.position.set(-0.25, 0.02, 0);
      chunkGroup.add(centerLine1);

      const centerLine2 = new THREE.Mesh(centerLineGeo, this.solidLineMat);
      centerLine2.position.set(0.25, 0.02, 0);
      chunkGroup.add(centerLine2);

      // 5. Outer Solid White Edges
      const outerLineGeo = new THREE.PlaneGeometry(0.25, this.chunkLength);
      outerLineGeo.rotateX(-Math.PI / 2);

      const leftOuter = new THREE.Mesh(outerLineGeo, this.dashedLineMat);
      leftOuter.position.set(-halfWidth + 0.4, 0.02, 0);
      chunkGroup.add(leftOuter);

      const rightOuter = new THREE.Mesh(outerLineGeo, this.dashedLineMat);
      rightOuter.position.set(halfWidth - 0.4, 0.02, 0);
      chunkGroup.add(rightOuter);

      // 6. Dashed Lane Divider Stripes (3 dashes per chunk)
      const dashGeo = new THREE.PlaneGeometry(0.22, 5.0);
      dashGeo.rotateX(-Math.PI / 2);

      // Lane divider left (-5.5) and right (+5.5)
      const dashOffsets = [-15, 0, 15];
      dashOffsets.forEach(dz => {
        const dashL = new THREE.Mesh(dashGeo, this.dashedLineMat);
        dashL.position.set(-this.laneWidth, 0.02, dz);
        chunkGroup.add(dashL);

        const dashR = new THREE.Mesh(dashGeo, this.dashedLineMat);
        dashR.position.set(this.laneWidth, 0.02, dz);
        chunkGroup.add(dashR);

        // Cat-eye reflector dot
        const refGeo = new THREE.BoxGeometry(0.15, 0.08, 0.25);
        const refL = new THREE.Mesh(refGeo, this.reflectorMat);
        refL.position.set(-this.laneWidth, 0.04, dz + 3.0);
        chunkGroup.add(refL);

        const refR = new THREE.Mesh(refGeo, this.reflectorMat);
        refR.position.set(this.laneWidth, 0.04, dz + 3.0);
        chunkGroup.add(refR);
      });

      const z = -i * this.chunkLength;
      this.positionChunk(chunkGroup, z);
      this.group.add(chunkGroup);
      this.chunks.push({ group: chunkGroup, z });
    }
  }

  positionChunk(chunkGroup, z) {
    const x = this.getRoadCenterX(z);
    const y = this.getRoadCenterY(z);
    const angle = this.getRoadAngle(z);

    chunkGroup.position.set(x, y, z);
    chunkGroup.rotation.y = angle;
  }

  initStreetlights() {
    const spacing = 45; // meters
    const numLights = Math.floor(this.totalCoveredLength / spacing);

    for (let i = 0; i < numLights; i++) {
      const lightGroup = new THREE.Group();

      // Vertical Pole
      const poleGeo = new THREE.CylinderGeometry(0.15, 0.22, 10, 6);
      poleGeo.translate(0, 5, 0);
      const pole = new THREE.Mesh(poleGeo, this.poleMat);
      lightGroup.add(pole);

      // Curved Arch Arm
      const armGeo = new THREE.BoxGeometry(3.5, 0.12, 0.12);
      armGeo.translate(1.6, 10, 0);
      const arm = new THREE.Mesh(armGeo, this.poleMat);
      lightGroup.add(arm);

      // Glowing Lamp Fixture
      const lampGeo = new THREE.BoxGeometry(1.2, 0.2, 0.4);
      lampGeo.translate(3.2, 9.85, 0);
      const lamp = new THREE.Mesh(lampGeo, this.lampHeadMat);
      lightGroup.add(lamp);

      // Alternate left and right side of highway
      const side = (i % 2 === 0) ? -1 : 1;
      const z = -i * spacing;

      lightGroup.userData = { side, baseZ: z };
      this.positionStreetlight(lightGroup, z, side);

      this.group.add(lightGroup);
      this.streetlights.push(lightGroup);
    }
  }

  positionStreetlight(lightGroup, z, side) {
    const x = this.getRoadCenterX(z);
    const y = this.getRoadCenterY(z);
    const angle = this.getRoadAngle(z);
    const offsetDistance = (this.roadWidth * 0.5 + 2.5) * side;

    lightGroup.position.set(
      x + Math.cos(angle) * offsetDistance,
      y,
      z + Math.sin(angle) * offsetDistance
    );
    // Face the light towards the road center
    lightGroup.rotation.y = angle + (side === 1 ? Math.PI : 0);
  }

  initGantries() {
    // Tokyo Expressway Overhead Directional Signs
    const gantrySpacing = 350;
    const numGantries = Math.floor(this.totalCoveredLength / gantrySpacing);
    const signTexts = [
      'LO-FI EXPWY · 渋谷 SHIBUYA 5km',
      'MIDNIGHT CRUISE · 新宿 SHINJUKU',
      'CHILL LANE · 銀座 GINZA 8km',
      'COSMIC HIGHWAY · 六本木 ROPPONGI'
    ];

    for (let i = 0; i < numGantries; i++) {
      const gantryGroup = new THREE.Group();

      const span = this.roadWidth + 6;
      const height = 9.5;

      // Left column
      const colGeo = new THREE.BoxGeometry(0.6, height, 0.6);
      const leftCol = new THREE.Mesh(colGeo, this.trussMat);
      leftCol.position.set(-span * 0.5, height * 0.5, 0);
      gantryGroup.add(leftCol);

      // Right column
      const rightCol = new THREE.Mesh(colGeo, this.trussMat);
      rightCol.position.set(span * 0.5, height * 0.5, 0);
      gantryGroup.add(rightCol);

      // Cross beam
      const beamGeo = new THREE.BoxGeometry(span, 0.8, 0.8);
      beamGeo.position.set(0, height, 0);
      const crossBeam = new THREE.Mesh(beamGeo, this.trussMat);
      gantryGroup.add(crossBeam);

      // Sign board
      const signBoardGeo = new THREE.PlaneGeometry(14, 3.5);
      const signMesh = new THREE.Mesh(signBoardGeo, this.signMat);
      signMesh.position.set(0, height - 1.2, 0.45);
      gantryGroup.add(signMesh);

      const z = - (i + 1) * gantrySpacing;
      gantryGroup.userData = { baseZ: z };
      this.positionChunk(gantryGroup, z);

      this.group.add(gantryGroup);
      this.gantries.push(gantryGroup);
    }
  }

  // Update loop: seamlessly recycles chunks and streetlights ahead of player
  update(playerZ) {
    // 1. Recycle road chunks
    const behindDistance = 80; // distance behind player before moving forward
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      if (chunk.z - playerZ > behindDistance) {
        // Find frontmost chunk z
        let minZ = 0;
        for (let j = 0; j < this.chunks.length; j++) {
          if (this.chunks[j].z < minZ) {
            minZ = this.chunks[j].z;
          }
        }
        chunk.z = minZ - this.chunkLength;
        this.positionChunk(chunk.group, chunk.z);
      }
    }

    // 2. Recycle streetlights
    const lightBehindDistance = 60;
    const lightSpacing = 45;
    for (let i = 0; i < this.streetlights.length; i++) {
      const light = this.streetlights[i];
      if (light.userData.baseZ - playerZ > lightBehindDistance) {
        let minZ = 0;
        for (let j = 0; j < this.streetlights.length; j++) {
          if (this.streetlights[j].userData.baseZ < minZ) {
            minZ = this.streetlights[j].userData.baseZ;
          }
        }
        light.userData.baseZ = minZ - lightSpacing;
        this.positionStreetlight(light, light.userData.baseZ, light.userData.side);
      }
    }

    // 3. Recycle gantries
    const gantryBehindDistance = 100;
    const gantrySpacing = 350;
    for (let i = 0; i < this.gantries.length; i++) {
      const gantry = this.gantries[i];
      if (gantry.userData.baseZ - playerZ > gantryBehindDistance) {
        let minZ = 0;
        for (let j = 0; j < this.gantries.length; j++) {
          if (this.gantries[j].userData.baseZ < minZ) {
            minZ = this.gantries[j].userData.baseZ;
          }
        }
        gantry.userData.baseZ = minZ - gantrySpacing;
        this.positionChunk(gantry, gantry.userData.baseZ);
      }
    }
  }
}
