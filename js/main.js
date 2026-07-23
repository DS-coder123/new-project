// === ECHO FORGE — MAIN GAME ORCHESTRATOR ===

import * as THREE from 'three';
import { InputSystem } from './input.js';
import { Renderer } from './renderer.js';
import { Player } from './player.js';
import { ThirdPersonCamera } from './camera.js';
import { World } from './world.js';
import { EchoSystem } from './echo.js';
import { Enemy, EnemyType } from './enemies.js';
import { Effects } from './effects.js';
import { AudioSystem } from './audio.js';
import { UI } from './ui.js';
import { COMBAT, PLAYER_STATS, ECHO as ECHO_CFG, CAMERA } from './config.js';

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
