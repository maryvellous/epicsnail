import React from 'react';
import { History, Plus, MessageSquare, Archive } from 'lucide-react';

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onCreateNewThread,
  onSwitchThread,
  onArchiveThread
}) {
  if (!isOpen) return null;

  return (
    <aside className="w-64 h-full bg-card border-r border-plum/40 flex flex-col p-4 z-30 shadow-2xl animate-fadeIn">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <h2 className="font-heading font-black text-sm text-white flex items-center gap-2">
          <History className="w-4 h-4 text-sand" />
          Cronologia Chat
        </h2>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xs font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <button
        onClick={onCreateNewThread}
        className="action-pill bg-lavender hover:bg-sidebar text-white font-bold w-full justify-center mb-4 text-xs shadow-md cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Nuova Chat</span>
      </button>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        <span className="text-[10px] font-mono text-sand uppercase tracking-wider block mb-1">Attive</span>
        {threads.filter(t => !t.archived).map((t) => (
          <div
            key={t.id}
            onClick={() => onSwitchThread(t)}
            className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
              t.id === activeThreadId
                ? 'bg-plum border-sand font-bold text-white shadow-md'
                : 'bg-canvas border-white/10 text-white/80 hover:border-white/30'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <MessageSquare className="w-3.5 h-3.5 text-sand shrink-0" />
              <span className="truncate">{t.title}</span>
            </div>

            <button
              onClick={(e) => onArchiveThread(t.id, e)}
              title="Archivia Conversazione"
              className="p-1 rounded-lg text-white/40 hover:text-sand hover:bg-white/10 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Archived Section */}
        {threads.some(t => t.archived) && (
          <div className="pt-4 border-t border-white/10 mt-4 space-y-2">
            <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1">Archiviate</span>
            {threads.filter(t => t.archived).map((t) => (
              <div
                key={t.id}
                onClick={() => onSwitchThread(t)}
                className="p-2.5 rounded-2xl bg-canvas/50 border border-white/5 text-xs text-white/50 cursor-pointer flex items-center justify-between hover:text-white"
              >
                <span className="truncate">{t.title}</span>
                <button
                  onClick={(e) => onArchiveThread(t.id, e)}
                  title="Ripristina Conversazione"
                  className="p-1 text-white/40 hover:text-white cursor-pointer"
                >
                  ↺
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
