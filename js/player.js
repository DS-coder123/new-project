// === PLAYER CONTROLLER ===
// Third-person character: movement, physics, combat state, animations

import * as THREE from 'three';
import { PHYSICS, PLAYER_STATS, COMBAT, ANIM } from './config.js';

const State = {
  IDLE: 'idle',
  WALK: 'walk',
  SPRINT: 'sprint',
  JUMP: 'jump',
  FALL: 'fall',
  DODGE: 'dodge',
  CLIMB: 'climb',
  LEDGE: 'ledge',
  LIGHT_ATTACK: 'lightAttack',
  HEAVY_ATTACK: 'heavyAttack',
  AIR_ATTACK: 'airAttack',
  BLOCK: 'block',
  PARRY: 'parry',
  HIT_STUN: 'hitStun',
  DEAD: 'dead',
};

class Player {
  constructor(scene, input) {
    this.scene = scene;
    this.input = input;

    // Stats
    this.hp = PLAYER_STATS.MAX_HP;
    this.maxHp = PLAYER_STATS.MAX_HP;
    this.stamina = PLAYER_STATS.MAX_STAMINA;
    this.maxStamina = PLAYER_STATS.MAX_STAMINA;

    // Physics
    this.position = new THREE.Vector3(0, 10, 0);
    this.velocity = new THREE.Vector3();
    this.moveDir = new THREE.Vector3();
    this.facingAngle = 0; // world Y rotation
    this.onGround = false;
    this.wallNormal = null;
    this.climbWall = null;

    // State machine
    this.state = State.IDLE;
    this.prevState = State.IDLE;
    this.stateTime = 0;
    this.stateLocked = false;

    // Dodge
    this.dodgeCooldown = 0;
    this.dodgeDir = new THREE.Vector3();
    this.isInvincible = false;

    // Combat
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isBlocking = false;
    this.attackHit = false; // has current attack landed?
    this.parryWindow = 0;

    // Climbing
    this.climbStamina = 0;
    this.ledgeHanging = false;

    // Slowmo
    this.slowmoTimer = 0;

    // Visual body
    this.body = this._createBody();
    this.scene.add(this.body);

    // Trail for dodge
    this.trailMeshes = [];
  }

  _createBody() {
    var group = new THREE.Group();

    // Body (torso)
    var bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8);
    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.5, metalness: 0.3 });
    var torso = new THREE.Mesh(bodyGeo, bodyMat);
    torso.position.y = 1.2;
    torso.castShadow = true;
    group.add(torso);

    // Head
    var headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    var headMat = new THREE.MeshStandardMaterial({ color: 0xffddaa, roughness: 0.6 });
    var head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    head.castShadow = true;
    group.add(head);

    // Legs
    var legGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 8);
    var legMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.5 });
    var leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.15, 0.4, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    var rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.15, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);
    this.legL = leftLeg;
    this.legR = rightLeg;

    // Arms
    var armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.6, 8);
    var armMat = new THREE.MeshStandardMaterial({ color: 0x334466, roughness: 0.5 });
    var leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.35, 1.3, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    var rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.35, 1.3, 0);
    rightArm.castShadow = true;
    group.add(rightArm);
    this.armL = leftArm;
    this.armR = rightArm;

    // Weapon (sword on back when idle)
    var bladeGeo = new THREE.BoxGeometry(0.06, 0.8, 0.03);
    var bladeMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, roughness: 0.2, metalness: 0.9, emissive: 0x112244, emissiveIntensity: 0.3 });
    this.weapon = new THREE.Mesh(bladeGeo, bladeMat);
    this.weapon.position.set(0, 0.4, -0.1);
    this.weapon.rotation.x = -0.3;
    this.weapon.castShadow = true;
    group.add(this.weapon);

    // Guard
    var guardGeo = new THREE.BoxGeometry(0.15, 0.06, 0.04);
    var guardMat = new THREE.MeshStandardMaterial({ color: 0xccaadd, roughness: 0.3, metalness: 0.8 });
    var guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0;
    this.weapon.add(guard);

    return group;
  }

  update(dt, world) {
    if (this.state === State.DEAD) return;

    this.stateTime += dt;
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) this.comboCount = 0;
    this.slowmoTimer = Math.max(0, this.slowmoTimer - dt);

    // Stamina regen
    if (this.stamina < this.maxStamina && !this.isBlocking) {
      const regenRate = PLAYER_STATS.STAMINA_REGEN;
      this.stamina = Math.min(this.maxStamina, this.stamina + regenRate * dt);
    }

    const move = this.input.getMove();

    switch (this.state) {
      case State.IDLE:
      case State.WALK:
      case State.SPRINT:
        this._updateGroundMovement(dt, move, world);
        break;
      case State.JUMP:
      case State.FALL:
        this._updateAirMovement(dt, move, world);
        break;
      case State.DODGE:
        this._updateDodge(dt);
        break;
      case State.CLIMB:
        this._updateClimb(dt, move);
        break;
      case State.LIGHT_ATTACK:
      case State.HEAVY_ATTACK:
      case State.AIR_ATTACK:
        this._updateAttackState(dt);
        break;
      case State.BLOCK:
        this._updateBlock(dt, move);
        break;
      case State.HIT_STUN:
        this._updateHitStun(dt);
        break;
    }

    // Apply gravity in air states
    if ([State.JUMP, State.FALL, State.AIR_ATTACK].includes(this.state)) {
      this.velocity.y -= PHYSICS.GRAVITY * dt;
      this.position.y += this.velocity.y * dt;
      this._checkGround(world);
    }

    // Update body position
    this.body.position.copy(this.position);
    // Smooth facing
    if (this.state !== State.DODGE && this.state !== State.HIT_STUN) {
      const targetAngle = this._getTargetAngle(move);
      this._smoothRotate(targetAngle, dt);
    }
    this.body.rotation.y = this.facingAngle;

    // Animate body parts
    this._animateBody(dt);
  }

  _updateGroundMovement(dt, move, world) {
    const sprinting = this.input.isSprinting() && this.stamina > 0 && move.magnitude > 0.5;
    const speed = sprinting ? PHYSICS.PLAYER_SPEED * PHYSICS.SPRINT_MULTIPLIER : PHYSICS.PLAYER_SPEED;

    // Sprint stamina drain
    if (sprinting) {
      this.stamina = Math.max(0, this.stamina - PLAYER_STATS.STAMINA_SPRINT_COST * dt);
    }

    // Movement
    const camDir = this._getCameraDirection();
    this.moveDir.set(
      move.x * camDir.x + move.z * camDir.z,
      0,
      move.x * (-camDir.z) + move.z * camDir.x
    );
    if (this.moveDir.lengthSq() > 0) this.moveDir.normalize();

    this.position.x += this.moveDir.x * speed * dt * move.magnitude;
    this.position.z += this.moveDir.z * speed * dt * move.magnitude;

    // State transitions
    if (sprinting) {
      this._setState(State.SPRINT);
    } else if (move.magnitude > 0.05) {
      this._setState(State.WALK);
    } else {
      this._setState(State.IDLE);
    }

    // Jump
    if (this.input.jumpPressed() && this.stamina >= 10) {
      this.velocity.y = PHYSICS.JUMP_FORCE;
      this.onGround = false;
      this._setState(State.JUMP);
      return;
    }

    // Dodge
    if (this.input.dodgePressed() && this.dodgeCooldown <= 0 && this.stamina >= PLAYER_STATS.STAMINA_DODGE_COST) {
      this._startDodge(move);
      return;
    }

    // Attack
    if (this.input.lightAttack() && this.stamina >= PLAYER_STATS.STAMINA_ATTACK_COST) {
      this._startAttack('light');
      return;
    }
    if (this.input.heavyAttack() && this.stamina >= PLAYER_STATS.STAMINA_HEAVY_COST) {
      this._startAttack('heavy');
      return;
    }

    // Block
    if (this.input.blockHeld()) {
      this._setState(State.BLOCK);
      this.isBlocking = true;
      this.parryWindow = COMBAT.PARRY_WINDOW;
      return;
    } else {
      this.isBlocking = false;
      this.parryWindow = Math.max(0, this.parryWindow - dt);
    }

    // Gravity
    if (!this.onGround) {
      this.velocity.y = 0;
      this._setState(State.FALL);
    }
  }

  _updateAirMovement(dt, move, world) {
    const speed = PHYSICS.PLAYER_SPEED * PHYSICS.AIR_CONTROL;
    const camDir = this._getCameraDirection();
    this.moveDir.set(
      move.x * camDir.x + move.z * camDir.z,
      0,
      move.x * (-camDir.z) + move.z * camDir.x
    );
    if (this.moveDir.lengthSq() > 0) this.moveDir.normalize();

    this.position.x += this.moveDir.x * speed * dt * move.magnitude;
    this.position.z += this.moveDir.z * speed * dt * move.magnitude;

    if (this.velocity.y > 0) this._setState(State.JUMP);

    // Air attack
    if (this.input.lightAttack() && this.stamina >= PLAYER_STATS.STAMINA_ATTACK_COST) {
      this._setState(State.AIR_ATTACK);
      this.stamina -= PLAYER_STATS.STAMINA_ATTACK_COST;
      this.stateTime = 0;
      this.attackHit = false;
      this._setStateLock(ANIM.LIGHT_ATTACK);
    }
  }

  _startDodge(move) {
    this.stamina -= PLAYER_STATS.STAMINA_DODGE_COST;
    this.dodgeCooldown = PHYSICS.DODGE_COOLDOWN;
    this.isInvincible = true;

    const camDir = this._getCameraDirection();
    if (move.magnitude > 0.1) {
      this.dodgeDir.set(
        move.x * camDir.x + move.z * camDir.z,
        0,
        move.x * (-camDir.z) + move.z * camDir.x
      ).normalize();
    } else {
      this.dodgeDir.set(
        Math.sin(this.facingAngle),
        0,
        Math.cos(this.facingAngle)
      );
    }
    this._setState(State.DODGE);
    this._setStateLock(PHYSICS.DODGE_DURATION);
  }

  _updateDodge(dt) {
    const speed = PHYSICS.DODGE_FORCE;
    this.position.x += this.dodgeDir.x * speed * dt;
    this.position.z += this.dodgeDir.z * speed * dt;

    if (this.stateTime >= PHYSICS.DODGE_DURATION) {
      this.isInvincible = false;
      this._setState(State.IDLE);
    }
  }

  _updateClimb(dt, move) {
    this.climbStamina -= 8 * dt;
    if (this.climbStamina <= 0 || this.input.jumpPressed()) {
      this.velocity.y = PHYSICS.JUMP_FORCE * 0.6;
      this._setState(State.JUMP);
      this.onGround = false;
      return;
    }
    this.position.y += move.z * PHYSICS.CLIMB_SPEED * dt;
    if (this.position.y > this.climbWall.maxY) {
      // Reach top — pull up
      this.position.y = this.climbWall.maxY + 0.2;
      this.position.x += this.climbWall.normal.x * 0.5;
      this.position.z += this.climbWall.normal.z * 0.5;
      this.onGround = true;
      this._setState(State.IDLE);
    }
  }

  _startAttack(type) {
    const isLight = type === 'light';
    if (isLight) {
      this.stamina -= PLAYER_STATS.STAMINA_ATTACK_COST;
      this._setState(State.LIGHT_ATTACK);
      this._setStateLock(ANIM.LIGHT_ATTACK);
    } else {
      this.stamina -= PLAYER_STATS.STAMINA_HEAVY_COST;
      this._setState(State.HEAVY_ATTACK);
      this._setStateLock(ANIM.HEAVY_ATTACK);
    }
    this.stateTime = 0;
    this.attackHit = false;
  }

  _updateAttackState(dt) {
    if (!this.stateLocked) {
      this._setState(this.onGround ? State.IDLE : State.FALL);
    }
  }

  _updateBlock(dt, move) {
    if (!this.input.blockHeld()) {
      this.isBlocking = false;
      this._setState(State.IDLE);
      return;
    }
    // Slow walk while blocking
    if (move.magnitude > 0.05) {
      const speed = PHYSICS.PLAYER_SPEED * 0.4;
      const camDir = this._getCameraDirection();
      this.position.x += (move.x * camDir.x + move.z * camDir.z) * speed * dt;
      this.position.z += (move.x * (-camDir.z) + move.z * camDir.x) * speed * dt;
    }
    this.stamina = Math.max(0, this.stamina - PLAYER_STATS.STAMINA_BLOCK_COST * dt);
    this.parryWindow = Math.max(0, this.parryWindow - dt);

    // Dodge cancel
    if (this.input.dodgePressed() && this.dodgeCooldown <= 0 && this.stamina >= PLAYER_STATS.STAMINA_DODGE_COST) {
      this.isBlocking = false;
      this._startDodge(move);
    }
  }

  _updateHitStun(dt) {
    if (!this.stateLocked) {
      this._setState(State.IDLE);
    }
  }

  takeDamage(amount, attackerPos, knockbackForce = 3) {
    if (this.isInvincible || this.state === State.DEAD) return 0;

    let finalDmg = amount;

    // Block reduction
    if (this.isBlocking && this.stamina > 0) {
      finalDmg *= (1 - COMBAT.BLOCK_DAMAGE_REDUCTION);
      this.stamina = Math.max(0, this.stamina - amount * 0.5);
    }

    // Parry check
    if (this.parryWindow > 0) {
      finalDmg = 0;
      this._setState(State.PARRY);
      this._setStateLock(0.5);
      // Stagger the attacker (handled externally)
      return -1; // signal parry
    }

    // Perfect dodge check (dodging through attack)
    if (this.state === State.DODGE && this.stateTime < COMBAT.PERFECT_DODGE_WINDOW) {
      finalDmg = 0;
      this.slowmoTimer = COMBAT.CRITICAL_SLOWMO_DURATION;
      return -2; // signal perfect dodge
    }

    this.hp = Math.max(0, this.hp - finalDmg);

    // Knockback
    if (attackerPos) {
      const dir = new THREE.Vector3().subVectors(this.position, attackerPos).normalize();
      this.velocity.x = dir.x * knockbackForce;
      this.velocity.z = dir.z * knockbackForce;
    }

    // Hit stun
    this._setState(State.HIT_STUN);
    this._setStateLock(ANIM.HIT_STUN);

    if (this.hp <= 0) {
      this._setState(State.DEAD);
      this._setStateLock(ANIM.DEATH);
    }

    return finalDmg;
  }

  addComboHit() {
    this.comboCount++;
    this.comboTimer = COMBAT.COMBO_TIMEOUT;
    // Combo increases damage slightly
    const bonus = Math.min(this.comboCount * 3, 30);
    return COMBAT.LIGHT_DAMAGE + bonus;
  }

  getAttackDamage() {
    switch (this.state) {
      case State.LIGHT_ATTACK: return COMBAT.LIGHT_DAMAGE + Math.min(this.comboCount * 3, 30);
      case State.HEAVY_ATTACK: return COMBAT.HEAVY_DAMAGE;
      case State.AIR_ATTACK: return COMBAT.AIR_DAMAGE;
      default: return 0;
    }
  }

  getAttackRange() {
    if (this.state === State.HEAVY_ATTACK) return 2.8;
    return 2.2;
  }

  getAttackAngle() {
    if (this.state === State.HEAVY_ATTACK) return Math.PI * 0.5;
    return Math.PI * 0.35;
  }

  isInAttackWindow() {
    if (![State.LIGHT_ATTACK, State.HEAVY_ATTACK, State.AIR_ATTACK].includes(this.state)) return false;
    if (this.attackHit) return false;
    // Attack is active during middle portion of animation
    const progress = this.stateTime / (this.state === State.HEAVY_ATTACK ? ANIM.HEAVY_ATTACK : ANIM.LIGHT_ATTACK);
    return progress > 0.15 && progress < 0.65;
  }

  _checkGround(world) {
    if (!world) return;
    const groundY = world.getGroundHeight(this.position.x, this.position.z);
    if (this.position.y <= groundY) {
      this.position.y = groundY;
      this.velocity.y = 0;
      if (!this.onGround) {
        this.onGround = true;
        if (this.state === State.FALL || this.state === State.JUMP || this.state === State.AIR_ATTACK) {
          this._setState(State.IDLE);
        }
      }
    } else {
      this.onGround = false;
      if (this.state === State.IDLE || this.state === State.WALK || this.state === State.SPRINT) {
        this._setState(State.FALL);
      }
    }
  }

  tryClimb(wallInfo) {
    if (this.state === State.CLIMB) return;
    if (this.stamina < 20) return;
    this.climbWall = wallInfo;
    this.climbStamina = 100;
    this._setState(State.CLIMB);
    this.velocity.set(0,0,0);
  }

  tryLedgeGrab(ledgePos) {
    this.position.copy(ledgePos);
    this.position.y += 0.5;
    this.velocity.set(0,0,0);
    this.onGround = true;
    this._setState(State.IDLE);
  }

  _setState(newState) {
    if (this.state === newState) return;
    if (this.stateLocked && newState !== State.HIT_STUN) return;
    this.prevState = this.state;
    this.state = newState;
    this.stateTime = 0;
    this.stateLocked = false;
  }

  _setStateLock(duration) {
    this.stateLocked = true;
    setTimeout(() => { this.stateLocked = false; }, duration * 1000);
  }

  _getCameraDirection() {
    // Derived from the camera's forward vector (injected by Camera system)
    if (this._camForward) return this._camForward;
    return new THREE.Vector3(0, 0, 1);
  }

  setCameraForward(forward) { this._camForward = forward; }

  _getTargetAngle(move) {
    if (move.magnitude < 0.05) return this.facingAngle;
    const camDir = this._getCameraDirection();
    const target = Math.atan2(
      move.x * camDir.x + move.z * camDir.z,
      move.x * (-camDir.z) + move.z * camDir.x
    );
    return target;
  }

  _smoothRotate(target, dt) {
    // Smooth angle interpolation
    let diff = target - this.facingAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facingAngle += diff * Math.min(15 * dt, 1);
  }

  _animateBody(dt) {
    const t = performance.now() * 0.001;

    // Walk/run bob
    if (this.state === State.WALK || this.state === State.SPRINT) {
      const bobSpeed = this.state === State.SPRINT ? 14 : 8;
      const bobAmp = this.state === State.SPRINT ? 0.08 : 0.04;
      this.legL.rotation.x = Math.sin(t * bobSpeed) * bobAmp * 4;
      this.legR.rotation.x = Math.sin(t * bobSpeed + Math.PI) * bobAmp * 4;
      this.armL.rotation.x = Math.sin(t * bobSpeed + Math.PI) * bobAmp * 3;
      this.armR.rotation.x = Math.sin(t * bobSpeed) * bobAmp * 3;
    } else if (this.state === State.IDLE) {
      // Gentle idle sway
      this.legL.rotation.x *= 0.9;
      this.legR.rotation.x *= 0.9;
      this.armL.rotation.x = Math.sin(t * 2) * 0.02;
      this.armR.rotation.x = Math.sin(t * 2 + Math.PI) * 0.02;
    }

    // Dodge roll
    if (this.state === State.DODGE) {
      this.body.rotation.z += (1.5 - this.body.rotation.z) * 20 * dt;
      // Trail effect
      if (this.stateTime < PHYSICS.DODGE_DURATION * 0.5) {
        this._spawnTrail();
      }
    } else {
      this.body.rotation.z *= 0.85;
    }

    // Attack animations
    if (this.state === State.LIGHT_ATTACK) {
      const progress = this.stateTime / ANIM.LIGHT_ATTACK;
      this.weapon.rotation.z = -Math.PI * 0.8 + progress * Math.PI * 1.6;
      this.armR.rotation.z = this.weapon.rotation.z * 0.5;
    } else if (this.state === State.HEAVY_ATTACK) {
      const progress = this.stateTime / ANIM.HEAVY_ATTACK;
      // Wind up then slam
      if (progress < 0.4) {
        this.weapon.rotation.z = -0.5 - progress * 2;
      } else {
        this.weapon.rotation.z = -1.3 + (progress - 0.4) * 4.5;
      }
      this.armR.rotation.z = this.weapon.rotation.z * 0.4;
    } else if (this.state !== State.LIGHT_ATTACK && this.state !== State.HEAVY_ATTACK) {
      // Reset weapon
      this.weapon.rotation.z += (0 - this.weapon.rotation.z) * 10 * dt;
      this.armR.rotation.z = this.weapon.rotation.z * 0.3;
    }

    // Block pose
    if (this.isBlocking) {
      this.weapon.rotation.z = -0.4;
      this.armL.rotation.z = -0.6;
      this.armR.rotation.z = 0.5;
    }

    // Hit stun
    if (this.state === State.HIT_STUN) {
      this.body.position.x += Math.sin(t * 30) * 0.02;
    }
  }

  _spawnTrail() {
    // Ghost trail behind player during dodge
    var trailGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.5, 6);
    var trailMat = new THREE.MeshBasicMaterial({
      color: 0x4dc9f6,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    var trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.copy(this.position);
    trail.rotation.y = this.facingAngle;
    this.scene.add(trail);
    this.trailMeshes.push({ mesh: trail, born: performance.now() });
  }

  updateTrails(now) {
    for (let i = this.trailMeshes.length - 1; i >= 0; i--) {
      const t = this.trailMeshes[i];
      const age = (now - t.born) / 1000;
      t.mesh.material.opacity = Math.max(0, 0.3 - age * 0.6);
      t.mesh.scale.multiplyScalar(0.95);
      if (age > 0.5) {
        this.scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        t.mesh.material.dispose();
        this.trailMeshes.splice(i, 1);
      }
    }
  }

  reset(position) {
    this.position.copy(position || new THREE.Vector3(0, 5, 0));
    this.velocity.set(0,0,0);
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.onGround = false;
    this._setState(State.IDLE);
    this.isInvincible = false;
    this.isBlocking = false;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  dispose() {
    // Cleanup trails
    this.trailMeshes.forEach(t => {
      this.scene.remove(t.mesh);
      t.mesh.geometry.dispose();
      t.mesh.material.dispose();
    });
    this.scene.remove(this.body);
  }
}

export { Player, State as PlayerState };
