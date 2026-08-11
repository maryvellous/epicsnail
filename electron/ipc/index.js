const { registerGitIPC } = require('./gitHandlers');
const { registerSystemIPC } = require('./systemHandlers');
const { registerAuthIPC } = require('./authHandlers');
const { registerGithubIPC } = require('./githubHandlers');
const { registerGoogleIPC } = require('./googleHandlers');
const { registerSpotifyIPC } = require('./spotifyHandlers');
const { registerPinterestIPC } = require('./pinterestHandlers');
const { registerAIIPC } = require('./aiHandlers');

function registerAllIPC(ipcMain, deps) {
  const modules = [
    { name: 'Git', register: registerGitIPC },
    { name: 'System', register: registerSystemIPC },
    { name: 'Auth', register: registerAuthIPC },
    { name: 'GitHub', register: registerGithubIPC },
    { name: 'Google', register: registerGoogleIPC },
    { name: 'Spotify', register: registerSpotifyIPC },
    { name: 'Pinterest', register: registerPinterestIPC },
    { name: 'AI', register: registerAIIPC },
  ];

  for (const mod of modules) {
    try {
      mod.register(ipcMain, deps);
    } catch (err) {
      console.error(`[IPC Register Error] Failed to register ${mod.name} IPC handlers:`, err);
    }
  }
}

module.exports = {
  registerAllIPC,
  registerGitIPC,
  registerSystemIPC,
  registerAuthIPC,
  registerGithubIPC,
  registerGoogleIPC,
  registerSpotifyIPC,
  registerPinterestIPC,
  registerAIIPC,
};
