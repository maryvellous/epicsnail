function registerGithubIPC(ipcMain, deps) {
  const { githubTools } = deps;

  ipcMain.handle('github:validate', async (event, token) => {
    return await githubTools.validateToken(token);
  });

  ipcMain.handle('github:get-repos', async () => {
    return await githubTools.getRepos();
  });

  ipcMain.handle('github:get-issues', async () => {
    return await githubTools.getIssues();
  });
}

module.exports = { registerGithubIPC };
