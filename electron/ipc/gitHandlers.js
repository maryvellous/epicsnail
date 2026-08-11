const path = require('path');

function registerGitIPC(ipcMain, deps) {
  const { store, scanDirectoryForGitRepos, getGitProjectDetails, executeGitAction, appRoot } = deps;

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

    const currentWorkspace = appRoot || path.resolve(__dirname, '../..');
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
}

module.exports = { registerGitIPC };
