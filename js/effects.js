// === VISUAL EFFECTS ===
// Particles, hit sparks, trails, slow-motion

import * as THREE from 'three';

class Effects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.hitSparks = [];
  }

  // Hit spark effect
  spawnHitSparks(position, color = 0xffaa44, count = 12) {
    for (let i = 0; i < count; i++) {
      var sparkGeo = new THREE.SphereGeometry(0.05, 4, 4);
      var sparkMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      var spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.copy(position);
      spark.position.x += (Math.random() - 0.5) * 0.5;
      spark.position.y += (Math.random() - 0.5) * 0.5;
      spark.position.z += (Math.random() - 0.5) * 0.5;

      const speed = 3 + Math.random() * 5;
      spark.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * speed,
          Math.random() * speed * 1.5,
          (Math.random() - 0.5) * speed
        ),
        life: 0.4 + Math.random() * 0.6,
        born: performance.now(),
      };

      this.scene.add(spark);
      this.hitSparks.push(spark);
    }
  }

  // Critical hit effect (bigger, more dramatic)
  spawnCriticalHit(position) {
    this.spawnHitSparks(position, 0x4dc9f6, 25);

    // Shockwave ring
    var ringGeo = new THREE.RingGeometry(0.1, 0.3, 16);
    var ringMat = new THREE.MeshBasicMaterial({
      color: 0x4dc9f6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(position);
    ring.position.y += 0.2;
    ring.rotation.x = -Math.PI / 2;
    ring.userData = {
      life: 0.6,
      born: performance.now(),
      type: 'shockwave',
    };
    this.scene.add(ring);
    this.hitSparks.push(ring);
  }

  // Perfect dodge effect
  spawnPerfectDodge(position) {
    // Brief afterimage + blue flash
    for (let i = 0; i < 4; i++) {
      var ghostGeo = new THREE.TorusGeometry(0.3 + i * 0.3, 0.03, 8, 16);
      var ghostMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6 - i * 0.12,
        depthWrite: false,
      });
      var ghost = new THREE.Mesh(ghostGeo, ghostMat);
      ghost.position.copy(position);
      ghost.position.y += 1;
      ghost.userData = {
        life: 0.5,
        born: performance.now(),
        type: 'dodgeGhost',
        offsetY: i * 0.15,
        scaleSpeed: 1 + i * 0.5,
      };
      this.scene.add(ghost);
      this.hitSparks.push(ghost);
    }
  }

  // Parry effect
  spawnParry(position) {
    var shieldGeo = new THREE.TorusGeometry(0.8, 0.05, 8, 32);
    var shieldMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    var shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.copy(position);
    shield.position.y += 1.2;
    shield.userData = {
      life: 0.5,
      born: performance.now(),
      type: 'parryShield',
    };
    this.scene.add(shield);
    this.hitSparks.push(shield);
  }

  // Echo spawn effect
  spawnEchoEffect(position) {
    for (let i = 0; i < 15; i++) {
      var pGeo = new THREE.SphereGeometry(0.04, 4, 4);
      var pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6, 0.8, 0.5 + Math.random() * 0.3),
        transparent: true,
        opacity: 0.8,
      });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(position);
      p.position.y += 1;
      p.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4
        ),
        life: 0.8 + Math.random() * 0.5,
        born: performance.now(),
        type: 'echoParticle',
      };
      this.scene.add(p);
      this.hitSparks.push(p);
    }
  }

  // Boss intro effect
  spawnBossIntro(position) {
    // Dark energy burst
    for (let i = 0; i < 40; i++) {
      var pGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.06, 4, 4);
      var pMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.95, 0.9, 0.3 + Math.random() * 0.4),
        transparent: true,
      });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(position);
      p.position.y += 2;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      p.userData = {
        velocity: new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 4, Math.sin(angle) * speed),
        life: 1.5 + Math.random(),
        born: performance.now(),
        type: 'bossParticle',
      };
      this.scene.add(p);
      this.hitSparks.push(p);
    }
  }

  update(dt, now) {
    // Update all particles
    for (let i = this.hitSparks.length - 1; i >= 0; i--) {
      const p = this.hitSparks[i];
      const age = (now - p.userData.born) / 1000;
      const life = p.userData.life;

      if (age >= life) {
        this.scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (p.material) p.material.dispose();
        this.hitSparks.splice(i, 1);
        continue;
      }

      const progress = age / life;

      if (p.userData.type === 'shockwave') {
        p.scale.setScalar(1 + progress * 5);
        p.material.opacity = 0.8 * (1 - progress);
      } else if (p.userData.type === 'parryShield') {
        p.scale.setScalar(1 + progress * 2);
        p.material.opacity = 0.9 * (1 - progress);
        p.rotation.z += dt * 3;
      } else if (p.userData.type === 'dodgeGhost') {
        p.scale.setScalar(1 + progress * p.userData.scaleSpeed);
        p.material.opacity = Math.max(0, 0.5 * (1 - progress));
        p.position.y += dt * 0.5;
      } else if (p.userData.velocity) {
        p.position.x += p.userData.velocity.x * dt;
        p.position.y += p.userData.velocity.y * dt;
        p.position.z += p.userData.velocity.z * dt;
        p.userData.velocity.y -= 8 * dt; // gravity
        if (p.material && p.material.opacity !== undefined) {
          p.material.opacity = Math.max(0, 1 - progress);
        }
      }
    }
  }

  clearAll() {
    this.hitSparks.forEach(p => {
      this.scene.remove(p);
      if (p.geometry) p.geometry.dispose();
      if (p.material) p.material.dispose();
    });
    this.hitSparks = [];
  }
}

export { Effects };
