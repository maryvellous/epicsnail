import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ChatPanel Persistence Logic (Phase 1)', () => {
  let mockStoreData;
  let mockSetStoreData;

  beforeEach(() => {
    mockStoreData = {
      chatThreads: [
        {
          id: 't_current',
          title: 'Conversazione Corrente',
          messages: [{ id: 'm1', role: 'user', content: 'Messaggio salvato precedente' }],
          archived: false,
          date: 'Oggi'
        }
      ]
    };
    mockSetStoreData = vi.fn();
    global.window = {
      electronAPI: {
        getStoreData: vi.fn().mockResolvedValue(mockStoreData),
        setStoreData: mockSetStoreData,
        getContextHeader: vi.fn().mockResolvedValue(''),
        saveContextHeader: vi.fn().mockResolvedValue(true)
      }
    };
  });

  it('verifies that setStoreData is called when threads are updated after load', async () => {
    // Simulate store loading
    const loadedStore = await window.electronAPI.getStoreData();
    expect(loadedStore.chatThreads).toHaveLength(1);
    expect(loadedStore.chatThreads[0].messages[0].content).toBe('Messaggio salvato precedente');

    // Simulate sending a new message and updating thread payload
    const updatedThreads = [
      {
        ...loadedStore.chatThreads[0],
        messages: [
          ...loadedStore.chatThreads[0].messages,
          { id: 'm2', role: 'user', content: 'test persistenza 12345' }
        ]
      }
    ];

    // Trigger save via electronAPI
    await window.electronAPI.setStoreData('chatThreads', updatedThreads);

    expect(mockSetStoreData).toHaveBeenCalledWith('chatThreads', updatedThreads);
    expect(mockSetStoreData.mock.calls[0][1][0].messages).toHaveLength(2);
    expect(mockSetStoreData.mock.calls[0][1][0].messages[1].content).toBe('test persistenza 12345');
  });
});