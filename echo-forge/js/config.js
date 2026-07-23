// === ECHO FORGE CONFIG ===
// All tunable constants in one place

export const GAME = {
  TITLE: 'ECHO FORGE',
  VERSION: '0.1.0',
};

export const PHYSICS = {
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

export const COMBAT = {
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

export const PLAYER_STATS = {
  MAX_HP: 100,
  MAX_STAMINA: 100,
  STAMINA_REGEN: 25,
  STAMINA_DODGE_COST: 30,
  STAMINA_SPRINT_COST: 15,
  STAMINA_ATTACK_COST: 10,
  STAMINA_HEAVY_COST: 25,
  STAMINA_BLOCK_COST: 8,
};

export const ECHO = {
  MAX_RECORDING_TIME: 15,
  MAX_SLOTS: 4,
  MAX_SIMULTANEOUS: 3,
  REPLAY_SPEED: 1.0,
  SAMPLE_RATE: 20, // snapshots per second
};

export const ENEMY_STATS = {
  MELEE: { hp: 60, speed: 5, damage: 12, attackRange: 2, detectionRange: 15 },
  ARCHER: { hp: 35, speed: 3, damage: 18, attackRange: 20, detectionRange: 25 },
  MAGE: { hp: 40, speed: 3.5, damage: 22, attackRange: 18, detectionRange: 20 },
  FLYING: { hp: 50, speed: 7, damage: 15, attackRange: 3, detectionRange: 20 },
  ELITE: { hp: 150, speed: 6, damage: 25, attackRange: 2.5, detectionRange: 18 },
  BOSS: { hp: 600, speed: 5.5, damage: 35, attackRange: 3, detectionRange: 30 },
};

export const INPUT = {
  MOUSE_SENSITIVITY: 0.003,
  GAMEPAD_DEADZONE: 0.15,
};

export const CAMERA = {
  DEFAULT_DISTANCE: 5,
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 10,
  HEIGHT_OFFSET: 2.5,
  SMOOTH_SPEED: 8,
  COLLISION_RADIUS: 0.3,
  AIM_OFFSET: 0.5,
};

export const WORLD = {
  MAP_SIZE: 200,
  SECTOR_SIZE: 50,
};

// Animation durations (seconds)
export const ANIM = {
  LIGHT_ATTACK: 0.4,
  HEAVY_ATTACK: 0.8,
  DODGE: 0.35,
  HIT_STUN: 0.4,
  DEATH: 1.5,
};
