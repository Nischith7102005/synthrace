// Temporary boot smoke test - constructs all game subsystems and simulates 120 frames.
// Catches boot-time crashes (like the geometry.position bug) without a browser.
import * as THREE from 'three';

// Minimal DOM stub: only what the subsystems touch (canvas 2d contexts for textures)
const gradient = { addColorStop() {} };
const ctx2d = new Proxy({}, {
  get(t, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
    if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
    return () => {};
  },
  set() { return true; }
});
globalThis.document = {
  createElement: (tag) => tag === 'canvas'
    ? { width: 0, height: 0, getContext: () => ctx2d, style: {} }
    : { style: {} },
  getElementById: () => null,
  body: { appendChild() {} }
};
globalThis.window = globalThis;

const { RoadSystem } = await import('./src/world/RoadSystem.js');
const { Biomes } = await import('./src/world/Biomes.js');
const { FlyingCreatures } = await import('./src/world/FlyingCreatures.js');
const { Car } = await import('./src/entities/Car.js');
const { Traffic } = await import('./src/entities/Traffic.js');
const { Weather } = await import('./src/systems/Weather.js');
const { CameraController } = await import('./src/camera/CameraController.js');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x110f24, 0.0028);
scene.background = new THREE.Color(0x110f24);

const road = new RoadSystem(scene);
const biomes = new Biomes(scene, road);
const creatures = new FlyingCreatures(scene);
const soundStub = { updateEngineSound() {}, playRespawnChime() {} };
const car = new Car(scene, road, soundStub);
const traffic = new Traffic(scene, road);
const weather = new Weather(scene);
const cam = new CameraController(new THREE.PerspectiveCamera(62, 16 / 9, 0.2, 1400));

const input = { forward: true, backward: false, left: false, right: false, drift: false };
for (let i = 0; i < 120; i++) {
  const dt = 1 / 60;
  car.update(dt, input, traffic.getVehicles());
  traffic.update(dt, car);
  road.update(car.z);
  biomes.update(dt, car.z);
  weather.update(dt, car);
  creatures.update(dt, car.z);
  cam.update(dt, car);
}

// sanity: car should have moved forward, gantry cross beam must exist at proper height
if (!(car.distanceTraveled > 0)) throw new Error('car did not move');
const gantry = road.gantries[0];
if (!gantry) throw new Error('no gantries built');
console.log('BOOT SMOKE TEST PASSED · car traveled', car.distanceTraveled.toFixed(1), 'm · gantries:', road.gantries.length, '· vehicles:', traffic.vehicles.length);
