const { app, BrowserWindow } = require('electron')
const serve = require('electron-serve');
const loadURL = serve({directory: './web-build'});

const createWindow = async () => {
    const win = new BrowserWindow({
      width: 400,
      height: 600,
      titleBarStyle:'hidden'
    })
    await loadURL(win);
    await win.loadURL('app://-');
  }

  app.whenReady().then(() => {
    createWindow()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
