import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';

export interface TerminalLog {
  id: string;
  type: 'stdout' | 'speech' | 'boss' | 'error' | 'combat' | 'system';
  text: string;
  tip?: string;
  timestamp: string;
}

interface TerminalProps {
  logs: TerminalLog[];
  onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onClear }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-800 rounded-xl p-3 font-mono overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
            Runtime Output
          </span>
        </div>

        <button
          onClick={onClear}
          className="p-1 text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900 rounded transition-colors"
          title="Clear Runtime Output"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 pt-2 overflow-y-auto font-mono text-[11px] space-y-1.5 max-h-[180px] selection:bg-emerald-600/30">
        {logs.length === 0 ? (
          <div className="text-neutral-600 italic py-4 text-center">
            &gt; No process output. Type <span className="text-emerald-500">bomb = [BOOM] * 6; print(bomb)</span>
          </div>
        ) : (
          logs.map((log, idx) => {
            const uniqueKey = `${log.id || 'log'}-${idx}`;
            if (log.type === 'error') {
              return (
                <div key={uniqueKey} className="p-2 rounded bg-red-950/30 border border-red-900/40 text-red-400">
                  <div className="flex items-start gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                    <span>{log.text}</span>
                  </div>
                  {log.tip && (
                    <div className="mt-1 text-[10px] text-amber-400/90 pl-5 border-l-2 border-amber-500/40">
                      💡 Tip: {log.tip}
                    </div>
                  )}
                </div>
              );
            }

            if (log.type === 'speech') {
              return (
                <div key={uniqueKey} className="flex items-start gap-1.5 text-emerald-400">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                  <span>
                    <strong className="text-emerald-300">[Player]:</strong> &quot;{log.text}&quot;
                  </span>
                </div>
              );
            }

            if (log.type === 'boss') {
              return (
                <div key={uniqueKey} className="flex items-start gap-1.5 text-red-400 bg-red-950/20 p-1 rounded border border-red-950/40">
                  <span className="shrink-0">👾</span>
                  <span>
                    <strong className="text-red-300">[Boss]:</strong> {log.text}
                  </span>
                </div>
              );
            }

            if (log.type === 'combat') {
              return (
                <div key={uniqueKey} className="text-orange-500 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>{log.text}</span>
                </div>
              );
            }

            // stdout default
            return (
              <div key={uniqueKey} className="text-emerald-500 font-mono">
                <span className="text-neutral-600 mr-1.5">&gt;</span>
                <span>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
