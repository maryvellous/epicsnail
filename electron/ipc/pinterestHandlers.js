function registerPinterestIPC(ipcMain, deps) {
  const { pinterestTools, authVault } = deps;

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
}

module.exports = { registerPinterestIPC };
