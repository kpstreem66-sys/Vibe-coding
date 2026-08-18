import React from 'react';
import { Trophy, Lock, Play, X, Shield, Star, Zap } from 'lucide-react';
import { PLATFORM_LEVELS } from '../data/platformLevels';

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  unlockedLevels: number[];
  onSelectLevel: (levelNum: number) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  unlockedLevels,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-neutral-950 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/80 border-b border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                BOSS ARENA ENCOUNTERS
              </h2>
              <p className="text-xs text-neutral-400">
                Select a level to test your Python algorithms against stickman bosses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORM_LEVELS.map(lvl => {
            const isUnlocked = unlockedLevels.includes(lvl.level);
            const isCurrent = currentLevel === lvl.level;

            return (
              <div
                key={lvl.level}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-neutral-900/90 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : isUnlocked
                    ? 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/40 border-neutral-900 opacity-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 uppercase tracking-wider">
                      LEVEL 0{lvl.level}
                    </span>

                    {isUnlocked ? (
                      <span className="flex items-center text-emerald-400 text-xs gap-1 font-mono">
                        <Star className="w-3.5 h-3.5 fill-emerald-400" />
                        <span>READY</span>
                      </span>
                    ) : (
                      <span className="flex items-center text-neutral-500 text-xs gap-1 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <span>{lvl.boss.name}</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    {lvl.subtitle}
                  </p>

                  <div className="mt-3 text-xs text-neutral-400 space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-neutral-500" />
                      <span>HP: <strong className="text-white">{lvl.boss.maxHp}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Weakness: <strong className="text-emerald-400">{lvl.boss.weakness.join(', ')}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-end">
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        onSelectLevel(lvl.level);
                        onClose();
                      }}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold font-mono transition-all ${
                        isCurrent
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrent ? 'ACTIVE' : 'SELECT ENCOUNTER'}</span>
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-600 italic font-mono">Defeat previous boss to unlock</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
