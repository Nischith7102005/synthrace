// CameraController.js - Smooth Spring Chase Camera, Hood Cockpit View & Cinematic Drone Orbit
import * as THREE from 'three';

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'chase'; // 'chase', 'hood', 'drone'

    this.currentPos = new THREE.Vector3(0, 5, 10);
    this.currentTarget = new THREE.Vector3(0, 1.5, -20);
    this.droneAngle = 0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  toggleMode() {
    if (this.mode === 'chase') this.mode = 'hood';
    else if (this.mode === 'hood') this.mode = 'drone';
    else this.mode = 'chase';
    return this.mode;
  }

  update(delta, car) {
    const carPos = car.group.position;
    const carRot = car.group.rotation.y;
    const speed = car.speed;

    const targetPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    if (this.mode === 'chase') {
      // Third-person chase with speed-dependent dynamic pull back
      const followDist = 8.0 + (speed / car.maxSpeed) * 3.0;
      const height = 3.6 + (speed / car.maxSpeed) * 0.8;

      targetPos.x = carPos.x + Math.sin(carRot) * followDist;
      targetPos.y = carPos.y + height;
      targetPos.z = carPos.z + Math.cos(carRot) * followDist;

      // Look slightly ahead of car
      const lookDist = 18.0;
      lookTarget.x = carPos.x - Math.sin(carRot) * lookDist;
      lookTarget.y = carPos.y + 1.6;
      lookTarget.z = carPos.z - Math.cos(carRot) * lookDist;

      // Smooth lerp for buttery lag-free spring camera
      this.currentPos.lerp(targetPos, Math.min(1.0, delta * 7.5));
      this.currentTarget.lerp(lookTarget, Math.min(1.0, delta * 9.0));

    } else if (this.mode === 'hood') {
      // First-person hood / windshield view
      targetPos.x = carPos.x - Math.sin(carRot) * 0.2;
      targetPos.y = carPos.y + 1.45;
      targetPos.z = carPos.z - Math.cos(carRot) * 0.2;

      const lookDist = 30.0;
      lookTarget.x = carPos.x - Math.sin(carRot) * lookDist;
      lookTarget.y = carPos.y + 1.35;
      lookTarget.z = carPos.z - Math.cos(carRot) * lookDist;

      this.currentPos.lerp(targetPos, Math.min(1.0, delta * 18.0));
      this.currentTarget.lerp(lookTarget, Math.min(1.0, delta * 18.0));

    } else if (this.mode === 'drone') {
      // Cinematic slow sweeping orbit around car
      this.droneAngle += delta * 0.25;
      const droneDist = 14.0;
      const droneHeight = 7.0 + Math.sin(this.droneAngle * 0.5) * 3.0;

      targetPos.x = carPos.x + Math.sin(this.droneAngle) * droneDist;
      targetPos.y = carPos.y + droneHeight;
      targetPos.z = carPos.z + Math.cos(this.droneAngle) * droneDist;

      lookTarget.x = carPos.x;
      lookTarget.y = carPos.y + 1.2;
      lookTarget.z = carPos.z;

      this.currentPos.lerp(targetPos, Math.min(1.0, delta * 4.0));
      this.currentTarget.lerp(lookTarget, Math.min(1.0, delta * 5.0));
    }

    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.currentTarget);
  }
}
