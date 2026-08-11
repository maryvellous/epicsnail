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
const { registerAllIPC } = require('./ipc');

// Initialize shared instances and tools
const store = new LocalStore();
const authVault = new AuthVault();
const githubTools = new GitHubTools(authVault);
const googleTools = new GoogleTools(authVault);
const spotifyTools = new SpotifyTools(authVault);
const pinterestTools = new PinterestTools(authVault);
const aiEngine = new AIEngine(authVault, store, githubTools, googleTools, spotifyTools);

// Register domain IPC handlers
registerAllIPC(ipcMain, {
  store,
  authVault,
  githubTools,
  googleTools,
  spotifyTools,
  pinterestTools,
  aiEngine,
  OAuthManager,
  scanDirectoryForGitRepos,
  getGitProjectDetails,
  executeGitAction,
  systemOps: { openTerminal, openVSCode, openAndroidStudio, openAntigravityIDE, openInExplorer },
  shell,
  appRoot: path.resolve(__dirname, '..'),
});

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
