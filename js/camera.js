// === THIRD-PERSON CAMERA ===
// Smooth follow, collision detection, orbit via mouse

import * as THREE from 'three';
import { CAMERA, INPUT } from './config.js';

class ThirdPersonCamera {
  constructor(camera, renderer) {
    this.camera = camera;
    this.renderer = renderer;

    this.target = null; // Player position
    this.distance = CAMERA.DEFAULT_DISTANCE;
    this.desiredDistance = CAMERA.DEFAULT_DISTANCE;
    this.phi = Math.PI * 0.2; // vertical angle (radians from horizontal)
    this.theta = 0; // horizontal angle

    // Smoothing
    this.currentPos = new THREE.Vector3();
    this.idealPos = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();

    // Collision
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = CAMERA.MAX_DISTANCE + 2;

    // Mouse look
    this.yaw = 0;
    this.pitch = 0;

    // Combat camera
    this.combatZoom = 0;
    this.shakeAmount = 0;
    this.shakeDecay = 5;

    // Forward vector for player movement
    this.forward = new THREE.Vector3(0, 0, 1);
  }

  update(dt, input, world) {
    if (!this.target) return;

    // Mouse look
    this.yaw -= input.mouse.dx * INPUT.MOUSE_SENSITIVITY * 100;
    this.pitch -= input.mouse.dy * INPUT.MOUSE_SENSITIVITY * 100;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -0.8, 0.6); // limit looking up/down

    // Scroll zoom
    // (handled via mouse wheel not currently tracked, but could be added)

    // Compute ideal camera position (orbit around player)
    this.phi = Math.PI * 0.25 + this.pitch;
    this.theta = this.yaw;

    const effectiveDist = this.distance + this.combatZoom;
    const cosPhi = Math.cos(this.phi);

    this.idealPos.set(
      this.target.x - Math.sin(this.theta) * cosPhi * effectiveDist,
      this.target.y + Math.sin(this.phi) * effectiveDist + CAMERA.HEIGHT_OFFSET,
      this.target.z - Math.cos(this.theta) * cosPhi * effectiveDist
    );

    // Collision detection — push camera forward if obstructed
    this._resolveCollision(world);

    // Smooth interpolation
    const smoothFactor = 1 - Math.exp(-CAMERA.SMOOTH_SPEED * dt);
    this.currentPos.lerp(this.idealPos, smoothFactor);

    // Apply screen shake
    if (this.shakeAmount > 0) {
      this.currentPos.x += (Math.random() - 0.5) * this.shakeAmount * 2;
      this.currentPos.y += (Math.random() - 0.5) * this.shakeAmount * 2;
      this.shakeAmount = Math.max(0, this.shakeAmount - this.shakeDecay * dt);
    }

    // Look target (slightly ahead of player for better feel)
    this.lookTarget.copy(this.target);
    this.lookTarget.y += 1.2;

    // Set camera
    this.camera.position.copy(this.currentPos);
    this.camera.lookAt(this.lookTarget);

    // Combat zoom decay
    this.combatZoom += (0 - this.combatZoom) * 5 * dt;

    // Update forward vector for player movement (horizontal only)
    this.forward.set(
      -Math.sin(this.theta),
      0,
      -Math.cos(this.theta)
    ).normalize();
  }

  _resolveCollision(world) {
    if (!world || !world.collisionObjects) return;

    const dir = new THREE.Vector3().subVectors(this.idealPos, this.target).normalize();
    const dist = this.idealPos.distanceTo(this.target);

    this.raycaster.set(this.target, dir);
    this.raycaster.far = dist;

    const intersects = this.raycaster.intersectObjects(world.collisionObjects, true);
    if (intersects.length > 0) {
      const hitDist = intersects[0].distance;
      if (hitDist < dist) {
        // Push camera to just before collision point
        this.idealPos.copy(this.target).addScaledVector(dir, Math.max(hitDist - 0.3, CAMERA.MIN_DISTANCE));
      }
    }
  }

  setTarget(targetPos) {
    this.target = targetPos;
  }

  addShake(amount) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  triggerCombatZoom() {
    this.combatZoom = -1.2; // pull camera closer
  }

  getForward() {
    return this.forward;
  }
}

export { ThirdPersonCamera };
