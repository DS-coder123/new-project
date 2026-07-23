// === js/config.js ===
// === ECHO FORGE CONFIG ===
// All tunable constants in one place

const GAME = {
  TITLE: 'ECHO FORGE',
  VERSION: '0.1.0',
};

const PHYSICS = {
  GRAVITY: 25,
  PLAYER_SPEED: 8,
  SPRINT_MULTIPLIER: 1.7,
  JUMP_FORCE: 12,
  DODGE_FORCE: 18,
  DODGE_DURATION: 0.35,
  DODGE_COOLDOWN: 0.8,
  CLIMB_SPEED: 4,
  AIR_CONTROL: 0.3,
  GROUND_FRICTION: 8,
  PLAYER_HEIGHT: 1.8,
  PLAYER_RADIUS: 0.35,
};

const COMBAT = {
  LIGHT_DAMAGE: 15,
  HEAVY_DAMAGE: 35,
  AIR_DAMAGE: 25,
  PERFECT_DODGE_WINDOW: 0.2,
  PARRY_WINDOW: 0.3,
  BLOCK_DAMAGE_REDUCTION: 0.7,
  COMBO_TIMEOUT: 2.0,
  STAGGER_THRESHOLD: 60,
  CRITICAL_SLOWMO_DURATION: 1.5,
  CRITICAL_SLOWMO_SCALE: 0.3,
};

const PLAYER_STATS = {
  MAX_HP: 100,
  MAX_STAMINA: 100,
  STAMINA_REGEN: 25,
  STAMINA_DODGE_COST: 30,
  STAMINA_SPRINT_COST: 15,
  STAMINA_ATTACK_COST: 10,
  STAMINA_HEAVY_COST: 25,
  STAMINA_BLOCK_COST: 8,
};

const ECHO = {
  MAX_RECORDING_TIME: 15,
  MAX_SLOTS: 4,
  MAX_SIMULTANEOUS: 3,
  REPLAY_SPEED: 1.0,
  SAMPLE_RATE: 20, // snapshots per second
};

const ENEMY_STATS = {
  MELEE: { hp: 60, speed: 5, damage: 12, attackRange: 2, detectionRange: 15 },
  ARCHER: { hp: 35, speed: 3, damage: 18, attackRange: 20, detectionRange: 25 },
  MAGE: { hp: 40, speed: 3.5, damage: 22, attackRange: 18, detectionRange: 20 },
  FLYING: { hp: 50, speed: 7, damage: 15, attackRange: 3, detectionRange: 20 },
  ELITE: { hp: 150, speed: 6, damage: 25, attackRange: 2.5, detectionRange: 18 },
  BOSS: { hp: 600, speed: 5.5, damage: 35, attackRange: 3, detectionRange: 30 },
};

const INPUT = {
  MOUSE_SENSITIVITY: 0.003,
  GAMEPAD_DEADZONE: 0.15,
};

const CAMERA = {
  DEFAULT_DISTANCE: 5,
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 10,
  HEIGHT_OFFSET: 2.5,
  SMOOTH_SPEED: 8,
  COLLISION_RADIUS: 0.3,
  AIM_OFFSET: 0.5,
};

const WORLD = {
  MAP_SIZE: 200,
  SECTOR_SIZE: 50,
};

// Animation durations (seconds)
const ANIM = {
  LIGHT_ATTACK: 0.4,
  HEAVY_ATTACK: 0.8,
  DODGE: 0.35,
  HIT_STUN: 0.4,
  DEATH: 1.5,
};


// === js/input.js ===
// === INPUT SYSTEM ===
// Keyboard + Mouse + Gamepad abstraction


class InputSystem {
  constructor() {
    this.keys = {};
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, buttons: {} };
    this.mouseJustPressed = {};
    this.mouseJustReleased = {};
    this.gamepad = null;
    this.gamepadAxes = [0,0,0,0];
    this.gamepadButtons = {};
    this.gamepadJustPressed = {};
    this._prevKeys = {};
    this._prevMouse = {};
    this._prevGamepad = {};

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    this._init();
  }

  _init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  _onKeyDown(e) {
    if (!this.keys[e.code]) this.keysJustPressed[e.code] = true;
    this.keys[e.code] = true;
    // Prevent browser shortcuts
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    if (this.keys[e.code]) this.keysJustReleased[e.code] = true;
    this.keys[e.code] = false;
  }

  _onMouseMove(e) {
    this.mouse.dx += (e.movementX || 0);
    this.mouse.dy += (e.movementY || 0);
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _onMouseDown(e) {
    this.mouse.buttons[e.button] = true;
    this.mouseJustPressed[e.button] = true;
  }

  _onMouseUp(e) {
    this.mouse.buttons[e.button] = false;
    this.mouseJustReleased[e.button] = true;
  }

  _onContextMenu(e) { e.preventDefault(); }

  // Called once per frame AFTER all logic has consumed the frame's inputs
  endFrame() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    this.keysJustPressed = {};
    this.keysJustReleased = {};
    this.mouseJustPressed = {};
    this.mouseJustReleased = {};
    this.gamepadJustPressed = {};
    this._prevKeys = { ...this.keys };
    this._prevMouse = { ...this.mouse.buttons };
    this._prevGamepad = { ...this.gamepadButtons };
  }

  updateGamepad() {
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if (!gp) { this.gamepad = null; return; }
    this.gamepad = gp;
    this.gamepadAxes = [gp.axes[0], gp.axes[1], gp.axes[2], gp.axes[3]];
    const prev = this._prevGamepad;
    for (let i = 0; i < gp.buttons.length; i++) {
      const pressed = gp.buttons[i].pressed;
      this.gamepadButtons[i] = pressed;
      if (pressed && !prev[i]) this.gamepadJustPressed[i] = true;
    }
  }

  // Convenience queries
  isDown(code) { return !!this.keys[code] || !!this.gamepadButtons[this._gpMap(code)]; }
  justPressed(code) {
    return !!this.keysJustPressed[code] || !!this.gamepadJustPressed[this._gpMap(code)];
  }
  justReleased(code) {
    return !!this.keysJustReleased[code] || false;
  }
  mouseDown(btn) { return !!this.mouse.buttons[btn]; }
  mouseJustPressed(btn) { return !!this.mouseJustPressed[btn]; }
  mouseJustReleased(btn) { return !!this.mouseJustReleased[btn]; }

  // Movement input (normalized)
  getMove() {
    let x = 0, z = 0;
    // Keyboard
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) z -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) z += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    // Gamepad left stick
    if (this.gamepad) {
      const gx = this.gamepadAxes[0], gz = this.gamepadAxes[1];
      if (Math.abs(gx) > INPUT.GAMEPAD_DEADZONE) x = gx;
      if (Math.abs(gz) > INPUT.GAMEPAD_DEADZONE) z = gz;
    }
    // Normalize
    const len = Math.sqrt(x*x + z*z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, magnitude: Math.min(len, 1) };
  }

  isSprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight') ||
           (this.gamepad && this.gamepadButtons[8]); // L-stick click
  }

  jumpPressed() { return this.justPressed('Space') || (this.gamepad && this.gamepadJustPressed[0]); }
  dodgePressed() { return this.justPressed('AltLeft') || this.justPressed('AltRight') ||
                         (this.gamepad && this.gamepadJustPressed[2]); }
  lightAttack() { return this.mouseJustPressed(0) || (this.gamepad && this.gamepadJustPressed[5]); }
  heavyAttack() { return this.mouseJustPressed(2) || (this.gamepad && this.gamepadJustPressed[4]); }
  blockHeld() { return this.isDown('KeyQ') || (this.gamepad && this.gamepadButtons[4]); }
  lockOnPressed() { return this.justPressed('Tab') || (this.gamepad && this.gamepadJustPressed[9]); }
  interactPressed() { return this.justPressed('KeyE') || (this.gamepad && this.gamepadJustPressed[1]); }

  // Echo controls
  recordPressed() { return this.justPressed('KeyR'); }
  spawnEchoPressed(slot) {
    const keys = ['Digit1','Digit2','Digit3','Digit4','KeyF','KeyG','KeyH','KeyJ'];
    return this.justPressed(keys[slot]) || this.justPressed(keys[slot+4]);
  }

  pausePressed() { return this.justPressed('Escape') || (this.gamepad && this.gamepadJustPressed[11]); }

  _gpMap(code) {
    const map = {
      'Space': 0, 'KeyE': 1, 'AltLeft': 2, 'KeyQ': 4,
      'ShiftLeft': 8, 'Tab': 9, 'Escape': 11,
    };
    return map[code] ?? -1;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
  }
}



// === js/renderer.js ===
// === RENDERER ===
// Three.js scene setup, lighting, fog, post-processing prep


class Renderer {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    document.body.prepend(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a18);
    this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.00015);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 1, 0);

    // Lighting
    this._setupLighting();

    // Clock
    this.clock = new THREE.Clock();

    // Post-processing prep (separate scene for UI/effects)
    this.uiScene = new THREE.Scene();
    this.uiCamera = new THREE.OrthographicCamera(-1,1,1,-1,0.1,10);

    // Resize handler
    window.addEventListener('resize', () => this._onResize());

    // Performance
    this.fpsFrames = 0;
    this.fpsTime = 0;
    this.fps = 60;
  }

  _setupLighting() {
    // Ambient
    var amb = new THREE.AmbientLight(0x1a1a3e, 1.2);
    this.scene.add(amb);

    // Directional sun
    var sun = new THREE.DirectionalLight(0xffeedd, 3.5);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.bias = -0.0001;
    this.scene.add(sun);
    this.sun = sun;

    // Hemisphere
    var hemi = new THREE.HemisphereLight(0x8899cc, 0x223344, 0.8);
    this.scene.add(hemi);

    // Point lights for atmosphere
    this.atmoLights = [];
    const colors = [0x4dc9f6, 0xa78bfa, 0xf64d9b];
    for (let i = 0; i < 3; i++) {
      var pt = new THREE.PointLight(colors[i], 3, 30);
      pt.position.set(
        (Math.random() - 0.5) * 40,
        5 + Math.random() * 15,
        (Math.random() - 0.5) * 40
      );
      this.scene.add(pt);
      this.atmoLights.push(pt);
    }
  }

  update(dt) {
    // FPS counter
    this.fpsFrames++;
    this.fpsTime += dt;
    if (this.fpsTime >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsTime);
      this.fpsFrames = 0;
      this.fpsTime = 0;
      const el = document.getElementById('fps-counter');
      if (el) el.textContent = this.fps + ' FPS';
    }

    // Animate atmosphere lights
    const t = this.clock.getElapsedTime();
    for (let i = 0; i < this.atmoLights.length; i++) {
      const l = this.atmoLights[i];
      l.intensity = 2.5 + Math.sin(t * 0.7 + i * 2) * 1.5;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  getDelta() { return Math.min(this.clock.getDelta(), 0.1); }
  getElapsed() { return this.clock.getElapsedTime(); }
}



// === js/player.js ===
// === PLAYER CONTROLLER ===
// Third-person character: movement, physics, combat state, animations


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
    if (isNaN(dt) || dt <= 0 || dt > 1) dt = 0.016;
    if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
      this.position.set(0, 6, -10); this.velocity.set(0,0,0);
    }

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



// === js/camera.js ===
// === THIRD-PERSON CAMERA ===
// Smooth follow, collision detection, orbit via mouse


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
    if (isNaN(this.target.x) || isNaN(this.target.y) || isNaN(this.target.z)) return;
    if (isNaN(this.yaw)) this.yaw = 0;
    if (isNaN(this.pitch)) this.pitch = 0;
    if (isNaN(this.theta)) this.theta = 0;
    if (isNaN(this.phi)) this.phi = Math.PI * 0.25;

    // Mouse look
    var mdx = input.mouse.dx || 0; this.yaw -= mdx * CAMERA.MOUSE_SENSITIVITY * 100;
    var mdy = input.mouse.dy || 0; this.pitch -= mdy * CAMERA.MOUSE_SENSITIVITY * 100;
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
    if (isNaN(this.forward.x)) this.forward.set(0, 0, 1);
    return this.forward;
  }
}



// === js/world.js ===
// === WORLD ===
// Environment: terrain, platforms, structures, collision geometry


class World {
  constructor(scene) {
    this.scene = scene;
    this.groundMeshes = [];
    this.collisionObjects = [];
    this.platforms = [];
    this.structures = [];
    this.walls = [];
    this.decorations = [];

    this._buildWorld();
  }

  _buildWorld() {
    // Main ground plane
    this._createGround();

    // Temple arena
    this._createTempleArena();

    // Platforming section
    this._createPlatformSection();

    // Elevated walkways
    this._createWalkways();

    // Pillars and columns
    this._createPillars();

    // Walls and boundaries
    this._createBoundaries();

    // Decorative elements
    this._createDecorations();
  }

  _createGround() {
    // Large textured ground
    var groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
    // Add subtle height variation
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const dist = Math.sqrt(x*x + y*y) * 0.05;
      pos.setZ(i, Math.sin(x * 0.3) * Math.cos(y * 0.3) * 0.4 + Math.sin(dist) * 0.3);
    }
    groundGeo.computeVertexNormals();

    var groundMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3a,
      roughness: 0.8,
      metalness: 0.1,
    });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMeshes.push(ground);
    this.collisionObjects.push(ground);
  }

  _createTempleArena() {
    // Central arena — large circular platform
    var arenaGeo = new THREE.CylinderGeometry(12, 12.5, 0.4, 32);
    var arenaMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a4a,
      roughness: 0.5,
      metalness: 0.4,
    });
    var arena = new THREE.Mesh(arenaGeo, arenaMat);
    arena.position.set(0, 0.1, 0);
    arena.receiveShadow = true;
    arena.castShadow = true;
    this.scene.add(arena);
    this.collisionObjects.push(arena);
    this.structures.push({ mesh: arena, type: 'arena' });

    // Arena ring pattern
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      var pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0x5a5a6a,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0x111122,
        emissiveIntensity: 0.2,
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(
        Math.cos(angle) * 11,
        1.5,
        Math.sin(angle) * 11
      );
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.collisionObjects.push(pillar);
      this.structures.push({ mesh: pillar, type: 'pillar' });

      // Torch light on each pillar
      var flameGeo = new THREE.SphereGeometry(0.15, 8, 8);
      var flameMat = new THREE.MeshBasicMaterial({ color: 0xff8844 });
      var flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 1.7, 0);
      pillar.add(flame);
    }

    // Center crystal/statue
    var crystalGeo = new THREE.OctahedronGeometry(0.8, 0);
    var crystalMat = new THREE.MeshStandardMaterial({
      color: 0x4dc9f6,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x113355,
      emissiveIntensity: 0.6,
    });
    var crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.5;
    crystal.castShadow = true;
    this.scene.add(crystal);
    this.structures.push({ mesh: crystal, type: 'crystal' });

    // Floating particles around crystal
    for (let i = 0; i < 20; i++) {
      var pGeo = new THREE.SphereGeometry(0.05, 4, 4);
      var pMat = new THREE.MeshBasicMaterial({ color: 0x88ccff });
      var p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 3,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 3
      );
      p.userData = {
        baseY: p.position.y,
        speed: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        radius: 0.5 + Math.random() * 1.5,
        angle: Math.random() * Math.PI * 2,
      };
      this.scene.add(p);
      this.decorations.push(p);
    }
  }

  _createPlatformSection() {
    // Series of floating platforms for parkour
    const platformData = [
      { x: 15, y: 2, z: -5, w: 3, h: 0.3, d: 3 },
      { x: 19, y: 3.5, z: -5, w: 2.5, h: 0.3, d: 2.5 },
      { x: 23, y: 5, z: -5, w: 2, h: 0.3, d: 2 },
      { x: 27, y: 6.5, z: -3, w: 2, h: 0.3, d: 2 },
      { x: 31, y: 8, z: -1, w: 2.5, h: 0.3, d: 2.5 },
      { x: 34, y: 9.5, z: 1, w: 3, h: 0.3, d: 3 },
      { x: 36, y: 11, z: 3, w: 4, h: 0.3, d: 4 },
      // Descent platforms
      { x: 32, y: 8, z: 8, w: 2.5, h: 0.3, d: 2.5 },
      { x: 28, y: 5, z: 10, w: 2, h: 0.3, d: 2 },
      { x: 24, y: 2.5, z: 10, w: 3, h: 0.3, d: 3 },
    ];

    platformData.forEach((p, i) => {
      var platGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      var platMat = new THREE.MeshStandardMaterial({
        color: i % 3 === 0 ? 0x4a5a6a : i % 3 === 1 ? 0x5a4a5a : 0x4a6a5a,
        roughness: 0.4,
        metalness: 0.5,
      });
      var plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(p.x, p.y, p.z);
      plat.castShadow = true;
      plat.receiveShadow = true;
      plat.userData = { type: 'platform', index: i };
      this.scene.add(plat);
      this.collisionObjects.push(plat);
      this.platforms.push(plat);

      // Glowing edge highlight
      var edgeGeo = new THREE.EdgesGeometry(platGeo);
      var edgeLine = new THREE.LineSegments(
        edgeGeo,
        new THREE.LineBasicMaterial({ color: 0x4dc9f6, transparent: true, opacity: 0.3 })
      );
      plat.add(edgeLine);
    });
  }

  _createWalkways() {
    // Elevated bridge/walkway
    for (let i = 0; i < 6; i++) {
      var segGeo = new THREE.BoxGeometry(3, 0.25, 8);
      var segMat = new THREE.MeshStandardMaterial({
        color: 0x5a4a3a,
        roughness: 0.6,
        metalness: 0.3,
      });
      var seg = new THREE.Mesh(segGeo, segMat);
      seg.position.set(-15 + i * 6, 2.5, 15);
      seg.castShadow = true;
      seg.receiveShadow = true;
      this.scene.add(seg);
      this.collisionObjects.push(seg);
      this.structures.push({ mesh: seg, type: 'walkway' });

      // Support pillars
      var supGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 8);
      var supMat = new THREE.MeshStandardMaterial({ color: 0x4a4a5a, roughness: 0.5 });
      var supL = new THREE.Mesh(supGeo, supMat);
      supL.position.set(-15 + i * 6, 1.2, 12);
      this.scene.add(supL);
      this.collisionObjects.push(supL);
      var supR = new THREE.Mesh(supGeo, supMat);
      supR.position.set(-15 + i * 6, 1.2, 18);
      this.scene.add(supR);
      this.collisionObjects.push(supR);
    }
  }

  _createPillars() {
    const positions = [
      [-25, 0, -15], [25, 0, -15], [-25, 0, 15], [25, 0, 15],
      [-35, 0, 0], [35, 0, 0], [0, 0, -25], [0, 0, 25],
    ];

    positions.forEach(([x, _, z]) => {
      var pillarGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 8);
      var pillarMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a4e,
        roughness: 0.3,
        metalness: 0.7,
      });
      var pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(x, 2.8, z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);
      this.collisionObjects.push(pillar);
      this.structures.push({ mesh: pillar, type: 'pillar' });

      // Top light
      var topGeo = new THREE.SphereGeometry(0.2, 8, 8);
      var topMat = new THREE.MeshBasicMaterial({ color: 0xaaccff });
      var top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 3.2;
      pillar.add(top);
    });
  }

  _createBoundaries() {
    // Invisible walls (collision only)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.7,
      transparent: true,
      opacity: 0.5,
    });
    const boundaries = [
      { x: 0, y: 3, z: -50, w: 100, h: 6, d: 0.5 },
      { x: 0, y: 3, z: 50, w: 100, h: 6, d: 0.5 },
      { x: -50, y: 3, z: 0, w: 0.5, h: 6, d: 100 },
      { x: 50, y: 3, z: 0, w: 0.5, h: 6, d: 100 },
    ];

    boundaries.forEach(b => {
      var wallGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      var wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(b.x, b.y, b.z);
      this.scene.add(wall);
      this.collisionObjects.push(wall);
      this.walls.push(wall);
    });
  }

  _createDecorations() {
    // Scattered ruins/debris
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      // Skip central arena
      if (Math.sqrt(x*x + z*z) < 14) continue;

      const size = 0.2 + Math.random() * 0.8;
      var debrisGeo = Math.random() > 0.5
        ? new THREE.BoxGeometry(size, size * 0.5, size * 0.7)
        : new THREE.CylinderGeometry(size * 0.3, size * 0.4, size, 6);
      var debrisMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.65 + Math.random() * 0.1, 0.1, 0.2 + Math.random() * 0.2),
        roughness: 0.7,
      });
      var debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(x, size * 0.2, z);
      debris.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      debris.receiveShadow = true;
      this.scene.add(debris);
      this.decorations.push(debris);
    }

    // Floating crystal shards (atmosphere)
    for (let i = 0; i < 15; i++) {
      var shardGeo = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.5, 0);
      var shardMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.8, 0.5 + Math.random() * 0.3),
        roughness: 0.2,
        metalness: 0.8,
        emissive: new THREE.Color().setHSL(0.6, 0.8, 0.2),
        emissiveIntensity: 0.4,
      });
      var shard = new THREE.Mesh(shardGeo, shardMat);
      shard.position.set(
        (Math.random() - 0.5) * 60,
        2 + Math.random() * 10,
        (Math.random() - 0.5) * 60
      );
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shard.userData = {
        baseY: shard.position.y,
        floatSpeed: 0.3 + Math.random() * 1,
        floatAmp: 0.3 + Math.random() * 1.5,
        rotSpeed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };
      this.scene.add(shard);
      this.decorations.push(shard);
    }
  }

  update(dt) {
    const t = performance.now() * 0.001;

    // Animate floating decorations
    this.decorations.forEach(d => {
      if (d.userData.floatSpeed !== undefined) {
        d.position.y = d.userData.baseY + Math.sin(t * d.userData.floatSpeed + d.userData.phase) * d.userData.floatAmp;
        d.rotation.y += d.userData.rotSpeed * dt;
      }
      if (d.userData.angle !== undefined) {
        // Crystal particles
        d.userData.angle += d.userData.speed * dt;
        d.position.x = Math.cos(d.userData.angle) * d.userData.radius;
        d.position.z = Math.sin(d.userData.angle) * d.userData.radius;
        d.position.y = d.userData.baseY + Math.sin(t * d.userData.speed + d.userData.phase) * 0.5;
      }
    });
  }

  getGroundHeight(x, z) {
    // Simple ground height lookup — base ground at y=0
    let h = 0;

    // Check platforms
    for (const plat of this.platforms) {
      const px = plat.position.x, pz = plat.position.z;
      const hw = plat.geometry.parameters.width / 2;
      const hd = plat.geometry.parameters.depth / 2;
      if (Math.abs(x - px) < hw + 0.3 && Math.abs(z - pz) < hd + 0.3) {
        const top = plat.position.y + plat.geometry.parameters.height / 2;
        if (top > h && Math.abs(top - h) < 5) h = top;
      }
    }

    // Check structures that are walkable
    for (const s of this.structures) {
      if (s.type === 'arena') {
        const dx = x - s.mesh.position.x;
        const dz = z - s.mesh.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 12) {
          const top = s.mesh.position.y + 0.2;
          if (top > h) h = top;
        }
      }
    }

    return h;
  }

  isWalkable(x, z) {
    // Check if position is within bounds and not inside a wall
    if (Math.abs(x) > 48 || Math.abs(z) > 48) return false;
    return true;
  }
}



// === js/echo.js ===
// === ECHO SYSTEM ===
// Core mechanic: record player actions, spawn ghost echoes that replay them


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



// === js/enemies.js ===
// === ENEMY SYSTEM ===
// Multiple enemy classes: Melee, Archer, Mage, Flying, Elite, Boss


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



// === js/effects.js ===
// === VISUAL EFFECTS ===
// Particles, hit sparks, trails, slow-motion


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



// === js/audio.js ===
// === AUDIO SYSTEM ===
// Procedural sound effects via Web Audio API

class AudioSystem {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.6;
    this.oscillators = [];
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch(e) {
      console.warn('Web Audio not available', e);
    }
  }

  _playTone(freq, duration, type = 'sine', gain = 0.3, detune = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;

    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gainNode);
    gainNode.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);

    this.oscillators.push(osc);
    osc.onended = () => {
      const idx = this.oscillators.indexOf(osc);
      if (idx !== -1) this.oscillators.splice(idx, 1);
    };
  }

  _playNoise(duration, gain = 0.15, filterFreq = 3000) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.5;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // === Sound Effects ===

  swing() {
    this._playNoise(0.08, 0.1, 2000);
    this._playTone(400, 0.06, 'sawtooth', 0.08);
  }

  heavySwing() {
    this._playNoise(0.12, 0.15, 1500);
    this._playTone(200, 0.1, 'sawtooth', 0.12);
    this._playTone(80, 0.15, 'triangle', 0.1);
  }

  hit() {
    this._playNoise(0.06, 0.12, 4000);
    this._playTone(600, 0.04, 'square', 0.06);
  }

  heavyHit() {
    this._playNoise(0.1, 0.2, 3000);
    this._playTone(300, 0.08, 'sawtooth', 0.1);
    this._playTone(100, 0.12, 'triangle', 0.08);
  }

  block() {
    this._playTone(500, 0.08, 'triangle', 0.08);
    this._playTone(800, 0.06, 'triangle', 0.05, 5);
  }

  parry() {
    this._playTone(1200, 0.15, 'sine', 0.2);
    this._playTone(1800, 0.1, 'sine', 0.15, 10);
    this._playNoise(0.05, 0.08, 6000);
  }

  perfectDodge() {
    this._playTone(800, 0.15, 'sine', 0.15);
    this._playTone(1200, 0.1, 'sine', 0.12, 12);
    this._playTone(400, 0.2, 'triangle', 0.1);
  }

  dodge() {
    this._playNoise(0.08, 0.08, 2000);
    this._playTone(300, 0.06, 'sine', 0.06);
  }

  jump() {
    this._playTone(200, 0.1, 'sine', 0.06);
    this._playTone(400, 0.08, 'sine', 0.04, 3);
  }

  land() {
    this._playNoise(0.04, 0.08, 1500);
    this._playTone(100, 0.06, 'triangle', 0.06);
  }

  footstep() {
    this._playNoise(0.02, 0.03, 3000);
  }

  echoSpawn() {
    this._playTone(600, 0.3, 'sine', 0.12);
    this._playTone(900, 0.2, 'sine', 0.1, 8);
    this._playTone(1200, 0.15, 'sine', 0.08, 16);
    // Ethereal shimmer
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this._playTone(500 + i * 200, 0.2, 'sine', 0.04, i * 20);
      }, i * 80);
    }
  }

  echoFade() {
    this._playTone(400, 0.5, 'sine', 0.06);
    this._playTone(600, 0.4, 'sine', 0.05, -8);
  }

  recordStart() {
    this._playTone(300, 0.15, 'sine', 0.08);
    this._playTone(450, 0.1, 'triangle', 0.06, 5);
  }

  recordStop() {
    this._playTone(450, 0.1, 'sine', 0.06);
    this._playTone(300, 0.15, 'triangle', 0.08, -5);
  }

  enemyDeath() {
    this._playNoise(0.15, 0.1, 2000);
    this._playTone(400, 0.2, 'sawtooth', 0.08);
    this._playTone(200, 0.3, 'triangle', 0.06);
    this._playTone(100, 0.4, 'sine', 0.04);
  }

  bossIntro() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this._playTone(100 + i * 50, 0.4, 'sawtooth', 0.12);
      }, i * 150);
    }
    this._playNoise(0.3, 0.08, 1000);
  }

  playerHurt() {
    this._playNoise(0.1, 0.15, 2000);
    this._playTone(150, 0.2, 'sawtooth', 0.1);
  }

  criticalHit() {
    this._playTone(1500, 0.2, 'sine', 0.15);
    this._playTone(2000, 0.15, 'sine', 0.1, 20);
    this._playNoise(0.08, 0.1, 8000);
    // Slow-mo bass drop
    setTimeout(() => {
      this._playTone(60, 0.5, 'sine', 0.15);
    }, 80);
  }

  // Background drone (looping ambient)
  startAmbient() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Low drone
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    const droneGain = this.ctx.createGain();
    droneGain.gain.value = 0.04;
    drone.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start(now);
    this.ambientDrone = drone;
  }

  stopAmbient() {
    if (this.ambientDrone) {
      this.ambientDrone.stop();
      this.ambientDrone = null;
    }
  }

  setMasterVolume(v) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
  }

  dispose() {
    this.oscillators.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    if (this.ambientDrone) {
      try { this.ambientDrone.stop(); } catch(e) {}
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}



// === js/ui.js ===
// === UI ===
// HUD updates, menus, notifications

class UI {
  constructor() {
    this.elements = {};
    this._cacheElements();
  }

  _cacheElements() {
    const ids = [
      'hp-fill', 'hp-value', 'sp-fill', 'sp-value',
      'timeline-progress', 'timeline-time',
      'combo-display', 'combo-count',
      'echo-slots', 'fps-counter',
      'pause-menu', 'gameover-screen', 'gameover-stats',
      'loading-screen', 'loading-bar', 'loading-text',
      'slowmo-overlay', 'boss-intro', 'boss-name', 'boss-subtitle',
      'hud',
    ];
    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });

    // Echo slot buttons
    this.echoSlotEls = document.querySelectorAll('.echo-slot');

    // Damage vignette (create on the fly)
    if (!document.getElementById('damage-vignette')) {
      var dv = document.createElement('div');
      dv.id = 'damage-vignette';
      document.body.appendChild(dv);
    }
    this.elements['damage-vignette'] = document.getElementById('damage-vignette');
  }

  setLoading(percent, text) {
    const bar = this.elements['loading-bar'];
    const txt = this.elements['loading-text'];
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
  }

  hideLoading() {
    const el = this.elements['loading-screen'];
    if (el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.5s';
      setTimeout(() => { el.style.display = 'none'; }, 500);
    }
  }

  showHUD() {
    const hud = this.elements['hud'];
    if (hud) hud.style.display = 'block';
  }

  updateHealth(hp, maxHp) {
    const fill = this.elements['hp-fill'];
    const val = this.elements['hp-value'];
    if (!fill || !val) return;
    const pct = Math.max(0, hp / maxHp * 100);
    fill.style.width = pct + '%';
    val.textContent = Math.ceil(hp) + '/' + maxHp;

    // Color shift on low HP
    if (pct < 25) {
      fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    } else if (pct < 50) {
      fill.style.background = 'linear-gradient(90deg, #facc15, #eab308)';
    } else {
      fill.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
    }
  }

  updateStamina(sp, maxSp) {
    const fill = this.elements['sp-fill'];
    const val = this.elements['sp-value'];
    if (!fill || !val) return;
    fill.style.width = Math.max(0, sp / maxSp * 100) + '%';
    val.textContent = Math.ceil(sp) + '/' + maxSp;
  }

  updateEchoTimeline(recording, duration, maxDuration) {
    const progress = this.elements['timeline-progress'];
    const timeEl = this.elements['timeline-time'];
    if (!progress || !timeEl) return;

    if (recording) {
      progress.style.width = (duration / maxDuration * 100) + '%';
      const secs = Math.floor(duration);
      timeEl.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' +
        String(secs % 60).padStart(2, '0');
    } else {
      progress.style.width = '0%';
      timeEl.textContent = '00:00';
    }
  }

  updateEchoSlots(slots, activeRecording) {
    this.echoSlotEls.forEach((el, i) => {
      el.classList.remove('recording', 'saved');
      if (activeRecording !== null && activeRecording.slot === i) {
        el.classList.add('recording');
        el.textContent = '●';
      } else if (slots[i]) {
        el.classList.add('saved');
        el.textContent = (i + 1);
      } else {
        el.textContent = (i + 1);
      }
    });
  }

  updateCombo(count) {
    const display = this.elements['combo-display'];
    const countEl = this.elements['combo-count'];
    if (!display || !countEl) return;

    if (count > 1) {
      display.style.opacity = '1';
      countEl.textContent = count;
      // Scale animation
      countEl.style.transform = 'scale(1.3)';
      setTimeout(() => { countEl.style.transform = 'scale(1)'; }, 100);
    } else {
      display.style.opacity = '0';
    }
  }

  showDamageVignette(intensity = 0.5) {
    const dv = this.elements['damage-vignette'];
    if (dv) {
      dv.style.opacity = intensity;
      setTimeout(() => { dv.style.opacity = '0'; }, 200);
    }
  }

  showSlowmo(show) {
    const el = this.elements['slowmo-overlay'];
    if (el) el.style.display = show ? 'block' : 'none';
  }

  showPauseMenu() {
    const el = this.elements['pause-menu'];
    if (el) el.style.display = 'flex';
  }

  hidePauseMenu() {
    const el = this.elements['pause-menu'];
    if (el) el.style.display = 'none';
  }

  showGameOver(stats) {
    const el = this.elements['gameover-screen'];
    const statsEl = this.elements['gameover-stats'];
    if (el) el.style.display = 'flex';
    if (statsEl && stats) {
      statsEl.textContent = `Enemies Defeated: ${stats.kills || 0} | Echoes Used: ${stats.echoesUsed || 0} | Max Combo: ${stats.maxCombo || 0}`;
    }
  }

  hideGameOver() {
    const el = this.elements['gameover-screen'];
    if (el) el.style.display = 'none';
  }

  showBossIntro(name, subtitle) {
    const el = this.elements['boss-intro'];
    const nameEl = this.elements['boss-name'];
    const subEl = this.elements['boss-subtitle'];
    if (el) {
      el.style.display = 'flex';
      nameEl.textContent = name || '';
      subEl.textContent = subtitle || '';
      setTimeout(() => { el.style.display = 'none'; }, 3000);
    }
  }

  updateAbilityCooldowns(abilities) {
    const echoIcon = document.getElementById('ability-echo');
    const dashIcon = document.getElementById('ability-dash');
    const specIcon = document.getElementById('ability-special');

    if (echoIcon) echoIcon.className = 'ability-icon ' + (abilities.echo ? 'ready' : 'cooldown');
    if (dashIcon) dashIcon.className = 'ability-icon ' + (abilities.dash ? 'ready' : 'cooldown');
    if (specIcon) specIcon.className = 'ability-icon ' + (abilities.special ? 'ready' : 'cooldown');
  }

  updateMinimap(playerPos, enemies, worldSize = 100) {
    const canvas = document.getElementById('minimap');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const scale = w / worldSize;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, w, h);

    // Center on player
    const cx = w / 2, cy = h / 2;

    // Player dot
    ctx.fillStyle = '#4dc9f6';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    if (enemies) {
      enemies.forEach(e => {
        if (e.isDead && e.isDead()) return;
        const dx = (e.position.x - playerPos.x) * scale;
        const dy = (e.position.z - playerPos.z) * scale;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < w / 2) {
          ctx.fillStyle = e.type === 'BOSS' ? '#ff2266' : '#ff4444';
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
}



// === js/main.js ===
// === ECHO FORGE — MAIN GAME ORCHESTRATOR ===


class Game {
  constructor() {
    this.state = 'loading'; // loading, menu, playing, paused, gameover
    this.timeScale = 1;
    this.stats = { kills: 0, echoesUsed: 0, maxCombo: 0, totalDamage: 0 };

    // Systems (initialized in start)
    this.renderer = null;
    this.input = null;
    this.player = null;
    this.camera = null;
    this.world = null;
    this.echoSystem = null;
    this.enemies = [];
    this.effects = null;
    this.audio = null;
    this.ui = null;

    // Combat
    this.combatTimer = 0;

    // Start async
    this._init();
  }

  async _init() {
    this.ui = new UI();
    this.ui.setLoading(10, 'Initializing renderer...');

    // Small delay to let DOM settle
    await new Promise(r => setTimeout(r, 50));

    this.renderer = new Renderer();
    this.ui.setLoading(25, 'Creating world...');

    this.world = new World(this.renderer.scene);
    this.ui.setLoading(40, 'Setting up input...');

    this.input = new InputSystem();
    this.audio = new AudioSystem();
    this.effects = new Effects(this.renderer.scene);
    this.echoSystem = new EchoSystem(this.renderer.scene);

    this.ui.setLoading(55, 'Creating player...');

    this.player = new Player(this.renderer.scene, this.input);
    this.player.reset(new THREE.Vector3(0, 5, -10));

    this.ui.setLoading(70, 'Setting up camera...');

    this.camera = new ThirdPersonCamera(this.renderer.camera, this.renderer.renderer);

    this.ui.setLoading(85, 'Spawning enemies...');

    this._spawnInitialEnemies();

    this.ui.setLoading(100, 'Ready.');

    // Hide loading, show HUD
    await new Promise(r => setTimeout(r, 300));
    this.ui.hideLoading();
    this.ui.showHUD();

    // Request pointer lock on click
    this.renderer.canvas.addEventListener('click', () => {
      if (this.state === 'playing') {
        this.renderer.canvas.requestPointerLock();
      }
    });

    // Start game
    this.state = 'playing';
    this.audio.init();
    this.audio.startAmbient();
    this._gameLoop();
  }

  _spawnInitialEnemies() {
    // Arena enemies
    this._spawnEnemy(EnemyType.MELEE, new THREE.Vector3(5, 0, 3));
    this._spawnEnemy(EnemyType.MELEE, new THREE.Vector3(-5, 0, 5));
    this._spawnEnemy(EnemyType.ARCHER, new THREE.Vector3(10, 0, -8));
    this._spawnEnemy(EnemyType.ARCHER, new THREE.Vector3(-8, 0, -5));
    this._spawnEnemy(EnemyType.MAGE, new THREE.Vector3(0, 0, -15));
    this._spawnEnemy(EnemyType.FLYING, new THREE.Vector3(8, 3, 8));

    // Patrolling enemies
    this._spawnEnemy(EnemyType.MELEE, new THREE.Vector3(-20, 0, 10));
    this._spawnEnemy(EnemyType.MELEE, new THREE.Vector3(20, 0, -10));
    this._spawnEnemy(EnemyType.ELITE, new THREE.Vector3(30, 0, 15));
  }

  _spawnEnemy(type, pos) {
    const enemy = new Enemy(type, pos, this.renderer.scene);
    this.enemies.push(enemy);
    return enemy;
  }

  _gameLoop() {
    requestAnimationFrame(() => this._gameLoop());

    const rawDt = this.renderer.getDelta();
    const now = performance.now();

    if (this.state === 'gameover' || this.state === 'loading') {
      this.renderer.update(rawDt);
      return;
    }

    // Slow-motion from critical hits
    const playerSlowmo = this.player.slowmoTimer > 0;
    const dt = rawDt * (playerSlowmo ? COMBAT.CRITICAL_SLOWMO_SCALE : this.timeScale);

    // Input
    this.input.updateGamepad();

    // Pause toggle
    if (this.input.pausePressed()) {
      if (this.state === 'playing') {
        this.state = 'paused';
        this.ui.showPauseMenu();
        document.exitPointerLock();
      } else if (this.state === 'paused') {
        this.state = 'playing';
        this.ui.hidePauseMenu();
      }
    }

    if (this.state === 'paused') {
      this.renderer.render();
      this.input.endFrame();
      return;
    }

    // === UPDATE ===

    // Update world (decorations)
    this.world.update(dt);

    // Update camera
    if (this.camera) {
      this.camera.setTarget(this.player.position);
      this.camera.update(dt, this.input, this.world);
      this.player.setCameraForward(this.camera.getForward());
    }

    // Update player
    this.player.update(dt, this.world);
    this.player.updateTrails(now);

    // Record echo frame
    if (this.echoSystem.isRecording()) {
      this.echoSystem.recordFrame({
        position: this.player.position.clone(),
        velocity: this.player.velocity.clone(),
        facingAngle: this.player.facingAngle,
        state: this.player.state,
        isAttacking: this.player.isInAttackWindow(),
        attackDamage: this.player.getAttackDamage(),
        attackRange: this.player.getAttackRange(),
        attackAngle: this.player.getAttackAngle(),
        onGround: this.player.onGround,
      });
    }

    // Update echo system
    this.echoSystem.update(dt, now);

    // === ECHO CONTROLS ===
    if (this.input.recordPressed()) {
      if (this.echoSystem.isRecording()) {
        const rec = this.echoSystem.stopRecording();
        if (rec) {
          this.audio.recordStop();
          this.ui.updateEchoSlots(this.echoSystem.slots, null);
          this.stats.echoesUsed++;
        }
      } else {
        const slot = this.echoSystem.startRecording();
        if (slot !== false) {
          this.audio.recordStart();
          this.ui.updateEchoSlots(this.echoSystem.slots, this.echoSystem.activeRecording);
        }
      }
    }

    // Spawn echoes from slots
    for (let i = 0; i < ECHO_CFG.MAX_SLOTS; i++) {
      if (this.input.spawnEchoPressed(i)) {
        const echo = this.echoSystem.spawnEcho(i);
        if (echo) {
          this.audio.echoSpawn();
          this.effects.spawnEchoEffect(echo.mesh.position);
        }
      }
    }

    // === COMBAT SYSTEM ===

    // Player attacks hit enemies
    if (this.player.isInAttackWindow()) {
      const attackPos = this.player.position.clone();
      const attackForward = new THREE.Vector3(
        Math.sin(this.player.facingAngle), 0, Math.cos(this.player.facingAngle)
      );
      const range = this.player.getAttackRange();
      const angle = this.player.getAttackAngle();

      for (const enemy of this.enemies) {
        if (enemy.isDead()) continue;
        const toEnemy = new THREE.Vector3().subVectors(enemy.position, attackPos);
        toEnemy.y = 0;
        const dist = toEnemy.length();

        if (dist < range) {
          const dot = attackForward.dot(toEnemy.normalize());
          if (dot > Math.cos(angle / 2)) {
            // Hit!
            const dmg = this.player.getAttackDamage();
            const knockDir = toEnemy.normalize();
            enemy.takeDamage(dmg, knockDir, 2);

            const comboDmg = this.player.addComboHit();
            this.stats.maxCombo = Math.max(this.stats.maxCombo, this.player.comboCount);

            this.effects.spawnHitSparks(enemy.position.clone(), 0xffaa44);
            this.audio.hit();
            this.camera.addShake(0.05);
            this.ui.updateCombo(this.player.comboCount);

            if (enemy.isDead()) {
              this.stats.kills++;
              this.audio.enemyDeath();
              this.effects.spawnHitSparks(enemy.position.clone(), 0xff6644, 20);
            }

            // Slow-mo on killing blow or high combo
            if (enemy.isDead() || this.player.comboCount >= 5) {
              this.player.slowmoTimer = COMBAT.CRITICAL_SLOWMO_DURATION;
              this.effects.spawnCriticalHit(enemy.position);
              this.audio.criticalHit();
            }

            break; // One enemy per swing
          }
        }
      }
    }

    // Echo attacks hit enemies
    const attackingEchoes = this.echoSystem.getAttackingEchoes();
    for (const echo of attackingEchoes) {
      const atkData = this.echoSystem.getEchoAttackData(echo);
      if (!atkData) continue;

      const forward = new THREE.Vector3(
        Math.sin(atkData.facingAngle), 0, Math.cos(atkData.facingAngle)
      );

      for (const enemy of this.enemies) {
        if (enemy.isDead()) continue;
        const toEnemy = new THREE.Vector3().subVectors(enemy.position, atkData.position);
        toEnemy.y = 0;
        const dist = toEnemy.length();

        if (dist < atkData.range) {
          const dot = forward.dot(toEnemy.normalize());
          if (dot > Math.cos(atkData.angle / 2)) {
            enemy.takeDamage(atkData.damage, toEnemy.normalize(), 1.5);
            this.effects.spawnHitSparks(enemy.position.clone(), 0x88aaff, 8);
            if (enemy.isDead()) {
              this.stats.kills++;
              this.audio.enemyDeath();
            }
          }
        }
      }
    }

    // Enemy attacks hit player
    for (const enemy of this.enemies) {
      if (enemy.isDead() || !enemy.isAttacking()) continue;

      if (enemy.consumeAttack()) {
        const dist = enemy.position.distanceTo(this.player.position);

        if (dist < enemy.stats.attackRange + 1.2) {
          const dmgResult = this.player.takeDamage(
            enemy.stats.damage,
            enemy.position,
            4
          );

          if (dmgResult > 0) {
            this.ui.showDamageVignette(dmgResult / PLAYER_STATS.MAX_HP);
            this.audio.playerHurt();
            this.camera.addShake(0.1);
            this.effects.spawnHitSparks(this.player.position.clone(), 0xff4444, 10);
          } else if (dmgResult === -1) {
            // Parry!
            this.audio.parry();
            this.effects.spawnParry(this.player.position.clone());
            this.camera.addShake(0.03);
            // Reflect damage
            enemy.takeDamage(enemy.stats.damage * 0.5, null, 0);
          } else if (dmgResult === -2) {
            // Perfect dodge!
            this.audio.perfectDodge();
            this.effects.spawnPerfectDodge(this.player.position.clone());
            this.player.slowmoTimer = COMBAT.CRITICAL_SLOWMO_DURATION;
            this.camera.triggerCombatZoom();
          }

          if (this.player.hp <= 0) {
            this._onGameOver();
            break;
          }
        }
      }
    }

    // Update enemies
    for (const enemy of this.enemies) {
      if (!enemy.isDead()) {
        enemy.update(dt, this.player.position, this.world, this.echoSystem);
        // Hit flash fade
        if (enemy.hitFlashTimer <= 0 && enemy._bodyMesh) {
          enemy._bodyMesh.material.emissiveIntensity = 0;
        }
      }
    }

    // Update effects
    this.effects.update(dt, now);

    // === UI UPDATES ===
    this.ui.updateHealth(this.player.hp, this.player.maxHp);
    this.ui.updateStamina(this.player.stamina, this.player.maxStamina);

    if (this.echoSystem.isRecording()) {
      this.ui.updateEchoTimeline(true, this.echoSystem.getRecordingDuration(), ECHO_CFG.MAX_RECORDING_TIME);
    } else {
      this.ui.updateEchoTimeline(false, 0, ECHO_CFG.MAX_RECORDING_TIME);
    }

    this.ui.updateEchoSlots(this.echoSystem.slots, this.echoSystem.activeRecording);
    this.ui.updateAbilityCooldowns({
      echo: !this.echoSystem.isRecording(),
      dash: this.player.dodgeCooldown <= 0,
      special: this.player.stamina >= PLAYER_STATS.STAMINA_HEAVY_COST,
    });
    this.ui.updateMinimap(this.player.position, this.enemies, 100);

    // Slowmo overlay
    this.ui.showSlowmo(playerSlowmo);

    // Footstep sounds (when moving on ground)
    if (this.player.onGround &&
        (this.player.state === 'walk' || this.player.state === 'sprint') &&
        Math.random() < dt * 5) {
      this.audio.footstep();
    }

    // Render
    this.renderer.update(rawDt);
    this.renderer.render();

    // End frame (clear just-pressed states)
    this.input.endFrame();
  }

  _onGameOver() {
    this.state = 'gameover';
    this.ui.showGameOver(this.stats);
    document.exitPointerLock();
    this.audio.stopAmbient();
    this.audio.enemyDeath();
  }

  restart() {
    this.stats = { kills: 0, echoesUsed: 0, maxCombo: 0, totalDamage: 0 };
    this.player.reset(new THREE.Vector3(0, 5, -10));
    this.echoSystem.clearAll();
    this.effects.clearAll();

    // Clear and respawn enemies
    this.enemies.forEach(e => e.dispose());
    this.enemies = [];
    this._spawnInitialEnemies();

    this.ui.hideGameOver();
    this.ui.hidePauseMenu();
    this.ui.updateCombo(0);
    this.audio.startAmbient();
    this.state = 'playing';

    this.renderer.canvas.requestPointerLock();
  }
}

// === ENTRY POINT ===
let game;

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
  });
} else {
  game = new Game();
}

// Expose controls for HTML buttons
window.resumeGame = () => {
  if (game && game.state === 'paused') {
    game.state = 'playing';
    game.ui.hidePauseMenu();
    game.renderer.canvas.requestPointerLock();
  }
};
window.restartGame = () => {
  if (game) game.restart();
};
window.quitGame = () => {
  if (game) {
    game.state = 'gameover';
    game.ui.showGameOver(game.stats);
    document.exitPointerLock();
  }
};
