/**
 * PySpell: 2D Stickman Platformer & Python Boss Battle Arena Types
 */

export type SpellElement = 
  | 'BOOM'
  | 'FIRE'
  | 'THUNDER'
  | 'LIGHTNING'
  | 'FROST'
  | 'ICE'
  | 'HEAL'
  | 'SHIELD'
  | 'LASER'
  | 'METEOR'
  | 'POISON'
  | 'SUMMON'
  | 'BLACK_HOLE';

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'solid' | 'jump_pad' | 'moving' | 'drop_through';
  color?: string;
  vx?: number;
  minX?: number;
  maxX?: number;
}

export interface StickmanLimbAngles {
  headY: number;
  bodyAngle: number;
  leftArmAngle: number;
  rightArmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  staffAngle: number;
}

export interface PlayerStickman {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  jumpCount: number;
  maxJumps: number;
  runCycle: number;
  castingAnimation: number; // 0 to 1
  hitFlash: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  shield: number;
  maxShield: number;
}

export interface BossStickman {
  id: string;
  level: number;
  name: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  runCycle: number;
  scale: number;
  color: string;
  accentColor: string;
  hp: number;
  maxHp: number;
  defense: number;
  state: 'idle' | 'patrol' | 'jump' | 'telegraphing' | 'attacking' | 'hurt' | 'defeated';
  actionTimer: number;
  currentAttack: BossAttackPattern | null;
  attackTelegraphProgress: number; // 0 to 1
  hitFlash: number;
  weakness: SpellElement[];
  resistance: SpellElement[];
  attacks: BossAttackPattern[];
  dialogueIntro: string;
  dialogueDefeat: string;
  tauntResponses: Record<string, string>;
  defaultTauntResponse: string;
}

export interface BossAttackPattern {
  name: string;
  cooldown: number;
  damage: number;
  type: 'projectile_burst' | 'laser_sweep' | 'ground_slam' | 'minion_spawn' | 'freeze_wave' | 'meteor_rain' | 'dash_slash';
  telegraphTime: number;
  description: string;
}

export interface StickmanMinion {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  runCycle: number;
  hp: number;
  maxHp: number;
  isFriendly: boolean; // Friendly summon vs boss minion
  type: string;
  color: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  element: SpellElement;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  label?: string;
  lifetime: number;
  maxLifetime: number;
  exploded?: boolean;
  trail: { x: number; y: number; alpha: number }[];
  isPlayerSpell: boolean;
  bouncesRemaining?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'text' | 'debris';
  text?: string;
  scale?: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  isCrit?: boolean;
  isHeal?: boolean;
}

export interface SpellInstance {
  id: string;
  element: SpellElement;
  multiplier: number;
  rawName: string;
  damage: number;
  speed: number;
  radius: number;
  color: string;
  glowColor: string;
  label?: string;
}

export interface SpellRecipe {
  id: string;
  name: string;
  category: 'Beginner' | 'Elemental' | 'Loops & Lists' | 'Defense & Healing' | 'Advanced Metamagic';
  code: string;
  description: string;
  manaCost: number;
  tags: string[];
  powerRating: number;
}

export interface ExecutionResult {
  success: boolean;
  stdout: string[];
  speech?: string;
  spells: SpellInstance[];
  heals: number;
  shields: number;
  error?: {
    type: string;
    message: string;
    line?: number;
    tip?: string;
  };
  variables: Record<string, any>;
}

export interface SpeechBubble {
  text: string;
  timeRemaining: number;
  sender: 'player' | 'boss';
  color: string;
}
