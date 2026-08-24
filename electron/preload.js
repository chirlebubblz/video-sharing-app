const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  onGlobalShortcut: (callback) => ipcRenderer.on('global-shortcut', (_event, value) => callback(value)),
});
