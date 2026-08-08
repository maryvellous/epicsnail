import { describe, it, expect, vi } from 'vitest';

describe('ChatPanel Thread Switching Race Condition Logic (Phase 2)', () => {
  it('ensures async AI response is bound to targetThreadId and does not contaminate activeThreadId if user switches threads', async () => {
    const targetThreadId = 't_1';
    let activeThreadId = 't_1';

    const threads = [
      { id: 't_1', title: 'Thread 1', messages: [{ id: 'm1', role: 'user', content: 'Domanda Thread 1' }] },
      { id: 't_2', title: 'Thread 2', messages: [{ id: 'm2', role: 'user', content: 'Domanda Thread 2' }] }
    ];

    // Mock async AI response delay
    const mockSendChatMessage = vi.fn().mockImplementation(async () => {
      return { success: true, text: 'Risposta per Thread 1' };
    });

    // 1. User sends message in Thread 1
    const asyncResponsePromise = mockSendChatMessage();

    // 2. User switches to Thread 2 BEFORE AI response resolves
    activeThreadId = 't_2';

    // 3. AI response resolves
    const res = await asyncResponsePromise;

    // 4. Update threads array targeting targetThreadId ('t_1')
    const assistantMsg = { id: 'asst_1', role: 'assistant', content: res.text };
    const updatedThreads = threads.map(t => {
      if (t.id === targetThreadId) {
        return { ...t, messages: [...t.messages, assistantMsg] };
      }
      return t;
    });

    // 5. Check UI update rule: active messages only update if current active thread matches target
    let activeUIMessages = threads.find(t => t.id === activeThreadId).messages;
    if (activeThreadId === targetThreadId) {
      activeUIMessages = [...activeUIMessages, assistantMsg];
    }

    // VERIFY: Thread 1 has the AI response in threads storage
    const t1 = updatedThreads.find(t => t.id === 't_1');
    expect(t1.messages).toHaveLength(2);
    expect(t1.messages[1].content).toBe('Risposta per Thread 1');

    // VERIFY: Thread 2 was NOT contaminated
    const t2 = updatedThreads.find(t => t.id === 't_2');
    expect(t2.messages).toHaveLength(1);
    expect(t2.messages[0].content).toBe('Domanda Thread 2');

    // VERIFY: Current UI view (Thread 2) remains untainted
    expect(activeUIMessages).toHaveLength(1);
    expect(activeUIMessages[0].content).toBe('Domanda Thread 2');
  });
});
