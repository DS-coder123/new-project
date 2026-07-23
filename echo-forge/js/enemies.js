// === ENEMY SYSTEM ===
// Multiple enemy classes: Melee, Archer, Mage, Flying, Elite, Boss

import * as THREE from 'three';
import { ENEMY_STATS, ANIM } from './config.js';

const EnemyType = {
  MELEE: 'MELEE', ARCHER: 'ARCHER', MAGE: 'MAGE',
  FLYING: 'FLYING', ELITE: 'ELITE', BOSS: 'BOSS',
};

class Enemy {
  constructor(type, position, scene) {
    this.type = type;
    this.scene = scene;
    this.stats = { ...ENEMY_STATS[type] };
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.onGround = true;

    // AI state
    this.state = 'idle'; // idle, patrol, chase, attack, stagger, dead
    this.stateTimer = 0;
    this.attackCooldown = 0;
    this.target = null;
    this.patrolDir = new THREE.Vector3(
      (Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2
    ).normalize();
    this.patrolTimer = 2 + Math.random() * 3;
    this.detectionRange = this.stats.detectionRange;
    this.staggerThreshold = 40;
    this.staggerAccum = 0;

    // Visual
    this.mesh = this._createMesh();
    this.healthBar = this._createHealthBar();
    scene.add(this.mesh);

    // Hit flash
    this.hitFlashTimer = 0;
  }

  _createMesh() {
    var group = new THREE.Group();

    const colors = {
      MELEE: 0xcc4444,
      ARCHER: 0x44aa44,
      MAGE: 0x8844cc,
      FLYING: 0xccaa44,
      ELITE: 0xcc8844,
      BOSS: 0xcc2266,
    };
    const color = colors[this.type] || 0xcc4444;

    // Body
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
    var bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.2 });
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);
    this._bodyMesh = body;

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    group.add(head);

    // Eyes (glow)
    var eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    var eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    var lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.08, 0.05, -0.18);
    head.add(lEye);
    var rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.08, 0.05, -0.18);
    head.add(rEye);

    // Arms / Weapons based on type
    if (this.type === EnemyType.MELEE || this.type === EnemyType.BOSS) {
      var armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);
      var armMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      var rArm = new THREE.Mesh(armGeo, armMat);
      rArm.position.set(0.4, 1.3, 0);
      group.add(rArm);
      this._weaponArm = rArm;

      // Sword/axe
      var weaponGeo = new THREE.BoxGeometry(0.06, 0.7, 0.03);
      var weaponMat = new THREE.MeshStandardMaterial({
        color: 0xff6644,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0x330000,
        emissiveIntensity: 0.3,
      });
      var weapon = new THREE.Mesh(weaponGeo, weaponMat);
      weapon.position.set(0.4, 1.0, 0.2);
      weapon.rotation.z = 0.5;
      weapon.castShadow = true;
      group.add(weapon);
      this._weapon = weapon;
    }

    if (this.type === EnemyType.ARCHER) {
      // Bow (simplified as staff)
      var bowGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
      var bowMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.5 });
      var bow = new THREE.Mesh(bowGeo, bowMat);
      bow.position.set(0.3, 1.2, 0.3);
      bow.rotation.z = -0.5;
      group.add(bow);
      this._weapon = bow;
    }

    if (this.type === EnemyType.MAGE) {
      // Staff with crystal
      var staffGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.5, 8);
      var staffMat = new THREE.MeshStandardMaterial({ color: 0x664488, roughness: 0.5 });
      var staff = new THREE.Mesh(staffGeo, staffMat);
      staff.position.set(0.3, 1.4, 0.2);
      staff.rotation.z = -0.3;
      group.add(staff);
      var crystalGeo = new THREE.OctahedronGeometry(0.15, 0);
      var crystalMat = new THREE.MeshBasicMaterial({ color: 0xcc88ff });
      var crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.y = 0.85;
      staff.add(crystal);
      this._weapon = staff;
      this._weaponCrystal = crystal;
    }

    if (this.type === EnemyType.FLYING) {
      // Wings
      for (let s = -1; s <= 1; s += 2) {
        var wingGeo = new THREE.BoxGeometry(0.05, 0.4, 0.7);
        var wingMat = new THREE.MeshStandardMaterial({
          color: 0x8899aa,
          roughness: 0.3,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        var wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(s * 0.4, 1.5, -0.15);
        group.add(wing);
        this['wing' + (s === 1 ? 'R' : 'L')] = wing;
      }
    }

    if (this.type === EnemyType.ELITE) {
      // Heavy armor + shield
      var shieldGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16);
      var shieldMat = new THREE.MeshStandardMaterial({
        color: 0x886644,
        roughness: 0.3,
        metalness: 0.8,
      });
      var shield = new THREE.Mesh(shieldGeo, shieldMat);
      shield.position.set(-0.4, 1.2, 0);
      shield.rotation.x = Math.PI / 2;
      group.add(shield);
      this._shield = shield;
    }

    if (this.type === EnemyType.BOSS) {
      // Giant size
      group.scale.setScalar(2.5);

      // Crown/horns
      for (let s = -1; s <= 1; s += 2) {
        var hornGeo = new THREE.ConeGeometry(0.12, 0.5, 6);
        var hornMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.3, metalness: 0.8 });
        var horn = new THREE.Mesh(hornGeo, hornMat);
        horn.position.set(s * 0.15, 0.35, -0.05);
        var headRef = group.children.find(c => c.geometry && c.geometry.type === 'SphereGeometry');
        if (headRef) headRef.add(horn);
      }
    }

    group.position.copy(this.position);
    return group;
  }

  _createHealthBar() {
    // Health bar is a simple plane that hovers above the enemy
    var barGeo = new THREE.PlaneGeometry(1.5, 0.15);
    var barMat = new THREE.ShaderMaterial({
      uniforms: {
        hpPercent: { value: 1.0 },
        barColor: { value: new THREE.Color(0xff4444) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float hpPercent;
        uniform vec3 barColor;
        void main() {
          float edge = smoothstep(0.0, 0.02, vUv.x) * smoothstep(0.0, 0.02, 1.0 - vUv.x)
                     * smoothstep(0.0, 0.1, vUv.y) * smoothstep(0.0, 0.1, 1.0 - vUv.y);
          vec3 bgColor = vec3(0.15, 0.05, 0.05);
          float hp = step(vUv.x, hpPercent);
          vec3 col = mix(bgColor, barColor, hp);
          col *= 0.7 + edge * 0.3;
          gl_FragColor = vec4(col, 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    var bar = new THREE.Mesh(barGeo, barMat);
    bar.renderOrder = 999;
    bar.material.depthTest = false;
    bar.visible = false;
    this.scene.add(bar);
    return bar;
  }

  update(dt, playerPos, world, echoSystem) {
    if (this.state === 'dead') return;

    this.stateTimer += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);

    // Update health bar
    const hpPct = this.hp / this.maxHp;
    this.healthBar.material.uniforms.hpPercent.value = hpPct;
    if (hpPct < 1 && this.state !== 'dead') {
      this.healthBar.visible = true;
      this.healthBar.position.copy(this.mesh.position);
      this.healthBar.position.y += this.type === EnemyType.BOSS ? 5 : 2.5;
      this.healthBar.lookAt(this.healthBar.position.clone().add(
        new THREE.Vector3(0, 0, 1)
      ));
    } else {
      this.healthBar.visible = false;
    }

    const distToPlayer = this.position.distanceTo(playerPos);

    // AI State Machine
    switch (this.state) {
      case 'idle':
        if (distToPlayer < this.detectionRange) {
          this.state = 'chase';
          this.target = playerPos.clone();
        } else if (this.stateTimer > this.patrolTimer) {
          this.state = 'patrol';
          this.stateTimer = 0;
        }
        break;

      case 'patrol':
        this.position.x += this.patrolDir.x * this.stats.speed * 0.4 * dt;
        this.position.z += this.patrolDir.z * this.stats.speed * 0.4 * dt;
        this.mesh.rotation.y = Math.atan2(this.patrolDir.x, this.patrolDir.z);

        if (distToPlayer < this.detectionRange) {
          this.state = 'chase';
          this.target = playerPos.clone();
        } else if (this.stateTimer > this.patrolTimer) {
          this.patrolDir.set(
            (Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2
          ).normalize();
          this.stateTimer = 0;
        }
        break;

      case 'chase':
        // Move toward player
        this.target = playerPos.clone();

        // React to echoes
        if (echoSystem) {
          const echoes = echoSystem.getEchoesNear(this.position, 8);
          if (echoes.length > 0 && Math.random() < 0.3) {
            // Distracted by echo
            const echo = echoes[0];
            this.target = echo.mesh.position.clone();
          }
        }

        const toTarget = new THREE.Vector3().subVectors(this.target, this.position);
        toTarget.y = 0;
        const targetDist = toTarget.length();

        if (targetDist > this.stats.attackRange) {
          toTarget.normalize();
          this.position.x += toTarget.x * this.stats.speed * dt;
          this.position.z += toTarget.z * this.stats.speed * dt;
          this.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        } else if (this.attackCooldown <= 0) {
          // Attack!
          this.state = 'attack';
          this.stateTimer = 0;
        }

        if (distToPlayer > this.detectionRange * 1.5) {
          this.state = 'patrol';
          this.stateTimer = 0;
        }
        break;

      case 'attack':
        // Attack animation/behavior
        const attackDuration = this.type === EnemyType.BOSS ? 1.2 : 0.5;
        if (this.stateTimer > attackDuration) {
          // Deal damage
          if (distToPlayer < this.stats.attackRange + 1) {
            // Damage will be applied by combat system
            this._attackDealt = true;
          }
          this.attackCooldown = this.type === EnemyType.BOSS ? 2 : 1.5;
          this.state = 'chase';
        }

        // Weapon swing animation
        if (this._weapon) {
          const progress = this.stateTimer / attackDuration;
          this._weapon.rotation.z = -0.8 + Math.sin(progress * Math.PI) * 1.6;
        }
        break;

      case 'stagger':
        if (this.stateTimer > 0.5) {
          this.state = 'chase';
        }
        break;
    }

    // Flying enemies hover
    if (this.type === EnemyType.FLYING) {
      this.position.y = 3 + Math.sin(performance.now() * 0.003) * 0.5;
      if (this.wingL) this.wingL.rotation.z = Math.sin(performance.now() * 0.01) * 0.3;
      if (this.wingR) this.wingR.rotation.z = -Math.sin(performance.now() * 0.01) * 0.3;
    }

    // Gravity for grounded enemies
    if (this.type !== EnemyType.FLYING) {
      const groundY = world ? world.getGroundHeight(this.position.x, this.position.z) : 0;
      if (this.position.y > groundY + 0.1) {
        this.velocity.y -= 20 * dt;
        this.position.y += this.velocity.y * dt;
        if (this.position.y <= groundY) {
          this.position.y = groundY;
          this.velocity.y = 0;
          this.onGround = true;
        }
      } else {
        this.position.y = groundY;
        this.onGround = true;
      }
    }

    this.mesh.position.copy(this.position);
  }

  takeDamage(amount, knockbackDir, knockbackForce) {
    if (this.state === 'dead') return 0;

    this.hp -= amount;
    this.staggerAccum += amount;

    // Knockback
    if (knockbackDir) {
      this.position.x += knockbackDir.x * knockbackForce;
      this.position.z += knockbackDir.z * knockbackForce;
    }

    // Hit flash
    this.hitFlashTimer = 0.15;
    if (this._bodyMesh) {
      this._bodyMesh.material.emissive = new THREE.Color(0xff0000);
      this._bodyMesh.material.emissiveIntensity = 1;
    }

    // Stagger check
    if (this.staggerAccum >= this.staggerThreshold && this.type !== EnemyType.BOSS) {
      this.state = 'stagger';
      this.stateTimer = 0;
      this.staggerAccum = 0;
    }

    if (this.hp <= 0) {
      this.state = 'dead';
      this._onDeath();
    }

    return amount;
  }

  _onDeath() {
    // Death animation - fade out
    const startTime = performance.now();
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / 0.8, 1);
      this.mesh.position.y -= 0.03;
      this.mesh.children.forEach(c => {
        if (c.material && c.material.opacity !== undefined) {
          c.material.transparent = true;
          c.material.opacity = 1 - progress;
        }
      });
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.dispose();
      }
    };
    animate();
  }

  isDead() { return this.state === 'dead'; }
  isAttacking() { return this.state === 'attack' && this._attackDealt; }
  consumeAttack() { const v = this._attackDealt; this._attackDealt = false; return v; }
  getAttackDamage() { return this.stats.damage; }

  dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.traverse(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
          else c.material.dispose();
        }
      });
    }
    if (this.healthBar) {
      this.scene.remove(this.healthBar);
      this.healthBar.geometry.dispose();
      this.healthBar.material.dispose();
    }
  }
}

export { Enemy, EnemyType };
