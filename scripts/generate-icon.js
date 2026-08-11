const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    transparent: true,
    frame: false,
    backgroundColor: '#00000000',
    webPreferences: {
      offscreen: true
    }
  });

  const svgPath = path.join(__dirname, '../src/assets/icona-V-trasparente.svg');
  const svgData = fs.readFileSync(svgPath, 'utf8');
  const html = `<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent !important;}</style></head><body>${svgData}</body></html>`;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  
  // Wait a moment for rendering
  await new Promise(r => setTimeout(r, 1000));

  const image = await win.webContents.capturePage();
  const pngBuffer = image.toPNG();

  const outPath = path.join(__dirname, '../public/icon.png');
  fs.writeFileSync(outPath, pngBuffer);
  console.log('Successfully generated public/icon.png (size:', pngBuffer.length, 'bytes)');

  app.quit();
});
