import { useState, useEffect } from 'react';

export function useAIConfig() {
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiKey, setAiKey] = useState('');
  const [aiStatus, setAiStatus] = useState(null);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getToken('selected_ai_provider').then((prov) => {
        const activeProv = prov || 'gemini';
        setAiProvider(activeProv);
        window.electronAPI.getToken(`${activeProv}_api_key`).then((k) => {
          if (k) setAiKey(k);
        });
      });
    }
  }, []);

  const handleProviderChange = (e) => {
    const newProv = e.target.value;
    setAiProvider(newProv);
    setAiKey('');
    setAiStatus(null);
    if (window.electronAPI) {
      window.electronAPI.saveToken('selected_ai_provider', newProv);
      window.electronAPI.getToken(`${newProv}_api_key`).then((k) => {
        if (k) setAiKey(k);
      });
    }
  };

  const handleSaveAiKey = async () => {
    if (aiProvider !== 'ollama' && !aiKey.trim()) return;
    setTestingAi(true);
    setAiStatus(null);
    if (window.electronAPI) {
      const res = await window.electronAPI.testAiKey(aiProvider, aiKey.trim());
      setTestingAi(false);
      setAiStatus(res);
      if (res.success) {
        await window.electronAPI.saveToken(`${aiProvider}_api_key`, aiKey.trim());
        await window.electronAPI.saveToken('selected_ai_provider', aiProvider);
      }
    } else {
      setTestingAi(false);
      setAiStatus({ success: true, message: 'Demo Web OK' });
    }
  };

  return {
    aiProvider,
    setAiProvider,
    aiKey,
    setAiKey,
    aiStatus,
    setAiStatus,
    testingAi,
    handleProviderChange,
    handleSaveAiKey,
  };
}

export default useAIConfig;
