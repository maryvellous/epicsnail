import React, { useState, useEffect, useRef } from 'react';
import { AestheticCommentsIcon } from './AestheticIcons';
import { 
  Send, Sparkles, Sliders, CheckCircle, XCircle, 
  Trash2, Calendar, FolderGit2, Music, ChevronDown,
  CornerDownLeft, ShieldCheck, History, Plus, Archive, Folder, MessageSquare
} from 'lucide-react';
import { useGamification } from '../context/GamificationContext';
import { useProjects } from '../context/ProjectsContext';
import { PROVIDER_TIERS } from '../constants/providers';

const getTimeBasedGreeting = (name) => {
  const hour = new Date().getHours();
  let timeSalute = 'Buongiorno';
  if (hour >= 12 && hour < 18) {
    timeSalute = 'Buon pomeriggio';
  } else if (hour >= 18 && hour < 22) {
    timeSalute = 'Buonasera';
  } else if (hour >= 22 || hour < 5) {
    timeSalute = 'Buonanotte';
  }
  const displayName = name ? ` ${name}` : '';
  return `${timeSalute}${displayName}, cosa posso fare per te?`;
};

const SLASH_COMMANDS = [
  { command: '/calendar', label: 'Mostra eventi Google Calendar', icon: Calendar, prompt: 'Mostrami i miei prossimi eventi su Google Calendar.' },
  { command: '/github', label: 'Mostra repository e issue aperte', icon: FolderGit2, prompt: 'Elenca le mie issue aperte ed i repository GitHub.' },
  { command: '/spotify', label: 'Stato riproduzione musica', icon: Music, prompt: 'Qual è il brano attualmente in riproduzione su Spotify?' },
  { command: '/clear', label: 'Cancella la cronologia della chat', icon: Trash2, action: 'clear' },
];

export default function ChatPanel() {
  const { userName } = useGamification();
  const { projects } = useProjects();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: getTimeBasedGreeting(userName)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings & Tiers
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [activeTier, setActiveTier] = useState('gemini-2.0-flash');
  
  // Active Project Context & Header
  const [activeContextProjectId, setActiveContextProjectId] = useState('none');
  const [contextHeader, setContextHeader] = useState('');
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [contextSavedMessage, setContextSavedMessage] = useState(false);

  // Chat History Sidebar State & Archived Threads
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [threads, setThreads] = useState([
    { id: 't_current', title: 'Conversazione Corrente', messages: [], archived: false, date: 'Oggi' },
  ]);
  const [activeThreadId, setActiveThreadId] = useState('t_current');
  const [isLoaded, setIsLoaded] = useState(false);

  // Slash menu UI
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Update welcome message if username loads late
    setMessages(prev => prev.map(m => {
      if (m.id === 'welcome') {
        return { ...m, content: getTimeBasedGreeting(userName) };
      }
      return m;
    }));
  }, [userName]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStoreData().then(store => {
        if (store?.selectedProvider) {
          setActiveProvider(store.selectedProvider);
          const defaultTier = PROVIDER_TIERS[store.selectedProvider]?.[0]?.id;
          if (defaultTier) setActiveTier(defaultTier);
        }
        if (store?.chatThreads && Array.isArray(store.chatThreads) && store.chatThreads.length > 0) {
          setThreads(store.chatThreads);
          // Restore messages of initial active thread if available
          const initialThread = store.chatThreads.find(t => t.id === 't_current') || store.chatThreads[0];
          if (initialThread && initialThread.messages && initialThread.messages.length > 0) {
            setMessages(initialThread.messages);
            setActiveThreadId(initialThread.id);
          }
        }
        setIsLoaded(true);
      }).catch(() => {
        setIsLoaded(true);
      });

      window.electronAPI.getContextHeader().then(header => {
        if (header) {
          setContextHeader(header);
          // Try matching header to project
          const matched = (projects || []).find(p => p && p.name && header.includes(p.name));
          if (matched) setActiveContextProjectId(matched.id);
        }
      });
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Persist threads to disk whenever threads state updates after initial load
  useEffect(() => {
    if (isLoaded && window.electronAPI) {
      window.electronAPI.setStoreData('chatThreads', threads);
    }
  }, [threads, isLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleProviderChange = (prov) => {
    setActiveProvider(prov);
    const tiers = PROVIDER_TIERS[prov] || [];
    if (tiers.length > 0) setActiveTier(tiers[0].id);
  };

  const handleContextProjectChange = async (projectId) => {
    setActiveContextProjectId(projectId);
    if (projectId === 'none') {
      setContextHeader('');
      if (window.electronAPI) await window.electronAPI.saveContextHeader('');
      return;
    }

    const selectedProj = projects.find(p => p.id === projectId);
    if (selectedProj) {
      // Concise context format as agreed
      const conciseContext = `[CONTESTO PROGETTO: ${selectedProj.name}]
- Percorso locale: ${selectedProj.path}
- Ramo Git attivo: ${selectedProj.branch}`;

      setContextHeader(conciseContext);
      if (window.electronAPI) {
        await window.electronAPI.saveContextHeader(conciseContext);
      }
    }
  };

  const handleCreateNewThread = () => {
    const newId = `t_${Date.now()}`;
    const newThread = {
      id: newId,
      title: `Nuova Chat ${threads.length + 1}`,
      messages: [{ id: 'welcome', role: 'assistant', content: getTimeBasedGreeting(userName) }],
      archived: false,
      date: 'Ora'
    };
    const updated = [newThread, ...threads];
    setThreads(updated);
    setActiveThreadId(newId);
    setMessages(newThread.messages);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('chatThreads', updated);
    }
  };

  const handleArchiveThread = (threadId, e) => {
    e.stopPropagation();
    const updated = threads.map(t => t.id === threadId ? { ...t, archived: !t.archived } : t);
    setThreads(updated);
    if (window.electronAPI) {
      window.electronAPI.setStoreData('chatThreads', updated);
    }
  };

  const handleSwitchThread = (thread) => {
    setActiveThreadId(thread.id);
    setMessages(thread.messages.length > 0 ? thread.messages : [{ id: 'welcome', role: 'assistant', content: getTimeBasedGreeting(userName) }]);
  };

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
      const cleared = [
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: 'Cronologia chat cancellata.'
        }
      ];
      setMessages(cleared);
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: cleared } : t));
      setInputText('');
      return;
    }

    if (cmd.prompt) {
      sendMessage(cmd.prompt);
    }
  };

  const sendMessage = async (overrideText = null) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: newMessages } : t));
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
        setMessages(updatedMsgs);

        // Update active thread storage
        setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, messages: updatedMsgs } : t));
      } else {
        const errMsg = {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `**Errore:** ${res.error || 'Impossibile completare la richiesta.'}`
        };
        setMessages(prev => {
          const updated = [...prev, errMsg];
          setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
          return updated;
        });
      }
    } catch (e) {
      const connErrMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `**Errore di connessione:** ${e.message}`
      };
      setMessages(prev => {
        const updated = [...prev, connErrMsg];
        setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (msgId, action) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === msgId && m.pendingAction) {
          return {
            ...m,
            pendingAction: { ...m.pendingAction, status: 'executing' }
          };
        }
        return m;
      });
      setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
      return updated;
    });

    try {
      const res = await window.electronAPI.executeTool(action.toolName, action.params);
      
      setMessages(prev => {
        const updated = prev.map(m => {
          if (m.id === msgId && m.pendingAction) {
            return {
              ...m,
              pendingAction: {
                ...m.pendingAction,
                status: res.success ? 'completed' : 'error',
                result: res
              }
            };
          }
          return m;
        });
        setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
        return updated;
      });

      if (res.success) {
        const sysMsg = {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `**Azione eseguita con successo!**\n\`\`\`json\n${JSON.stringify(res, null, 2)}\n\`\`\``
        };
        setMessages(prev => {
          const updated = [...prev, sysMsg];
          setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
          return updated;
        });
      } else {
        const errSysMsg = {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `❌ **Errore durante l'esecuzione dell'azione:** ${res.error}`
        };
        setMessages(prev => {
          const updated = [...prev, errSysMsg];
          setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
          return updated;
        });
      }
    } catch (err) {
      const catchErrMsg = { error: err.message };
      setMessages(prev => {
        const updated = prev.map(m => {
          if (m.id === msgId && m.pendingAction) {
            return {
              ...m,
              pendingAction: { ...m.pendingAction, status: 'error', result: catchErrMsg }
            };
          }
          return m;
        });
        setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
        return updated;
      });
    }
  };

  const handleCancelAction = (msgId) => {
    setMessages(prev => {
      const updated = prev.map(m => {
        if (m.id === msgId && m.pendingAction) {
          return {
            ...m,
            pendingAction: { ...m.pendingAction, status: 'cancelled' }
          };
        }
        return m;
      });
      setThreads(tPrev => tPrev.map(t => t.id === activeThreadId ? { ...t, messages: updated } : t));
      return updated;
    });
  };

  const handleSaveContext = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveContextHeader(contextHeader);
      setContextSavedMessage(true);
      setTimeout(() => setContextSavedMessage(false), 2000);
    }
  };

  const filteredSlashCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(slashFilter) || cmd.label.toLowerCase().includes(slashFilter)
  );

  const activeProjObj = projects.find(p => p.id === activeContextProjectId);

  return (
    <div className="flex-1 flex h-full bg-[#1e1333] text-white relative overflow-hidden select-none">
      
      {/* COLLAPSIBLE CHAT HISTORY SIDEBAR */}
      {isHistorySidebarOpen && (
        <aside className="w-64 h-full bg-[#2b1c47] border-r border-[#7A3F67]/40 flex flex-col p-4 z-30 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h2 className="font-heading font-black text-sm text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#E8D19E]" />
              Cronologia Chat
            </h2>
            <button
              onClick={() => setIsHistorySidebarOpen(false)}
              className="text-white/60 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleCreateNewThread}
            className="action-pill bg-[#9D85C6] hover:bg-[#6B5887] text-white font-bold w-full justify-center mb-4 text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Chat</span>
          </button>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <span className="text-[10px] font-mono text-[#E8D19E] uppercase tracking-wider block mb-1">Attive</span>
            {threads.filter(t => !t.archived).map((t) => (
              <div
                key={t.id}
                onClick={() => handleSwitchThread(t)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                  t.id === activeThreadId
                    ? 'bg-[#7A3F67] border-[#E8D19E] font-bold text-white shadow-md'
                    : 'bg-[#1e1333] border-white/10 text-white/80 hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-[#E8D19E] shrink-0" />
                  <span className="truncate">{t.title}</span>
                </div>

                <button
                  onClick={(e) => handleArchiveThread(t.id, e)}
                  title="Archivia Conversazione"
                  className="p-1 rounded-lg text-white/40 hover:text-[#E8D19E] hover:bg-white/10"
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
                    onClick={() => handleSwitchThread(t)}
                    className="p-2.5 rounded-2xl bg-[#1e1333]/50 border border-white/5 text-xs text-white/50 cursor-pointer flex items-center justify-between hover:text-white"
                  >
                    <span className="truncate">{t.title}</span>
                    <button
                      onClick={(e) => handleArchiveThread(t.id, e)}
                      title="Ripristina Conversazione"
                      className="p-1 text-white/40 hover:text-white"
                    >
                      ↺
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER CHAT WITH CONTEXT PILL & CONTROLS */}
        <header className="h-16 px-6 pr-36 bg-[#2b1c47] border-b border-[#7A3F67]/50 flex items-center justify-between z-20 shadow-xl drag-region">
          <div className="flex items-center gap-3 no-drag">
            <button
              onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
              className="p-2 rounded-xl bg-[#1e1333] border border-white/10 text-[#E8D19E] hover:bg-[#6B5887] transition-all"
              title="Cronologia & Archivio Chat"
            >
              <History className="w-4 h-4" />
            </button>

            <AestheticCommentsIcon className="w-10 h-10 shrink-0 filter drop-shadow-md" />

            <div>
              <h1 className="font-heading font-black text-base text-white leading-tight">
                Diaspro AI
              </h1>
              <p className="text-[11px] text-[#9D85C6]">Assistente integrato Diaspro Viboard</p>
            </div>
          </div>

          {/* CONTROLS HEADER (Context Pill Dropdown, Provider & Tier) */}
          <div className="flex items-center gap-3 no-drag">
            
            {/* CONTEXT PILL DROPDOWN */}
            <div className="relative">
              <select
                value={activeContextProjectId}
                onChange={(e) => handleContextProjectChange(e.target.value)}
                className="appearance-none bg-[#7A3F67] text-[#E8D19E] border border-[#E8D19E]/50 hover:border-[#E8D19E] rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#E8D19E] cursor-pointer shadow-md"
              >
                <option value="none" className="bg-[#2b1c47] text-white/70">Nessun Contesto</option>
                {(projects || []).map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#2b1c47] text-white font-normal">
                    Contesto: {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#E8D19E] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Provider Selector */}
            <div className="relative hidden md:block">
              <select
                value={activeProvider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="appearance-none bg-[#1e1333] text-[#A5C4DC] border border-[#9D85C6]/40 hover:border-[#9D85C6] rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#9D85C6] cursor-pointer shadow-inner"
              >
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI GPT</option>
                <option value="deepseek">DeepSeek</option>
                <option value="ollama">Ollama (Locale)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#A5C4DC] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Active Tier Selector */}
            <div className="relative">
              <select
                value={activeTier}
                onChange={(e) => setActiveTier(e.target.value)}
                className="appearance-none bg-[#6B5887] text-white border border-white/20 hover:border-white rounded-2xl px-3.5 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#9D85C6] cursor-pointer shadow-md"
              >
                {(PROVIDER_TIERS[activeProvider] || []).map(t => (
                  <option key={t.id} value={t.id} className="bg-[#2b1c47] text-white font-normal">
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Context Config Button */}
            <button
              onClick={() => setIsContextModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#1e1333] hover:bg-[#6B5887] border border-white/20 text-xs font-bold text-white transition-all cursor-pointer shadow-md active:scale-95"
              title="Configurazione Manuale Contesto & System Instructions"
            >
              <Sliders className="w-4 h-4 text-[#E8D19E]" />
            </button>
          </div>
        </header>

        {/* CHAT MESSAGES STREAM */}
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
                          ? 'bg-[#6B5887] text-white border-[#A5C4DC]/30 rounded-tr-sm'
                          : 'bg-[#2b1c47] text-white border-[#9D85C6]/40 rounded-tl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans break-words">
                        {msg.content}
                      </div>
                    </div>

                    {/* HUMAN-IN-THE-LOOP ACTION CARD */}
                    {msg.pendingAction && (
                      <div className="p-4 rounded-2xl bg-[#2b1c47] border-2 border-[#E8D19E]/60 shadow-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[#E8D19E] font-bold text-xs">
                          <ShieldCheck className="w-4 h-4 text-[#E8D19E]" />
                          Richiesta di Approvazione Esecuzione (Human-in-the-Loop)
                        </div>

                        <div className="text-xs text-white bg-[#1e1333] p-3 rounded-xl border border-white/10 font-mono">
                          <p className="font-semibold text-[#E8D19E] mb-1">{msg.pendingAction.description}</p>
                          <span className="text-[11px] text-[#A5C4DC]">Tool: {msg.pendingAction.toolName}</span>
                        </div>

                        {/* ACTION BUTTONS & STATUS */}
                        {msg.pendingAction.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleApproveAction(msg.id, msg.pendingAction)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#98A78A] hover:bg-[#88977A] text-[#15260f] font-black text-xs shadow-lg transition-all cursor-pointer active:scale-95"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approva ed Esegui
                            </button>
                            <button
                              onClick={() => handleCancelAction(msg.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-300 font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              <XCircle className="w-4 h-4 text-red-300" />
                              Annulla
                            </button>
                          </div>
                        )}

                        {msg.pendingAction.status === 'executing' && (
                          <div className="text-xs text-[#E8D19E] font-medium flex items-center gap-2 py-1">
                            <span className="w-3 h-3 border-2 border-[#E8D19E] border-t-transparent rounded-full animate-spin"></span>
                            Esecuzione in corso...
                          </div>
                        )}

                        {msg.pendingAction.status === 'completed' && (
                          <div className="text-xs text-[#98A78A] font-bold flex items-center gap-1.5 py-1">
                            <CheckCircle className="w-4 h-4" />
                            Azione eseguita con successo!
                          </div>
                        )}

                        {msg.pendingAction.status === 'cancelled' && (
                          <div className="text-xs text-[#A5C4DC] font-medium flex items-center gap-1.5 py-1">
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
                <div className="p-3 rounded-2xl bg-[#2b1c47] border border-[#9D85C6]/30 text-xs text-[#9D85C6] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#9D85C6] rounded-full animate-ping"></span>
                  Elaborazione risposta in corso...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA & SLASH MENU */}
        <div className="p-4 sm:p-6 bg-[#2b1c47] border-t border-[#7A3F67]/40 z-20 flex justify-center shadow-2xl">
          <div className="w-full max-w-3xl relative">
            
            {/* SLASH COMMANDS MENU POPUP */}
            {showSlashMenu && filteredSlashCommands.length > 0 && (
              <div className="absolute bottom-full mb-3 left-0 w-full bg-[#2b1c47] border-2 border-[#9D85C6]/50 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/10 animate-fadeIn">
                <div className="px-4 py-2 bg-[#1e1333] text-[11px] font-bold text-[#E8D19E] uppercase tracking-wider flex items-center justify-between">
                  <span>Comandi Rapidi (Slash Commands)</span>
                  <span className="text-[#9D85C6] font-normal">Premi invio o seleziona</span>
                </div>
                {filteredSlashCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.command}
                      onClick={() => executeSlashCommand(cmd)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-[#6B5887]/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#7A3F67] border border-[#9D85C6]/40 flex items-center justify-center text-[#E8D19E] group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-sm text-[#E8D19E] group-hover:text-white mr-2">{cmd.command}</span>
                          <span className="text-xs text-[#A5C4DC]">{cmd.label}</span>
                        </div>
                      </div>
                      <CornerDownLeft className="w-4 h-4 text-[#9D85C6] group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* INPUT BAR WITH AUTO-EXPANDING TEXTAREA */}
            <div className="flex items-end gap-2 bg-[#1e1333] border border-[#9D85C6]/40 focus-within:border-[#9D85C6] rounded-3xl p-2.5 shadow-2xl transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputText}
                onChange={(e) => {
                  handleInputChange(e);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                  }
                }}
                placeholder="Scrivi un messaggio o digita / per i comandi rapidi... (Invio per inviare, Shift+Invio a capo)"
                className="flex-1 bg-transparent border-none text-white text-sm px-4 py-1 focus:outline-none placeholder-[#9D85C6]/50 font-sans resize-none overflow-y-auto max-h-40 leading-relaxed"
              />
              <button
                onClick={() => {
                  sendMessage();
                  if (textareaRef.current) textareaRef.current.style.height = 'auto';
                }}
                disabled={!inputText.trim() || isLoading}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
                  inputText.trim() && !isLoading
                    ? 'bg-[#6B5887] hover:bg-[#7A3F67] text-white hover:scale-105 active:scale-95 border border-white/20'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEXT CONFIGURATION MODAL */}
      {isContextModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#2b1c47] border border-[#9D85C6]/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#E8D19E]" />
                <h3 className="font-heading font-black text-lg text-white">Configurazione Contesto AI</h3>
              </div>
              <button
                onClick={() => setIsContextModalOpen(false)}
                className="text-white/50 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#A5C4DC] leading-relaxed">
              Definisci le **Stringhe di Inizializzazione (Context Header / System Instructions)** da allegare a ogni richiesta inviata al provider attivo.
            </p>

            <textarea
              rows={6}
              value={contextHeader}
              onChange={(e) => setContextHeader(e.target.value)}
              placeholder="Inserisci qui le istruzioni di contesto predefinite..."
              className="w-full bg-[#1e1333] border border-[#9D85C6]/40 focus:border-[#9D85C6] rounded-2xl p-4 text-xs text-white focus:outline-none resize-none font-mono"
            />

            {contextSavedMessage && (
              <div className="text-xs text-[#98A78A] font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Configurazione contesto salvata!
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsContextModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white/80 cursor-pointer"
              >
                Chiudi
              </button>
              <button
                onClick={handleSaveContext}
                className="px-5 py-2 rounded-xl bg-[#6B5887] hover:bg-[#7A3F67] text-xs font-bold text-white shadow-lg cursor-pointer border border-white/20"
              >
                Salva Contesto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
