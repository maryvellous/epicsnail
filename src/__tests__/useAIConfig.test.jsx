// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIConfig } from '../hooks/useAIConfig';

describe('useAIConfig Custom Hook (Step 2)', () => {
  let mockGetToken;
  let mockSaveToken;
  let mockTestAiKey;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken = vi.fn().mockImplementation((key) => {
      if (key === 'selected_ai_provider') return Promise.resolve('gemini');
      if (key === 'gemini_api_key') return Promise.resolve('gemini-secret-key-123');
      if (key === 'anthropic_api_key') return Promise.resolve('claude-secret-key-456');
      return Promise.resolve(null);
    });
    mockSaveToken = vi.fn().mockResolvedValue(true);
    mockTestAiKey = vi.fn().mockResolvedValue({ success: true, message: 'Key ok' });

    global.window = {
      electronAPI: {
        getToken: mockGetToken,
        saveToken: mockSaveToken,
        testAiKey: mockTestAiKey,
      },
    };
  });

  it('loads active AI provider and its saved API key on mount', async () => {
    const { result } = renderHook(() => useAIConfig());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetToken).toHaveBeenCalledWith('selected_ai_provider');
    expect(mockGetToken).toHaveBeenCalledWith('gemini_api_key');
    expect(result.current.aiProvider).toBe('gemini');
    expect(result.current.aiKey).toBe('gemini-secret-key-123');
  });

  it('reloads saved key when provider changes', async () => {
    const { result } = renderHook(() => useAIConfig());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      result.current.handleProviderChange({ target: { value: 'anthropic' } });
      await Promise.resolve();
    });

    expect(result.current.aiProvider).toBe('anthropic');
    expect(mockSaveToken).toHaveBeenCalledWith('selected_ai_provider', 'anthropic');
    expect(mockGetToken).toHaveBeenCalledWith('anthropic_api_key');
    expect(result.current.aiKey).toBe('claude-secret-key-456');
  });

  it('saves API key and selected provider when testAiKey succeeds', async () => {
    const { result } = renderHook(() => useAIConfig());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setAiKey('new-valid-gemini-key');
    });

    await act(async () => {
      await result.current.handleSaveAiKey();
    });

    expect(mockTestAiKey).toHaveBeenCalledWith('gemini', 'new-valid-gemini-key');
    expect(mockSaveToken).toHaveBeenCalledWith('gemini_api_key', 'new-valid-gemini-key');
    expect(mockSaveToken).toHaveBeenCalledWith('selected_ai_provider', 'gemini');
    expect(result.current.aiStatus).toEqual({ success: true, message: 'Key ok' });
  });

  it('blocks saving API key when testAiKey fails', async () => {
    mockTestAiKey.mockResolvedValueOnce({ success: false, error: 'Chiave non valida' });

    const { result } = renderHook(() => useAIConfig());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setAiKey('invalid-key-xyz');
    });

    await act(async () => {
      await result.current.handleSaveAiKey();
    });

    expect(mockTestAiKey).toHaveBeenCalledWith('gemini', 'invalid-key-xyz');
    expect(mockSaveToken).not.toHaveBeenCalledWith('gemini_api_key', 'invalid-key-xyz');
    expect(result.current.aiStatus).toEqual({ success: false, error: 'Chiave non valida' });
  });

  it('degrades gracefully to Demo Web OK when window.electronAPI is undefined', async () => {
    delete global.window.electronAPI;

    const { result } = renderHook(() => useAIConfig());

    act(() => {
      result.current.setAiKey('demo-key');
    });

    await act(async () => {
      await result.current.handleSaveAiKey();
    });

    expect(result.current.testingAi).toBe(false);
    expect(result.current.aiStatus).toEqual({ success: true, message: 'Demo Web OK' });
  });
});
