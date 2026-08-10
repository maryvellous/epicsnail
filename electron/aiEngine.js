const TokenTrimmer = require('./tokenTrimmer');

class AIEngine {
  constructor(authVault, store, githubTools, googleTools, spotifyTools) {
    this.authVault = authVault;
    this.store = store;
    this.githubTools = githubTools;
    this.googleTools = googleTools;
    this.spotifyTools = spotifyTools;

    // Mutative write tools require user approval (Human-in-the-Loop)
    this.mutativeTools = [
      'create_calendar_event',
      'create_github_issue',
      'spotify_play',
      'spotify_pause',
      'spotify_next',
      'spotify_previous'
    ];
  }

  getContextHeader() {
    const customHeader = this.store.get('context_header');
    const scanPaths = this.store.get('scanPaths') || [];
    const scanInfo = scanPaths.length > 0 
      ? ` [Percorsi di scansione disco locali attivi: ${scanPaths.join(', ')}. Usa lo strumento get_local_projects per accedere ai progetti locali trovati sul disco.]`
      : '';
    return (customHeader || "Sei Diaspro AI, un assistente IA produttivo integrato nell'app desktop Diaspro Viboard. Sii conciso, cortese e usa Markdown per le risposte.") + scanInfo;
  }

  saveContextHeader(headerText) {
    return this.store.set('context_header', headerText);
  }

  // Unified Tool Definitions (OpenAI/Generic JSON Schema format)
  getToolsDeclarations() {
    return [
      {
        name: 'get_calendar_events',
        description: 'Recupera i prossimi eventi da Google Calendar.',
        parameters: {
          type: 'object',
          properties: {
            maxResults: { type: 'integer', description: 'Numero massimo di eventi da restituire (default 10)' }
          }
        }
      },
      {
        name: 'create_calendar_event',
        description: 'Crea un nuovo evento su Google Calendar (richiede approvazione utente).',
        parameters: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Titolo dell\'evento' },
            startTime: { type: 'string', description: 'Data/ora di inizio (ISO string o HH:mm per oggi)' },
            endTime: { type: 'string', description: 'Data/ora di fine (ISO string o HH:mm per oggi)' },
            description: { type: 'string', description: 'Descrizione opzionale dell\'evento' }
          },
          required: ['summary']
        }
      },
      {
        name: 'get_google_tasks',
        description: 'Recupera le attività da Google Tasks.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'get_github_repos',
        description: 'Recupera i repository GitHub dell\'utente.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'get_github_issues',
        description: 'Recupera le issue aperte GitHub dell\'utente.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'create_github_issue',
        description: 'Crea una nuova issue su un repository GitHub (richiede approvazione utente).',
        parameters: {
          type: 'object',
          properties: {
            repo: { type: 'string', description: 'Nome del repository nel formato owner/repo' },
            title: { type: 'string', description: 'Titolo della issue' },
            body: { type: 'string', description: 'Corpo/Descrizione della issue' }
          },
          required: ['repo', 'title']
        }
      },
      {
        name: 'get_spotify_playback',
        description: 'Recupera lo stato attuale della riproduzione Spotify.',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'spotify_play',
        description: 'Avvia o riprende la riproduzione Spotify (richiede approvazione utente).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'spotify_pause',
        description: 'Mette in pausa la riproduzione Spotify (richiede approvazione utente).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'spotify_next',
        description: 'Passa al brano successivo su Spotify (richiede approvazione utente).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'get_local_projects',
        description: 'Scansiona e restituisce i repository e progetti locali dell\'utente trovati nei percorsi di scansione su disco (es. C:\\Users\\Clark\\Desktop).',
        parameters: { type: 'object', properties: {} }
      },
      {
        name: 'read_local_file',
        description: 'Legge il contenuto di un file sorgente o documento di un progetto locale (es. README.md, package.json, file di codice).',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Percorso assoluto del file da leggere' }
          },
          required: ['filePath']
        }
      },
      {
        name: 'spotify_previous',
        description: 'Torna al brano precedente su Spotify (richiede approvazione utente).',
        parameters: { type: 'object', properties: {} }
      }
    ];
  }

  // Execute read-only or confirmed mutative tools
  async executeTool(toolName, params = {}) {
    try {
      switch (toolName) {
        case 'get_calendar_events':
          return await this.googleTools.getCalendarEvents(params.maxResults || 10);
        case 'create_calendar_event':
          return await this.googleTools.createCalendarEvent(params);
        case 'get_google_tasks':
          return await this.googleTools.getGoogleTasks();
        case 'get_github_repos':
          return await this.githubTools.getRepos();
        case 'get_github_issues':
          return await this.githubTools.getIssues();
        case 'create_github_issue':
          return await this.githubTools.createIssue(params);
        case 'get_spotify_playback':
          return await this.spotifyTools.getPlaybackState();
        case 'spotify_play':
          return await this.spotifyTools.play();
        case 'spotify_pause':
          return await this.spotifyTools.pause();
        case 'spotify_next':
          return await this.spotifyTools.next();
        case 'spotify_previous':
          return await this.spotifyTools.previous();
        case 'get_local_projects': {
          const rootPaths = this.store.get('scanPaths') || [];
          const { scanDirectoryForGitRepos } = require('./gitScanner');
          const allRepos = [];
          for (const rootPath of rootPaths) {
            try {
              const repos = await scanDirectoryForGitRepos(rootPath, 3);
              allRepos.push(...repos);
            } catch (err) {
              console.error('Scan error on path:', rootPath, err);
            }
          }
          return { success: true, scanPaths: rootPaths, projects: allRepos };
        }
        case 'read_local_file': {
          const fs = require('fs').promises;
          try {
            const content = await fs.readFile(params.filePath, 'utf-8');
            return { success: true, filePath: params.filePath, content: content.slice(0, 12000) };
          } catch (err) {
            return { success: false, error: err.message };
          }
        }
        default:
          return { success: false, error: `Tool non riconosciuto: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Send message to LLM provider
  async handleChatMessage({ provider, modelTier, messages }) {
    const contextHeader = this.getContextHeader();
    const apiKey = this.authVault.getToken(`${provider}_api_key`);

    if (provider !== 'ollama' && !apiKey) {
      return {
        success: false,
        error: `Chiave API non trovata per il provider "${provider}". Configurala nelle Impostazioni.`
      };
    }

    // Trim messages to fit context window safely
    const trimmedMessages = TokenTrimmer.trimMessages(messages, 6000);

    try {
      if (provider === 'gemini') {
        return await this.callGemini({ apiKey, modelTier: modelTier || 'gemini-3.6-flash', contextHeader, messages: trimmedMessages });
      } else if (provider === 'anthropic') {
        return await this.callAnthropic({ apiKey, modelTier: modelTier || 'claude-sonnet-5', contextHeader, messages: trimmedMessages });
      } else if (provider === 'openai' || provider === 'deepseek') {
        const baseUrl = provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.deepseek.com';
        const defaultTier = provider === 'openai' ? 'gpt-5.6-terra' : 'deepseek-v4-flash';
        return await this.callOpenAICompatible({ baseUrl, apiKey, modelTier: modelTier || defaultTier, contextHeader, messages: trimmedMessages });
      } else if (provider === 'ollama') {
        return await this.callOllama({ modelTier: modelTier || 'llama3.3', contextHeader, messages: trimmedMessages });
      } else {
        return { success: false, error: `Provider non supportato: ${provider}` };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Gemini API Handler
  async callGemini({ apiKey, modelTier, contextHeader, messages }) {
    const activeModel = modelTier || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;

    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Inject system context header as first instruction if present
    const systemInstruction = {
      parts: [{ text: contextHeader }]
    };

    const tools = [{
      functionDeclarations: this.getToolsDeclarations().map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }))
    }];

    const payload = {
      contents: formattedContents,
      systemInstruction,
      tools
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gemini API Status ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let responseText = '';
    let functionCall = null;

    for (const part of parts) {
      if (part.text) responseText += part.text;
      if (part.functionCall) functionCall = part.functionCall;
    }

    if (functionCall) {
      const toolName = functionCall.name;
      const params = functionCall.args || {};

      if (this.mutativeTools.includes(toolName)) {
        return {
          success: true,
          text: responseText || `Ho preparato l'azione per: **${toolName}**.`,
          pendingAction: {
            id: `action_${Date.now()}`,
            toolName,
            params,
            description: this.getToolActionSummary(toolName, params)
          }
        };
      } else {
        // Read-only tool auto execution
        const toolResult = await this.executeTool(toolName, params);

        try {
          const responsePayload = (typeof toolResult === 'object' && toolResult !== null && !Array.isArray(toolResult))
            ? toolResult
            : { result: toolResult };

          const followUpContents = [
            ...formattedContents,
            candidate.content || {
              role: 'model',
              parts: [{ functionCall }]
            },
            {
              role: 'user',
              parts: [{
                functionResponse: {
                  name: toolName,
                  response: responsePayload
                }
              }]
            }
          ];

          const res2 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: followUpContents,
              systemInstruction,
              tools
            })
          });

          if (res2.ok) {
            const data2 = await res2.json();
            const candidate2 = data2.candidates?.[0];
            const parts2 = candidate2?.content?.parts || [];

            let text2 = '';
            let secondFunctionCall = null;

            for (const part of parts2) {
              if (part.text) text2 += part.text;
              if (part.functionCall) secondFunctionCall = part.functionCall;
            }

            if (secondFunctionCall) {
              console.warn('[AIEngine] Follow-up response contained unexpected tool call, falling back');
              if (text2) return { success: true, text: text2 };
            } else if (text2) {
              return { success: true, text: text2 };
            }
          }
        } catch (err) {
          console.error('[AIEngine] Gemini follow-up call failed:', err);
        }

        return {
          success: true,
          text: `[Informazioni recuperate da ${toolName}]:\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``
        };
      }
    }

    return {
      success: true,
      text: responseText || 'Nessuna risposta ricevuta dal modello.'
    };
  }

  // OpenAI / DeepSeek Compatible Handler
  async callOpenAICompatible({ baseUrl, apiKey, modelTier, contextHeader, messages }) {
    const formattedMessages = [
      { role: 'system', content: contextHeader },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const tools = this.getToolsDeclarations().map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelTier,
        messages: formattedMessages,
        tools
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `API Status ${res.status}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;

    if (choice?.tool_calls && choice.tool_calls.length > 0) {
      const toolCallObj = choice.tool_calls[0];
      const toolCall = toolCallObj.function;
      const toolName = toolCall.name;
      let params = {};
      try {
        params = JSON.parse(toolCall.arguments || '{}');
      } catch (e) {
        console.warn('[AIEngine] Failed to parse toolCall arguments JSON:', e.message);
      }

      if (this.mutativeTools.includes(toolName)) {
        return {
          success: true,
          text: choice.content || `Azione proposta per: **${toolName}**.`,
          pendingAction: {
            id: `action_${Date.now()}`,
            toolName,
            params,
            description: this.getToolActionSummary(toolName, params)
          }
        };
      } else {
        const toolResult = await this.executeTool(toolName, params);

        try {
          const followUpMessages = [
            ...formattedMessages,
            choice,
            {
              role: 'tool',
              tool_call_id: toolCallObj.id,
              content: JSON.stringify(toolResult)
            }
          ];

          const res2 = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: modelTier,
              messages: followUpMessages,
              tools
            })
          });

          if (res2.ok) {
            const data2 = await res2.json();
            const choice2 = data2.choices?.[0]?.message;
            const text2 = choice2?.content || '';

            if (choice2?.tool_calls && choice2.tool_calls.length > 0) {
              console.warn('[AIEngine] Follow-up response contained unexpected tool call, falling back');
              if (text2) return { success: true, text: text2 };
            } else if (text2) {
              return { success: true, text: text2 };
            }
          }
        } catch (err) {
          console.error('[AIEngine] OpenAI/DeepSeek follow-up call failed:', err);
        }

        return {
          success: true,
          text: `[Dati recuperati tramite ${toolName}]:\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``
        };
      }
    }

    return {
      success: true,
      text: choice?.content || ''
    };
  }

  // Anthropic Claude Handler
  async callAnthropic({ apiKey, modelTier, contextHeader, messages }) {
    const formattedMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    const tools = this.getToolsDeclarations().map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));

    const targetModel = modelTier || 'claude-sonnet-5';

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: targetModel,
        system: contextHeader,
        max_tokens: 1024,
        messages: formattedMessages,
        tools
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Anthropic API Status ${res.status}`);
    }

    const data = await res.json();
    let text = '';
    let toolUse = null;

    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text') text += block.text;
        if (block.type === 'tool_use') toolUse = block;
      }
    }

    if (toolUse) {
      const toolName = toolUse.name;
      const params = toolUse.input || {};

      if (this.mutativeTools.includes(toolName)) {
        return {
          success: true,
          text: text || `Preparazione azione: **${toolName}**.`,
          pendingAction: {
            id: `action_${Date.now()}`,
            toolName,
            params,
            description: this.getToolActionSummary(toolName, params)
          }
        };
      } else {
        const toolResult = await this.executeTool(toolName, params);
        try {
          const followUpMessages = [
            ...formattedMessages,
            { role: 'assistant', content: data.content },
            {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify(toolResult)
                }
              ]
            }
          ];

          const res2 = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              model: targetModel,
              system: contextHeader,
              max_tokens: 1024,
              messages: followUpMessages,
              tools
            })
          });

          if (res2.ok) {
            const data2 = await res2.json();
            let text2 = '';
            let secondToolUse = null;

            if (data2.content && Array.isArray(data2.content)) {
              for (const block of data2.content) {
                if (block.type === 'text') text2 += block.text;
                if (block.type === 'tool_use') secondToolUse = block;
              }
            }

            if (secondToolUse) {
              console.warn('[AIEngine] Follow-up response contained unexpected tool call, falling back');
              if (text2) return { success: true, text: text2 };
            } else if (text2) {
              return { success: true, text: text2 };
            }
          }
        } catch (err) {
          console.error('[AIEngine] Anthropic follow-up call failed:', err);
        }

        return {
          success: true,
          text: `[Dati recuperati tramite ${toolName}]:\n\`\`\`json\n${JSON.stringify(toolResult, null, 2)}\n\`\`\``
        };
      }
    }

    return {
      success: true,
      text: text || ''
    };
  }

  // Ollama Local API Handler
  async callOllama({ modelTier, contextHeader, messages }) {
    const formattedMessages = [
      { role: 'system', content: contextHeader },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modelTier || 'llama3',
        messages: formattedMessages,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama non risponde su http://localhost:11434 (status ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      text: data.message?.content || ''
    };
  }

  getToolActionSummary(toolName, params) {
    switch (toolName) {
      case 'create_calendar_event':
        return `Creazione evento Google Calendar: "${params.summary || 'Nuovo Evento'}" (${params.startTime || 'Oggi'})`;
      case 'create_github_issue':
        return `Creazione issue GitHub in "${params.repo || 'Repository'}": "${params.title || 'Nuova Issue'}"`;
      case 'spotify_play':
        return 'Avvio/Ripresa riproduzione Spotify';
      case 'spotify_pause':
        return 'Pausa riproduzione Spotify';
      case 'spotify_next':
        return 'Passaggio al brano successivo su Spotify';
      case 'spotify_previous':
        return 'Ritorno al brano precedente su Spotify';
      default:
        return `Esecuzione azione: ${toolName}`;
    }
  }
}

module.exports = AIEngine;
