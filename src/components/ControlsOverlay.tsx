import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap, Volume2, VolumeX, Shield, Heart } from 'lucide-react';

interface ControlsOverlayProps {
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onJump: () => void;
  onCast: () => void;
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  levelNum: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onJump,
  onCast,
  playerHp,
  playerMaxHp,
  playerShield,
  bossHp,
  bossMaxHp,
  bossName,
  levelNum,
  isMuted,
  onToggleMute,
}) => {
  const playerHpPct = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));
  const bossHpPct = Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100));

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Top Combat HUD Bars (Immersive UI Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-neutral-900/80 border border-emerald-500/20 rounded-xl backdrop-blur-md">
        {/* Player Vitality Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-tighter text-emerald-400 font-mono font-bold">
            <span className="flex items-center gap-1">
              <span>Player: Stickman_PyMancer</span>
              {playerShield > 0 && (
                <span className="text-cyan-400 ml-1 text-[9px] bg-cyan-950 px-1 py-0.5 rounded border border-cyan-800">
                  +{playerShield} SHIELD
                </span>
              )}
            </span>
            <span>{Math.round(playerHpPct)}% ({Math.round(playerHp)}/{playerMaxHp} HP)</span>
          </div>

          <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden border border-emerald-900/50 relative">
            <div
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] transition-all duration-300 rounded-full"
              style={{ width: `${playerHpPct}%` }}
            />
            {playerShield > 0 && (
              <div
                className="absolute top-0 left-0 h-full bg-cyan-400/40 border-r-2 border-cyan-300 transition-all duration-300"
                style={{ width: `${Math.min(100, playerHpPct + (playerShield / playerMaxHp) * 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* Boss Vitality Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-tighter text-red-400 font-mono font-bold">
            <span className="truncate flex items-center gap-1">
              <span>Boss: {bossName}</span>
              <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/60">
                LVL {levelNum}
              </span>
            </span>
            <span>{Math.round(bossHpPct)}% ({Math.max(0, Math.round(bossHp))}/{bossMaxHp} HP)</span>
          </div>

          <div className="h-2.5 w-full bg-neutral-800 rounded-full overflow-hidden border border-red-900/50">
            <div
              className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.7)] transition-all duration-300 rounded-full"
              style={{ width: `${bossHpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Platformer Keybinds Reminder & Touch D-Pad */}
      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-neutral-400 font-mono">
        <div className="hidden sm:flex items-center gap-3">
          <span>
            MOVE: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">A</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">→</kbd>
          </span>
          <span>
            JUMP: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">W</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200">SPACE</kbd>
          </span>
          <span>
            CAST: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-emerald-400">SHIFT + ENTER</kbd>
          </span>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors ml-auto text-[11px]"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* On-Screen Mobile Controller D-Pad */}
      <div className="flex items-center justify-between gap-2 sm:hidden pt-1">
        <div className="flex items-center gap-2">
          <button
            onMouseDown={onMoveLeftStart}
            onMouseUp={onMoveLeftEnd}
            onTouchStart={onMoveLeftStart}
            onTouchEnd={onMoveLeftEnd}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-900 active:bg-emerald-600 text-white border border-neutral-700 active:scale-95 transition-all shadow-md"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onMouseDown={onMoveRightStart}
            onMouseUp={onMoveRightEnd}
            onTouchStart={onMoveRightStart}
            onTouchEnd={onMoveRightEnd}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-900 active:bg-emerald-600 text-white border border-neutral-700 active:scale-95 transition-all shadow-md"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onJump}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-900 active:bg-emerald-600 text-white border border-neutral-700 active:scale-95 transition-all shadow-md"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <button
            onClick={onCast}
            className="px-4 h-12 flex items-center justify-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold border border-emerald-400 shadow-md text-xs font-mono"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>CAST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
