import React, { useState } from 'react';
import { BookOpen, X, Sparkles, Copy, Play, Check, Flame, Zap, Shield, Repeat, Cpu } from 'lucide-react';
import { SPELL_RECIPES } from '../data/spellRecipes';
import { SpellRecipe } from '../types';

interface SpellbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (code: string) => void;
  onQuickCast: (code: string) => void;
}

export const SpellbookModal: React.FC<SpellbookModalProps> = ({
  isOpen,
  onClose,
  onSelectRecipe,
  onQuickCast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ['All', 'Beginner', 'Elemental', 'Loops & Lists', 'Defense & Healing', 'Advanced Metamagic'];

  const filteredRecipes = selectedCategory === 'All'
    ? SPELL_RECIPES
    : SPELL_RECIPES.filter(r => r.category === selectedCategory);

  const handleCopy = (recipe: SpellRecipe) => {
    navigator.clipboard.writeText(recipe.code);
    setCopiedId(recipe.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-neutral-950 border border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900/80 border-b border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                PYTHON GRIMOIRE OF SPELLS
              </h2>
              <p className="text-xs text-neutral-400">
                Execute Python spell macros and algorithm incantations
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

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-neutral-900/40 border-b border-neutral-800 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium font-mono rounded transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recipe Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-white font-mono flex items-center gap-2">
                    {recipe.name}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-emerald-400 border border-neutral-700">
                      {recipe.category}
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {recipe.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(recipe)}
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1 border border-neutral-700"
                    title="Copy code"
                  >
                    {copiedId === recipe.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      onSelectRecipe(recipe.code);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-emerald-950 text-emerald-400 hover:text-emerald-300 text-xs font-mono transition-colors border border-neutral-700"
                  >
                    Load into Editor
                  </button>

                  <button
                    onClick={() => {
                      onQuickCast(recipe.code);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-transform active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    Cast Now
                  </button>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative mt-3 p-3 rounded-lg bg-[#1e1e1e] border border-neutral-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre className="m-0 whitespace-pre leading-relaxed">{recipe.code}</pre>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {recipe.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-neutral-800 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
