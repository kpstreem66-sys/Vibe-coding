/**
 * PySpell: 2D Stickman Platformer & Python Boss Battle Arena
 * Immersive UI Design Theme
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  BookOpen,
  RotateCcw,
  Sparkles,
  Swords,
  Play,
  Volume2,
  VolumeX,
  Zap,
  HelpCircle,
  Flame,
  Award,
  ChevronRight,
  Shield,
  Heart,
  Code,
} from 'lucide-react';

import {
  PlayerStickman,
  BossStickman,
  Platform,
  StickmanMinion,
  Projectile,
  Particle,
  DamageNumber,
  SpeechBubble,
} from './types';
import { PLATFORM_LEVELS } from './data/platformLevels';
import { pythonInterpreter } from './engine/pythonInterpreter';
import { soundFx } from './audio/soundFx';
import {
  updatePhysicsWorld,
  launchPlayerSpells,
  createExplosionParticles,
  createShockwave,
  PhysicsWorldState,
} from './engine/physics';
import { ArenaCanvas } from './components/ArenaCanvas';
import { CodeEditor } from './components/CodeEditor';
import { Terminal, TerminalLog } from './components/Terminal';
import { SpellbookModal } from './components/SpellbookModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { ControlsOverlay } from './components/ControlsOverlay';

let globalLogCounter = 0;
const createUniqueLogId = (prefix: string) =>
  `${prefix}_${Date.now()}_${++globalLogCounter}_${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  // Game Configuration & Progression
  const [currentLevelNum, setCurrentLevelNum] = useState<number>(1);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState<boolean>(false);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'victory' | 'defeat'>('playing');

  // Kernel uptime timer counter
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSecs: number) => {
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `00:${hrs}:${mins}:${secs}`;
  };

  // Python Code in Editor
  const [code, setCode] = useState<string>(
    `# Write a Python script to fight the boss!\nbomb = [BOOM] * 6\nprint(bomb)`
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init_1',
      type: 'system',
      text: 'Kernel initialized. Type Python code to battle.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Current Level Data
  const levelData = PLATFORM_LEVELS.find(l => l.level === currentLevelNum) || PLATFORM_LEVELS[0];

  // Game World State Refs for 60FPS Physics Loop
  const worldRef = useRef<PhysicsWorldState>({
    player: {
      x: levelData.playerSpawn.x,
      y: levelData.playerSpawn.y,
      vx: 0,
      vy: 0,
      width: 28,
      height: 48,
      isGrounded: false,
      facing: 'right',
      jumpCount: 0,
      maxJumps: 2,
      runCycle: 0,
      castingAnimation: 0,
      hitFlash: 0,
      hp: 100,
      maxHp: 100,
      mana: 100,
      maxMana: 100,
      shield: 0,
      maxShield: 100,
    },
    boss: {
      ...levelData.boss,
      x: levelData.bossSpawn.x,
      y: levelData.bossSpawn.y,
      vx: 0,
      vy: 0,
      width: 36 * levelData.boss.scale,
      height: 58 * levelData.boss.scale,
      isGrounded: false,
      facing: 'left',
      runCycle: 0,
      state: 'idle',
      actionTimer: 0,
      currentAttack: null,
      attackTelegraphProgress: 0,
      hitFlash: 0,
    },
    platforms: [...levelData.platforms],
    minions: [],
    projectiles: [],
    particles: [],
    damageNumbers: [],
    screenShake: 0,
  });

  // UI Reactive States
  const [playerVitality, setPlayerVitality] = useState({
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    shield: 0,
  });
  const [bossVitality, setBossVitality] = useState({
    hp: levelData.boss.hp,
    maxHp: levelData.boss.maxHp,
    name: levelData.boss.name,
  });

  const [playerSpeech, setPlayerSpeech] = useState<SpeechBubble | null>(null);
  const [bossSpeech, setBossSpeech] = useState<SpeechBubble | null>(null);

  // Input states
  const keysRef = useRef<{ left: boolean; right: boolean; jump: boolean; down: boolean }>({
    left: false,
    right: false,
    jump: false,
    down: false,
  });

  // Initialize or Reset a Level
  const initLevel = useCallback(
    (lvlNum: number) => {
      const lvl = PLATFORM_LEVELS.find(l => l.level === lvlNum) || PLATFORM_LEVELS[0];
      setCurrentLevelNum(lvlNum);
      setGameStatus('playing');

      worldRef.current = {
        player: {
          x: lvl.playerSpawn.x,
          y: lvl.playerSpawn.y,
          vx: 0,
          vy: 0,
          width: 28,
          height: 48,
          isGrounded: false,
          facing: 'right',
          jumpCount: 0,
          maxJumps: 2,
          runCycle: 0,
          castingAnimation: 0,
          hitFlash: 0,
          hp: 100,
          maxHp: 100,
          mana: 100,
          maxMana: 100,
          shield: 0,
          maxShield: 100,
        },
        boss: {
          ...lvl.boss,
          x: lvl.bossSpawn.x,
          y: lvl.bossSpawn.y,
          vx: 0,
          vy: 0,
          width: 36 * lvl.boss.scale,
          height: 58 * lvl.boss.scale,
          isGrounded: false,
          facing: 'left',
          runCycle: 0,
          state: 'idle',
          actionTimer: 0,
          currentAttack: null,
          attackTelegraphProgress: 0,
          hitFlash: 0,
        },
        platforms: [...lvl.platforms],
        minions: [],
        projectiles: [],
        particles: [],
        damageNumbers: [],
        screenShake: 0,
      };

      setPlayerVitality({
        hp: 100,
        maxHp: 100,
        mana: 100,
        maxMana: 100,
        shield: 0,
      });

      setBossVitality({
        hp: lvl.boss.hp,
        maxHp: lvl.boss.maxHp,
        name: lvl.boss.name,
      });

      // Boss intro dialogue
      setBossSpeech({
        text: lvl.boss.dialogueIntro,
        timeRemaining: 4.5,
        sender: 'boss',
        color: lvl.boss.color,
      });

      setTerminalLogs(prev => [
        ...prev,
        {
          id: createUniqueLogId('lvl_start'),
          type: 'boss',
          text: `${lvl.boss.name}: "${lvl.boss.dialogueIntro}"`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    []
  );

  // Initialize level 1 on mount
  useEffect(() => {
    initLevel(1);
  }, [initLevel]);

  // Keyboard Event Listeners for Movement & Platforming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'INPUT';

      if (isInputFocused) {
        if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          executePythonCode();
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        keysRef.current.jump = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = true;
      }
      if (e.key === 'Enter') {
        executePythonCode();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        keysRef.current.jump = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        keysRef.current.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [code]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const world = worldRef.current;

      // Mana passive regen
      world.player.mana = Math.min(
        world.player.maxMana,
        world.player.mana + 15 * dt
      );

      // Speech bubble timers
      if (playerSpeech) {
        playerSpeech.timeRemaining -= dt;
        if (playerSpeech.timeRemaining <= 0) setPlayerSpeech(null);
      }
      if (bossSpeech) {
        bossSpeech.timeRemaining -= dt;
        if (bossSpeech.timeRemaining <= 0) setBossSpeech(null);
      }

      // Boss Attack Cycle
      if (world.boss.state !== 'defeated' && gameStatus === 'playing') {
        world.boss.actionTimer += dt;

        if (!world.boss.currentAttack && world.boss.actionTimer > 3.0) {
          const attacks = world.boss.attacks;
          const chosen = attacks[Math.floor(Math.random() * attacks.length)];
          world.boss.currentAttack = chosen;
          world.boss.state = 'telegraphing';
          world.boss.attackTelegraphProgress = 0;
          soundFx.playBossTelegraph();
        }

        if (world.boss.state === 'telegraphing' && world.boss.currentAttack) {
          world.boss.attackTelegraphProgress += dt / world.boss.currentAttack.telegraphTime;
          if (world.boss.attackTelegraphProgress >= 1.0) {
            executeBossAttack(world.boss.currentAttack);
            world.boss.currentAttack = null;
            world.boss.state = 'idle';
            world.boss.actionTimer = 0;
          }
        }
      }

      // Update Physics
      updatePhysicsWorld(world, keysRef.current, dt, {
        onBossHit: (dmg, isCrit, element, isWeakness) => {
          world.boss.hp = Math.max(0, world.boss.hp - dmg);
          world.boss.hitFlash = 1.0;
          soundFx.playHit();

          world.damageNumbers.push({
            id: `dn_${Date.now()}_${Math.random()}`,
            x: world.boss.x + (Math.random() * 20 - 10),
            y: world.boss.y - 30,
            text: isWeakness ? `WEAKNESS! -${dmg}` : isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
            color: isWeakness ? '#f59e0b' : isCrit ? '#fbbf24' : '#f87171',
            alpha: 1.0,
            vy: -1.8,
            isCrit: isCrit || isWeakness,
          });

          if (isWeakness) {
            setTerminalLogs(prev => [
              ...prev.slice(-30),
              {
                id: createUniqueLogId('log_weakness'),
                type: 'combat',
                text: `CRITICAL WEAKNESS! Exploited ${element} vulnerability: -${dmg} HP!`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          }

          if (world.boss.hp <= 0 && world.boss.state !== 'defeated') {
            world.boss.state = 'defeated';
            handleBossDefeat();
          }
        },
        onPlayerHit: dmg => {
          let remaining = dmg;
          if (world.player.shield > 0) {
            if (world.player.shield >= remaining) {
              world.player.shield -= remaining;
              remaining = 0;
            } else {
              remaining -= world.player.shield;
              world.player.shield = 0;
            }
          }
          if (remaining > 0) {
            world.player.hp = Math.max(0, world.player.hp - remaining);
            world.player.hitFlash = 1.0;
            soundFx.playHit();

            world.damageNumbers.push({
              id: `dn_p_${Date.now()}_${Math.random()}`,
              x: world.player.x,
              y: world.player.y - 20,
              text: `-${dmg}`,
              color: '#ef4444',
              alpha: 1.0,
              vy: -1.8,
            });

            if (world.player.hp <= 0) {
              handlePlayerDefeat();
            }
          }
        },
        onExplosion: (x, y, radius, element) => {
          soundFx.playExplosion(element === 'BOOM' ? 1.2 : 0.8);
          const dist = Math.hypot(world.boss.x - x, world.boss.y - y);
          if (dist < radius + world.boss.width / 2 && world.boss.state !== 'defeated') {
            const aoeDmg = element === 'BOOM' ? 40 : 25;
            world.boss.hp = Math.max(0, world.boss.hp - aoeDmg);
            world.boss.hitFlash = 1.0;

            world.damageNumbers.push({
              id: `dn_aoe_${Date.now()}_${Math.random()}`,
              x: world.boss.x,
              y: world.boss.y - 45,
              text: `💥 BOOM! -${aoeDmg}`,
              color: '#f97316',
              alpha: 1.0,
              vy: -2.2,
              isCrit: true,
            });

            if (world.boss.hp <= 0 && world.boss.state !== 'defeated') {
              world.boss.state = 'defeated';
              handleBossDefeat();
            }
          }
        },
      });

      // Sync state for React HUD
      setPlayerVitality({
        hp: world.player.hp,
        maxHp: world.player.maxHp,
        mana: world.player.mana,
        maxMana: world.player.maxMana,
        shield: world.player.shield,
      });

      setBossVitality({
        hp: world.boss.hp,
        maxHp: world.boss.maxHp,
        name: world.boss.name,
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameStatus, currentLevelNum]);

  // Execute Boss Attack Patterns
  const executeBossAttack = (attack: any) => {
    const world = worldRef.current;
    if (world.boss.state === 'defeated') return;

    if (attack.type === 'projectile_burst') {
      const count = 3;
      for (let i = 0; i < count; i++) {
        const dx = world.player.x - world.boss.x;
        const dy = world.player.y - world.boss.y;
        const angle = Math.atan2(dy, dx) + (i - 1) * 0.25;
        const speed = 7.0;

        world.projectiles.push({
          id: `boss_proj_${Date.now()}_${i}`,
          x: world.boss.x,
          y: world.boss.y - 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.1,
          element: 'BOOM',
          damage: attack.damage,
          radius: 14,
          color: '#ef4444',
          glowColor: '#f87171',
          label: '!',
          lifetime: 0,
          maxLifetime: 4.0,
          trail: [],
          isPlayerSpell: false,
        });
      }
      soundFx.playCast('BOOM', 1);
    } else if (attack.type === 'ground_slam') {
      world.boss.vy = -12;
      world.screenShake = 12;
      createShockwave(world.particles, world.boss.x, world.boss.y, '#f97316');
      createExplosionParticles(world.particles, world.boss.x, world.boss.y, '#f97316', 30);
      soundFx.playExplosion(1.5);
    } else if (attack.type === 'minion_spawn') {
      for (let i = 0; i < 2; i++) {
        world.minions.push({
          id: `minion_${Date.now()}_${i}`,
          x: world.boss.x + (i === 0 ? -40 : 40),
          y: world.boss.y,
          vx: i === 0 ? -2 : 2,
          vy: -4,
          width: 20,
          height: 32,
          isGrounded: false,
          facing: 'left',
          runCycle: 0,
          hp: 30,
          maxHp: 30,
          isFriendly: false,
          type: 'byte_bug',
          color: '#a855f7',
        });
      }
      createExplosionParticles(world.particles, world.boss.x, world.boss.y, '#a855f7', 15);
    } else if (attack.type === 'meteor_rain') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (world.boss.state === 'defeated') return;
          const rx = 100 + Math.random() * 760;
          world.projectiles.push({
            id: `meteor_${Date.now()}_${i}`,
            x: rx,
            y: -20,
            vx: (Math.random() - 0.5) * 2,
            vy: 8.5,
            gravity: 0.2,
            element: 'METEOR',
            damage: attack.damage,
            radius: 24,
            color: '#ea580c',
            glowColor: '#fb923c',
            label: '☄',
            lifetime: 0,
            maxLifetime: 3.5,
            trail: [],
            isPlayerSpell: false,
          });
          soundFx.playCast('BOOM', 1.2);
        }, i * 350);
      }
    } else if (attack.type === 'laser_sweep' || attack.type === 'freeze_wave') {
      for (let i = 0; i < 5; i++) {
        const vx = (world.boss.facing === 'right' ? 1 : -1) * (10 + i * 1.5);
        world.projectiles.push({
          id: `laser_${Date.now()}_${i}`,
          x: world.boss.x,
          y: world.boss.y - 15,
          vx,
          vy: (Math.random() - 0.5) * 2,
          gravity: 0,
          element: 'LASER',
          damage: attack.damage,
          radius: 12,
          color: '#06b6d4',
          glowColor: '#67e8f9',
          label: '⚡',
          lifetime: 0,
          maxLifetime: 2.0,
          trail: [],
          isPlayerSpell: false,
        });
      }
      soundFx.playCast('LASER', 1);
    }
  };

  // Execute User's Python Code!
  const executePythonCode = () => {
    if (isExecuting) return;
    const world = worldRef.current;
    if (world.boss.state === 'defeated' || world.player.hp <= 0) return;

    setIsExecuting(true);

    const context = {
      boss: {
        name: world.boss.name,
        hp: world.boss.hp,
        max_hp: world.boss.maxHp,
        state: world.boss.state,
        is_telegraphing: world.boss.state === 'telegraphing',
      },
      player: {
        hp: world.player.hp,
        max_hp: world.player.maxHp,
        mana: world.player.mana,
        shield: world.player.shield,
      },
    };

    const result = pythonInterpreter.execute(code, context);

    if (!result.success && result.error) {
      soundFx.playError();
      setTerminalLogs(prev => [
        ...prev,
        {
          id: createUniqueLogId('err'),
          type: 'error',
          text: `${result.error?.type}: ${result.error?.message}`,
          tip: result.error?.tip,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsExecuting(false);
      return;
    }

    // 1. Log stdout
    if (result.stdout.length > 0) {
      result.stdout.forEach(line => {
        setTerminalLogs(prev => [
          ...prev,
          {
            id: createUniqueLogId('out'),
            type: 'stdout',
            text: line,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      });
    }

    // 2. Handle Player Speech
    if (result.speech) {
      soundFx.playSpeechBlip();
      setPlayerSpeech({
        text: result.speech,
        timeRemaining: 3.5,
        sender: 'player',
        color: '#10b981',
      });

      setTerminalLogs(prev => [
        ...prev,
        {
          id: createUniqueLogId('sp'),
          type: 'speech',
          text: result.speech!,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      const lower = result.speech.toLowerCase();
      let bossReply = world.boss.defaultTauntResponse;
      Object.keys(world.boss.tauntResponses).forEach(kw => {
        if (lower.includes(kw)) {
          bossReply = world.boss.tauntResponses[kw];
        }
      });

      setTimeout(() => {
        if (world.boss.state !== 'defeated') {
          soundFx.playSpeechBlip();
          setBossSpeech({
            text: bossReply,
            timeRemaining: 4.0,
            sender: 'boss',
            color: world.boss.color,
          });

          setTerminalLogs(prev => [
            ...prev,
            {
              id: createUniqueLogId('boss_reply'),
              type: 'boss',
              text: `${world.boss.name}: "${bossReply}"`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      }, 700);
    }

    // 3. Launch Spells
    if (result.spells.length > 0) {
      soundFx.playCast(result.spells[0].element, result.spells.length);
      launchPlayerSpells(
        result.spells,
        world.player,
        world.boss,
        world.projectiles,
        world.particles
      );

      world.player.mana = Math.max(0, world.player.mana - Math.min(25, result.spells.length * 5));
    }

    // 4. Handle Heals & Shields
    if (result.heals > 0) {
      world.player.hp = Math.min(world.player.maxHp, world.player.hp + result.heals);
      soundFx.playHeal();
      world.damageNumbers.push({
        id: `dn_heal_${Date.now()}`,
        x: world.player.x,
        y: world.player.y - 30,
        text: `+${result.heals} HP`,
        color: '#10b981',
        alpha: 1.0,
        vy: -1.5,
        isHeal: true,
      });
    }

    if (result.shields > 0) {
      world.player.shield = Math.min(
        world.player.maxShield,
        world.player.shield + result.shields
      );
      soundFx.playHeal();
      world.damageNumbers.push({
        id: `dn_shield_${Date.now()}`,
        x: world.player.x,
        y: world.player.y - 30,
        text: `+${result.shields} Shield`,
        color: '#06b6d4',
        alpha: 1.0,
        vy: -1.5,
      });
    }

    setTimeout(() => setIsExecuting(false), 200);
  };

  const handleBossDefeat = () => {
    soundFx.playVictory();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setGameStatus('victory');
    const nextLevel = currentLevelNum + 1;
    if (nextLevel <= PLATFORM_LEVELS.length && !unlockedLevels.includes(nextLevel)) {
      setUnlockedLevels(prev => [...prev, nextLevel]);
    }

    setTerminalLogs(prev => [
      ...prev,
      {
        id: createUniqueLogId('vic'),
        type: 'combat',
        text: `🏆 BOSS DEFEATED! ${worldRef.current.boss.name} has been neutralized!`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handlePlayerDefeat = () => {
    soundFx.playError();
    setGameStatus('defeat');
    setTerminalLogs(prev => [
      ...prev,
      {
        id: createUniqueLogId('def'),
        type: 'error',
        text: `💀 PROCESS CRASHED! Your stickman wizard fell. Check spell algorithms & shields!`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col relative selection:bg-emerald-600/30">
      {/* Immersive UI Emerald Dot Matrix Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Immersive UI Header */}
      <header className="h-16 flex items-center justify-between px-6 md:px-8 bg-neutral-900/80 border-b border-emerald-500/30 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">
              Current Level
            </span>
            <span className="text-base md:text-lg font-mono font-bold uppercase tracking-tight text-white">
              0{currentLevelNum}: {levelData.boss.name}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-neutral-700 hidden sm:block" />

          <div className="flex-col hidden sm:flex">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">
              Kernel Uptime
            </span>
            <span className="text-xs md:text-sm font-mono text-emerald-400">
              {formatUptime(uptimeSeconds)}
            </span>
          </div>
        </div>

        {/* Header Right Action Badges */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLevelSelectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono font-medium border border-neutral-700 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Stages</span>
          </button>

          <button
            onClick={() => setIsSpellbookOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Grimoire</span>
          </button>

          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              soundFx.setMuted(nextMute);
            }}
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-6 gap-5 relative z-10 max-w-7xl w-full mx-auto">
        {/* 2D Platformer Canvas Stage */}
        <div className="relative bg-neutral-900/40 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />

          <ArenaCanvas
            player={worldRef.current.player}
            boss={worldRef.current.boss}
            platforms={worldRef.current.platforms}
            minions={worldRef.current.minions}
            projectiles={worldRef.current.projectiles}
            particles={worldRef.current.particles}
            damageNumbers={worldRef.current.damageNumbers}
            playerSpeech={playerSpeech}
            bossSpeech={bossSpeech}
            screenShake={worldRef.current.screenShake}
            bgGradient={levelData.theme.bgGradient}
            platformBorder={levelData.theme.platformBorder}
            ambientColor={levelData.theme.ambientColor}
          />

          {/* Victory Modal Overlay */}
          {gameStatus === 'victory' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="p-6 rounded-2xl bg-neutral-950 border border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)] text-center max-w-md w-full animate-in zoom-in-95">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/40">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold font-mono text-white mb-1">
                  LEVEL 0{currentLevelNum} COMPLETED!
                </h2>
                <p className="text-xs text-neutral-400 mb-4">
                  {worldRef.current.boss.dialogueDefeat}
                </p>

                <div className="flex items-center justify-center gap-3 font-mono">
                  <button
                    onClick={() => initLevel(currentLevelNum)}
                    className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
                  >
                    Replay
                  </button>

                  {currentLevelNum < PLATFORM_LEVELS.length ? (
                    <button
                      onClick={() => initLevel(currentLevelNum + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all"
                    >
                      <span>Next Boss</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsLevelSelectOpen(true)}
                      className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black shadow-lg"
                    >
                      View All Stages
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Defeat Modal Overlay */}
          {gameStatus === 'defeat' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <div className="p-6 rounded-2xl bg-neutral-950 border border-red-500/60 shadow-[0_0_30px_rgba(220,38,38,0.3)] text-center max-w-md w-full animate-in zoom-in-95">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-3 border border-red-500/40">
                  <RotateCcw className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold font-mono text-white mb-1">
                  CORE DUMP / EXECUTION FAILED
                </h2>
                <p className="text-xs text-neutral-400 mb-4">
                  Dodge boss attacks with platforms or chant <code className="text-emerald-400 font-mono">shield(50)</code> & <code className="text-emerald-400 font-mono">heal(30)</code>!
                </p>

                <button
                  onClick={() => initLevel(currentLevelNum)}
                  className="px-6 py-2.5 rounded bg-red-600 hover:bg-red-500 text-xs font-bold font-mono text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all"
                >
                  Retry Encounter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vitality HUD Bars & Mobile Controls */}
        <ControlsOverlay
          onMoveLeftStart={() => (keysRef.current.left = true)}
          onMoveLeftEnd={() => (keysRef.current.left = false)}
          onMoveRightStart={() => (keysRef.current.right = true)}
          onMoveRightEnd={() => (keysRef.current.right = false)}
          onJump={() => {
            keysRef.current.jump = true;
            setTimeout(() => (keysRef.current.jump = false), 150);
          }}
          onCast={executePythonCode}
          playerHp={playerVitality.hp}
          playerMaxHp={playerVitality.maxHp}
          playerShield={playerVitality.shield}
          bossHp={bossVitality.hp}
          bossMaxHp={bossVitality.maxHp}
          bossName={bossVitality.name}
          levelNum={currentLevelNum}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            soundFx.setMuted(next);
          }}
        />

        {/* Bottom Section: Code Editor + Live Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <CodeEditor
              code={code}
              onChange={setCode}
              onExecute={executePythonCode}
              onOpenSpellbook={() => setIsSpellbookOpen(true)}
              onResetCode={() => setCode(`bomb = [BOOM] * 6\nprint(bomb)`)}
              isExecuting={isExecuting}
              playerMana={playerVitality.mana}
              playerMaxMana={playerVitality.maxMana}
              manaCost={20}
            />
          </div>

          <div className="lg:col-span-4 h-[280px]">
            <Terminal
              logs={terminalLogs}
              onClear={() => setTerminalLogs([])}
            />
          </div>
        </div>
      </main>

      {/* Telemetry Footer */}
      <footer className="h-8 bg-neutral-900 border-t border-neutral-800 flex items-center px-6 justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-mono relative z-20">
        <div className="flex gap-6">
          <span>CPU: 14%</span>
          <span>MEM: 256MB</span>
          <span>FPS: 60</span>
          <span>STATUS: ONLINE</span>
        </div>
        <div>V-0.9.4-IMMERSIVE</div>
      </footer>

      {/* Modals */}
      <SpellbookModal
        isOpen={isSpellbookOpen}
        onClose={() => setIsSpellbookOpen(false)}
        onSelectRecipe={recipeCode => setCode(recipeCode)}
        onQuickCast={recipeCode => {
          setCode(recipeCode);
          setTimeout(() => executePythonCode(), 50);
        }}
      />

      <LevelSelectModal
        isOpen={isLevelSelectOpen}
        onClose={() => setIsLevelSelectOpen(false)}
        currentLevel={currentLevelNum}
        unlockedLevels={unlockedLevels}
        onSelectLevel={lvl => initLevel(lvl)}
      />
    </div>
  );
}
