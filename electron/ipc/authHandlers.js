function registerAuthIPC(ipcMain, deps) {
  const { authVault } = deps;

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
}

module.exports = { registerAuthIPC };
