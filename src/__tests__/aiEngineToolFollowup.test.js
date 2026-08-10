import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AIEngine from '../../electron/aiEngine';

describe('AIEngine Tool Follow-up & Loop Protection', () => {
  let aiEngine;
  let mockAuthVault;
  let mockStore;
  let mockGithubTools;
  let mockGoogleTools;
  let mockSpotifyTools;

  beforeEach(() => {
    mockAuthVault = {
      getToken: vi.fn((key) => 'test-api-key')
    };

    mockStore = {
      get: vi.fn((key) => {
        if (key === 'scanPaths') return ['C:\\TestPath'];
        return null;
      }),
      set: vi.fn()
    };

    mockGithubTools = {
      getRepos: vi.fn().mockResolvedValue([{ name: 'test-repo' }]),
      getIssues: vi.fn().mockResolvedValue([]),
      createIssue: vi.fn()
    };

    mockGoogleTools = {};
    mockSpotifyTools = {};

    aiEngine = new AIEngine(
      mockAuthVault,
      mockStore,
      mockGithubTools,
      mockGoogleTools,
      mockSpotifyTools
    );

    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('callGemini', () => {
    it('executes read-only tool and performs natural language follow-up with full context', async () => {
      // First fetch: Gemini returns tool call
      const firstResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                role: 'model',
                parts: [{ functionCall: { name: 'get_github_repos', args: {} } }]
              }
            }
          ]
        })
      };

      // Second fetch: Gemini follow-up returns natural text
      const secondResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                role: 'model',
                parts: [{ text: 'Ecco i tuoi repository: test-repo.' }]
              }
            }
          ]
        })
      };

      global.fetch
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'gemini',
        modelTier: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: 'Mostrami i miei repo' }]
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Ecco i tuoi repository: test-repo.');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Verify follow-up payload included full context
      const secondCallBody = JSON.parse(global.fetch.mock.calls[1][1].body);
      expect(secondCallBody.contents).toHaveLength(3); // User message, Model functionCall, User functionResponse
      expect(secondCallBody.contents[2].parts[0].functionResponse.name).toBe('get_github_repos');
    });

    it('triggers loop protection and warns when follow-up response contains an unexpected tool call', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const firstResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_github_repos', args: {} } }] } }]
        })
      };

      // Second response contains another tool call
      const secondResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'read_local_file', args: {} } }] } }]
        })
      };

      global.fetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'gemini',
        messages: [{ role: 'user', content: 'Mostrami i repo' }]
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected tool call'));
      expect(result.text).toContain('[Informazioni recuperate da get_github_repos]');
    });

    it('logs error and falls back to raw JSON when follow-up fetch fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const firstResponse = {
        ok: true,
        json: async () => ({
          candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'get_github_repos', args: {} } }] } }]
        })
      };

      global.fetch
        .mockResolvedValueOnce(firstResponse)
        .mockRejectedValueOnce(new Error('Network error on follow-up'));

      const result = await aiEngine.handleChatMessage({
        provider: 'gemini',
        messages: [{ role: 'user', content: 'Mostrami i repo' }]
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Gemini follow-up call failed'), expect.any(Error));
      expect(result.text).toContain('[Informazioni recuperate da get_github_repos]');
    });
  });

  describe('callOpenAICompatible (OpenAI & DeepSeek)', () => {
    it('executes tool follow-up for OpenAI provider with role: tool', async () => {
      const firstResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              tool_calls: [{ id: 'call_123', function: { name: 'get_github_repos', arguments: '{}' } }]
            }
          }]
        })
      };

      const secondResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'Hai un repo chiamato test-repo.' } }]
        })
      };

      global.fetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'openai',
        messages: [{ role: 'user', content: 'Quali repo ho?' }]
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Hai un repo chiamato test-repo.');

      const secondCallBody = JSON.parse(global.fetch.mock.calls[1][1].body);
      expect(secondCallBody.messages).toHaveLength(4); // system, user, assistant tool_call, tool response
      expect(secondCallBody.messages[3].role).toBe('tool');
      expect(secondCallBody.messages[3].tool_call_id).toBe('call_123');
    });

    it('executes tool follow-up for DeepSeek provider independently', async () => {
      const firstResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              tool_calls: [{ id: 'call_ds_456', function: { name: 'get_github_repos', arguments: '{}' } }]
            }
          }]
        })
      };

      const secondResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { role: 'assistant', content: 'Risposta da DeepSeek: test-repo trovato.' } }]
        })
      };

      global.fetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'deepseek',
        messages: [{ role: 'user', content: 'Quali repo ho su DeepSeek?' }]
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Risposta da DeepSeek: test-repo trovato.');
      expect(global.fetch.mock.calls[0][0]).toContain('api.deepseek.com');
    });

    it('handles loop protection for OpenAI/DeepSeek when follow-up returns tool_calls', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const firstResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: { role: 'assistant', tool_calls: [{ id: 'call_1', function: { name: 'get_github_repos', arguments: '{}' } }] }
          }]
        })
      };

      const secondResponse = {
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant',
              content: 'Ecco una parte',
              tool_calls: [{ id: 'call_2', function: { name: 'read_local_file', arguments: '{}' } }]
            }
          }]
        })
      };

      global.fetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'openai',
        messages: [{ role: 'user', content: 'Test loop' }]
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('unexpected tool call'));
      expect(result.text).toBe('Ecco una parte');
    });
  });

  describe('callAnthropic', () => {
    it('executes tool follow-up with natural language response', async () => {
      const firstResponse = {
        ok: true,
        json: async () => ({
          content: [
            { type: 'tool_use', id: 'toolu_01', name: 'get_github_repos', input: {} }
          ]
        })
      };

      const secondResponse = {
        ok: true,
        json: async () => ({
          content: [
            { type: 'text', text: 'Trovato 1 repository su GitHub: test-repo.' }
          ]
        })
      };

      global.fetch.mockResolvedValueOnce(firstResponse).mockResolvedValueOnce(secondResponse);

      const result = await aiEngine.handleChatMessage({
        provider: 'anthropic',
        messages: [{ role: 'user', content: 'Mostrami i repo' }]
      });

      expect(result.success).toBe(true);
      expect(result.text).toBe('Trovato 1 repository su GitHub: test-repo.');
    });

    it('logs error when Anthropic follow-up fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const firstResponse = {
        ok: true,
        json: async () => ({
          content: [
            { type: 'tool_use', id: 'toolu_01', name: 'get_github_repos', input: {} }
          ]
        })
      };

      global.fetch
        .mockResolvedValueOnce(firstResponse)
        .mockRejectedValueOnce(new Error('Anthropic follow-up network error'));

      const result = await aiEngine.handleChatMessage({
        provider: 'anthropic',
        messages: [{ role: 'user', content: 'Mostrami i repo' }]
      });

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Anthropic follow-up call failed'), expect.any(Error));
      expect(result.text).toContain('[Dati recuperati tramite get_github_repos]');
    });
  });
});
