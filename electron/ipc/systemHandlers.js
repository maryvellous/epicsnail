function registerSystemIPC(ipcMain, deps) {
  const { store, systemOps, shell } = deps;
  const { openTerminal, openVSCode, openAndroidStudio, openAntigravityIDE, openInExplorer } = systemOps;

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
}

module.exports = { registerSystemIPC };
