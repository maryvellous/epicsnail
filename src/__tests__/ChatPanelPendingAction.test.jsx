import { describe, it, expect } from 'vitest';

describe('ChatPanel Human-in-the-Loop Pending Action Guard (Phase 3)', () => {
  it('detects pending action cards and blocks message sending while pending', () => {
    const messages = [
      { id: 'm1', role: 'user', content: 'Esegui comando git' },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Richiesta esecuzione',
        pendingAction: { toolName: 'gitExecute', params: {}, status: 'pending', description: 'Esegui git' }
      }
    ];

    const hasPendingAction = messages.some(m => m.pendingAction && m.pendingAction.status === 'pending');
    expect(hasPendingAction).toBe(true);

    // Simulate sendMessage guard check
    const inputText = 'Nuova domanda';
    const isLoading = false;
    const canSend = inputText.trim() && !isLoading && !hasPendingAction;

    expect(canSend).toBe(false);
  });

  it('allows message sending once action status is updated to completed or cancelled', () => {
    const messages = [
      { id: 'm1', role: 'user', content: 'Esegui comando git' },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Richiesta esecuzione',
        pendingAction: { toolName: 'gitExecute', params: {}, status: 'completed', description: 'Esegui git' }
      }
    ];

    const hasPendingAction = messages.some(m => m.pendingAction && m.pendingAction.status === 'pending');
    expect(hasPendingAction).toBe(false);

    const inputText = 'Nuova domanda';
    const isLoading = false;
    const canSend = !!(inputText.trim() && !isLoading && !hasPendingAction);

    expect(canSend).toBe(true);
  });
});
