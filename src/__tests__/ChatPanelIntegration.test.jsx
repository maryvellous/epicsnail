// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ChatPanel from '../components/ChatPanel';
import { GamificationProvider } from '../context/GamificationContext';
import { ProjectsProvider } from '../context/ProjectsContext';

describe('ChatPanel Real Component Integration Tests (useChatThreads & usePendingActions)', () => {
  let mockElectronAPI;

  beforeEach(() => {
    mockElectronAPI = {
      getStoreData: vi.fn().mockImplementation((key) => {
        if (key === 'chatThreads') return Promise.resolve([]);
        return Promise.resolve({
          user: { name: 'TestUser', xp: 150, level: 1, streak: 1 },
          chatThreads: []
        });
      }),
      setStoreData: vi.fn().mockResolvedValue(true),
      sendChatMessage: vi.fn(),
      executeTool: vi.fn(),
      scanRepos: vi.fn().mockResolvedValue([]),
      getGitHubRepos: vi.fn().mockResolvedValue({ success: true, repos: [] }),
      getContextHeader: vi.fn().mockResolvedValue(''),
      saveContextHeader: vi.fn().mockResolvedValue(true)
    };

    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.electronAPI = mockElectronAPI;
  });

  afterEach(() => {
    cleanup();
    delete window.electronAPI;
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <GamificationProvider>
        <ProjectsProvider>
          <ChatPanel />
        </ProjectsProvider>
      </GamificationProvider>
    );
  };

  it('1. Sync messages -> hasPendingAction: detects pending action in response and blocks input', async () => {
    mockElectronAPI.sendChatMessage.mockResolvedValueOnce({
      success: true,
      text: 'Richiesta di esecuzione comando git.',
      pendingAction: {
        toolName: 'gitExecute',
        params: { command: 'git status' },
        description: 'Esegui git status'
      }
    });

    renderComponent();

    // Find chat input textarea
    const textarea = screen.getAllByPlaceholderText(/Scrivi un messaggio/i)[0];
    fireEvent.change(textarea, { target: { value: 'Esegui git status' } });

    // Send message
    const sendButton = screen.getAllByTitle(/Invia messaggio/i)[0];
    fireEvent.click(sendButton);

    // Wait for AI response with pending action to arrive
    await waitFor(() => {
      expect(screen.getAllByText(/Esegui git status/i).length).toBeGreaterThan(0);
    });

    // Check that pending action action card buttons are rendered
    expect(screen.getAllByText(/Approva ed Esegui/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Annulla/i).length).toBeGreaterThan(0);

    // Input area should display warning or block sending while action is pending
    expect(screen.getAllByText(/Invio disabilitato/i).length).toBeGreaterThan(0);
  });

  it('2. Coherence messages/threads after handleApproveAction: updates action status and restores input availability', async () => {
    mockElectronAPI.sendChatMessage.mockResolvedValueOnce({
      success: true,
      text: 'Richiesta di esecuzione comando.',
      pendingAction: {
        toolName: 'gitExecute',
        params: { command: 'git pull' },
        description: 'Esegui git pull'
      }
    });

    mockElectronAPI.executeTool.mockResolvedValueOnce({
      success: true,
      output: 'Already up to date.'
    });

    renderComponent();

    const textarea = screen.getAllByPlaceholderText(/Scrivi un messaggio/i)[0];
    fireEvent.change(textarea, { target: { value: 'Fai git pull' } });
    fireEvent.click(screen.getAllByTitle(/Invia messaggio/i)[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/Esegui git pull/i).length).toBeGreaterThan(0);
    });

    // Click 'Approva ed Esegui' button after it renders
    const approveButtons = await screen.findAllByText(/Approva ed Esegui/i);
    fireEvent.click(approveButtons[approveButtons.length - 1]);

    // Verify executeTool was called
    await waitFor(() => {
      expect(mockElectronAPI.executeTool).toHaveBeenCalledWith('gitExecute', { command: 'git pull' });
    });

    // Verify system execution success message is added
    await waitFor(() => {
      expect(screen.getAllByText(/Azione eseguita con successo!/i).length).toBeGreaterThan(0);
    });

    // Input area is restored (hasPendingAction is false)
    await waitFor(() => {
      expect(screen.queryAllByText(/Invio disabilitato/i).length).toBe(0);
    });
  });

  it('3. Recalculation of hasPendingAction upon thread switch: toggles pending block state when switching threads', async () => {
    mockElectronAPI.sendChatMessage.mockResolvedValueOnce({
      success: true,
      text: 'Richiesta per Thread 1',
      pendingAction: {
        toolName: 'systemTool',
        params: {},
        description: 'Azione Pendente Thread 1'
      }
    });

    renderComponent();

    // 1. Send message in Thread 1 to get a pending action
    const textarea = screen.getAllByPlaceholderText(/Scrivi un messaggio/i)[0];
    fireEvent.change(textarea, { target: { value: 'Messaggio Thread 1' } });
    fireEvent.click(screen.getAllByTitle(/Invia messaggio/i)[0]);

    await waitFor(() => {
      expect(screen.getByText(/Azione Pendente Thread 1/i)).toBeDefined();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Invio disabilitato/i).length).toBeGreaterThan(0);
    });

    // 2. Open History Sidebar
    const sidebarToggleBtn = screen.getAllByTitle(/Cronologia & Archivio Chat/i)[0];
    fireEvent.click(sidebarToggleBtn);

    // 3. Create New Thread
    const newThreadBtn = screen.getByText(/Nuova Chat/i);
    fireEvent.click(newThreadBtn);

    // In Thread 2, there should be NO pending action warning
    await waitFor(() => {
      expect(screen.queryAllByText(/Invio disabilitato/i).length).toBe(0);
    });

    // 4. Switch back to Thread 1 ("Conversazione Corrente")
    const thread1Item = screen.getByText(/Conversazione Corrente/i);
    fireEvent.click(thread1Item);

    // In Thread 1, pending action warning should be recalculated and restored
    await waitFor(() => {
      expect(screen.getAllByText(/Invio disabilitato/i).length).toBeGreaterThan(0);
    });
  });
});
