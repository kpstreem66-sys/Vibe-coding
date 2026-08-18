/**
 * Physics and Collision Engine for PySpell 2D Platformer
 */

import {
  Platform,
  PlayerStickman,
  BossStickman,
  StickmanMinion,
  Projectile,
  Particle,
  DamageNumber,
  SpellInstance,
  SpellElement,
} from '../types';

export const GRAVITY = 0.52;
export const MOVE_SPEED = 4.8;
export const JUMP_FORCE = -11.5;
export const JUMP_PAD_FORCE = -16.5;

export interface PhysicsWorldState {
  player: PlayerStickman;
  boss: BossStickman;
  platforms: Platform[];
  minions: StickmanMinion[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  screenShake: number;
}

export function updatePhysicsWorld(
  world: PhysicsWorldState,
  inputs: { left: boolean; right: boolean; jump: boolean; down: boolean },
  dt: number,
  callbacks: {
    onBossHit: (dmg: number, isCrit: boolean, element: string, isWeakness: boolean) => void;
    onPlayerHit: (dmg: number) => void;
    onExplosion: (x: number, y: number, radius: number, element: string) => void;
    onMinionKilled?: (minionId: string) => void;
  }
) {
  const { player, boss, platforms, minions, projectiles, particles, damageNumbers } = world;

  // 1. Decay Screen Shake
  if (world.screenShake > 0) {
    world.screenShake = Math.max(0, world.screenShake - dt * 25);
  }

  // 2. Update Player Kinematics
  if (inputs.left) {
    player.vx = -MOVE_SPEED;
    player.facing = 'left';
    if (player.isGrounded) player.runCycle += 0.22;
  } else if (inputs.right) {
    player.vx = MOVE_SPEED;
    player.facing = 'right';
    if (player.isGrounded) player.runCycle += 0.22;
  } else {
    player.vx *= 0.78; // friction
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  // Jump logic
  if (inputs.jump && player.jumpCount < player.maxJumps) {
    player.vy = JUMP_FORCE;
    player.jumpCount++;
    player.isGrounded = false;
    createDustParticles(particles, player.x, player.y + player.height / 2, '#94a3b8');
  }

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > 14) player.vy = 14;

  // Move player
  player.x += player.vx;
  player.y += player.vy;

  // Keep player in bounds [30, 930]
  if (player.x < 30) player.x = 30;
  if (player.x > 930) player.x = 930;

  // Player Platform Collisions
  player.isGrounded = false;
  for (const plat of platforms) {
    // Jump pad detection
    if (plat.type === 'jump_pad') {
      if (
        player.x >= plat.x &&
        player.x <= plat.x + plat.w &&
        player.y + player.height / 2 >= plat.y &&
        player.y + player.height / 2 <= plat.y + plat.h + 12 &&
        player.vy >= 0
      ) {
        player.vy = JUMP_PAD_FORCE;
        player.jumpCount = 1;
        createShockwave(particles, plat.x + plat.w / 2, plat.y, plat.color || '#22c55e');
        continue;
      }
    }

    // Solid platform collision from above
    const feetY = player.y + player.height / 2;
    const prevFeetY = feetY - player.vy;
    if (
      player.x + player.width / 3 > plat.x &&
      player.x - player.width / 3 < plat.x + plat.w &&
      prevFeetY <= plat.y + 6 &&
      feetY >= plat.y &&
      player.vy >= 0
    ) {
      player.y = plat.y - player.height / 2;
      player.vy = 0;
      player.isGrounded = true;
      player.jumpCount = 0;
    }
  }

  // Animation decays
  if (player.castingAnimation > 0) {
    player.castingAnimation = Math.max(0, player.castingAnimation - dt * 2.5);
  }
  if (player.hitFlash > 0) {
    player.hitFlash = Math.max(0, player.hitFlash - dt * 4);
  }

  // 3. Update Boss Kinematics & AI
  if (boss.state !== 'defeated') {
    if (boss.hitFlash > 0) {
      boss.hitFlash = Math.max(0, boss.hitFlash - dt * 4);
    }

    // Boss Gravity
    boss.vy += GRAVITY;
    if (boss.vy > 14) boss.vy = 14;

    boss.x += boss.vx;
    boss.y += boss.vy;

    // Boss Platform collision
    boss.isGrounded = false;
    for (const plat of platforms) {
      const feetY = boss.y + boss.height / 2;
      const prevFeetY = feetY - boss.vy;
      if (
        boss.x + boss.width / 3 > plat.x &&
        boss.x - boss.width / 3 < plat.x + plat.w &&
        prevFeetY <= plat.y + 8 &&
        feetY >= plat.y &&
        boss.vy >= 0
      ) {
        boss.y = plat.y - boss.height / 2;
        boss.vy = 0;
        boss.isGrounded = true;
      }
    }

    // Boss tracking AI
    const distToPlayer = player.x - boss.x;
    boss.facing = distToPlayer > 0 ? 'right' : 'left';

    boss.actionTimer += dt;

    if (boss.state === 'idle' || boss.state === 'patrol') {
      if (Math.abs(distToPlayer) > 180) {
        boss.vx = (distToPlayer > 0 ? 1 : -1) * 2.2;
        boss.runCycle += 0.15;
      } else {
        boss.vx = 0;
      }

      if (boss.actionTimer > 3.5 && boss.isGrounded && Math.random() < 0.35) {
        boss.vy = JUMP_FORCE * 1.1;
        boss.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
        boss.actionTimer = 0;
      }
    }

    // Keep boss inside screen
    if (boss.x < 100) boss.x = 100;
    if (boss.x > 860) boss.x = 860;
  }

  // 4. Update Minions
  for (let i = minions.length - 1; i >= 0; i--) {
    const minion = minions[i];
    minion.vy += GRAVITY;
    minion.x += minion.vx;
    minion.y += minion.vy;

    // Platform collisions
    for (const plat of platforms) {
      const feetY = minion.y + minion.height / 2;
      if (
        minion.x + minion.width / 2 > plat.x &&
        minion.x - minion.width / 2 < plat.x + plat.w &&
        feetY >= plat.y &&
        feetY <= plat.y + 12 &&
        minion.vy >= 0
      ) {
        minion.y = plat.y - minion.height / 2;
        minion.vy = 0;
        minion.isGrounded = true;
      }
    }

    // Friendly minion attacks boss
    if (minion.isFriendly) {
      const dx = boss.x - minion.x;
      minion.facing = dx > 0 ? 'right' : 'left';
      minion.vx = (dx > 0 ? 1 : -1) * 2.5;
      minion.runCycle += 0.18;

      if (Math.abs(dx) < 40 && Math.abs(boss.y - minion.y) < 50) {
        callbacks.onBossHit(18, false, 'SUMMON', false);
        createExplosionParticles(particles, minion.x, minion.y, '#10b981', 10);
        minions.splice(i, 1);
        continue;
      }
    } else {
      // Enemy minion attacks player
      const dx = player.x - minion.x;
      minion.facing = dx > 0 ? 'right' : 'left';
      minion.vx = (dx > 0 ? 1 : -1) * 2.0;
      minion.runCycle += 0.16;

      if (Math.abs(dx) < 30 && Math.abs(player.y - minion.y) < 40) {
        callbacks.onPlayerHit(14);
        createExplosionParticles(particles, minion.x, minion.y, '#a855f7', 10);
        minions.splice(i, 1);
        continue;
      }
    }
  }

  // 5. Update Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.lifetime += dt;

    // Trail
    proj.trail.push({ x: proj.x, y: proj.y, alpha: 0.8 });
    if (proj.trail.length > 8) proj.trail.shift();
    proj.trail.forEach(t => (t.alpha -= 0.08));

    // Physics
    proj.vy += proj.gravity;
    proj.x += proj.vx;
    proj.y += proj.vy;

    let didExplode = false;

    // A. Player Projectile Collisions
    if (proj.isPlayerSpell) {
      // Check hit on Boss
      const dx = boss.x - proj.x;
      const dy = boss.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.radius + boss.width / 2 && boss.state !== 'defeated') {
        // Weakness calculation
        const isWeakness = boss.weakness.includes(proj.element as SpellElement);
        const isResistance = boss.resistance.includes(proj.element as SpellElement);
        let multiplier = 1.0;
        if (isWeakness) multiplier = 2.0;
        else if (isResistance) multiplier = 0.5;

        const isCrit = Math.random() < 0.25 || isWeakness;
        const effectiveDamage = Math.max(
          5,
          Math.round((proj.damage * multiplier - boss.defense * 0.4) * (isCrit ? 1.4 : 1.0))
        );

        callbacks.onBossHit(effectiveDamage, isCrit, proj.element, isWeakness);
        callbacks.onExplosion(proj.x, proj.y, proj.radius * 2.0, proj.element);
        createShockwave(particles, proj.x, proj.y, proj.color);
        createExplosionParticles(particles, proj.x, proj.y, proj.color, 24);
        world.screenShake = Math.max(world.screenShake, 8);
        didExplode = true;
      }

      // Check hit on Platforms or Ground
      if (!didExplode) {
        for (const plat of platforms) {
          if (
            proj.x >= plat.x - 10 &&
            proj.x <= plat.x + plat.w + 10 &&
            proj.y >= plat.y - 10 &&
            proj.y <= plat.y + plat.h + 10
          ) {
            // Explode on ground/platform contact!
            const blastRadius = proj.radius * 2.2;
            callbacks.onExplosion(proj.x, proj.y, blastRadius, proj.element);
            createShockwave(particles, proj.x, proj.y, proj.color);
            createExplosionParticles(particles, proj.x, proj.y, proj.color, 20);
            world.screenShake = Math.max(world.screenShake, 6);

            // Destroy any enemy minions caught in blast radius
            for (let mIdx = minions.length - 1; mIdx >= 0; mIdx--) {
              const m = minions[mIdx];
              if (!m.isFriendly) {
                const mDist = Math.hypot(m.x - proj.x, m.y - proj.y);
                if (mDist <= blastRadius + 20) {
                  createExplosionParticles(particles, m.x, m.y, '#f97316', 15);
                  minions.splice(mIdx, 1);
                }
              }
            }

            didExplode = true;
            break;
          }
        }
      }
    } 
    // B. Boss Projectile Collisions
    else {
      const dx = player.x - proj.x;
      const dy = player.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < proj.radius + player.width / 2) {
        callbacks.onPlayerHit(proj.damage);
        createExplosionParticles(particles, proj.x, proj.y, proj.color, 16);
        world.screenShake = Math.max(world.screenShake, 6);
        didExplode = true;
      }

      // Hit ground
      if (!didExplode && proj.y > 450) {
        createExplosionParticles(particles, proj.x, proj.y, proj.color, 10);
        didExplode = true;
      }
    }

    // Remove if exploded or off screen
    if (
      didExplode ||
      proj.lifetime > proj.maxLifetime ||
      proj.x < -100 ||
      proj.x > 1060 ||
      proj.y > 550
    ) {
      projectiles.splice(i, 1);
    }
  }

  // 6. Update Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.gravity * dt * 60;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay * dt;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // 7. Update Floating Damage Numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const dn = damageNumbers[i];
    dn.y += dn.vy;
    dn.alpha -= dt * 1.1;

    if (dn.alpha <= 0) {
      damageNumbers.splice(i, 1);
    }
  }
}

// Spawns spell projectiles from player toward boss
export function launchPlayerSpells(
  spells: SpellInstance[],
  player: PlayerStickman,
  boss: BossStickman,
  projectiles: Projectile[],
  particles: Particle[]
) {
  player.castingAnimation = 1.0;

  spells.forEach((spell, idx) => {
    setTimeout(() => {
      const dx = boss.x - player.x;
      const dy = (boss.y - 15) - (player.y - 15);
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.18;
      const speed = 9.5 + Math.random() * 2.0;

      // Element aesthetics
      let color = '#f97316';
      let glowColor = '#fdba74';
      let label = spell.label || 'b';
      let gravity = 0.35;
      let radius = 16;

      if (spell.element === 'BOOM') {
        color = '#f97316';
        glowColor = '#fed7aa';
        label = spell.label || 'BOOM';
        gravity = 0.38;
        radius = 18;
      } else if (spell.element === 'FIRE') {
        color = '#ef4444';
        glowColor = '#fca5a5';
        label = '🔥';
        gravity = 0.15;
      } else if (spell.element === 'THUNDER' || spell.element === 'LIGHTNING') {
        color = '#eab308';
        glowColor = '#fef08a';
        label = '⚡';
        gravity = 0.05;
      } else if (spell.element === 'FROST' || spell.element === 'ICE') {
        color = '#38bdf8';
        glowColor = '#bae6fd';
        label = '❄';
        gravity = 0.2;
      } else if (spell.element === 'LASER') {
        color = '#06b6d4';
        glowColor = '#67e8f9';
        label = '━';
        gravity = 0;
      } else if (spell.element === 'METEOR') {
        color = '#ea580c';
        glowColor = '#fed7aa';
        label = '☄';
        gravity = 0.45;
        radius = 22;
      } else if (spell.element === 'BLACK_HOLE') {
        color = '#7c3aed';
        glowColor = '#c4b5fd';
        label = '●';
        gravity = 0.08;
      }

      projectiles.push({
        id: `p_spell_${Date.now()}_${idx}_${Math.random()}`,
        x: player.x + (player.facing === 'right' ? 18 : -18),
        y: player.y - 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        gravity,
        element: spell.element,
        damage: spell.damage,
        radius,
        color,
        glowColor,
        label,
        lifetime: 0,
        maxLifetime: 3.5,
        trail: [],
        isPlayerSpell: true,
      });

      createExplosionParticles(particles, player.x, player.y - 12, color, 6);
    }, idx * 110);
  });
}

export function createExplosionParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number = 20
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5.0;
    particles.push({
      id: `part_${Date.now()}_${Math.random()}`,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color,
      alpha: 1.0,
      decay: 1.8 + Math.random() * 0.8,
      gravity: 0.15,
      shape: 'spark',
    });
  }
}

export function createShockwave(
  particles: Particle[],
  x: number,
  y: number,
  color: string
) {
  particles.push({
    id: `sw_${Date.now()}_${Math.random()}`,
    x,
    y,
    vx: 0,
    vy: 0,
    size: 6,
    color,
    alpha: 1.0,
    decay: 2.2,
    gravity: 0,
    shape: 'circle',
  });
}

export function createDustParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string
) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      id: `dust_${Date.now()}_${Math.random()}`,
      x: x + (Math.random() * 16 - 8),
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      color,
      alpha: 0.7,
      decay: 2.5,
      gravity: -0.05,
      shape: 'smoke',
    });
  }
}
