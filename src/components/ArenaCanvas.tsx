/**
 * 2D Stickman Platformer Arena Canvas
 * Renders animated stickman hero, stickman bosses, platforms, jump pads,
 * particle explosions, speech bubbles, projectiles, and floating damage numbers.
 */

import React, { useRef, useEffect } from 'react';
import {
  PlayerStickman,
  BossStickman,
  Platform,
  Projectile,
  Particle,
  DamageNumber,
  StickmanMinion,
  SpeechBubble,
} from '../types';

interface ArenaCanvasProps {
  player: PlayerStickman;
  boss: BossStickman;
  platforms: Platform[];
  minions: StickmanMinion[];
  projectiles: Projectile[];
  particles: Particle[];
  damageNumbers: DamageNumber[];
  playerSpeech: SpeechBubble | null;
  bossSpeech: SpeechBubble | null;
  screenShake: number;
  bgGradient: [string, string];
  platformBorder: string;
  ambientColor: string;
}

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  player,
  boss,
  platforms,
  minions,
  projectiles,
  particles,
  damageNumbers,
  playerSpeech,
  bossSpeech,
  screenShake,
  bgGradient,
  platformBorder,
  ambientColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply Screen Shake
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake;
      const shakeY = (Math.random() - 0.5) * screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Background & Cyber Grid
    const grad = ctx.createLinearGradient(0, 0, 0, 540);
    grad.addColorStop(0, bgGradient[0]);
    grad.addColorStop(1, bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 960, 540);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 960; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 540);
      ctx.stroke();
    }
    for (let y = 0; y < 540; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(960, y);
      ctx.stroke();
    }

    // Ambient glow in arena center
    const ambientGrad = ctx.createRadialGradient(480, 270, 50, 480, 270, 480);
    ambientGrad.addColorStop(0, `${ambientColor}15`);
    ambientGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, 960, 540);

    // 2. Draw Platforms & Jump Pads
    platforms.forEach(plat => {
      ctx.save();
      if (plat.type === 'jump_pad') {
        // Glowing jump pad
        ctx.fillStyle = plat.color || '#22c55e';
        ctx.shadowColor = plat.color || '#22c55e';
        ctx.shadowBlur = 12;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Arrows indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('▲ JUMP ▲', plat.x + plat.w / 2, plat.y + 8);
      } else {
        // Platform body
        ctx.fillStyle = plat.color || '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Top glowing neon edge
        ctx.strokeStyle = platformBorder || '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = platformBorder || '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y);
        ctx.lineTo(plat.x + plat.w, plat.y);
        ctx.stroke();

        // Platform rivets
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let rx = plat.x + 10; rx < plat.x + plat.w; rx += 30) {
          ctx.beginPath();
          ctx.arc(rx, plat.y + plat.h / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // 3. Draw Minions
    minions.forEach(minion => {
      drawStickman(
        ctx,
        minion.x,
        minion.y,
        0.65,
        minion.color,
        minion.facing,
        minion.runCycle,
        minion.isGrounded,
        false,
        0,
        0,
        false,
        minion.isFriendly ? 'mini_wizard' : 'slime_fiend'
      );
    });

    // 4. Draw Stickman Boss
    if (boss.state !== 'defeated') {
      // Telegraph attack aura
      if (boss.state === 'telegraphing' && boss.currentAttack) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 70 * boss.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Telegraph charge text
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ ${boss.currentAttack.name.toUpperCase()} ⚡`, boss.x, boss.y - 65 * boss.scale);
        ctx.restore();
      }

      drawStickman(
        ctx,
        boss.x,
        boss.y,
        boss.scale,
        boss.hitFlash > 0 ? '#ffffff' : boss.color,
        boss.facing,
        boss.runCycle,
        boss.isGrounded,
        boss.state === 'attacking',
        0,
        0,
        false,
        boss.id as any
      );
    }

    // 5. Draw Player Stickman
    drawStickman(
      ctx,
      player.x,
      player.y,
      1.0,
      player.hitFlash > 0 ? '#ffffff' : '#f8fafc',
      player.facing,
      player.runCycle,
      player.isGrounded,
      player.castingAnimation > 0,
      player.castingAnimation,
      player.shield,
      true,
      'player_hero'
    );

    // 6. Draw Projectiles
    projectiles.forEach(proj => {
      ctx.save();

      // Draw trails
      proj.trail.forEach(t => {
        ctx.fillStyle = proj.glowColor;
        ctx.globalAlpha = Math.max(0, t.alpha * 0.4);
        ctx.beginPath();
        ctx.arc(t.x, t.y, proj.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      ctx.shadowColor = proj.glowColor;
      ctx.shadowBlur = 14;

      // Outer glow circle
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
      ctx.fill();

      // Core white heat
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Render letter label (e.g. 'b' or '[BOOM]')
      if (proj.label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(proj.label, proj.x, proj.y);
      }

      ctx.restore();
    });

    // 7. Draw Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;

      if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * 2, p.size / 2);
      } else if (p.shape === 'text' && p.text) {
        ctx.font = 'bold 16px monospace';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 8. Draw Speech Bubbles
    if (playerSpeech && playerSpeech.timeRemaining > 0) {
      drawSpeechBubble(ctx, player.x, player.y - 55, playerSpeech.text, '#0284c7', '#ffffff', 'left');
    }
    if (bossSpeech && bossSpeech.timeRemaining > 0 && boss.state !== 'defeated') {
      drawSpeechBubble(ctx, boss.x, boss.y - 75 * boss.scale, bossSpeech.text, boss.color, '#ffffff', 'right');
    }

    // 9. Draw Floating Damage Numbers
    damageNumbers.forEach(dn => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, dn.alpha);
      ctx.fillStyle = dn.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.font = dn.isCrit ? '900 20px monospace' : 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    });

    ctx.restore();
  }, [
    player,
    boss,
    platforms,
    minions,
    projectiles,
    particles,
    damageNumbers,
    playerSpeech,
    bossSpeech,
    screenShake,
    bgGradient,
    platformBorder,
    ambientColor,
  ]);

  return (
    <div className="relative w-full aspect-[16/9] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="w-full h-full block"
      />
    </div>
  );
};

/**
 * Procedural Kinematic Stickman Renderer
 */
function drawStickman(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  facing: 'left' | 'right',
  runCycle: number,
  isGrounded: boolean,
  isCasting: boolean,
  castingProgress: number,
  shieldAmount: number,
  isPlayer: boolean,
  archetype: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (facing === 'right' ? 1 : -1), scale);

  // Shield Bubble Glow
  if (shieldAmount > 0) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, -10, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shield sparks
    ctx.fillStyle = '#bae6fd';
    for (let i = 0; i < 4; i++) {
      const ang = (Date.now() / 300) + (i * Math.PI) / 2;
      ctx.fillRect(Math.cos(ang) * 38 - 2, Math.sin(ang) * 38 - 12, 4, 4);
    }
    ctx.restore();
  }

  // Stickman Line Properties
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = isPlayer ? 4 : 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Head Position
  const headRadius = isPlayer ? 10 : 13;
  const headY = -34;
  const neckY = -24;
  const hipY = -2;

  // 1. Torso
  ctx.beginPath();
  ctx.moveTo(0, neckY);
  ctx.lineTo(0, hipY);
  ctx.stroke();

  // 2. Head
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Special Head Accessories
  if (isPlayer) {
    // Wizard Pointy Hat
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(-14, headY + 2);
    ctx.lineTo(14, headY + 2);
    ctx.lineTo(-4, headY - 22);
    ctx.closePath();
    ctx.fill();

    // Glowing Wizard Star on hat
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-6, headY - 8, 4, 4);

    // Glowing Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(3, headY - 2, 3, 3);
  } else if (archetype === 'syntax_viper') {
    // Snake Head Crest & Green Fangs
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-4, headY - 16, 8, 5);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(4, headY - 1, 3, 3);
  } else if (archetype === 'loop_titan') {
    // Titan Heavy Shoulders & Crown
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 6;
    ctx.strokeRect(-12, neckY - 2, 24, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(3, headY - 2, 4, 4);
  } else if (archetype === 'memory_lich') {
    // Lich Floating Dark Horns
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, headY - 8);
    ctx.lineTo(-16, headY - 22);
    ctx.moveTo(8, headY - 8);
    ctx.lineTo(16, headY - 22);
    ctx.stroke();
    // Glowing red eyes
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(3, headY - 2, 3, 3);
  } else if (archetype === 'gil_dragon') {
    // Cyber Wings
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, neckY);
    ctx.lineTo(-30, neckY - 25);
    ctx.lineTo(-12, neckY - 10);
    ctx.stroke();
  } else if (archetype === 'master_compiler') {
    // Cosmic Halo
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, headY - 16, 18, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Legs Kinematics
  ctx.strokeStyle = color;
  ctx.lineWidth = isPlayer ? 4 : 5;
  if (!isGrounded) {
    // Jumping pose (tucked legs)
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(-8, hipY + 12);
    ctx.lineTo(-14, hipY + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, hipY);
    ctx.lineTo(10, hipY + 14);
    ctx.lineTo(16, hipY + 10);
    ctx.stroke();
  } else {
    // Running / Idle Kinematic Walk Cycle
    const legSwing = Math.sin(runCycle) * 16;

    // Left Leg
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const lKneeX = -legSwing * 0.6;
    const lKneeY = hipY + 14;
    const lFootX = -legSwing;
    const lFootY = hipY + 28;
    ctx.lineTo(lKneeX, lKneeY);
    ctx.lineTo(lFootX, lFootY);
    ctx.stroke();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(0, hipY);
    const rKneeX = legSwing * 0.6;
    const rKneeY = hipY + 14;
    const rFootX = legSwing;
    const rFootY = hipY + 28;
    ctx.lineTo(rKneeX, rKneeY);
    ctx.lineTo(rFootX, rFootY);
    ctx.stroke();
  }

  // 4. Arms & Staff Kinematics
  const shoulderY = neckY + 4;
  if (isCasting || castingProgress > 0) {
    // Casting Staff thrust forward!
    const castAngle = -0.3;
    const staffLength = 45;
    const handX = 22;
    const handY = shoulderY - 8;

    // Back arm
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-12, shoulderY + 8);
    ctx.lineTo(-6, shoulderY + 16);
    ctx.stroke();

    // Front arm pointing forward
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(10, shoulderY - 4);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Glowing Wizard Staff
    if (isPlayer) {
      ctx.save();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handX - 4, handY + 20);
      ctx.lineTo(handX + 16, handY - staffLength + 20);
      ctx.stroke();

      // Magic Crystal Orb on tip
      const orbX = handX + 16;
      const orbY = handY - staffLength + 20;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    // Running / Idle Arms
    const armSwing = Math.sin(runCycle) * 12;

    // Back Arm
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(-armSwing * 0.8, shoulderY + 12);
    ctx.lineTo(-armSwing * 1.2, shoulderY + 20);
    ctx.stroke();

    // Front Arm
    ctx.beginPath();
    ctx.moveTo(0, shoulderY);
    ctx.lineTo(armSwing * 0.8 + 6, shoulderY + 10);
    ctx.lineTo(armSwing * 1.2 + 10, shoulderY + 18);
    ctx.stroke();

    // Idle Staff for Player
    if (isPlayer) {
      ctx.save();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(12, shoulderY + 26);
      ctx.lineTo(16, shoulderY - 14);
      ctx.stroke();

      // Crystal
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(16, shoulderY - 14, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Floating cape for wizard
  if (isPlayer) {
    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-2, neckY + 2);
    ctx.quadraticCurveTo(-20 + Math.sin(runCycle) * 6, hipY + 8, -14, hipY + 22);
    ctx.lineTo(-4, hipY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Comic Speech Bubble Renderer
 */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  borderColor: string,
  textColor: string,
  tailAlign: 'left' | 'right'
) {
  ctx.save();
  ctx.font = 'bold 13px system-ui, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const paddingX = 14;
  const paddingY = 8;
  const bubbleWidth = Math.min(260, Math.max(60, textWidth + paddingX * 2));
  const bubbleHeight = 32;

  const bx = x - (tailAlign === 'left' ? 20 : bubbleWidth - 20);
  const by = y - bubbleHeight;

  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = borderColor;
  ctx.shadowBlur = 8;

  // Rounded rectangle
  ctx.beginPath();
  ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, 8);
  ctx.fill();
  ctx.stroke();

  // Little Pointer Triangle
  ctx.beginPath();
  ctx.moveTo(x - 4, by + bubbleHeight);
  ctx.lineTo(x, by + bubbleHeight + 8);
  ctx.lineTo(x + 6, by + bubbleHeight);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.fill();
  ctx.stroke();

  // Speech Text
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + bubbleWidth / 2, by + bubbleHeight / 2, bubbleWidth - 12);

  ctx.restore();
}
