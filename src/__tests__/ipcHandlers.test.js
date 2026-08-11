import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerAllIPC,
  registerGitIPC,
  registerSystemIPC,
  registerAuthIPC,
  registerGithubIPC,
  registerGoogleIPC,
  registerSpotifyIPC,
  registerPinterestIPC,
  registerAIIPC,
} from '../../electron/ipc/index.js';

function createMockIpcMain() {
  const handlers = new Map();
  return {
    handle: vi.fn((channel, fn) => {
      handlers.set(channel, fn);
    }),
    getHandler: (channel) => handlers.get(channel),
    hasChannel: (channel) => handlers.has(channel),
    handlers,
  };
}

describe('Electron IPC Handlers Refactoring', () => {
  let mockIpcMain;
  let mockStore;
  let mockAuthVault;
  let mockGithubTools;
  let mockGoogleTools;
  let mockSpotifyTools;
  let mockPinterestTools;
  let mockAiEngine;
  let mockOAuthManager;
  let mockSystemOps;
  let mockShell;
  let mockGitScanner;
  let deps;

  beforeEach(() => {
    mockIpcMain = createMockIpcMain();

    mockStore = {
      get: vi.fn((key) => (key === 'scanPaths' ? ['/mock/path'] : null)),
      set: vi.fn((key, val) => ({ key, val })),
      data: { theme: 'dark', scanPaths: ['/mock/path'] },
    };

    mockAuthVault = {
      saveToken: vi.fn().mockReturnValue(true),
      getToken: vi.fn().mockReturnValue('mock-token'),
      hasToken: vi.fn().mockReturnValue(true),
      removeToken: vi.fn().mockReturnValue(true),
    };

    mockGithubTools = {
      validateToken: vi.fn().mockResolvedValue({ valid: true }),
      getRepos: vi.fn().mockResolvedValue([{ name: 'repo1' }]),
      getIssues: vi.fn().mockResolvedValue([{ id: 1 }]),
    };

    mockGoogleTools = {
      getClientId: vi.fn().mockReturnValue('google-id'),
      getClientSecret: vi.fn().mockReturnValue('google-secret'),
      getConnectionStatus: vi.fn().mockResolvedValue({ connected: true }),
      disconnect: vi.fn().mockResolvedValue(true),
      getCalendarEvents: vi.fn().mockResolvedValue([]),
      createCalendarEvent: vi.fn().mockResolvedValue({ id: 'evt1' }),
      deleteCalendarEvent: vi.fn().mockResolvedValue(true),
      getGoogleTasks: vi.fn().mockResolvedValue([]),
      toggleGoogleTask: vi.fn().mockResolvedValue(true),
      createGoogleTask: vi.fn().mockResolvedValue({ id: 'tsk1' }),
      postponeTaskToTomorrow: vi.fn().mockResolvedValue(true),
      getDriveFiles: vi.fn().mockResolvedValue([]),
    };

    mockSpotifyTools = {
      startSpotifyOAuth: vi.fn().mockResolvedValue({ success: true }),
      getConnectionStatus: vi.fn().mockResolvedValue({ connected: true }),
      getPlaybackState: vi.fn().mockResolvedValue({ is_playing: true }),
      play: vi.fn().mockResolvedValue(true),
      pause: vi.fn().mockResolvedValue(true),
      next: vi.fn().mockResolvedValue(true),
      previous: vi.fn().mockResolvedValue(true),
      seek: vi.fn().mockResolvedValue(true),
    };

    mockPinterestTools = {
      startPinterestOAuth: vi.fn().mockResolvedValue({ success: true }),
      getConnectionStatus: vi.fn().mockResolvedValue({ connected: true }),
      getPinterestBoards: vi.fn().mockResolvedValue([]),
      getPinterestPins: vi.fn().mockResolvedValue([]),
    };

    mockAiEngine = {
      handleChatMessage: vi.fn().mockResolvedValue({ response: 'hello' }),
      executeTool: vi.fn().mockResolvedValue({ result: 'ok' }),
      getContextHeader: vi.fn().mockReturnValue('header-ctx'),
      saveContextHeader: vi.fn().mockReturnValue(true),
    };

    mockOAuthManager = {
      startGoogleOAuth: vi.fn().mockResolvedValue({ success: true, tokens: { access_token: 'abc' } }),
    };

    mockSystemOps = {
      openTerminal: vi.fn().mockResolvedValue(true),
      openVSCode: vi.fn().mockResolvedValue(true),
      openAndroidStudio: vi.fn().mockResolvedValue(true),
      openAntigravityIDE: vi.fn().mockResolvedValue(true),
      openInExplorer: vi.fn().mockResolvedValue(true),
    };

    mockShell = {
      openExternal: vi.fn(),
    };

    mockGitScanner = {
      scanDirectoryForGitRepos: vi.fn().mockResolvedValue([{ name: 'repo-scanned', path: '/mock/path/repo' }]),
      getGitProjectDetails: vi.fn().mockResolvedValue({ name: 'current-repo', path: '/mock/app/root' }),
      executeGitAction: vi.fn().mockResolvedValue({ success: true }),
    };

    deps = {
      store: mockStore,
      authVault: mockAuthVault,
      githubTools: mockGithubTools,
      googleTools: mockGoogleTools,
      spotifyTools: mockSpotifyTools,
      pinterestTools: mockPinterestTools,
      aiEngine: mockAiEngine,
      OAuthManager: mockOAuthManager,
      scanDirectoryForGitRepos: mockGitScanner.scanDirectoryForGitRepos,
      getGitProjectDetails: mockGitScanner.getGitProjectDetails,
      executeGitAction: mockGitScanner.executeGitAction,
      systemOps: mockSystemOps,
      shell: mockShell,
      appRoot: '/mock/app/root',
    };
  });

  it('registers all 27+ expected IPC channels via registerAllIPC', () => {
    registerAllIPC(mockIpcMain, deps);

    const expectedChannels = [
      // Git
      'git:scan', 'git:details', 'git:action',
      // System & Store
      'system:open-terminal', 'system:open-vscode', 'system:open-studio',
      'system:open-antigravity', 'system:open-explorer', 'system:open-external',
      'store:get-all', 'store:set',
      // Auth
      'auth:save-token', 'auth:get-token', 'auth:has-token', 'auth:remove-token',
      // GitHub
      'github:validate', 'github:get-repos', 'github:get-issues',
      // Google
      'google:start-oauth', 'google:get-status', 'google:disconnect',
      'google:get-events', 'google:create-event', 'google:delete-event',
      'google:get-tasks', 'google:toggle-task', 'google:create-task',
      'google:postpone-task', 'google:get-drive-files',
      // Spotify
      'spotify:start-oauth', 'spotify:get-status', 'spotify:disconnect',
      'spotify:get-playback', 'spotify:play', 'spotify:pause',
      'spotify:next', 'spotify:previous', 'spotify:seek',
      // Pinterest
      'pinterest:start-oauth', 'pinterest:get-status', 'pinterest:disconnect',
      'pinterest:get-boards', 'pinterest:get-pins',
      // AI
      'ai:test-key', 'api:chat-message', 'api:execute-tool',
      'api:get-context', 'api:save-context',
    ];

    expect(mockIpcMain.handlers.size).toBe(expectedChannels.length);

    for (const channel of expectedChannels) {
      expect(mockIpcMain.hasChannel(channel), `Channel ${channel} should be registered`).toBe(true);
    }
  });

  it('verifies shared store reference is used by gitHandlers and systemHandlers', async () => {
    registerGitIPC(mockIpcMain, deps);
    registerSystemIPC(mockIpcMain, deps);

    // Call git:scan which uses store.get('scanPaths')
    const gitScanHandler = mockIpcMain.getHandler('git:scan');
    await gitScanHandler(null, []);
    expect(mockStore.get).toHaveBeenCalledWith('scanPaths');

    // Call store:get-all which returns store.data
    const storeGetAllHandler = mockIpcMain.getHandler('store:get-all');
    const storeData = await storeGetAllHandler();
    expect(storeData).toBe(mockStore.data);

    // Call store:set which calls store.set
    const storeSetHandler = mockIpcMain.getHandler('store:set');
    await storeSetHandler(null, { key: 'scanPaths', val: ['/new/path'] });
    expect(mockStore.set).toHaveBeenCalledWith('scanPaths', ['/new/path']);
  });

  it('isolates registration errors in individual IPC modules with try/catch', () => {
    const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create broken deps or faulty module call test
    const faultyIpcMain = {
      handle: (channel) => {
        if (channel.startsWith('google:')) {
          throw new Error('Simulated Google module init failure');
        }
      },
    };

    expect(() => registerAllIPC(faultyIpcMain, deps)).not.toThrow();

    expect(spyError).toHaveBeenCalledWith(
      expect.stringContaining('[IPC Register Error] Failed to register Google IPC handlers:'),
      expect.any(Error)
    );

    spyError.mockRestore();
  });
});
