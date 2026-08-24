const { app, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

let mainWindow = null;
let overlayWindow = null;
let tray = null;

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

function createOverlayWindow() {
  if (overlayWindow) return;

  overlayWindow = new BrowserWindow({
    width: 260,
    height: 260,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    resizable: true,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadURL(`${APP_URL}?overlay=true`);
  overlayWindow.setIgnoreMouseEvents(false);
}

app.whenReady().then(() => {
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
