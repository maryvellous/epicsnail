function registerGoogleIPC(ipcMain, deps) {
  const { googleTools, OAuthManager, authVault } = deps;

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
}

module.exports = { registerGoogleIPC };
