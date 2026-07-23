// === ECHO SYSTEM ===
// Core mechanic: record player actions, spawn ghost echoes that replay them

import * as THREE from 'three';
import { ECHO } from './config.js';

class EchoSystem {
  constructor(scene) {
    this.scene = scene;
    this.slots = new Array(ECHO.MAX_SLOTS).fill(null); // saved recordings
    this.activeRecording = null; // currently recording
    this.activeEchoes = []; // spawned echo instances
    this.maxSimultaneous = ECHO.MAX_SIMULTANEOUS;
  }

  // Start recording a new echo
  startRecording() {
    if (this.activeRecording) return false;

    // Find free slot
    let slot = -1;
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i]) { slot = i; break; }
    }
    if (slot === -1) {
      // Overwrite oldest (slot 0)
      this._shiftSlots();
      slot = this.slots.length - 1;
    }

    this.activeRecording = {
      slot,
      startTime: performance.now(),
      frames: [], // array of snapshots
      maxDuration: ECHO.MAX_RECORDING_TIME * 1000,
    };

    return slot;
  }

  // Record a frame snapshot
  recordFrame(playerData) {
    if (!this.activeRecording) return;
    const elapsed = performance.now() - this.activeRecording.startTime;
    if (elapsed > this.activeRecording.maxDuration) {
      this.stopRecording();
      return;
    }
    this.activeRecording.frames.push({
      t: elapsed,
      pos: playerData.position.clone(),
      vel: playerData.velocity.clone(),
      rot: playerData.facingAngle,
      state: playerData.state,
      attack: playerData.isAttacking,
      attackDmg: playerData.attackDamage || 0,
      attackRange: playerData.attackRange || 0,
      attackAngle: playerData.attackAngle || 0,
      onGround: playerData.onGround,
    });
  }

  // Stop recording and save
  stopRecording() {
    if (!this.activeRecording) return null;
    const rec = {
      slot: this.activeRecording.slot,
      duration: (performance.now() - this.activeRecording.startTime) / 1000,
      frames: this.activeRecording.frames,
      createdAt: Date.now(),
    };
    this.slots[this.activeRecording.slot] = rec;
    this.activeRecording = null;
    return rec;
  }

  cancelRecording() {
    if (!this.activeRecording) return;
    this.activeRecording = null;
  }

  // Spawn an echo from a saved slot
  spawnEcho(slotIndex) {
    const rec = this.slots[slotIndex];
    if (!rec) return null;
    if (this.activeEchoes.length >= this.maxSimultaneous) {
      // Remove oldest echo
      const old = this.activeEchoes.shift();
      this._despawnEcho(old);
    }

    const echo = this._createEchoInstance(rec, slotIndex);
    this.activeEchoes.push(echo);
    return echo;
  }

  _createEchoInstance(recording, slotIndex) {
    // Ghost version of the player
    var group = new THREE.Group();

    // Ethereal body (same shape as player, more transparent)
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
    var bodyMat = new THREE.MeshStandardMaterial({
      color: 0x88aaff,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.5,
      emissive: 0x4466aa,
      emissiveIntensity: 0.4,
    });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    group.add(body);

    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({
      color: 0xaaccff,
      roughness: 0.3,
      transparent: true,
      opacity: 0.5,
      emissive: 0x335588,
      emissiveIntensity: 0.5,
    });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    group.add(head);

    // Glow effect
    var glowGeo = new THREE.SphereGeometry(0.6, 16, 16);
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Echo trail ring
    var ringGeo = new THREE.TorusGeometry(0.5, 0.03, 8, 16);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    group.add(ring);

    this.scene.add(group);

    return {
      mesh: group,
      recording,
      slotIndex,
      startTime: performance.now(),
      frameIndex: 0,
      finished: false,
      spawnedAt: performance.now(),
    };
  }

  update(dt, now) {
    // Update active echoes
    for (let i = this.activeEchoes.length - 1; i >= 0; i--) {
      const echo = this.activeEchoes[i];
      const elapsed = now - echo.startTime;

      // Find current frame
      const frames = echo.recording.frames;
      if (frames.length === 0) {
        this._despawnEcho(echo);
        this.activeEchoes.splice(i, 1);
        continue;
      }

      // Binary search for current frame
      let idx = echo.frameIndex;
      while (idx < frames.length && frames[idx].t <= elapsed) idx++;
      idx = Math.max(0, idx - 1);
      echo.frameIndex = idx;

      if (idx >= frames.length - 1 && elapsed > frames[frames.length - 1].t + 500) {
        // Echo has finished its recording
        this._fadeOutEcho(echo, i);
        continue;
      }

      // Interpolate between frames
      const f0 = frames[idx];
      const f1 = frames[Math.min(idx + 1, frames.length - 1)];
      const alpha = f1.t > f0.t ? (elapsed - f0.t) / (f1.t - f0.t) : 0;
      const a = THREE.MathUtils.clamp(alpha, 0, 1);

      echo.mesh.position.lerpVectors(f0.pos, f1.pos, a);
      echo.mesh.rotation.y = THREE.MathUtils.lerp(f0.rot, f1.rot, a);

      // Pulse glow
      const pulse = 1 + Math.sin(now * 0.005) * 0.2;
      echo.mesh.children.forEach(c => {
        if (c.material && c.material.emissiveIntensity !== undefined) {
          c.material.opacity = 0.4 + Math.sin(now * 0.008) * 0.15;
        }
      });
      echo.mesh.scale.setScalar(pulse);
    }
  }

  // Get echoes near a position (for combat/puzzle interaction)
  getEchoesNear(pos, radius) {
    return this.activeEchoes.filter(e => {
      return e.mesh.position.distanceTo(pos) < radius;
    });
  }

  // Echoes that are currently attacking (for enemy AI reaction)
  getAttackingEchoes() {
    const now = performance.now();
    return this.activeEchoes.filter(e => {
      const elapsed = now - e.startTime;
      const frames = e.recording.frames;
      const idx = e.frameIndex;
      if (idx < frames.length) {
        return frames[idx].attack && !e.finished;
      }
      return false;
    });
  }

  // Get echo attack data for hit detection
  getEchoAttackData(echo) {
    const frames = echo.recording.frames;
    const idx = echo.frameIndex;
    if (idx < frames.length && frames[idx].attack) {
      return {
        position: echo.mesh.position.clone(),
        damage: frames[idx].attackDmg || COMBAT.LIGHT_DAMAGE,
        range: frames[idx].attackRange || 2.2,
        angle: frames[idx].attackAngle || Math.PI * 0.35,
        facingAngle: frames[idx].rot,
      };
    }
    return null;
  }

  // Echo stands on pressure plate (puzzle mechanic)
  isEchoOnPlate(platePos, plateRadius) {
    return this.activeEchoes.some(e => {
      const dx = e.mesh.position.x - platePos.x;
      const dz = e.mesh.position.z - platePos.z;
      return Math.sqrt(dx*dx + dz*dz) < plateRadius;
    });
  }

  _fadeOutEcho(echo, index) {
    echo.finished = true;
    const startScale = echo.mesh.scale.x;
    const startTime = performance.now();

    const fadeOut = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / 0.6, 1);
      echo.mesh.scale.setScalar(startScale * (1 - progress * 0.5));
      echo.mesh.children.forEach(c => {
        if (c.material && c.material.opacity !== undefined) {
          c.material.opacity = Math.max(0, 0.5 * (1 - progress));
        }
      });
      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        this._despawnEcho(echo);
        const idx = this.activeEchoes.indexOf(echo);
        if (idx !== -1) this.activeEchoes.splice(idx, 1);
      }
    };
    fadeOut();
  }

  _despawnEcho(echo) {
    if (echo.mesh) {
      this.scene.remove(echo.mesh);
      echo.mesh.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) {
            c.material.forEach(m => m.dispose());
          } else {
            c.material.dispose();
          }
        }
      });
    }
  }

  _shiftSlots() {
    for (let i = 0; i < this.slots.length - 1; i++) {
      this.slots[i] = this.slots[i + 1];
    }
    this.slots[this.slots.length - 1] = null;
  }

  isRecording() { return !!this.activeRecording; }
  getRecordingDuration() {
    if (!this.activeRecording) return 0;
    return (performance.now() - this.activeRecording.startTime) / 1000;
  }
  getActiveEchoCount() { return this.activeEchoes.length; }

  clearAll() {
    this.cancelRecording();
    this.activeEchoes.forEach(e => this._despawnEcho(e));
    this.activeEchoes = [];
    this.slots.fill(null);
  }
}

export { EchoSystem };
