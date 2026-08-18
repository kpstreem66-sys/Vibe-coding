import React from 'react';
import { Play, Sparkles, RotateCcw, BookOpen, Terminal, Zap, Code, Shield, Heart } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  onExecute: () => void;
  onOpenSpellbook: () => void;
  onResetCode: () => void;
  isExecuting: boolean;
  playerMana: number;
  playerMaxMana: number;
  manaCost: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onExecute,
  onOpenSpellbook,
  onResetCode,
  isExecuting,
  playerMana,
  playerMaxMana,
  manaCost,
}) => {
  const lineCount = Math.max(code.split('\n').length, 5);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      onExecute();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertSnippet = (snippet: string) => {
    onChange(snippet);
  };

  const quickSnippets = [
    { label: 'bomb = [BOOM] * 6', code: 'bomb = [BOOM] * 6\nprint(bomb)' },
    { label: 'Talk & bomb * 5', code: 'print("Taste my Python script!")\nbomb = [BOOM] * 5\nprint(bomb)' },
    { label: 'Elemental Fusion', code: 'bomb = [BOOM] * 4\nfire = [FIRE] * 2\nprint(bomb + fire)' },
    { label: 'For-Loop Barrage', code: 'for i in range(4):\n  bomb = [BOOM] * 2\n  print(bomb)\n  print(FIRE)' },
    { label: 'Heal & Shield', code: 'print("Barrier up!")\nshield(50)\nheal(30)' },
  ];

  return (
    <div className="flex flex-col bg-[#1e1e1e] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl text-neutral-100">
      {/* Editor Header Bar */}
      <div className="h-9 bg-neutral-800/60 border-b border-neutral-700/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-3 text-[11px] text-neutral-400 font-mono italic flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>main.py — Code Editor</span>
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSpellbook}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/30 transition-colors"
            title="Open Python Grimoire & Spell Recipes"
          >
            <BookOpen className="w-3 h-3" />
            <span>Grimoire</span>
          </button>

          <button
            onClick={onResetCode}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Reset code template"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Insert Snippet Chips */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border-b border-neutral-800/80 overflow-x-auto text-[11px] font-mono no-scrollbar">
        <span className="text-neutral-500 text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Macros:
        </span>
        {quickSnippets.map((s, idx) => (
          <button
            key={idx}
            onClick={() => insertSnippet(s.code)}
            className="shrink-0 px-2 py-0.5 rounded bg-neutral-800 hover:bg-emerald-950/60 text-neutral-300 hover:text-emerald-300 border border-neutral-700/60 hover:border-emerald-500/40 transition-colors text-[10px]"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Main Textarea with Line Numbers */}
      <div className="relative flex min-h-[140px] max-h-[220px] font-mono text-sm bg-[#1e1e1e]">
        {/* Line Numbers Gutter */}
        <div className="w-10 select-none bg-neutral-900/50 text-neutral-600 text-right pr-2.5 py-3 text-xs leading-relaxed font-mono border-r border-neutral-800/60">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          value={code}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="# Write Python code here:&#10;bomb = [BOOM] * 6&#10;print(bomb)"
          className="flex-1 w-full p-3 bg-transparent text-emerald-400 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder:text-neutral-600 selection:bg-emerald-600/30"
        />
      </div>

      {/* Bottom Bar: Cast Button & Mana Meter */}
      <div className="h-10 bg-emerald-500 flex items-center justify-between px-4 text-black font-semibold">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-black text-black" />
            <span>Mana: {Math.round(playerMana)}/{playerMaxMana}</span>
          </span>
        </div>

        <button
          onClick={onExecute}
          disabled={isExecuting || playerMana < manaCost}
          className="flex items-center gap-2 px-3 py-1 bg-black text-emerald-400 hover:bg-neutral-900 font-bold text-[10px] uppercase tracking-wider rounded border border-black/40 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3 h-3 fill-emerald-400" />
          <span>{isExecuting ? 'EXECUTING...' : 'RUN SCRIPT (CTRL + ENTER)'}</span>
        </button>
      </div>
    </div>
  );
};
