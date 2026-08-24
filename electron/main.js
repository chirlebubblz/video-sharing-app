const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, session } = require('electron');
const path = require('path');

let mainWindow = null;
let overlayWindow = null;

const APP_URL = process.env.ELECTRON_START_URL || 'https://video-sharing-app-jordan.vercel.app';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'DefinitelyNotLoom Studio',
    icon: path.join(__dirname, '../public/icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Handle Electron getDisplayMedia screen capture permissions natively
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      if (sources && sources.length > 0) {
        callback({ video: sources[0], audio: 'loopback' });
      } else {
        callback({});
      }
    }).catch((err) => {
      console.warn('Display media handler error:', err);
      callback({});
    });
  });

  createMainWindow();

  // Register Global Shortcut (Alt+Shift+R to start/stop recording)
  globalShortcut.register('Alt+Shift+R', () => {
    if (mainWindow) {
      mainWindow.webContents.send('global-shortcut', 'toggle-record');
    }
  });

  // Handle Desktop Media Sources IPC
  ipcMain.handle('get-desktop-sources', async () => {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 300, height: 200 },
    });
    return sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
    }));
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
