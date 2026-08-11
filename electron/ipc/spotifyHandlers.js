function registerSpotifyIPC(ipcMain, deps) {
  const { spotifyTools, authVault } = deps;

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
}

module.exports = { registerSpotifyIPC };
