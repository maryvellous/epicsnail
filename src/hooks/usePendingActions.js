export function usePendingActions({ messages, setMessages, setThreads, activeThreadId, setActiveThreadId }) {
  const hasPendingAction = messages.some(m => m.pendingAction && m.pendingAction.status === 'pending');

  const handleApproveAction = async (msgId, action) => {
    const targetThreadId = activeThreadId;

    setThreads(prev => prev.map(t => {
      if (t.id === targetThreadId) {
        const updated = (t.messages || []).map(m => {
          if (m.id === msgId && m.pendingAction) {
            return { ...m, pendingAction: { ...m.pendingAction, status: 'executing' } };
          }
          return m;
        });
        return { ...t, messages: updated };
      }
      return t;
    }));

    setActiveThreadId(currentActive => {
      if (currentActive === targetThreadId) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId && m.pendingAction) {
            return { ...m, pendingAction: { ...m.pendingAction, status: 'executing' } };
          }
          return m;
        }));
      }
      return currentActive;
    });

    try {
      const res = await window.electronAPI.executeTool(action.toolName, action.params);
      
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const updated = (t.messages || []).map(m => {
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
          return { ...t, messages: updated };
        }
        return t;
      }));

      setActiveThreadId(currentActive => {
        if (currentActive === targetThreadId) {
          setMessages(prev => prev.map(m => {
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
          }));
        }
        return currentActive;
      });

      if (res.success) {
        const sysMsg = {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `**Azione eseguita con successo!**\n\`\`\`json\n${JSON.stringify(res, null, 2)}\n\`\`\``
        };
        setThreads(prev => prev.map(t => {
          if (t.id === targetThreadId) {
            return { ...t, messages: [...(t.messages || []), sysMsg] };
          }
          return t;
        }));
        setActiveThreadId(currentActive => {
          if (currentActive === targetThreadId) {
            setMessages(prev => [...prev, sysMsg]);
          }
          return currentActive;
        });
      } else {
        const errSysMsg = {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `❌ **Errore durante l'esecuzione dell'azione:** ${res.error}`
        };
        setThreads(prev => prev.map(t => {
          if (t.id === targetThreadId) {
            return { ...t, messages: [...(t.messages || []), errSysMsg] };
          }
          return t;
        }));
        setActiveThreadId(currentActive => {
          if (currentActive === targetThreadId) {
            setMessages(prev => [...prev, errSysMsg]);
          }
          return currentActive;
        });
      }
    } catch (err) {
      const catchErrMsg = { error: err.message };
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const updated = (t.messages || []).map(m => {
            if (m.id === msgId && m.pendingAction) {
              return { ...m, pendingAction: { ...m.pendingAction, status: 'error', result: catchErrMsg } };
            }
            return m;
          });
          return { ...t, messages: updated };
        }
        return t;
      }));
      setActiveThreadId(currentActive => {
        if (currentActive === targetThreadId) {
          setMessages(prev => prev.map(m => {
            if (m.id === msgId && m.pendingAction) {
              return { ...m, pendingAction: { ...m.pendingAction, status: 'error', result: catchErrMsg } };
            }
            return m;
          }));
        }
        return currentActive;
      });
    }
  };

  const handleCancelAction = (msgId) => {
    const targetThreadId = activeThreadId;

    setThreads(prev => prev.map(t => {
      if (t.id === targetThreadId) {
        const updated = (t.messages || []).map(m => {
          if (m.id === msgId && m.pendingAction) {
            return { ...m, pendingAction: { ...m.pendingAction, status: 'cancelled' } };
          }
          return m;
        });
        return { ...t, messages: updated };
      }
      return t;
    }));

    setActiveThreadId(currentActive => {
      if (currentActive === targetThreadId) {
        setMessages(prev => prev.map(m => {
          if (m.id === msgId && m.pendingAction) {
            return { ...m, pendingAction: { ...m.pendingAction, status: 'cancelled' } };
          }
          return m;
        }));
      }
      return currentActive;
    });
  };

  return {
    hasPendingAction,
    handleApproveAction,
    handleCancelAction
  };
}
