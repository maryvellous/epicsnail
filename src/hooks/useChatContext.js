import { useState, useEffect } from 'react';
import { PROVIDER_TIERS } from '../constants/providers';

export function useChatContext(projects) {
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [activeTier, setActiveTier] = useState('gemini-2.0-flash');
  
  const [activeContextProjectId, setActiveContextProjectId] = useState('none');
  const [contextHeader, setContextHeader] = useState('');
  const [contextSavedMessage, setContextSavedMessage] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getStoreData().then(store => {
        if (store?.selectedProvider) {
          setActiveProvider(store.selectedProvider);
          const defaultTier = PROVIDER_TIERS[store.selectedProvider]?.[0]?.id;
          if (defaultTier) setActiveTier(defaultTier);
        }
      }).catch(() => {});

      window.electronAPI.getContextHeader().then(header => {
        if (header) {
          setContextHeader(header);
          const matched = (projects || []).find(p => p && p.name && header.includes(p.name));
          if (matched) setActiveContextProjectId(matched.id);
        }
      }).catch(() => {});
    }
  }, [projects]);

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

    const selectedProj = (projects || []).find(p => p.id === projectId);
    if (selectedProj) {
      const conciseContext = `[CONTESTO PROGETTO: ${selectedProj.name}]
- Percorso locale: ${selectedProj.path}
- Ramo Git attivo: ${selectedProj.branch}`;

      setContextHeader(conciseContext);
      if (window.electronAPI) {
        await window.electronAPI.saveContextHeader(conciseContext);
      }
    }
  };

  const handleSaveContext = async () => {
    if (window.electronAPI) {
      await window.electronAPI.saveContextHeader(contextHeader);
      setContextSavedMessage(true);
      setTimeout(() => setContextSavedMessage(false), 2000);
    }
  };

  return {
    activeProvider,
    setActiveProvider,
    activeTier,
    setActiveTier,
    handleProviderChange,
    activeContextProjectId,
    contextHeader,
    setContextHeader,
    contextSavedMessage,
    handleContextProjectChange,
    handleSaveContext
  };
}
