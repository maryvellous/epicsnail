const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Git Scanner
  scanRepos: (rootPaths) => ipcRenderer.invoke('git:scan', rootPaths),
  getGitDetails: (folderPath) => ipcRenderer.invoke('git:details', folderPath),
  executeGitAction: (folderPath, action, options) => ipcRenderer.invoke('git:action', { folderPath, action, options }),

  // System Editors / Launchers
  openTerminal: (folderPath) => ipcRenderer.invoke('system:open-terminal', folderPath),
  openVSCode: (folderPath) => ipcRenderer.invoke('system:open-vscode', folderPath),
  openAndroidStudio: (folderPath) => ipcRenderer.invoke('system:open-studio', folderPath),
  openAntigravityIDE: (folderPath) => ipcRenderer.invoke('system:open-antigravity', folderPath),
  openInExplorer: (folderPath) => ipcRenderer.invoke('system:open-explorer', folderPath),
  openExternal: (url) => ipcRenderer.invoke('system:open-external', url),

  // Storage
  getStoreData: () => ipcRenderer.invoke('store:get-all'),
  setStoreData: (key, val) => ipcRenderer.invoke('store:set', { key, val }),

  // Vault & Auth
  saveToken: (service, token) => ipcRenderer.invoke('auth:save-token', { service, token }),
  getToken: (service) => ipcRenderer.invoke('auth:get-token', service),
  hasToken: (service) => ipcRenderer.invoke('auth:has-token', service),
  removeToken: (service) => ipcRenderer.invoke('auth:remove-token', service),

  // GitHub Integration
  validateGitHubToken: (token) => ipcRenderer.invoke('github:validate', token),
  getGitHubRepos: () => ipcRenderer.invoke('github:get-repos'),
  getGitHubIssues: () => ipcRenderer.invoke('github:get-issues'),

  // AI Key Test
  testAiKey: (provider, apiKey) => ipcRenderer.invoke('ai:test-key', { provider, apiKey }),


  // Google Integration
  startGoogleOAuth: () => ipcRenderer.invoke('google:start-oauth'),
  getGoogleStatus: () => ipcRenderer.invoke('google:get-status'),
  disconnectGoogle: () => ipcRenderer.invoke('google:disconnect'),
  getGoogleCalendarEvents: (maxResults) => ipcRenderer.invoke('google:get-events', maxResults),
  createGoogleCalendarEvent: (eventData) => ipcRenderer.invoke('google:create-event', eventData),
  deleteGoogleCalendarEvent: (eventId) => ipcRenderer.invoke('google:delete-event', eventId),
  getGoogleTasks: () => ipcRenderer.invoke('google:get-tasks'),
  toggleGoogleTask: (taskId, completed) => ipcRenderer.invoke('google:toggle-task', { taskId, completed }),
  createGoogleTask: (title, due) => ipcRenderer.invoke('google:create-task', { title, due }),
  postponeGoogleTask: (taskId) => ipcRenderer.invoke('google:postpone-task', taskId),
  getGoogleDriveFiles: (pageSize) => ipcRenderer.invoke('google:get-drive-files', pageSize),

  // Spotify Integration
  startSpotifyOAuth: () => ipcRenderer.invoke('spotify:start-oauth'),
  getSpotifyStatus: () => ipcRenderer.invoke('spotify:get-status'),
  disconnectSpotify: () => ipcRenderer.invoke('spotify:disconnect'),
  getSpotifyPlayback: () => ipcRenderer.invoke('spotify:get-playback'),
  spotifyPlay: () => ipcRenderer.invoke('spotify:play'),
  spotifyPause: () => ipcRenderer.invoke('spotify:pause'),
  spotifyNext: () => ipcRenderer.invoke('spotify:next'),
  spotifyPrevious: () => ipcRenderer.invoke('spotify:previous'),
  spotifySeek: (positionMs) => ipcRenderer.invoke('spotify:seek', positionMs),

  // Pinterest Integration
  startPinterestOAuth: () => ipcRenderer.invoke('pinterest:start-oauth'),
  getPinterestStatus: () => ipcRenderer.invoke('pinterest:get-status'),
  disconnectPinterest: () => ipcRenderer.invoke('pinterest:disconnect'),
  getPinterestBoards: () => ipcRenderer.invoke('pinterest:get-boards'),
  getPinterestPins: (boardId, bookmark) => ipcRenderer.invoke('pinterest:get-pins', { boardId, bookmark }),


  // Chat & Context Integration
  sendChatMessage: (data) => ipcRenderer.invoke('api:chat-message', data),
  executeTool: (toolName, params) => ipcRenderer.invoke('api:execute-tool', { toolName, params }),
  getContextHeader: () => ipcRenderer.invoke('api:get-context'),
  saveContextHeader: (header) => ipcRenderer.invoke('api:save-context', header),
});



