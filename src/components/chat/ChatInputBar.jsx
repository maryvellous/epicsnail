import React from 'react';
import { Send, Sparkles, CornerDownLeft, ShieldCheck } from 'lucide-react';

export default function ChatInputBar({
  inputText,
  onInputChange,
  onSendMessage,
  isLoading,
  hasPendingAction,
  showSlashMenu,
  filteredSlashCommands,
  onExecuteSlashCommand,
  textareaRef
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-card border-t border-plum/40 z-20 flex justify-center shadow-2xl">
      <div className="w-full max-w-3xl relative">
        
        {/* SLASH COMMANDS MENU POPUP */}
        {showSlashMenu && filteredSlashCommands.length > 0 && (
          <div className="absolute bottom-full mb-3 left-0 w-full bg-card border-2 border-lavender/50 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/10 animate-fadeIn">
            <div className="px-4 py-2 bg-canvas text-[11px] font-bold text-sand uppercase tracking-wider flex items-center justify-between">
              <span>Comandi Rapidi (Slash Commands)</span>
              <span className="text-lavender font-normal">Premi invio o seleziona</span>
            </div>
            {filteredSlashCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  onClick={() => onExecuteSlashCommand(cmd)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-sidebar/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-plum border border-lavender/40 flex items-center justify-center text-sand group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-sm text-sand group-hover:text-white mr-2">{cmd.command}</span>
                      <span className="text-xs text-blue">{cmd.label}</span>
                    </div>
                  </div>
                  <CornerDownLeft className="w-4 h-4 text-lavender group-hover:text-white" />
                </button>
              );
            })}
          </div>
        )}

        {/* INPUT BAR WITH AUTO-EXPANDING TEXTAREA */}
        <div className={`flex items-end gap-2 bg-canvas border rounded-3xl p-2.5 shadow-2xl transition-all ${
          hasPendingAction 
            ? 'border-terracotta/60 bg-canvas/80 opacity-90' 
            : 'border-lavender/40 focus-within:border-lavender'
        }`}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            disabled={hasPendingAction}
            placeholder={
              hasPendingAction 
                ? "Approva o annulla l'azione pendente per continuare..." 
                : "Scrivi un messaggio o digitare '/' per i comandi rapidi..."
            }
            className="flex-1 bg-transparent text-sm text-white placeholder-white/40 resize-none outline-none px-3 py-2 max-h-32 disabled:cursor-not-allowed"
          />

          <button
            onClick={() => onSendMessage()}
            disabled={!inputText.trim() || isLoading || hasPendingAction}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              !inputText.trim() || isLoading || hasPendingAction
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-lavender hover:bg-sidebar text-white shadow-lg cursor-pointer active:scale-95'
            }`}
            title={hasPendingAction ? "Azione in attesa di approvazione" : "Invia messaggio"}
          >
            {hasPendingAction ? (
              <ShieldCheck className="w-5 h-5 text-sand animate-pulse" />
            ) : isLoading ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {hasPendingAction && (
          <p className="text-[11px] text-sand/80 font-mono mt-2 text-center animate-pulse">
            ⚠️ Invio disabilitato: Rispondi alla scheda di approvazione per sbloccare l'input.
          </p>
        )}
      </div>
    </div>
  );
}
