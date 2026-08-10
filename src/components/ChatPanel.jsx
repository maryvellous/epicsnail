import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FolderGit2, Music, Trash2, Save, Sparkles, Sliders } from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { useProjects } from '../context/ProjectsContext';
import { useChatThreads } from '../hooks/useChatThreads';
import { useChatContext } from '../hooks/useChatContext';
import { usePendingActions } from '../hooks/usePendingActions';

import ChatHistorySidebar from './chat/ChatHistorySidebar';
import ChatHeader from './chat/ChatHeader';
import ChatMessagesStream from './chat/ChatMessagesStream';
import ChatInputBar from './chat/ChatInputBar';

const SLASH_COMMANDS = [
  { command: '/calendar', label: 'Mostra eventi Google Calendar', icon: Calendar, prompt: 'Mostrami i miei prossimi eventi su Google Calendar.' },
  { command: '/github', label: 'Mostra repository e issue aperte', icon: FolderGit2, prompt: 'Elenca le mie issue aperte ed i repository GitHub.' },
  { command: '/spotify', label: 'Stato riproduzione musica', icon: Music, prompt: 'Qual è il brano attualmente in riproduzione su Spotify?' },
  { command: '/clear', label: 'Cancella la cronologia della chat', icon: Trash2, action: 'clear' },
];

export default function ChatPanel() {
  const { userName } = useGamification();
  const { projects } = useProjects();

  // Custom Hooks
  const {
    threads,
    setThreads,
    activeThreadId,
    setActiveThreadId,
    messages,
    setMessages,
    handleCreateNewThread,
    handleArchiveThread,
    handleSwitchThread
  } = useChatThreads(userName);

  const {
    activeProvider,
    activeTier,
    setActiveTier,
    handleProviderChange,
    activeContextProjectId,
    contextHeader,
    setContextHeader,
    contextSavedMessage,
    handleContextProjectChange,
    handleSaveContext
  } = useChatContext(projects);

  const {
    hasPendingAction,
    handleApproveAction,
    handleCancelAction
  } = usePendingActions({
    messages,
    setMessages,
    setThreads,
    activeThreadId,
    setActiveThreadId
  });

  // Local UI state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  // Slash menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(val.toLowerCase());
    } else {
      setShowSlashMenu(false);
    }
  };

  const executeSlashCommand = (cmd) => {
    setShowSlashMenu(false);
    if (cmd.action === 'clear') {
      const targetThreadId = activeThreadId;
      const cleared = [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'Cronologia chat cancellata.'
        }
      ];
      setMessages(cleared);
      setThreads(prev => prev.map(t => t.id === targetThreadId ? { ...t, messages: cleared } : t));
      setInputText('');
      return;
    }

    if (cmd.prompt) {
      sendMessage(cmd.prompt);
    }
  };

  const sendMessage = async (overrideText = null) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isLoading || hasPendingAction) return;

    const targetThreadId = activeThreadId;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setThreads(prev => prev.map(t => t.id === targetThreadId ? { ...t, messages: newMessages } : t));
    setInputText('');
    setShowSlashMenu(false);
    setIsLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await window.electronAPI.sendChatMessage({
        provider: activeProvider,
        modelTier: activeTier,
        messages: history
      });

      if (res.success) {
        const assistantMsg = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          content: res.text,
          pendingAction: res.pendingAction ? { ...res.pendingAction, status: 'pending' } : null
        };
        const updatedMsgs = [...newMessages, assistantMsg];

        setThreads(prev => prev.map(t => t.id === targetThreadId ? { ...t, messages: updatedMsgs } : t));

        setActiveThreadId(currentActive => {
          if (currentActive === targetThreadId) {
            setMessages(updatedMsgs);
          }
          return currentActive;
        });
      } else {
        const errMsg = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `**Errore:** ${res.error || 'Impossibile completare la richiesta.'}`
        };
        setThreads(prev => prev.map(t => {
          if (t.id === targetThreadId) {
            const currentMsgs = t.messages || [];
            return { ...t, messages: [...currentMsgs, errMsg] };
          }
          return t;
        }));
        setActiveThreadId(currentActive => {
          if (currentActive === targetThreadId) {
            setMessages(prev => [...prev, errMsg]);
          }
          return currentActive;
        });
      }
    } catch (e) {
      const connErrMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `**Errore di connessione:** ${e.message}`
      };
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const currentMsgs = t.messages || [];
          return { ...t, messages: [...currentMsgs, connErrMsg] };
        }
        return t;
      }));
      setActiveThreadId(currentActive => {
        if (currentActive === targetThreadId) {
          setMessages(prev => [...prev, connErrMsg]);
        }
        return currentActive;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSlashCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(slashFilter) || cmd.label.toLowerCase().includes(slashFilter)
  );

  const activeProjObj = (projects || []).find(p => p.id === activeContextProjectId);

  return (
    <div className="flex-1 flex h-full bg-canvas text-white relative overflow-hidden select-none">
      
      {/* COLLAPSIBLE CHAT HISTORY SIDEBAR */}
      <ChatHistorySidebar
        isOpen={isHistorySidebarOpen}
        onClose={() => setIsHistorySidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onCreateNewThread={handleCreateNewThread}
        onSwitchThread={handleSwitchThread}
        onArchiveThread={handleArchiveThread}
      />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER CHAT */}
        <ChatHeader
          isHistorySidebarOpen={isHistorySidebarOpen}
          onToggleHistorySidebar={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
          activeContextProjectId={activeContextProjectId}
          onContextProjectChange={handleContextProjectChange}
          projects={projects}
          activeProvider={activeProvider}
          onProviderChange={handleProviderChange}
          activeTier={activeTier}
          onTierChange={setActiveTier}
          onOpenContextModal={() => setIsContextModalOpen(true)}
        />

        {/* CHAT MESSAGES STREAM */}
        <ChatMessagesStream
          messages={messages}
          isLoading={isLoading}
          onApproveAction={handleApproveAction}
          onCancelAction={handleCancelAction}
          messagesEndRef={messagesEndRef}
        />

        {/* INPUT AREA & SLASH MENU */}
        <ChatInputBar
          inputText={inputText}
          onInputChange={handleInputChange}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          hasPendingAction={hasPendingAction}
          showSlashMenu={showSlashMenu}
          filteredSlashCommands={filteredSlashCommands}
          onExecuteSlashCommand={executeSlashCommand}
          textareaRef={textareaRef}
        />

      </div>

      {/* CONTEXT MODAL */}
      {isContextModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card border-2 border-lavender/50 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sand" />
                Configurazione Contesto Chat & System Prompt
              </h3>
              <button
                onClick={() => setIsContextModalOpen(false)}
                className="text-white/60 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-lavender leading-relaxed">
              Il testo in questo riquadro viene incluso automaticamente come contesto o istruzioni di sistema per l'IA ad ogni messaggio.
            </p>

            {activeProjObj && (
              <div className="p-3 bg-canvas border border-sand/40 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-sand uppercase text-[10px] block">Progetto Collegato: {activeProjObj.name}</span>
                <p className="text-white/70 font-mono text-[11px] truncate">Path: {activeProjObj.path}</p>
                <p className="text-blue font-mono text-[11px]">Git Branch: {activeProjObj.branch}</p>
              </div>
            )}

            <textarea
              value={contextHeader}
              onChange={(e) => setContextHeader(e.target.value)}
              placeholder="Inserisci istruzioni di sistema o contesto aggiuntivo (es. regole di stile, formato risposte, percorsi file...)"
              className="w-full h-40 bg-canvas border border-white/20 rounded-2xl p-4 text-xs font-mono text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-lavender resize-none"
            />

            <div className="flex items-center justify-between pt-2">
              {contextSavedMessage ? (
                <span className="text-xs font-bold text-sage animate-fadeIn">✓ Contesto salvato su disco!</span>
              ) : (
                <span className="text-[11px] text-white/40 font-mono">Diaspro Viboard AI Context</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsContextModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Chiudi
                </button>
                <button
                  onClick={handleSaveContext}
                  className="action-pill bg-lavender hover:bg-sidebar text-white font-bold text-xs shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salva Contesto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
