import React from 'react';
import { ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

export default function ChatMessagesStream({
  messages,
  isLoading,
  onApproveAction,
  onCancelAction,
  messagesEndRef
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 animate-fadeIn ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] sm:max-w-[78%] space-y-3">
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-3xl text-sm leading-relaxed shadow-xl border ${
                    isUser
                      ? 'bg-sidebar text-white border-blue/30 rounded-tr-sm'
                      : 'bg-card text-white border-lavender/40 rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans break-words">
                    {msg.content}
                  </div>
                </div>

                {/* HUMAN-IN-THE-LOOP ACTION CARD */}
                {msg.pendingAction && (
                  <div className="p-4 rounded-2xl bg-card border-2 border-sand/60 shadow-2xl space-y-3">
                    <div className="flex items-center gap-2 text-sand font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-sand" />
                      Richiesta di Approvazione Esecuzione (Human-in-the-Loop)
                    </div>

                    <div className="text-xs text-white bg-canvas p-3 rounded-xl border border-white/10 font-mono">
                      <p className="font-semibold text-sand mb-1">{msg.pendingAction.description}</p>
                      <span className="text-[11px] text-blue">Tool: {msg.pendingAction.toolName}</span>
                    </div>

                    {/* ACTION BUTTONS & STATUS */}
                    {msg.pendingAction.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => onApproveAction(msg.id, msg.pendingAction)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-sage hover:bg-sage/80 text-canvas font-black text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approva ed Esegui
                        </button>
                        <button
                          onClick={() => onCancelAction(msg.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <XCircle className="w-4 h-4 text-terracotta" />
                          Annulla
                        </button>
                      </div>
                    )}

                    {msg.pendingAction.status === 'executing' && (
                      <div className="text-xs text-sand font-medium flex items-center gap-2 py-1">
                        <span className="w-3 h-3 border-2 border-sand border-t-transparent rounded-full animate-spin"></span>
                        Esecuzione in corso...
                      </div>
                    )}

                    {msg.pendingAction.status === 'completed' && (
                      <div className="text-xs text-sage font-bold flex items-center gap-1.5 py-1">
                        <CheckCircle className="w-4 h-4" />
                        Azione eseguita con successo!
                      </div>
                    )}

                    {msg.pendingAction.status === 'cancelled' && (
                      <div className="text-xs text-blue font-medium flex items-center gap-1.5 py-1">
                        <XCircle className="w-4 h-4 text-white/40" />
                        Azione annullata dall'utente.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center animate-pulse">
            <div className="p-3 rounded-2xl bg-card border border-lavender/30 text-xs text-lavender flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-lavender rounded-full animate-ping"></span>
              Elaborazione risposta in corso...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
