function registerAIIPC(ipcMain, deps) {
  const { aiEngine, authVault } = deps;

  ipcMain.handle('ai:test-key', async (event, { provider, apiKey }) => {
    const keyToTest = apiKey || authVault.getToken(`${provider}_api_key`);
    
    if (provider === 'ollama') {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) return { success: true, message: 'Ollama locale raggiungibile!' };
        return { success: false, error: 'Ollama non risponde su http://localhost:11434' };
      } catch (e) {
        return { success: false, error: 'Ollama non in esecuzione in locale' };
      }
    }

    if (!keyToTest) return { success: false, error: 'Chiave API non fornita' };

    try {
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
        if (res.ok) return { success: true, message: 'Chiave Gemini API valida!' };
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Chiave non valida' };
      }

      if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': keyToTest,
            'anthropic-version': '2023-06-01',
          },
        });
        if (res.ok) return { success: true, message: 'Chiave Anthropic Claude valida!' };
        const err = await res.json().catch(() => ({}));
        return { success: false, error: `[HTTP ${res.status}] ${err.error?.message || err.message || JSON.stringify(err)}` };
      }

      if (provider === 'deepseek') {
        const res = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${keyToTest}` },
        });
        if (res.ok) return { success: true, message: 'Chiave DeepSeek API valida!' };
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Chiave DeepSeek non valida' };
      }

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${keyToTest}` },
        });
        if (res.ok) return { success: true, message: 'Chiave OpenAI valida!' };
        const err = await res.json();
        return { success: false, error: err.error?.message || 'Chiave OpenAI non valida' };
      }

      return { success: false, error: 'Provider sconosciuto' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('api:chat-message', async (event, data) => {
    return await aiEngine.handleChatMessage(data);
  });

  ipcMain.handle('api:execute-tool', async (event, { toolName, params }) => {
    return await aiEngine.executeTool(toolName, params);
  });

  ipcMain.handle('api:get-context', async () => {
    return aiEngine.getContextHeader();
  });

  ipcMain.handle('api:save-context', async (event, contextHeader) => {
    return aiEngine.saveContextHeader(contextHeader);
  });
}

module.exports = { registerAIIPC };
