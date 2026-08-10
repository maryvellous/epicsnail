const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Load root .env file if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (e) {
    console.warn('Could not parse .env file:', e);
  }
}

const LocalStore = require('./storage');
const AuthVault = require('./authVault');
const GitHubTools = require('./githubTools');
const OAuthManager = require('./oauthManager');
const GoogleTools = require('./googleTools');
const SpotifyTools = require('./spotifyTools');
const PinterestTools = require('./pinterestTools');
const AIEngine = require('./aiEngine');
const { scanDirectoryForGitRepos, getGitProjectDetails, executeGitAction } = require('./gitScanner');
const { openTerminal, openVSCode, openAndroidStudio, openAntigravityIDE, openInExplorer } = require('./systemOps');

const store = new LocalStore();
const authVault = new AuthVault();
const githubTools = new GitHubTools(authVault);
const googleTools = new GoogleTools(authVault);
const spotifyTools = new SpotifyTools(authVault);
const pinterestTools = new PinterestTools(authVault);
const aiEngine = new AIEngine(authVault, store, githubTools, googleTools, spotifyTools);

let mainWindow = null;

function checkDevServer(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 650,
    title: 'Diaspro Viboard',
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2b1c47',
      symbolColor: '#E8D19E',
      height: 28,
    },
    backgroundColor: '#1e1333',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devServerActive = await checkDevServer('http://localhost:5173');
  if (devServerActive) {
    console.log('Loading live Vite dev server at http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  } else {
    console.log('Loading production dist build');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers
ipcMain.handle('git:scan', async (event, rootPaths) => {
  const pathsToScan = rootPaths && rootPaths.length > 0 ? rootPaths : store.get('scanPaths');
  let allRepos = [];
  for (const rootPath of pathsToScan) {
    try {
      const repos = await scanDirectoryForGitRepos(rootPath, 3);
      allRepos.push(...repos);
    } catch (e) {
      console.error('Scan error on path:', rootPath, e);
    }
  }

  const currentWorkspace = path.resolve(__dirname, '..');
  const hasCurrent = allRepos.some(r => r.path === currentWorkspace);
  if (!hasCurrent) {
    const currentRepo = await getGitProjectDetails(currentWorkspace);
    if (currentRepo) allRepos.unshift(currentRepo);
  }

  return allRepos;
});

ipcMain.handle('git:details', async (event, folderPath) => {
  return await getGitProjectDetails(folderPath);
});

ipcMain.handle('git:action', async (event, { folderPath, action, options }) => {
  return await executeGitAction(folderPath, action, options);
});

ipcMain.handle('system:open-terminal', async (event, folderPath) => {
  return await openTerminal(folderPath);
});

ipcMain.handle('system:open-vscode', async (event, folderPath) => {
  return await openVSCode(folderPath);
});

ipcMain.handle('system:open-studio', async (event, folderPath) => {
  return await openAndroidStudio(folderPath);
});

ipcMain.handle('system:open-antigravity', async (event, folderPath) => {
  return await openAntigravityIDE(folderPath);
});

ipcMain.handle('system:open-explorer', async (event, folderPath) => {
  return await openInExplorer(folderPath);
});

ipcMain.handle('system:open-external', async (event, url) => {
  if (url) shell.openExternal(url);
});

ipcMain.handle('store:get-all', async () => {
  return store.data;
});

ipcMain.handle('store:set', async (event, { key, val }) => {
  return store.set(key, val);
});

// Auth & Vault IPC Handlers
ipcMain.handle('auth:save-token', async (event, { service, token }) => {
  return authVault.saveToken(service, token);
});

ipcMain.handle('auth:get-token', async (event, service) => {
  return authVault.getToken(service);
});

ipcMain.handle('auth:has-token', async (event, service) => {
  return authVault.hasToken(service);
});

ipcMain.handle('auth:remove-token', async (event, service) => {
  return authVault.removeToken(service);
});

// GitHub Integration IPC Handlers
ipcMain.handle('github:validate', async (event, token) => {
  return await githubTools.validateToken(token);
});

ipcMain.handle('github:get-repos', async () => {
  return await githubTools.getRepos();
});

ipcMain.handle('github:get-issues', async () => {
  return await githubTools.getIssues();
});

// Google Integration IPC Handlers
ipcMain.handle('google:start-oauth', async () => {
  const clientId = googleTools.getClientId();
  const clientSecret = googleTools.getClientSecret();
  const oauthResult = await OAuthManager.startGoogleOAuth({ clientId, clientSecret });
  if (oauthResult.success && oauthResult.tokens) {
    authVault.saveToken('google_tokens', oauthResult.tokens);
  }
  return oauthResult;
});

ipcMain.handle('google:get-status', async () => {
  return await googleTools.getConnectionStatus();
});

ipcMain.handle('google:disconnect', async () => {
  return await googleTools.disconnect();
});

ipcMain.handle('google:get-events', async (event, maxResults) => {
  return await googleTools.getCalendarEvents(maxResults);
});

ipcMain.handle('google:create-event', async (event, eventData) => {
  return await googleTools.createCalendarEvent(eventData);
});

ipcMain.handle('google:get-tasks', async () => {
  return await googleTools.getGoogleTasks();
});

ipcMain.handle('google:toggle-task', async (event, { taskId, completed }) => {
  return await googleTools.toggleGoogleTask(taskId, completed);
});

ipcMain.handle('google:create-task', async (event, { title, due }) => {
  return await googleTools.createGoogleTask(title, due);
});

ipcMain.handle('google:get-drive-files', async (event, pageSize) => {
  return await googleTools.getDriveFiles(pageSize);
});


ipcMain.handle('google:delete-event', async (event, eventId) => {
  return await googleTools.deleteCalendarEvent(eventId);
});

ipcMain.handle('google:postpone-task', async (event, taskId) => {
  return await googleTools.postponeTaskToTomorrow(taskId);
});

// Spotify Integration IPC Handlers
ipcMain.handle('spotify:start-oauth', async () => {
  return await spotifyTools.startSpotifyOAuth();
});

ipcMain.handle('spotify:get-status', async () => {
  return await spotifyTools.getConnectionStatus();
});

ipcMain.handle('spotify:disconnect', async () => {
  return authVault.removeToken('spotify_tokens');
});

ipcMain.handle('spotify:get-playback', async () => {
  return await spotifyTools.getPlaybackState();
});

ipcMain.handle('spotify:play', async () => {
  return await spotifyTools.play();
});

ipcMain.handle('spotify:pause', async () => {
  return await spotifyTools.pause();
});

ipcMain.handle('spotify:next', async () => {
  return await spotifyTools.next();
});

ipcMain.handle('spotify:previous', async () => {
  return await spotifyTools.previous();
});

ipcMain.handle('spotify:seek', async (event, positionMs) => {
  return await spotifyTools.seek(positionMs);
});

// Pinterest Integration IPC Handlers
ipcMain.handle('pinterest:start-oauth', async () => {
  return await pinterestTools.startPinterestOAuth();
});

ipcMain.handle('pinterest:get-status', async () => {
  return await pinterestTools.getConnectionStatus();
});

ipcMain.handle('pinterest:disconnect', async () => {
  return authVault.removeToken('pinterest_tokens');
});

ipcMain.handle('pinterest:get-boards', async () => {
  return await pinterestTools.getPinterestBoards();
});

ipcMain.handle('pinterest:get-pins', async (event, { boardId, bookmark }) => {
  return await pinterestTools.getPinterestPins(boardId, bookmark);
});



// AI API Key Test IPC Handler
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

// Chat & Context IPC Handlers
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




