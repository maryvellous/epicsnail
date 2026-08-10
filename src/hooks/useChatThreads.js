import { useState, useEffect } from 'react';

export const getTimeBasedGreeting = (name) => {
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

export function useChatThreads(userName) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: getTimeBasedGreeting(userName)
    }
  ]);

  const [threads, setThreads] = useState([
    { id: 't_current', title: 'Conversazione Corrente', messages: [], archived: false, date: 'Oggi' },
  ]);
  const [activeThreadId, setActiveThreadId] = useState('t_current');
  const [isLoaded, setIsLoaded] = useState(false);

  // Update welcome message if userName changes
  useEffect(() => {
    setMessages(prev => prev.map(m => {
      if (m.id === 'welcome') {
        return { ...m, content: getTimeBasedGreeting(userName) };
      }
      return m;
    }));
  }, [userName]);

  // Load threads from Electron store
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStoreData().then(store => {
        if (store?.chatThreads && Array.isArray(store.chatThreads) && store.chatThreads.length > 0) {
          setThreads(store.chatThreads);
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
    } else {
      setIsLoaded(true);
    }
  }, []);

  // Persist threads to store on change after load
  useEffect(() => {
    if (isLoaded && window.electronAPI) {
      window.electronAPI.setStoreData('chatThreads', threads);
    }
  }, [threads, isLoaded]);

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
    if (e) e.stopPropagation();
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

  return {
    threads,
    setThreads,
    activeThreadId,
    setActiveThreadId,
    messages,
    setMessages,
    isLoaded,
    handleCreateNewThread,
    handleArchiveThread,
    handleSwitchThread
  };
}
